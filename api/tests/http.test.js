import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app.js";
const env = {
  JWT_SECRET: "test-only-".repeat(6),
  SPA_ORIGIN: "http://127.0.0.1:5500",
  JWT_EXPIRES_IN: "1h",
};
const users = [
  {
    id: 4,
    name: "Vendedor prueba",
    email: "seller@example.test",
    password: await bcrypt.hash("test-only-password", 4),
    rol: "vendedor",
    activo: 1,
  },
  {
    id: 1,
    name: "Administrador",
    email: "admin@example.test",
    password: await bcrypt.hash("test-only-password", 4),
    rol: "administrador",
    activo: 1,
  },
];
const pool = {
  execute: async (sql, p) => {
    if (sql.includes("WHERE email="))
      return [users.filter((u) => u.email === p[0])];
    if (sql.includes("FROM users WHERE id="))
      return [users.filter((u) => String(u.id) === String(p[0]))];
    throw new Error("Unexpected SQL " + sql);
  },
};
async function server(work) {
  const app = createApp(pool, env);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  try {
    await work("http://127.0.0.1:" + server.address().port);
  } finally {
    await new Promise((r) => server.close(r));
  }
}
const login = (base, data) =>
  fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
test("login genera JWT HS256 y usuario sin datos internos", () =>
  server(async (b) => {
    const res = await login(b, {
      correo: "seller@example.test",
      clave: "test-only-password",
    });
    assert.equal(res.status, 200);
    const d = await res.json();
    assert.deepEqual(Object.keys(d.usuario).sort(), ["correo", "id", "nombre"]);
    const t = jwt.verify(d.token, env.JWT_SECRET, { algorithms: ["HS256"] });
    assert.equal(t.sub, "4");
    assert.ok(t.exp > t.iat);
  }));
test("correo inexistente y contraseña errónea tienen respuesta idéntica", () =>
  server(async (b) => {
    const a = await login(b, { correo: "seller@example.test", clave: "wrong" }),
      c = await login(b, { correo: "missing@example.test", clave: "wrong" });
    assert.equal(a.status, 401);
    assert.equal(c.status, 401);
    assert.deepEqual(await a.json(), await c.json());
  }));
test("administrador no obtiene token y vendedor desactivado tampoco", () =>
  server(async (b) => {
    assert.equal(
      (
        await login(b, {
          correo: "admin@example.test",
          clave: "test-only-password",
        })
      ).status,
      403,
    );
    users[0].activo = 0;
    try {
      assert.equal(
        (
          await login(b, {
            correo: "seller@example.test",
            clave: "test-only-password",
          })
        ).status,
        403,
      );
    } finally {
      users[0].activo = 1;
    }
  }));
test("peticiones sin token y algoritmo incorrecto reciben 401", () =>
  server(async (b) => {
    assert.equal((await fetch(b + "/api/clientes")).status, 401);
    const token = jwt.sign({}, env.JWT_SECRET, {
      algorithm: "HS384",
      subject: "4",
    });
    assert.equal(
      (
        await fetch(b + "/api/clientes", {
          headers: { Authorization: "Bearer " + token },
        })
      ).status,
      401,
    );
  }));
test("desactivar una cuenta invalida inmediatamente su token anterior", () =>
  server(async (b) => {
    const token = jwt.sign({}, env.JWT_SECRET, { subject: "4" });
    users[0].activo = 0;
    try {
      assert.equal(
        (
          await fetch(b + "/api/clientes", {
            headers: { Authorization: "Bearer " + token },
          })
        ).status,
        401,
      );
    } finally {
      users[0].activo = 1;
    }
  }));
test("errores de cuerpo JSON y validación respetan formato", () =>
  server(async (b) => {
    const a = await fetch(b + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad",
    });
    assert.equal(a.status, 400);
    assert.ok((await a.json()).error);
    const v = await login(b, { correo: "bad", clave: "x" });
    assert.equal(v.status, 422);
    assert.ok((await v.json()).errores.correo);
  }));
test("CORS devuelve únicamente el origen configurado", () =>
  server(async (b) => {
    const a = await fetch(b + "/api/auth/login", {
      method: "OPTIONS",
      headers: {
        Origin: "http://evil.example",
        "Access-Control-Request-Method": "POST",
      },
    });
    assert.equal(a.headers.get("access-control-allow-origin"), env.SPA_ORIGIN);
    assert.notEqual(
      a.headers.get("access-control-allow-origin"),
      "http://evil.example",
    );
  }));
