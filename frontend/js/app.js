import { request, ApiError } from "./api.js";
import { monthNow } from "./format.js";
import * as view from "./views.js";
const root = document.querySelector("#app");
let session = null;
try {
  session = JSON.parse(localStorage.getItem("motogest-session"));
  if (!session?.token || !session.usuario?.nombre) session = null;
} catch {
  localStorage.removeItem("motogest-session");
}
const state = {
  session,
  route: location.hash.slice(1) || "resumen",
  month: monthNow(),
  search: "",
  activityFilter: "",
  clients: [],
  allClients: [],
  available: [],
  opportunities: [],
  products: [],
  activities: [],
  summary: null,
  detail: null,
  editClient: null,
  notice: "",
  error: "",
  loading: false,
};
let version = 0,
  controller = null,
  busy = false;
async function api(path, options = {}) {
  try {
    return await request(path, { token: state.session?.token, ...options });
  } catch (error) {
    if (error.status === 401 && state.session) {
      logout("Su sesión venció o su cuenta cambió. Inicie sesión nuevamente.");
    }
    throw error;
  }
}
function render() {
  if (!state.session) {
    root.innerHTML = view.login(state.error);
    return;
  }
  let content;
  const route = state.route.split("/")[0];
  if (route === "resumen") content = view.summary(state);
  else if (route === "clientes") content = view.clients(state);
  else if (route === "oportunidades")
    content = state.route.includes("/")
      ? view.detail(state)
      : view.opportunities(state);
  else if (route === "actividades") content = view.activities(state);
  else content = '<div class="empty">La pantalla solicitada no existe.</div>';
  root.innerHTML = view.shell(state, content);
}
function logout(message = "") {
  version++;
  controller?.abort();
  state.session = null;
  localStorage.removeItem("motogest-session");
  Object.assign(state, {
    clients: [],
    allClients: [],
    available: [],
    opportunities: [],
    products: [],
    activities: [],
    summary: null,
    detail: null,
    editClient: null,
    error: message,
    notice: "",
    loading: false,
  });
  render();
}
async function load() {
  if (!state.session) {
    render();
    return;
  }
  controller?.abort();
  controller = new AbortController();
  const current = ++version;
  state.loading = true;
  state.error = "";
  state.detail = null;
  render();
  try {
    const opts = { signal: controller.signal };
    const base = state.route.split("/")[0];
    const pending = {
      summary: api(
        `/reportes/resumen?mes=${encodeURIComponent(state.month)}`,
        opts,
      ),
    };
    if (base === "clientes") {
      pending.clients = api(
        `/clientes?q=${encodeURIComponent(state.search)}`,
        opts,
      );
      pending.available = api("/clientes/disponibles", opts);
    }
    if (base === "resumen" || base === "oportunidades")
      pending.opportunities = api("/oportunidades", opts);
    if (base === "oportunidades" || base === "actividades")
      pending.allClients = api("/clientes", opts);
    if (base === "oportunidades" && state.route.includes("/")) {
      pending.detail = api(
        "/oportunidades/" + encodeURIComponent(state.route.split("/")[1]),
        opts,
      );
      pending.products = api("/productos", opts);
    }
    if (base === "actividades")
      pending.activities = api(
        "/actividades" +
          (state.activityFilter ? "?estado=" + state.activityFilter : ""),
        opts,
      );
    const entries = await Promise.all(
      Object.entries(pending).map(async ([key, promise]) => [
        key,
        await promise,
      ]),
    );
    if (current !== version) return;
    Object.assign(state, Object.fromEntries(entries));
  } catch (error) {
    if (current !== version || error.name === "AbortError") return;
    state.error = error.message;
    state.summary = null;
  } finally {
    if (current === version) {
      state.loading = false;
      render();
    }
  }
}
function formErrors(form, error) {
  form.querySelectorAll("[data-error]").forEach((e) => (e.textContent = ""));
  for (const [key, message] of Object.entries(error.fields || {})) {
    const el = [...form.querySelectorAll("[data-error]")].find(
      (e) => e.dataset.error === key,
    );
    if (el) el.textContent = message;
  }
  const alert = form.querySelector(".form-error");
  if (alert) {
    alert.textContent = error.message;
    alert.className = "form-error alert alert-danger mt-3";
  }
  form
    .querySelector("[data-error]:not(:empty)")
    ?.previousElementSibling?.focus();
}
root.addEventListener("submit", async (event) => {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  if (busy) return;
  const type = form.dataset.form,
    data = Object.fromEntries(new FormData(form));
  if (type === "search") {
    state.search = data.q;
    await load();
    return;
  }
  if (type === "month") {
    state.month = data.mes;
    await load();
    return;
  }
  busy = true;
  const buttons = [...form.querySelectorAll("button")];
  buttons.forEach((b) => (b.disabled = true));
  try {
    let message = "Cambios guardados correctamente.";
    if (type === "login") {
      const result = await request("/auth/login", { method: "POST", data });
      state.session = result;
      localStorage.setItem("motogest-session", JSON.stringify(result));
      state.error = "";
      state.route = "resumen";
      location.hash = "resumen";
      await load();
      return;
    }
    if (type === "client") {
      await api("/clientes" + (form.dataset.id ? "/" + form.dataset.id : ""), {
        method: form.dataset.id ? "PATCH" : "POST",
        data,
      });
      state.editClient = null;
      message = "Cliente guardado correctamente.";
    }
    if (type === "opportunity") {
      const op = await api("/oportunidades", {
        method: "POST",
        data: { cliente_id: Number(data.cliente_id), titulo: data.titulo },
      });
      state.notice = "Cotización creada en prospecto.";
      location.hash = "oportunidades/" + op.id;
      return;
    }
    const id = state.detail?.id;
    if (type === "line")
      await api(`/oportunidades/${id}/productos`, {
        method: "POST",
        data: {
          producto_id: Number(data.producto_id),
          cantidad: Number(data.cantidad),
        },
      });
    if (type === "quantity")
      await api(`/oportunidades/${id}/productos/${form.dataset.id}`, {
        method: "PATCH",
        data: { cantidad: Number(data.cantidad) },
      });
    if (type === "title")
      await api(`/oportunidades/${id}`, {
        method: "PATCH",
        data: { titulo: data.titulo },
      });
    if (type === "lost")
      await api(`/oportunidades/${id}/etapa`, {
        method: "PATCH",
        data: { etapa: "perdida", motivo_perdida: data.motivo_perdida },
      });
    if (type === "activity") {
      const due = data.vence_en ? `${data.vence_en}:00-06:00` : null;
      await api(`/clientes/${Number(data.cliente_id)}/actividades`, {
        method: "POST",
        data: { tipo: data.tipo, descripcion: data.descripcion, vence_en: due },
      });
      message = "Actividad registrada correctamente.";
    }
    state.notice = message;
    await load();
  } catch (error) {
    if (form.isConnected) formErrors(form, error);
  } finally {
    busy = false;
    buttons.forEach((b) => (b.disabled = false));
  }
});
root.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "logout") {
    logout();
    return;
  }
  if (action === "retry") {
    await load();
    return;
  }
  if (action === "edit-client") {
    state.editClient = state.clients.find(
      (c) => c.id === Number(button.dataset.id),
    );
    render();
    document.querySelector("#nombre")?.focus();
    return;
  }
  if (action === "cancel-client") {
    state.editClient = null;
    render();
    return;
  }
  if (busy) return;
  busy = true;
  button.disabled = true;
  try {
    if (action === "take")
      await api(`/clientes/${button.dataset.id}/tomar`, { method: "POST" });
    if (action === "remove-line") {
      if (!confirm("¿Desea quitar este producto de la cotización?")) return;
      await api(
        `/oportunidades/${state.detail.id}/productos/${button.dataset.id}`,
        { method: "DELETE" },
      );
    }
    if (action === "advance")
      await api(`/oportunidades/${state.detail.id}/etapa`, {
        method: "PATCH",
        data: { etapa: button.dataset.stage },
      });
    if (action === "complete")
      await api(`/actividades/${button.dataset.id}`, {
        method: "PATCH",
        data: { completada: button.dataset.value === "true" },
      });
    state.notice = "Operación realizada correctamente.";
    await load();
  } catch (error) {
    state.error =
      error.message +
      (error.fields ? " " + Object.values(error.fields).join(" ") : "");
    render();
  } finally {
    busy = false;
    button.disabled = false;
  }
});
root.addEventListener("change", async (event) => {
  if (event.target.id === "activity-filter") {
    state.activityFilter = event.target.value;
    await load();
  }
});
window.addEventListener("hashchange", async () => {
  state.route = location.hash.slice(1) || "resumen";
  state.notice = "";
  state.editClient = null;
  await load();
  document.querySelector("#main")?.focus();
});
load();
