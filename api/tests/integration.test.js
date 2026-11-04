import test from "node:test";
import assert from "node:assert/strict";
import { createPool } from "../src/db.js";
import { createService } from "../src/service.js";
const enabled = process.env.RUN_DB_TESTS === "1";
test(
  "MySQL: cifras comunes y transacciones de concurrencia sin alterar datos originales",
  { skip: !enabled },
  async () => {
    const pool = createPool(),
      svc = createService(pool);
    let client, op;
    const actor = (
      await pool.execute("SELECT id FROM users WHERE email='valeria@crm.test'")
    )[0][0]?.id;
    try {
      assert.ok(actor, "Cargue VerificacionSeeder antes de ejecutar.");
      const summary = await svc.summary(actor, "2026-10");
      assert.equal(summary.total, 9250);
      assert.equal(summary.ventas, 2);
      assert.equal(summary.pronostico, 2512.88);
      const [counts] = await pool.execute(
        "SELECT COUNT(*) AS n FROM historial_etapas",
      );
      assert.equal(
        Number(counts[0].n),
        43,
        "Ejecute en una base recién cargada solo con VerificacionSeeder.",
      );
      const [insert] = await pool.execute(
        "INSERT INTO clientes(nombre,telefono,created_at,updated_at)VALUES('Prueba simultánea','49999888',UTC_TIMESTAMP(),UTC_TIMESTAMP())",
      );
      client = insert.insertId;
      const results = await Promise.allSettled([
        svc.take(actor, client),
        svc.take(actor, client),
      ]);
      assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
      assert.equal(
        results.find((x) => x.status === "rejected").reason.status,
        409,
      );
      const created = await svc.createOpportunity(actor, {
        cliente_id: client,
        titulo: "Prueba de transición simultánea",
      });
      op = created.id;
      const transitions = await Promise.allSettled([
        svc.stage(actor, op, { etapa: "calificado" }),
        svc.stage(actor, op, { etapa: "calificado" }),
      ]);
      assert.equal(
        transitions.filter((x) => x.status === "fulfilled").length,
        1,
      );
      const d = await svc.detail(actor, op);
      assert.equal(d.historial.length, 2);
    } finally {
      if (op) await pool.execute("DELETE FROM oportunidades WHERE id=?", [op]);
      if (client)
        await pool.execute("DELETE FROM clientes WHERE id=?", [client]);
      await pool.end();
    }
  },
);
