export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
export const fail = (status, message) => {
  throw new HttpError(status, message);
};
export const invalid = (fields) => {
  throw new HttpError(422, "Revise los datos.", fields);
};
export const stages = [
  "prospecto",
  "calificado",
  "propuesta",
  "negociacion",
  "ganada",
  "perdida",
];
export const probabilities = {
  prospecto: 10,
  calificado: 25,
  propuesta: 50,
  negociacion: 75,
  ganada: 100,
  perdida: 0,
};
export const closed = (stage) => ["ganada", "perdida"].includes(stage);
export function text(value, field, max) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    invalid({ [field]: `Escriba entre 1 y ${max} caracteres.` });
  return value.trim();
}
export function nit(value) {
  if (typeof value !== "string" || value.length > 60)
    invalid({ nit: "Escriba un NIT válido o CF." });
  let n = value.replace(/[\s-]/g, "").toUpperCase();
  if (n === "CF") return null;
  n = n.replace(/^0+/, "");
  if (!/^\d+[0-9K]$/.test(n) || n.length < 2 || n.length > 12)
    invalid({ nit: "Escriba un NIT válido o CF." });
  const body = n.slice(0, -1);
  let sum = 0;
  [...body].reverse().forEach((d, i) => {
    sum += Number(d) * (i + 2);
  });
  const check = (11 - (sum % 11)) % 11;
  if (n.at(-1) !== (check === 10 ? "K" : String(check)))
    invalid({ nit: "El dígito verificador del NIT no es válido." });
  return n;
}
export function phone(value) {
  if (
    typeof value !== "string" ||
    value.length > 60 ||
    !/^[\d\s().+\-]+$/.test(value)
  )
    invalid({ telefono: "Escriba un teléfono de Guatemala válido." });
  let n = value.replace(/[\s().-]/g, "");
  if (n.startsWith("+502")) n = n.slice(4);
  else if (n.length === 11 && n.startsWith("502")) n = n.slice(3);
  if (!/^[2-9]\d{7}$/.test(n))
    invalid({ telefono: "Escriba un teléfono de Guatemala de 8 dígitos." });
  return n;
}
export function clientData(data, partial = false) {
  const result = {};
  for (const field of ["nombre", "nit", "telefono", "correo"]) {
    if (partial && !(field in data)) continue;
    if (field === "nombre") result[field] = text(data[field], field, 150);
    if (field === "nit") result[field] = nit(data[field]);
    if (field === "telefono") result[field] = phone(data[field]);
    if (field === "correo") {
      const v = data[field];
      if (v == null || v === "") result[field] = null;
      else if (
        typeof v !== "string" ||
        v.trim().length > 150 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
      )
        invalid({ correo: "Escriba un correo válido." });
      else result[field] = v.trim();
    }
  }
  return result;
}
export function quantity(value) {
  if (!Number.isInteger(value) || value < 1 || value > 999)
    invalid({ cantidad: "Escriba una cantidad entera de 1 a 999." });
  return value;
}
export function id(value) {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)))
    fail(400, "El identificador no es válido.");
  return Number(value);
}
export function foreignId(value, field) {
  if (!Number.isSafeInteger(value) || value < 1)
    invalid({ [field]: "Seleccione una opción válida." });
  return value;
}
export function iso(value) {
  if (value == null || value === "") return null;
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    )
  )
    invalid({ vence_en: "Incluya una zona horaria válida en la fecha." });
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  const check = new Date(Date.UTC(y, m - 1, d));
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== m - 1 ||
    check.getUTCDate() !== d ||
    Number(value.slice(11, 13)) > 23 ||
    Number(value.slice(14, 16)) > 59 ||
    (/:\d{2}(?:\.\d+)?(?:Z|[+-])/.test(value) &&
      Number(value.slice(17, 19)) > 59) ||
    !Number.isFinite(Date.parse(value))
  )
    invalid({ vence_en: "La fecha no es válida." });
  return new Date(value).toISOString();
}
export function monthWindow(value) {
  const month =
    value ??
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Guatemala",
      year: "numeric",
      month: "2-digit",
    }).format(new Date());
  if (
    typeof month !== "string" ||
    !/^(?:19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(month)
  )
    fail(400, "Indique el mes con formato AAAA-MM.");
  const [y, m] = month.split("-").map(Number);
  const fmt = (d) => d.toISOString().slice(0, 19).replace("T", " ");
  return {
    month,
    start: fmt(new Date(Date.UTC(y, m - 1, 1, 6))),
    end: fmt(new Date(Date.UTC(y, m, 1, 6))),
  };
}
export function canTransition(from, to) {
  if (closed(from)) return false;
  return (
    to === "perdida" ||
    (to === "ganada" && from === "negociacion") ||
    (stages.indexOf(to) === stages.indexOf(from) + 1 && !closed(to))
  );
}
export const money = (cents) => Number(cents) / 100;
export const cents = (value) => Math.round(Number(value) * 100);
export const sqlDate = (value) =>
  value ? new Date(value).toISOString().slice(0, 23).replace("T", " ") : null;
export const dateJSON = (value) =>
  value
    ? new Date(
        String(value).replace(" ", "T") +
          (String(value).endsWith("Z") ? "" : "Z"),
      ).toISOString()
    : null;
export const clientJSON = (row) => ({
  id: Number(row.id),
  nombre: row.nombre,
  nit: row.nit ?? "CF",
  telefono: row.telefono,
  correo: row.correo,
});
