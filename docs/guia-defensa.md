# Guía para explicar MotoGest Xela

## Qué problema resuelve
En un taller se pierde seguimiento cuando nadie sabe quién atendió al cliente, qué repuestos cotizó ni cuándo debe volver a llamarlo. MotoGest organiza esas relaciones y cotizaciones. Es un CRM comercial: las citas del mecánico, inventario físico y facturación FEL no forman parte de este alcance.

## Las tres partes
| Parte | Explicación sencilla | Archivos principales |
|---|---|---|
| Panel Laravel | El encargado organiza personas, catálogo y clientes; revisa resultados. | routes/web.php, PanelController.php, Services/Cartera.php, Services/Reportes.php, resources/views/panel/ |
| API Express | El intermediario que verifica quién pide algo, aplica reglas y consulta MySQL. | api/src/app.js, service.js, domain.js, db.js |
| SPA | Las pantallas que usa el vendedor; solicita datos a la API y los muestra. | frontend/index.html, js/app.js, js/views.js, js/api.js, css/app.css |
| MySQL | La información permanente compartida por ambas puertas. | laravel/database/migrations y database/seeders |

Laravel usa Eloquent, que traduce operaciones de modelos a SQL. La API escribe las consultas con mysql2 y parámetros ?. Así se cumple la diferencia técnica solicitada por el ingeniero, sin duplicar bases.

## Los archivos que debe poder explicar
- app.js del frontend conserva un objeto state. Un evento cambia ese estado, se solicitan datos y render vuelve a dibujar la pantalla. Un escuchador en el contenedor atiende los botones: eso es delegación de eventos.
- views.js arma las vistas; format.js escapa texto, presenta quetzales y fechas de Guatemala. Escapar hace que un nombre con etiquetas se lea como texto en lugar de ejecutarse.
- api.js centraliza fetch, token y mensajes de error. Si recibe 401 vuelve a iniciar sesión. LocalStorage guarda únicamente la sesión.
- app.js de la API declara las rutas y verifica el JWT, su algoritmo, expiración y que el usuario siga activo. El vendedor se obtiene del token y nunca de un campo enviado por el navegador.
- service.js contiene el trabajo comercial: tomar clientes, cotizar, cambiar etapas y calcular resultados. domain.js valida datos como NIT, teléfono, fecha y cantidad.
- db.js abre y confirma transacciones. Una transacción hace que todos los cambios se guarden juntos o que ninguno quede guardado.
- Cartera.php aplica la asignación en el panel. Bloquea vendedores por orden de id y consulta la cartera con lectura actual para no aceptar un undécimo cliente.
- Las migraciones construyen las tablas y sus restricciones. Los seeders cargan ejemplos. VerificacionSeeder reproduce los datos del ingeniero; SectorSeeder agrega el taller sin cambiarlos.

## Reglas que más probablemente le preguntarán
**Máximo diez clientes:** se bloquea la fila del vendedor antes de contar y asignar. Dos peticiones del mismo vendedor esperan su turno. El índice único resuelve además NIT y teléfono duplicados.

**Tomar un cliente:** la transacción bloquea el cliente. Solo el primero que lo encuentra disponible puede asignárselo; otro intento responde 409.

**Precios históricos:** al agregar una pieza se copia el precio a la línea de la cotización. Cambiar el catálogo mañana no modifica lo cotizado ayer. El total lo calcula el servidor.

**Historial:** crear y avanzar una cotización registra quién lo hizo. Actualizar etapa, fecha de cierre e historial ocurre dentro de la misma transacción. Una operación rechazada no agrega historial.

**Regla del taller:** si incluye un repuesto marcado como requiere instalación, no puede ganar sin una línea de mano de obra marcada como instalación. Se valida con metadatos, no buscando palabras en el nombre.

**Fechas:** se guarda UTC. Los meses y la presentación usan Guatemala. Octubre comienza a las 06:00 UTC del 1 de octubre y termina justo antes de las 06:00 UTC del 1 de noviembre.

**Pronóstico:** suma el total de todas las cotizaciones abiertas por su probabilidad: 10, 25, 50 o 75 %. No se limita al mes. Solo se redondea al terminar de sumar.

**Reasignación:** las oportunidades abiertas y actividades pasan al nuevo vendedor. Las ventas cerradas conservan el vendedor original. Para liberar un cliente primero deben cerrarse sus oportunidades y completarse pendientes.

## Códigos HTTP en palabras normales
| Código | Significado |
|---|---|
| 200 / 201 / 204 | Consulta o cambio correcto / creado / borrado sin contenido. |
| 400 | La petición o un filtro tiene formato incorrecto. |
| 401 | Necesita una sesión válida. |
| 403 | La cuenta existe pero su rol no entra por esa puerta. |
| 404 | No existe o pertenece a otra cartera; no se revela cuál caso es. |
| 409 | Hay un conflicto: cupo lleno, duplicado, cerrado o ya tomado. |
| 422 | Corrija un campo del formulario. |

## Recorrido sugerido de quince minutos
1. Minutos 0–2: problema, tres aplicaciones y base compartida.
2. Minutos 2–5: ingresar como supervisor, mostrar equipo, cartera y reporte de octubre con semilla común.
3. Minutos 5–9: ingresar como vendedor, tomar cliente, crear cotización, agregar producto y avanzar etapas.
4. Minutos 9–11: demostrar la regla del taller con y sin mano de obra.
5. Minutos 11–13: explicar transacción, precio histórico, JWT y un rechazo de acceso ajeno.
6. Minutos 13–15: mostrar especificación, historial de Git y correcciones reales de IA. Estar listo para cambiar una validación o texto y ejecutarlo.

Ensaye cada parte con su compañero. Los dos deben comprender el trabajo completo y realizar cambios reales bajo sus propias cuentas. No afirme que una prueba pendiente ya pasó: consulte verificacion.md.

## Resumen de solicitudes usadas para desarrollar
| Solicitud resumida | Para qué se usó |
|---|---|
| Leer el enunciado y escribir decisiones antes del código | Conservar el contrato, definir reasignación, etapas, dinero y zona horaria. |
| Construir API con SQL parametrizado | Separar rutas, validaciones y transacciones sin usar ORM en Node. |
| Crear panel con Breeze y Eloquent | Mantener cuentas y administración en Laravel, sin registro público. |
| Crear pantallas del taller con HTML, CSS y módulos JS | Tener una interfaz completa y código que pueda seguirse archivo por archivo. |
| Revisar seguridad y ejecutar pruebas | Detectar errores reales, corregirlos y conservar evidencia. |

Aquí no usamos hooks de React: el enunciado pide JavaScript sin framework. Usamos eventos, estado y funciones normales. Breeze es el scaffolding de autenticación; Express, mysql2, bcryptjs y jsonwebtoken son dependencias con responsabilidades concretas. No confunda estas bibliotecas con los plugins del editor.
