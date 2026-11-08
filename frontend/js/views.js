import { escapeHTML as e, cash, date, labels, stageBadge } from "./format.js";
export const field = (
  label,
  name,
  type = "text",
  value = "",
  required = true,
) =>
  `<div><label class="form-label" for="${name}">${label}</label><input class="form-control" id="${name}" name="${name}" type="${type}" value="${e(value)}" ${required ? "required" : ""}><div class="field-error" data-error="${name}"></div></div>`;
const select = (label, name, options) =>
  `<div><label class="form-label" for="${name}">${label}</label><select class="form-select" id="${name}" name="${name}" required><option value="">Seleccione una opción</option>${options}</select><div class="field-error" data-error="${name}"></div></div>`;
const options = (rows, label = "nombre") =>
  rows.map((x) => `<option value="${x.id}">${e(x[label])}</option>`).join("");
const sectionPhoto = (name) =>
  `<picture class="section-photo" aria-hidden="true">
    <source media="(max-width: 760px)" srcset="images/${name}-440.avif" type="image/avif">
    <img src="images/${name}-880.avif" width="880" height="352" alt="" decoding="async">
  </picture>`;
export const heading = (tag, title, desc, action = "", photo = "") =>
  `<div class="page-heading${photo ? " page-heading--photo" : ""}"><div><div class="eyebrow">${tag}</div><h1>${title}</h1><p>${desc}</p></div>${action}${photo ? sectionPhoto(photo) : ""}</div>`;
