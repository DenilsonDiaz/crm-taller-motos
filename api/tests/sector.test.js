import test from "node:test";
import assert from "node:assert/strict";
import { createPool } from "../src/db.js";
import { createService } from "../src/service.js";
test(
  "MySQL: regla del taller rechaza sin instalación y cierra con ella, sin historial parcial",
  { skip: process.env.RUN_SECTOR_TESTS !== "1" },
  async () => {
    const pool = createPool(),
      service = createService(pool);
    let op;
    try {
      const [[actor]] = await pool.execute(
        "SELECT id FROM users WHERE email='asesor@motogest.test'",
      );
      assert.ok(actor, "Cargue ambas semillas en una base de pruebas.");
      const [[client]] = await pool.execute(
        "SELECT id FROM clientes WHERE vendedor_id=? LIMIT 1",
        [actor.id],
      );
      const [[part]] = await pool.execute(
        "SELECT id FROM productos WHERE requiere_instalacion=1 AND activo=1 LIMIT 1",
      );
      const [[labor]] = await pool.execute(
        "SELECT id FROM productos WHERE es_instalacion=1 AND activo=1 LIMIT 1",
      );
      assert.ok(client && part && labor);
      op = (
        await service.createOpportunity(actor.id, {
          cliente_id: client.id,
          titulo: "Prueba temporal de instalación",
        })
      ).id;
      await service.line(actor.id, op, { producto_id: part.id, cantidad: 1 });
      for (const etapa of ["calificado", "propuesta", "negociacion"])
        await service.stage(actor.id, op, { etapa });
      await assert.rejects(
        service.stage(actor.id, op, { etapa: "ganada" }),
        (e) => e.status === 422,
      );
      const rejected = await service.detail(actor.id, op);
      assert.equal(rejected.etapa, "negociacion");
      assert.equal(rejected.fecha_cierre, null);
      assert.equal(rejected.historial.length, 4);
      await service.line(actor.id, op, { producto_id: labor.id, cantidad: 1 });
      const success = await service.stage(actor.id, op, { etapa: "ganada" });
      assert.equal(success.etapa, "ganada");
      assert.equal(success.historial.length, 5);
      assert.ok(success.fecha_cierre);
      await assert.rejects(
        service.updateOpportunity(actor.id, op, { titulo: "No debe cambiar" }),
        (e) => e.status === 409,
      );
    } finally {
      if (op) await pool.execute("DELETE FROM oportunidades WHERE id=?", [op]);
      await pool.end();
    }
  },
);
