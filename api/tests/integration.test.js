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
    const extras = [];
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
      const expected = {
        users: 7,
        productos: 5,
        clientes: 21,
        oportunidades: 11,
        actividades: 4,
      };
      for (const [table, n] of Object.entries(expected)) {
        // Identificadores del código, nunca de una petición.
        const [[count]] = await pool.execute(
          `SELECT COUNT(*) AS n FROM ${table}`,
        );
        assert.equal(Number(count.n), n, table);
      }
      const [[carlos]] = await pool.execute(
        "SELECT id FROM users WHERE email='carlos@crm.test'",
      );
      const capacity = await Promise.allSettled([
        svc.createClient(carlos.id, {
          nombre: "Temporal cupo A",
          nit: "CF",
          telefono: "49999886",
        }),
        svc.createClient(carlos.id, {
          nombre: "Temporal cupo B",
          nit: "CF",
          telefono: "49999887",
        }),
      ]);
      extras.push(
        ...capacity
          .filter((x) => x.status === "fulfilled")
          .map((x) => x.value.id),
      );
      assert.equal(
        extras.length,
        1,
        "Con nueve clientes, de dos altas simultáneas solo una puede pasar.",
      );
      assert.equal(
        capacity.find((x) => x.status === "rejected").reason.status,
        409,
      );
      const duplicates = await Promise.allSettled([
        svc.createClient(actor, {
          nombre: "Temporal duplicado A",
          nit: "CF",
          telefono: "49999885",
        }),
        svc.createClient(actor, {
          nombre: "Temporal duplicado B",
          nit: "CF",
          telefono: "+502 4999-9885",
        }),
      ]);
      const createdDuplicates = duplicates.filter(
        (x) => x.status === "fulfilled",
      );
      extras.push(...createdDuplicates.map((x) => x.value.id));
      assert.equal(createdDuplicates.length, 1);
      assert.equal(
        duplicates.find((x) => x.status === "rejected").reason.code,
        "ER_DUP_ENTRY",
      );
      assert.deepEqual(await svc.clients(actor, "' OR 1=1 --"), []);
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
      for (const id of extras)
        await pool.execute("DELETE FROM clientes WHERE id=?", [id]);
      if (op) await pool.execute("DELETE FROM oportunidades WHERE id=?", [op]);
      if (client)
        await pool.execute("DELETE FROM clientes WHERE id=?", [client]);
      await pool.end();
    }
  },
);