const empty = (msg) => `<div class="empty">${msg}</div>`;
const openStages = ["prospecto", "calificado", "propuesta", "negociacion"];
const formError = '<div class="form-error mt-3" role="alert"></div>';
export function login(message = "") {
  return `<div class="login-page"><section class="login-art"><picture class="login-photo" aria-hidden="true"><source media="(max-width: 760px)" srcset="images/taller-440.avif" type="image/avif"><img src="images/taller-960.avif" width="960" height="1200" alt="" decoding="async" fetchpriority="high"></picture><div class="brand"><span class="brand-mark">MG</span><div><span class="brand-name">MotoGest</span><small>Taller de motos · Xela</small></div></div><div><div class="eyebrow" style="color:#f8875e">CRM para talleres de motos</div><h1>Ventas y <span>seguimiento.</span></h1><p>Consulte su cartera, prepare cotizaciones y revise las actividades pendientes.</p></div><small>MOTOGEST XELA · GESTIÓN COMERCIAL</small></section><main class="login-form"><div class="login-form-inner"><div class="eyebrow">Acceso del vendedor</div><h2>Ingresar a ventas</h2><p>Ingrese con la cuenta que le asignó el administrador.</p>${message ? `<div class="alert alert-warning">${e(message)}</div>` : ""}<form data-form="login">${field("Correo electrónico", "correo", "email")}${field("Contraseña", "clave", "password")}<button class="button-primary" type="submit">Entrar a ventas →</button>${formError}</form><p class="login-foot">¿Necesita una cuenta? Solicítela al administrador del taller.</p><a class="action-link" href="http://localhost:8000/login">Acceso de administración y supervisión ↗</a></div></main></div>`;
}
export function shell(state, body) {
  const user = state.session.usuario;
  const current = state.route.split("/")[0];
  return `<div class="app-shell"><aside class="sidebar"><a class="brand" href="#resumen"><span class="brand-mark">MG</span><div><span class="brand-name">MotoGest</span><small>Taller de motos · Xela</small></div></a><p class="nav-caption">MI ESPACIO DE VENTAS</p><nav class="side-nav" aria-label="Navegación principal">${[
    ["resumen", "◷", "Resumen"],
    ["clientes", "◇", "Mi cartera"],
    ["oportunidades", "▤", "Cotizaciones"],
    ["actividades", "✓", "Seguimiento"],
  ]
    .map(
      ([route, icon, title]) =>
        `<a class="${current === route ? "active" : ""}" ${current === route ? 'aria-current="page"' : ""} href="#${route}"><span class="nav-icon" aria-hidden="true">${icon}</span>${title}</a>`,
    )
    .join(
      "",
    )}</nav><div class="sidebar-bottom"><p>Un buen seguimiento hace<br>la diferencia.</p><button type="button" data-action="logout">Cerrar sesión ↗</button></div></aside><div class="workspace"><header class="topbar"><span class="breadcrumb-text">MotoGest Xela / Espacio del vendedor</span><div class="user-chip"><span class="avatar">${e(user.nombre.charAt(0))}</span><span>${e(user.nombre)}<small>Asesor de ventas</small></span></div></header>${state.loading ? '<div class="loading" role="status" aria-label="Cargando"></div>' : ""}<main class="content" id="main" tabindex="-1" aria-busy="${state.loading}">${state.notice ? `<div class="alert alert-success" role="status">${e(state.notice)}</div>` : ""}${state.error ? `<div class="alert alert-danger" role="alert">${e(state.error)} <button class="btn btn-sm btn-light" data-action="retry">Reintentar</button></div>` : ""}${body}<p class="bottom-note">MotoGest Xela · Montos en quetzales · Hora de Guatemala</p></main></div></div>`;
}
export function summary(s) {
  const d = s.summary;
  if (!d)
    return empty(
      s.loading ? "Cargando su resumen…" : "No hay un resumen disponible.",
    );
  return (
    heading(
      "Operación comercial",
      "Resumen de ventas",
      "Ventas, pronóstico y cartera del período seleccionado.",
      `<form data-form="month" class="filter-row"><label for="mes" class="visually-hidden">Mes del reporte</label><input class="form-control" id="mes" name="mes" type="month" value="${e(s.month)}" required><button class="btn btn-light">Consultar</button></form>`,
    ) +
    `<div class="metric-grid">${[
      ["Ventas del mes", d.ventas, "Cotizaciones cerradas como ganadas"],
      ["Total vendido", cash(d.total), "Precios guardados en cada cotización"],
      [
        "Pronóstico",
        cash(d.pronostico),
        "Estimación de todas sus oportunidades abiertas",
      ],
      [
        "Mi cartera",
        `${d.cartera.clientes} / ${d.cartera.maximo}`,
        "Clientes bajo su responsabilidad",
      ],
    ]
      .map(
        ([a, b, c]) =>
          `<div class="metric"><small>${a}</small><strong>${b}</strong><p>${c}</p></div>`,
      )
      .join(
        "",
      )}</div><section class="hero-strip"><picture class="hero-photo" aria-hidden="true"><source media="(max-width: 760px)" srcset="images/motor-440.avif" type="image/avif"><img src="images/motor-800.avif" width="800" height="450" alt="" decoding="async" loading="lazy"></picture><div><div class="eyebrow" style="color:#f8875e">Agenda comercial</div><h2>Actividades de seguimiento</h2><p>Consulte llamadas, reuniones y tareas pendientes.</p></div><a class="button-primary" href="#actividades">Abrir agenda →</a></section><div class="two-col"><section class="card-box"><div class="card-head"><h2>Oportunidades recientes</h2><a class="action-link" href="#oportunidades">Ver todas →</a></div>${opTable(s.opportunities.slice(0, 5))}</section><section class="card-box"><div class="card-head"><h2>Su cartera</h2><span class="pill">${d.cartera.clientes} clientes</span></div><p class="meta">Cada vendedor puede atender hasta diez clientes. Consulte sus datos o tome un cliente disponible.</p><div class="progress-track"><span style="width:${d.cartera.clientes * 10}%"></span></div><a class="button-primary mt-4" href="#clientes">Administrar mi cartera →</a></section></div>`
  );
}
function opTable(ops) {
  return ops.length
    ? `<table class="table table-mobile"><thead><tr><th>Cotización</th><th>Estado</th><th class="amount">Total</th><th></th></tr></thead><tbody>${ops.map((o) => `<tr><td data-label="Cotización"><strong>${e(o.titulo)}</strong><small>${e(o.cliente.nombre)}</small></td><td data-label="Estado">${stageBadge(o.etapa)}</td><td class="amount" data-label="Total">${cash(o.total)}</td><td><a class="action-link" href="#oportunidades/${o.id}">Ver detalle →</a></td></tr>`).join("")}</tbody></table>`
    : empty("Todavía no hay cotizaciones en esta lista.");
}
export function clients(s) {
  const edit = s.editClient;
  return (
    heading(
      "Relaciones que importan",
      "Mi cartera de clientes",
      "Consulte sus clientes, registre nuevos contactos y continúe la conversación.",
    ) +
    `<section class="card-box"><details ${edit ? "open" : ""}><summary>${edit ? "Editar cliente" : "Registrar un cliente"}</summary><form data-form="client" data-id="${edit?.id || ""}"><div class="row g-3"><div class="col-md-6">${field("Nombre completo o negocio", "nombre", "text", edit?.nombre || "")}</div><div class="col-md-6">${field("NIT o CF", "nit", "text", edit?.nit || "CF")}</div><div class="col-md-6">${field("Teléfono", "telefono", "tel", edit?.telefono || "")}</div><div class="col-md-6">${field("Correo electrónico opcional", "correo", "email", edit?.correo || "", false)}</div></div><div class="inline-actions mt-3"><button class="button-primary">${edit ? "Guardar cambios" : "Guardar cliente"}</button>${edit ? '<button type="button" class="btn btn-light" data-action="cancel-client">Cancelar</button>' : ""}</div>${formError}</form></details></section><section class="card-box"><div class="card-head"><h2>Clientes asignados</h2><span class="pill">${s.summary?.cartera.clientes ?? s.clients.length} / 10</span></div><form data-form="search" class="filter-row mb-3"><div><label class="form-label" for="q">Buscar por nombre o NIT</label><input class="form-control" type="search" name="q" id="q" value="${e(s.search)}" placeholder="Escriba y pulse Buscar"></div><button class="btn btn-light">Buscar</button></form>${s.clients.length ? `<table class="table table-mobile"><thead><tr><th>Cliente</th><th>NIT</th><th>Contacto</th><th></th></tr></thead><tbody>${s.clients.map((c) => `<tr><td data-label="Cliente"><strong>${e(c.nombre)}</strong></td><td class="technical" data-label="NIT">${e(c.nit)}</td><td data-label="Contacto"><span class="technical">${e(c.telefono)}</span><small>${e(c.correo || "Sin correo")}</small></td><td><button class="btn btn-sm btn-light" data-action="edit-client" data-id="${c.id}">Editar</button></td></tr>`).join("")}</tbody></table>` : empty("No hay clientes que coincidan con su búsqueda.")}</section><section class="card-box"><div class="card-head"><h2>Clientes disponibles</h2><small>Sin vendedor asignado</small></div>${s.available.length ? `<table class="table table-mobile"><thead><tr><th>Cliente</th><th>Acción</th></tr></thead><tbody>${s.available.map((c) => `<tr><td data-label="Cliente">${e(c.nombre)}</td><td><button class="btn btn-sm btn-light" data-action="take" data-id="${c.id}">Tomar cliente →</button></td></tr>`).join("")}</tbody></table>` : empty("Por ahora no hay clientes disponibles.")}</section>`
  );
}
export function opportunities(s) {
  return (
    heading(
      "De la consulta a la venta",
      "Su embudo comercial",
      "Dé seguimiento a cada cotización y avance una etapa a la vez.",
      "",
      "repuestos",
    ) +
    `<section class="card-box"><details><summary>Crear una cotización</summary>${!s.allClients.length ? empty("Registre o tome un cliente para poder crear una cotización.") : `<form data-form="opportunity"><div class="row g-3"><div class="col-md-6">${select("Cliente", "cliente_id", options(s.allClients))}</div><div class="col-md-6">${field("Título de la cotización", "titulo")}</div></div><button class="button-primary mt-3">Crear en prospecto</button>${formError}</form>`}</details></section><div class="stage-picker">
      <label class="form-label" for="board-stage">Etapa del embudo</label>
      <select class="form-select" id="board-stage" aria-controls="opportunity-board">
        ${openStages.map((stage) => `<option value="${stage}" ${s.boardStage === stage ? "selected" : ""}>${labels[stage]}</option>`).join("")}
      </select>
    </div><div class="board" id="opportunity-board">${openStages
      .map((stage) => {
        const list = s.opportunities.filter((o) => o.etapa === stage);
        return `<section class="board-column${s.boardStage === stage ? " is-current" : ""}" data-stage="${stage}"><h2>${labels[stage]} <span class="pill">${list.length}</span></h2>${list.map((o) => `<a class="op-card" href="#oportunidades/${o.id}"><strong>${e(o.titulo)}</strong><p>${e(o.cliente.nombre)}</p><footer><span>${cash(o.total)}</span><span class="text-accent">${o.probabilidad}%</span></footer></a>`).join("") || '<p class="meta">Sin oportunidades</p>'}</section>`;
      })
      .join(
        "",
      )}</div><section class="card-box closed-list"><div class="card-head"><h2>Cotizaciones cerradas</h2></div>${opTable(s.opportunities.filter((o) => ["ganada", "perdida"].includes(o.etapa)))}</section>`
  );
}
export function detail(s) {
  const o = s.detail;
  if (!o)
    return empty(
      s.loading ? "Cargando la cotización…" : "No se encontró la cotización.",
    );
  const isClosed = ["ganada", "perdida"].includes(o.etapa),
    idx = Object.keys(labels).indexOf(o.etapa),
    next = Object.keys(labels)[idx + 1];
  return (
    heading(
      "Detalle de cotización",
      e(o.titulo),
      e(o.cliente.nombre),
      '<a class="btn btn-light" href="#oportunidades">← Volver al embudo</a>',
    ) +
    `<div class="metric-grid"><div class="metric"><small>Total cotizado</small><strong>${cash(o.total)}</strong><p>Calculado por el servidor</p></div><div class="metric"><small>Etapa actual</small><strong style="font-size:22px">${labels[o.etapa]}</strong><p>${o.probabilidad}% de probabilidad</p></div><div class="metric"><small>Productos</small><strong>${o.productos.length}</strong><p>Líneas de esta cotización</p></div><div class="metric"><small>Cierre</small><strong style="font-size:15px">${o.fecha_cierre ? date(o.fecha_cierre) : "En seguimiento"}</strong><p>${isClosed ? "Cotización de solo lectura" : "Todavía puede editarla"}</p></div></div>${o.motivo_perdida ? `<div class="alert alert-secondary">Motivo de pérdida: ${e(o.motivo_perdida)}</div>` : ""}<div class="two-col"><div><section class="card-box"><div class="card-head"><h2>Repuestos y servicios</h2>${stageBadge(o.etapa)}</div>${o.productos.length ? `<table class="table table-mobile"><thead><tr><th>Producto</th><th>Cantidad</th><th class="amount">Precio</th><th class="amount">Subtotal</th><th></th></tr></thead><tbody>${o.productos.map((l) => `<tr><td data-label="Producto">${e(l.nombre)}</td><td data-label="Cantidad">${isClosed ? l.cantidad : `<form data-form="quantity" data-id="${l.id}" class="inline-actions"><label class="visually-hidden" for="qty-${l.id}">Cantidad de ${e(l.nombre)}</label><div><input id="qty-${l.id}" class="form-control" style="max-width:80px" type="number" min="1" max="999" name="cantidad" value="${l.cantidad}" required><div class="field-error" data-error="cantidad"></div></div><button class="btn btn-sm btn-light">Guardar</button>${formError}</form>`}</td><td class="amount" data-label="Precio guardado">${cash(l.precio_unitario)}</td><td class="amount" data-label="Subtotal">${cash(l.subtotal)}</td><td>${!isClosed ? `<button class="btn btn-sm btn-light" data-action="remove-line" data-id="${l.id}">Quitar</button>` : ""}</td></tr>`).join("")}</tbody></table>` : empty("Agregue productos o servicios a esta cotización.")}${!isClosed ? `<hr><form data-form="line"><div class="row g-3"><div class="col-md-8">${select("Producto o servicio activo", "producto_id", s.products.map((p) => `<option value="${p.id}">${e(p.nombre)} · ${cash(p.precio)}</option>`).join(""))}</div><div class="col-md-4">${field("Cantidad", "cantidad", "number", 1)}</div></div><p class="form-text">El servidor toma el precio actual del catálogo y lo conserva en la cotización.</p><button class="button-primary" ${!s.products.length ? "disabled" : ""}>Agregar producto</button>${!s.products.length ? '<p class="meta">No hay productos activos disponibles.</p>' : ""}${formError}</form>` : ""}</section>${!isClosed ? `<section class="card-box"><h2 class="h6">Editar el título</h2><form data-form="title">${field("Título", "titulo", "text", o.titulo)}<button class="btn btn-light mt-3">Guardar título</button>${formError}</form></section>` : ""}</div><div><section class="card-box"><div class="card-head"><h2>Siguiente paso</h2></div>${isClosed ? '<p class="meta">Esta cotización está cerrada y conserva su historial.</p>' : `<div class="inline-actions"><button class="button-primary" data-action="advance" data-stage="${next}">${next === "ganada" ? "Marcar como ganada" : "Avanzar a " + labels[next]} →</button></div><details class="mt-3"><summary>Marcar como perdida</summary><form data-form="lost">${field("Motivo de pérdida", "motivo_perdida")}<button class="btn btn-outline-secondary mt-3">Confirmar pérdida</button>${formError}</form></details>`}</section><section class="card-box"><div class="card-head"><h2>Historial de etapas</h2></div><ol class="timeline">${o.historial.map((h) => `<li><strong>${h.etapa_anterior ? labels[h.etapa_anterior] + " → " : ""}${labels[h.etapa_nueva]}</strong><small>${e(h.usuario)} · ${date(h.fecha)}</small></li>`).join("")}</ol></section></div></div>`
  );
}
export function activities(s) {
  return (
    heading(
      "Mantenga la conversación",
      "Actividades de seguimiento",
      "Organice sus llamadas, reuniones y tareas con sus clientes.",
      "",
      "servicio",
    ) +
    `<section class="card-box"><details><summary>Registrar una actividad</summary>${!s.allClients.length ? empty("Necesita un cliente asignado para registrar actividades.") : `<form data-form="activity"><div class="row g-3"><div class="col-md-6">${select("Cliente", "cliente_id", options(s.allClients))}</div><div class="col-md-6">${select("Tipo", "tipo", '<option value="llamada">Llamada</option><option value="reunion">Reunión</option><option value="tarea">Tarea</option>')}</div><div class="col-md-8">${field("Descripción", "descripcion")}</div><div class="col-md-4">${field("Vencimiento en hora de Guatemala", "vence_en", "datetime-local", "", false)}</div></div><button class="button-primary mt-3">Guardar actividad</button>${formError}</form>`}</details></section><section class="card-box"><div class="card-head"><h2>Su agenda</h2><label>Mostrar <select class="form-select" id="activity-filter"><option value="">Todas</option><option value="pendiente" ${s.activityFilter === "pendiente" ? "selected" : ""}>Pendientes</option><option value="completada" ${s.activityFilter === "completada" ? "selected" : ""}>Completadas</option></select></label></div>${s.activities.length ? `<table class="table table-mobile"><thead><tr><th>Actividad</th><th>Cliente</th><th>Vencimiento</th><th>Estado</th><th></th></tr></thead><tbody>${s.activities.map((a) => `<tr class="${a.vencida && !a.completada ? "activity-overdue" : ""}"><td data-label="Actividad"><strong>${e(a.descripcion)}</strong><small>${e(a.tipo)}</small></td><td data-label="Cliente">${e(a.cliente.nombre)}</td><td data-label="Vencimiento">${date(a.vence_en)}</td><td data-label="Estado"><span class="pill ${a.completada ? "active" : a.vencida ? "overdue" : ""}">${a.completada ? "Completada" : a.vencida ? "Vencida" : "Pendiente"}</span></td><td><button class="btn btn-sm btn-light" data-action="complete" data-id="${a.id}" data-value="${!a.completada}">${a.completada ? "Volver a pendiente" : "Completar ✓"}</button></td></tr>`).join("")}</tbody></table>` : empty("No hay actividades para este filtro.")}</section>`
  );
}
