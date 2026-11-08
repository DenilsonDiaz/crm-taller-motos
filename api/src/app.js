import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createService } from "./service.js";
import { HttpError, fail, invalid, id } from "./domain.js";
export function createApp(pool, env = process.env) {
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32)
    throw new Error(
      "Configure JWT_SECRET con al menos 32 caracteres aleatorios.",
    );
  if (!env.SPA_ORIGIN || new URL(env.SPA_ORIGIN).origin !== env.SPA_ORIGIN)
    throw new Error(
      "Configure SPA_ORIGIN con un origen exacto, sin ruta ni barra final.",
    );
  const app = express(),
    service = createService(pool);
  app.disable("x-powered-by");
  app.use(
    cors({
      origin: env.SPA_ORIGIN,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(express.json({ limit: "100kb", strict: true }));
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  const body = (req, res, next) => {
    if (!req.body || Array.isArray(req.body) || typeof req.body !== "object")
      fail(400, "Envíe un cuerpo JSON válido.");
    next();
  };
  const filters =
    (...allowed) =>
    (req, res, next) => {
      if (Object.keys(req.query).some((k) => !allowed.includes(k)))
        fail(400, "El parámetro de consulta no existe.");
      next();
    };
  app.post("/api/auth/login", body, async (req, res) => {
    const { correo, clave } = req.body;
    if (
      typeof correo !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())
    )
      invalid({ correo: "Escriba un correo válido." });
    if (typeof clave !== "string" || !clave)
      invalid({ clave: "Escriba su contraseña." });
    const [users] = await pool.execute(
      "SELECT id,name,email,password,rol,activo FROM users WHERE email=?",
      [correo.trim()],
    );
    const u = users[0];
    if (!u || !(await bcrypt.compare(clave, u.password)))
      fail(401, "El correo o la contraseña no son correctos.");
    if (!u.activo || u.rol !== "vendedor")
      fail(403, "Esta cuenta no tiene acceso a la aplicación de vendedores.");
    const token = jwt.sign({}, env.JWT_SECRET, {
      algorithm: "HS256",
      subject: String(u.id),
      expiresIn: env.JWT_EXPIRES_IN || "2h",
    });
    res.json({
      token,
      usuario: { id: Number(u.id), nombre: u.name, correo: u.email },
    });
  });
  app.use("/api", async (req, res, next) => {
    try {
      const match = /^Bearer ([^\s]+)$/.exec(req.get("Authorization") || "");
      if (!match) fail(401, "Inicie sesión para continuar.");
      const claims = jwt.verify(match[1], env.JWT_SECRET, {
        algorithms: ["HS256"],
      });
      if (typeof claims.sub !== "string" || !/^\d+$/.test(claims.sub))
        fail(401, "Su sesión ya no es válida.");
      const [users] = await pool.execute(
        "SELECT id,rol,activo FROM users WHERE id=?",
        [claims.sub],
      );
      const u = users[0];
      if (!u || !u.activo || u.rol !== "vendedor")
        fail(401, "Su sesión ya no es válida.");
      req.actor = Number(u.id);
      next();
    } catch (error) {
      if (error instanceof HttpError) throw error;
      if (error.name?.includes("Token") || error.name === "NotBeforeError")
        return next(new HttpError(401, "Su sesión venció o no es válida."));
      next(error);
    }
  });
  app.get("/api/productos", filters(), async (req, res) =>
    res.json(await service.products()),
  );
  app.get("/api/clientes", filters("q"), async (req, res) =>
    res.json(await service.clients(req.actor, req.query.q)),
  );
  app.post("/api/clientes", filters(), body, async (req, res) =>
    res.status(201).json(await service.createClient(req.actor, req.body)),
  );
  app.get("/api/clientes/disponibles", filters(), async (req, res) =>
    res.json(await service.available()),
  );
  app.post("/api/clientes/:id/tomar", filters(), async (req, res) =>
    res.json(await service.take(req.actor, id(req.params.id))),
  );
  app.get("/api/clientes/:id", filters(), async (req, res) =>
    res.json(await service.client(req.actor, id(req.params.id))),
  );
  app.patch("/api/clientes/:id", filters(), body, async (req, res) =>
    res.json(
      await service.updateClient(req.actor, id(req.params.id), req.body),
    ),
  );
  app.post("/api/clientes/:id/actividades", filters(), body, async (req, res) =>
    res
      .status(201)
      .json(
        await service.createActivity(req.actor, id(req.params.id), req.body),
      ),
  );
  app.get("/api/actividades", filters("estado"), async (req, res) =>
    res.json(await service.activities(req.actor, req.query.estado)),
  );
  app.patch("/api/actividades/:id", filters(), body, async (req, res) =>
    res.json(
      await service.updateActivity(req.actor, id(req.params.id), req.body),
    ),
  );
  app.get("/api/oportunidades", filters("etapa"), async (req, res) =>
    res.json(await service.opportunities(req.actor, req.query.etapa)),
  );
  app.post("/api/oportunidades", filters(), body, async (req, res) =>
    res.status(201).json(await service.createOpportunity(req.actor, req.body)),
  );
  app.get("/api/oportunidades/:id", filters(), async (req, res) =>
    res.json(await service.detail(req.actor, id(req.params.id))),
  );
  app.patch("/api/oportunidades/:id", filters(), body, async (req, res) =>
    res.json(
      await service.updateOpportunity(req.actor, id(req.params.id), req.body),
    ),
  );
  app.patch("/api/oportunidades/:id/etapa", filters(), body, async (req, res) =>
    res.json(await service.stage(req.actor, id(req.params.id), req.body)),
  );
  app.post(
    "/api/oportunidades/:id/productos",
    filters(),
    body,
    async (req, res) =>
      res
        .status(201)
        .json(await service.line(req.actor, id(req.params.id), req.body)),
  );
  app.patch(
    "/api/oportunidades/:id/productos/:lineaId",
    filters(),
    body,
    async (req, res) =>
      res.json(
        await service.line(
          req.actor,
          id(req.params.id),
          req.body,
          id(req.params.lineaId),
        ),
      ),
  );
  app.delete(
    "/api/oportunidades/:id/productos/:lineaId",
    filters(),
    async (req, res) => {
      await service.line(
        req.actor,
        id(req.params.id),
        {},
        id(req.params.lineaId),
        true,
      );
      res.status(204).end();
    },
  );
  app.get("/api/reportes/resumen", filters("mes"), async (req, res) =>
    res.json(await service.summary(req.actor, req.query.mes)),
  );
  app.use((req, res) =>
    res.status(404).json({ error: "No se encontró la ruta." }),
  );
  app.use((error, req, res, next) => {
    if (error.type === "entity.parse.failed" ||
        ["charset.unsupported", "encoding.unsupported"].includes(error.type))
      return res
        .status(400)
        .json({ error: "El JSON no se puede interpretar." });
    if (error.type === "entity.too.large")
      return res
        .status(400)
        .json({ error: "La petición es demasiado grande." });
    if (error.code === "ER_DUP_ENTRY")
      return res
        .status(409)
        .json({
          error:
            "Ya existe un registro con ese NIT, teléfono o producto en la oportunidad.",
        });
    if (["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"].includes(error.code))
      return res
        .status(409)
        .json({
          error: "Otra operación modificó estos datos. Intente nuevamente.",
        });
    if (error instanceof HttpError)
      return res
        .status(error.status)
        .json(
          error.fields ? { errores: error.fields } : { error: error.message },
        );
    console.error(error);
    res
      .status(500)
      .json({
        error: "No fue posible completar la operación. Intente nuevamente.",
      });
  });
  return app;
}
