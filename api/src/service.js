import {
  HttpError,
  fail,
  invalid,
  text,
  nit,
  clientData,
  quantity,
  foreignId,
  closed,
  stages,
  probabilities,
  canTransition,
  monthWindow,
  clientJSON,
  dateJSON,
  sqlDate,
  cents,
  money,
  iso,
} from "./domain.js";
import { transaction } from "./db.js";
export function createService(pool) {
  const rows = async (db, sql, params = []) =>
    (await db.execute(sql, params))[0];
  async function ownClient(db, actor, id, lock = false) {
    const row = (
      await rows(
        db,
        "SELECT * FROM clientes WHERE id = ? AND vendedor_id = ?" +
          (lock ? " FOR UPDATE" : ""),
        [id, actor],
      )
    )[0];
    if (!row) fail(404, "No se encontró el cliente.");
    return row;
  }
  async function ownOpportunity(db, actor, id, lock = false) {
    const row = (
      await rows(
        db,
        "SELECT * FROM oportunidades WHERE id = ? AND vendedor_id = ?" +
          (lock ? " FOR UPDATE" : ""),
        [id, actor],
      )
    )[0];
    if (!row) fail(404, "No se encontró la oportunidad.");
    return row;
  }
  async function capacity(db, actor) {
    const [row] = await rows(
      db,
      "SELECT COUNT(*) AS total FROM clientes WHERE vendedor_id = ?",
      [actor],
    );
    if (Number(row.total) >= 10)
      fail(409, "Su cartera ya tiene 10 clientes, el máximo permitido.");
  }
  async function detail(db, actor, id) {
    const op = await ownOpportunity(db, actor, id);
    const [client] = await rows(
      db,
      "SELECT id,nombre FROM clientes WHERE id = ?",
      [op.cliente_id],
    );
    const lines = await rows(
      db,
      "SELECT l.id,l.producto_id,p.nombre,l.cantidad,l.precio_unitario FROM oportunidad_productos l JOIN productos p ON p.id=l.producto_id WHERE l.oportunidad_id=? ORDER BY l.id",
      [id],
    );
    const history = await rows(
      db,
      "SELECT h.etapa_anterior,h.etapa_nueva,u.name AS usuario,h.created_at FROM historial_etapas h JOIN users u ON u.id=h.usuario_id WHERE h.oportunidad_id=? ORDER BY h.id",
      [id],
    );
    const products = lines.map((l) => ({
      id: Number(l.id),
      producto_id: Number(l.producto_id),
      nombre: l.nombre,
      cantidad: Number(l.cantidad),
      precio_unitario: Number(l.precio_unitario),
      subtotal: money(cents(l.precio_unitario) * Number(l.cantidad)),
    }));
    return {
      id: Number(op.id),
      cliente: { id: Number(client.id), nombre: client.nombre },
      titulo: op.titulo,
      etapa: op.etapa,
      probabilidad: probabilities[op.etapa],
      total: money(
        lines.reduce(
          (s, l) => s + cents(l.precio_unitario) * Number(l.cantidad),
          0,
        ),
      ),
      fecha_cierre: dateJSON(op.fecha_cierre),
      motivo_perdida: op.motivo_perdida,
      productos: products,
      historial: history.map((h) => ({
        etapa_anterior: h.etapa_anterior,
        etapa_nueva: h.etapa_nueva,
        usuario: h.usuario,
        fecha: dateJSON(h.created_at),
      })),
    };
  }
  const open = (op) => {
    if (closed(op.etapa))
      fail(409, "La oportunidad está cerrada y no puede modificarse.");
  };
  return {
    async products() {
      return (
        await rows(
          pool,
          "SELECT id,nombre,precio FROM productos WHERE activo=1 ORDER BY nombre",
        )
      ).map((p) => ({
        id: Number(p.id),
        nombre: p.nombre,
        precio: Number(p.precio),
      }));
    },
    async clients(actor, q = "") {
      if (typeof q !== "string") fail(400, "La búsqueda no es válida.");
      const like = "%" + q.trim().replace(/[\\%_]/g, "\\$&") + "%";
      return (
        await rows(
          pool,
          "SELECT * FROM clientes WHERE vendedor_id=? AND (nombre LIKE ? OR nit LIKE ?) ORDER BY nombre",
          [actor, like, like],
        )
      ).map(clientJSON);
    },
    async client(actor, id) {
      return clientJSON(await ownClient(pool, actor, id));
    },
    async available() {
      return (
        await rows(
          pool,
          "SELECT id,nombre FROM clientes WHERE vendedor_id IS NULL ORDER BY nombre",
        )
      ).map((c) => ({ id: Number(c.id), nombre: c.nombre }));
    },
    async createClient(actor, data) {
      const d = clientData(data);
      return transaction(
        pool,
        async (db) => {
          await capacity(db, actor);
          const [res] = await db.execute(
            "INSERT INTO clientes (vendedor_id,nombre,nit,telefono,correo,created_at,updated_at) VALUES (?,?,?,?,?,UTC_TIMESTAMP(),UTC_TIMESTAMP())",
            [actor, d.nombre, d.nit, d.telefono, d.correo],
          );
          return clientJSON(await ownClient(db, actor, res.insertId));
        },
        actor,
      );
    },
    async updateClient(actor, id, data) {
      return transaction(
        pool,
        async (db) => {
          const row = await ownClient(db, actor, id, true);
          const next = { ...row, ...clientData(data, true) };
          await db.execute(
            "UPDATE clientes SET nombre=?,nit=?,telefono=?,correo=?,updated_at=UTC_TIMESTAMP() WHERE id=?",
            [next.nombre, next.nit, next.telefono, next.correo, id],
          );
          return clientJSON(next);
        },
        actor,
      );
    },
    async take(actor, id) {
      return transaction(
        pool,
        async (db) => {
          const [c] = await rows(
            db,
            "SELECT * FROM clientes WHERE id=? FOR UPDATE",
            [id],
          );
          if (!c) fail(404, "No se encontró el cliente.");
          if (c.vendedor_id !== null)
            fail(409, "Otro vendedor ya tomó este cliente.");
          await capacity(db, actor);
          await db.execute(
            "UPDATE clientes SET vendedor_id=?,updated_at=UTC_TIMESTAMP() WHERE id=?",
            [actor, id],
          );
          return clientJSON(c);
        },
        actor,
      );
    },
    async opportunities(actor, stage) {
      if (stage !== undefined && !stages.includes(stage))
        fail(400, "La etapa del filtro no es válida.");
      const list = await rows(
        pool,
        `SELECT o.id,o.titulo,o.etapa,o.fecha_cierre,o.motivo_perdida,c.id AS cliente_id,c.nombre AS cliente_nombre,COALESCE(SUM(l.cantidad*l.precio_unitario),0) AS total FROM oportunidades o JOIN clientes c ON c.id=o.cliente_id LEFT JOIN oportunidad_productos l ON l.oportunidad_id=o.id WHERE o.vendedor_id=? ${stage ? "AND o.etapa=?" : ""} GROUP BY o.id,o.titulo,o.etapa,o.fecha_cierre,o.motivo_perdida,c.id,c.nombre ORDER BY o.id DESC`,
        stage ? [actor, stage] : [actor],
      );
      return list.map((o) => ({
        id: Number(o.id),
        cliente: { id: Number(o.cliente_id), nombre: o.cliente_nombre },
        titulo: o.titulo,
        etapa: o.etapa,
        probabilidad: probabilities[o.etapa],
        total: Number(o.total),
        fecha_cierre: dateJSON(o.fecha_cierre),
        motivo_perdida: o.motivo_perdida,
      }));
    },
    detail: (actor, id) => detail(pool, actor, id),
    async createOpportunity(actor, data) {
      const client = foreignId(data.cliente_id, "cliente_id");
      return transaction(
        pool,
        async (db) => {
          await ownClient(db, actor, client, true);
          const title = text(data.titulo, "titulo", 150);
          const [res] = await db.execute(
            "INSERT INTO oportunidades (cliente_id,vendedor_id,titulo,etapa,created_at,updated_at) VALUES (?,?,?,'prospecto',UTC_TIMESTAMP(),UTC_TIMESTAMP())",
            [client, actor, title],
          );
          await db.execute(
            "INSERT INTO historial_etapas (oportunidad_id,usuario_id,etapa_anterior,etapa_nueva,created_at) VALUES (?,?,NULL,'prospecto',UTC_TIMESTAMP())",
            [res.insertId, actor],
          );
          return detail(db, actor, res.insertId);
        },
        actor,
      );
    },
    async updateOpportunity(actor, id, data) {
      return transaction(
        pool,
        async (db) => {
          const op = await ownOpportunity(db, actor, id, true);
          open(op);
          await ownClient(db, actor, op.cliente_id);
          const title = text(data.titulo, "titulo", 150);
          await db.execute(
            "UPDATE oportunidades SET titulo=?,updated_at=UTC_TIMESTAMP() WHERE id=?",
            [title, id],
          );
          return detail(db, actor, id);
        },
        actor,
      );
    },
    async stage(actor, id, data) {
      const initial = await ownOpportunity(pool, actor, id);
      return transaction(
        pool,
        async (db) => {
          const op = await ownOpportunity(db, actor, id, true);
          open(op);
          await ownClient(db, actor, op.cliente_id);
          if (op.etapa !== initial.etapa)
            fail(409, "La etapa cambió. Recargue e intente nuevamente.");
          if (!stages.includes(data.etapa))
            invalid({ etapa: "Seleccione una etapa válida." });
          const reason =
            data.etapa === "perdida"
              ? text(data.motivo_perdida, "motivo_perdida", 255)
              : null;
          if (!canTransition(op.etapa, data.etapa))
            fail(409, "La transición de etapa no está permitida.");
          if (data.etapa === "ganada") {
            const [check] = await rows(
              db,
              "SELECT COUNT(*) AS lineas,COALESCE(MAX(p.requiere_instalacion),0) AS requiere,COALESCE(MAX(p.es_instalacion),0) AS instalacion FROM oportunidad_productos l JOIN productos p ON p.id=l.producto_id WHERE l.oportunidad_id=?",
              [id],
            );
            if (!Number(check.lineas))
              invalid({
                etapa: "Agregue al menos un producto antes de ganar.",
              });
            if (Number(check.requiere) && !Number(check.instalacion))
              invalid({
                etapa:
                  "Incluya el servicio de instalación para vender este repuesto.",
              });
          }
          await db.execute(
            "UPDATE oportunidades SET etapa=?,motivo_perdida=?,fecha_cierre=IF(?,UTC_TIMESTAMP(),NULL),updated_at=UTC_TIMESTAMP() WHERE id=?",
            [data.etapa, reason, closed(data.etapa) ? 1 : 0, id],
          );
          await db.execute(
            "INSERT INTO historial_etapas (oportunidad_id,usuario_id,etapa_anterior,etapa_nueva,created_at) VALUES (?,?,?,?,UTC_TIMESTAMP())",
            [id, actor, op.etapa, data.etapa],
          );
          return detail(db, actor, id);
        },
        actor,
      );
    },
    async line(actor, id, data, lineId, remove = false) {
      return transaction(
        pool,
        async (db) => {
          const op = await ownOpportunity(db, actor, id, true);
          open(op);
          await ownClient(db, actor, op.cliente_id);
          if (lineId) {
            const [line] = await rows(
              db,
              "SELECT id FROM oportunidad_productos WHERE id=? AND oportunidad_id=?",
              [lineId, id],
            );
            if (!line)
              fail(404, "No se encontró el producto en esta oportunidad.");
            if (remove)
              await db.execute("DELETE FROM oportunidad_productos WHERE id=?", [
                lineId,
              ]);
            else
              await db.execute(
                "UPDATE oportunidad_productos SET cantidad=?,updated_at=UTC_TIMESTAMP() WHERE id=?",
                [quantity(data.cantidad), lineId],
              );
          } else {
            const product = foreignId(data.producto_id, "producto_id");
            const [p] = await rows(
              db,
              "SELECT id,precio,activo FROM productos WHERE id=? FOR SHARE",
              [product],
            );
            if (!p || !p.activo)
              invalid({ producto_id: "Seleccione un producto activo." });
            await db.execute(
              "INSERT INTO oportunidad_productos (oportunidad_id,producto_id,cantidad,precio_unitario,created_at,updated_at) VALUES (?,?,?,?,UTC_TIMESTAMP(),UTC_TIMESTAMP())",
              [id, product, quantity(data.cantidad), p.precio],
            );
          }
          return remove ? null : detail(db, actor, id);
        },
        actor,
      );
    },
    async activities(actor, state) {
      if (state !== undefined && !["pendiente", "completada"].includes(state))
        fail(400, "El estado del filtro no es válido.");
      const list = await rows(
        pool,
        `SELECT a.*,c.nombre AS cliente_nombre FROM actividades a JOIN clientes c ON c.id=a.cliente_id WHERE c.vendedor_id=? ${state ? "AND a.completada=?" : ""} ORDER BY a.completada,a.vence_en IS NULL,a.vence_en,a.id`,
        state ? [actor, state === "completada" ? 1 : 0] : [actor],
      );
      return list.map(activityJSON);
    },
    async createActivity(actor, client, data) {
      return transaction(
        pool,
        async (db) => {
          await ownClient(db, actor, client, true);
          if (!["llamada", "reunion", "tarea"].includes(data.tipo))
            invalid({ tipo: "Seleccione llamada, reunión o tarea." });
          const desc = text(data.descripcion, "descripcion", 500),
            due = iso(data.vence_en);
          const [res] = await db.execute(
            "INSERT INTO actividades (cliente_id,vendedor_id,tipo,descripcion,vence_en,completada,created_at,updated_at) VALUES (?,?,?,?,?,0,UTC_TIMESTAMP(),UTC_TIMESTAMP())",
            [client, actor, data.tipo, desc, sqlDate(due)],
          );
          const [a] = await rows(
            db,
            "SELECT a.*,c.nombre AS cliente_nombre FROM actividades a JOIN clientes c ON c.id=a.cliente_id WHERE a.id=?",
            [res.insertId],
          );
          return activityJSON(a);
        },
        actor,
      );
    },
    async updateActivity(actor, id, data) {
      return transaction(
        pool,
        async (db) => {
          const [a] = await rows(
            db,
            "SELECT a.*,c.nombre AS cliente_nombre FROM actividades a JOIN clientes c ON c.id=a.cliente_id WHERE a.id=? AND c.vendedor_id=? FOR UPDATE",
            [id, actor],
          );
          if (!a) fail(404, "No se encontró la actividad.");
          if (typeof data.completada !== "boolean")
            invalid({ completada: "Indique verdadero o falso." });
          await db.execute(
            "UPDATE actividades SET completada=?,updated_at=UTC_TIMESTAMP() WHERE id=?",
            [data.completada ? 1 : 0, id],
          );
          return activityJSON({ ...a, completada: data.completada });
        },
        actor,
      );
    },
    async summary(actor, month) {
      const window = monthWindow(month);
      const [sales] = await rows(
        pool,
        "SELECT COUNT(DISTINCT o.id) AS ventas,COALESCE(SUM(t.total),0) AS total FROM oportunidades o LEFT JOIN (SELECT oportunidad_id,SUM(cantidad*precio_unitario) AS total FROM oportunidad_productos GROUP BY oportunidad_id) t ON t.oportunidad_id=o.id WHERE o.vendedor_id=? AND o.etapa='ganada' AND o.fecha_cierre>=? AND o.fecha_cierre<?",
        [actor, window.start, window.end],
      );
      const [forecast] = await rows(
        pool,
        "SELECT ROUND(COALESCE(SUM(t.total * CASE o.etapa WHEN 'prospecto' THEN .10 WHEN 'calificado' THEN .25 WHEN 'propuesta' THEN .50 WHEN 'negociacion' THEN .75 ELSE 0 END),0),2) AS total FROM oportunidades o LEFT JOIN (SELECT oportunidad_id,SUM(cantidad*precio_unitario) AS total FROM oportunidad_productos GROUP BY oportunidad_id)t ON t.oportunidad_id=o.id WHERE o.vendedor_id=? AND o.etapa IN ('prospecto','calificado','propuesta','negociacion')",
        [actor],
      );
      const [count] = await rows(
        pool,
        "SELECT COUNT(*) AS total FROM clientes WHERE vendedor_id=?",
        [actor],
      );
      return {
        mes: window.month,
        ventas: Number(sales.ventas),
        total: Number(sales.total),
        pronostico: Number(forecast.total),
        cartera: { clientes: Number(count.total), maximo: 10 },
      };
    },
  };
}
function activityJSON(a) {
  const due = dateJSON(a.vence_en);
  return {
    id: Number(a.id),
    cliente: { id: Number(a.cliente_id), nombre: a.cliente_nombre },
    tipo: a.tipo,
    descripcion: a.descripcion,
    vence_en: due,
    completada: Boolean(a.completada),
    vencida: !a.completada && due !== null && Date.parse(due) < Date.now(),
  };
}
