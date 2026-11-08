export const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const quetzales = new Intl.NumberFormat("es-GT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export const cash = (value) => "Q" + quetzales.format(Number(value));
export const date = (value) =>
  value
    ? new Intl.DateTimeFormat("es-GT", {
        timeZone: "America/Guatemala",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "Sin fecha";
export const monthNow = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Guatemala",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
export const labels = {
  prospecto: "Prospecto",
  calificado: "Calificado",
  propuesta: "Propuesta",
  negociacion: "Negociación",
  ganada: "Ganada",
  perdida: "Perdida",
};
export const stageBadge = (stage) =>
  `<span class="pill ${escapeHTML(stage)}">${escapeHTML(labels[stage] || stage)}</span>`;
