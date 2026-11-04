import test from "node:test";
import assert from "node:assert/strict";
import {
  nit,
  phone,
  clientData,
  quantity,
  iso,
  monthWindow,
  canTransition,
  closed,
} from "../src/domain.js";
test("normaliza NIT, valida módulo 11 y conserva CF como NULL", () => {
  assert.equal(nit(" 000452 1817-k "), "4521817K");
  assert.equal(nit("cf"), null);
  assert.throws(() => nit("45218170"));
  assert.throws(() => nit(""));
  assert.throws(() => nit(4521817));
});
test("normaliza teléfonos guatemaltecos y rechaza letras y prefijos inválidos", () => {
  for (const p of ["+502 (5555)-1234", "50255551234", "5555.1234"])
    assert.equal(phone(p), "55551234");
  for (const p of ["15551234", "5555123", "abc55551234", "+155551234"])
    assert.throws(() => phone(p));
});
test("campos opcionales y PATCH conservan solo los campos declarados", () => {
  assert.deepEqual(
    clientData({
      nombre: " Ana ",
      nit: "CF",
      telefono: "55551234",
      vendedor_id: 88,
    }),
    { nombre: "Ana", nit: null, telefono: "55551234", correo: null },
  );
  assert.deepEqual(clientData({ correo: "" }, true), { correo: null });
  assert.throws(() =>
    clientData({ nombre: " ", nit: "CF", telefono: "55551234" }),
  );
});
test("cantidad requiere número entero de 1 a 999", () => {
  assert.equal(quantity(1), 1);
  assert.equal(quantity(999), 999);
  for (const q of [0, 1000, 1.2, "2", null]) assert.throws(() => quantity(q));
});
test("fechas con offset se convierten a UTC y se rechaza ambigüedad/calendario inválido", () => {
  assert.equal(iso("2026-11-01T00:30:00-06:00"), "2026-11-01T06:30:00.000Z");
  assert.equal(iso(null), null);
  for (const v of [
    "2026-11-01T00:30",
    "2026-02-30T12:00:00Z",
    "2026-01-01T25:00:00Z",
  ])
    assert.throws(() => iso(v));
});
test("meses de Guatemala usan límites UTC a las seis", () => {
  assert.deepEqual(monthWindow("2026-10"), {
    month: "2026-10",
    start: "2026-10-01 06:00:00",
    end: "2026-11-01 06:00:00",
  });
  assert.equal(monthWindow("2026-12").end, "2027-01-01 06:00:00");
  assert.throws(() => monthWindow("2026-13"));
});
test("transiciones cumplen el mínimo y admiten pérdida desde propuesta", () => {
  assert.ok(canTransition("prospecto", "calificado"));
  assert.ok(canTransition("negociacion", "ganada"));
  assert.ok(canTransition("propuesta", "perdida"));
  assert.equal(canTransition("prospecto", "ganada"), false);
  assert.equal(canTransition("calificado", "prospecto"), false);
  assert.equal(canTransition("ganada", "perdida"), false);
  assert.ok(closed("perdida"));
});
