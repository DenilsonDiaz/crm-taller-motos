# Verificación de MotoGest Xela

Revisión: 4 de noviembre de 2026. Esta versión entrega código preparado, no una aprobación final del laboratorio. No se ha ejecutado la integración completa en el MySQL 8.4 de la computadora del estudiante.

## Resultados ejecutados
| Verificación | Resultado observado |
|---|---|
| Node: validaciones y HTTP real con base sustituida por usuarios en memoria | 14 aprobadas, 0 fallidas; 2 integraciones MySQL omitidas por no habilitarse. |
| Compatibilidad de autenticación | El login HTTP verificó con bcryptjs un hash de prueba $2y$ generado por PHP. |
| PHPUnit: normalización, acceso sin sesión, ausencia de registro y validación en español | 5 pruebas aprobadas, 9 aserciones. No requieren tablas reales. |
| Sintaxis PHP del código propio | Revisión con php -l, sin errores. |
| Rutas Laravel | 21 rutas web registradas; no existe /register. |
| Compilación Blade | artisan view:cache aprobado después de corregir foreach. |
| Compilación de recursos | npm run build aprobado con Vite; CSS y JS generados. |
| Composer | composer validate aprobado; instalación desde lock y comprobación de dependencias sin avisos de vulnerabilidades en la revisión. |
| SPA en Chromium a 1440 y 375 px, con respuestas de API simuladas | Login, resumen, cartera, embudo y actividades sin errores JS ni desbordamiento horizontal en las vistas recorridas. |
| Formularios y seguridad de SPA en navegador, con API simulada | Un 422 conserva el nombre escrito y muestra error de teléfono; API apagada muestra aviso; 401 elimina sesión y vuelve a login; nombres con img/onerror permanecen texto. |
| Panel Blade renderizado con datos de ejemplo, a 1440 y 375 px | Resumen y navegación revisados sin desbordamiento horizontal. Esto no verifica consultas ni permisos de MySQL. |
| Historial de Git | spec-v1 en d712441 anterior al código; commits del asistente identificados como tales. |

Las pruebas de interfaz usan datos preparados para revisar presentación y estados. Sus montos no son evidencia de que las consultas a MySQL hayan producido las cifras del enunciado. Se intentó iniciar un MySQL temporal de compatibilidad en el entorno de construcción; no pudo iniciar por falta de soporte de socket Unix. No se sustituyó esa prueba por una aprobación ficticia ni por SQLite.

## Matriz por criterio
“Parcial” significa código y alguna evidencia disponibles, con aceptación integrada pendiente. “Pendiente” exige ejecutarlo en la base de pruebas MySQL 8.4 antes de marcar entrega-final.

| Criterio | Evidencia y comprobación | Resultado |
|---|---|---|
| L1 | Migraciones nuevas, users original intacto, dos seeders; ejecutar ambos modos de migrate:fresh en base desechable y contrastar conteos. | Pendiente MySQL |
| L2 | Breeze adaptado, panel middleware, controlador de cuentas; registro inexistente probado. Probar roles, desactivación y protección de administrador. | Parcial |
| L3 | Validación de precio, catálogo y desactivación; cotizar, cambiar catálogo y revisar precio histórico. | Pendiente MySQL |
| L4 | Cartera.php: normalización, bloqueo, cupo, reasignación y liberación; probar altas, edición y borrado condicionado. | Pendiente MySQL |
| L5 | Alcance de equipo en consultas; Sergio debe recibir 404 al editar cliente de Sandra y no asignar fuera de equipo. | Pendiente MySQL |
| L6 | Reportes.php y oportunidades de solo lectura; comparar mes de Guatemala, productos, equipo y empresa. | Pendiente MySQL |
| L7 | Mensajes españoles y datos old; login vacío probado. Probar todos los formularios y los mismos valores en ambas puertas. | Parcial |
| A1 | Login JWT HS256, campos mínimos y rechazo de rol/inactivo probados con Express HTTP y hash PHP de prueba. | Aprobado sin MySQL; conexión real pendiente |
| A2 | Token ausente, algoritmo incorrecto y desactivación probados; vencimiento, firma alterada y cambio de rol en MySQL deben recorrerse. | Parcial |
| A3 | Clientes y toma transaccional; integration.test.js incluye cupo y duplicado simultáneos. | Pendiente MySQL |
| A4 | Servicio de oportunidades/líneas/historial; colección y pruebas preparadas para cierres, precios, ajenos y simultaneidad. | Pendiente MySQL |
| A5 | Validación de fechas con zona aprobada unitariamente; actividad completa y vencida con base real pendiente. | Parcial |
| A6 | Ventana de mes UTC+06 aprobada; cifras SQL no ejecutadas aún. | Pendiente MySQL |
| A7 | JSON malformado, 422, 401 y 403 probados; verificar conflictos y errores inesperados con base. | Parcial |
| A8 | README con veinte endpoints e instalación; colección Postman con 36 peticiones y regla del taller. | Archivos preparados; ejecución Postman pendiente |
| F1 | Login, cierre y 401 probado en navegador con API simulada; repetir conectado a la API. | Parcial |
| F2 | Cartera móvil, escape y formulario con 422 que conserva datos probados con respuestas simuladas. | Parcial |
| F3 | Embudo y vista móvil revisados; productos, cantidades y transiciones contra MySQL pendientes. | Parcial |
| F4 | Vista y estado de error revisados; creación/completado y fecha real pendientes. | Parcial |
| F5 | Resumen y quetzales revisados; fechas de Guatemala en format.js y límites API unitarios. | Parcial |
| F6 | Estado/render, delegación, carga, error, escape y ancho 375 revisados con navegador. | Aprobado en recorrido visual simulado; recorrido integrado pendiente |
| S1 | Hashes generados en PHP/Laravel; API solo compara con bcryptjs. Campos privados excluidos. | Revisado; users real pendiente |
| S2 | .env ignorados y ejemplos sin secretos; historial revisado. La API rechaza secreto menor de 32 caracteres. | Revisado |
| S3 | SQL con parámetros y Query Builder/Eloquent; identificadores dinámicos solo de listas del código. Postman y prueba SQL injection preparados. | Revisión aprobada; ataque integrado pendiente |
| S4 | Serializadores y login devuelven lista de campos permitidos; usuario de login probado. | Parcial |
| S5 | Consultas por dueño y alcance de equipo; pruebas cruzadas manuales indicadas abajo. | Pendiente MySQL |
| S6 | Respuesta CORS devuelve únicamente SPA_ORIGIN, nunca el origen atacante; probado por HTTP. | Aprobado HTTP; repetir en navegador externo |
| S7 | Usuario y cliente con img/onerror no generan etiqueta ejecutable; Blade usa {{ }}. | Aprobado en datos simulados |
| S8 | Bloqueos y UNIQUE implementados; pruebas concurrentes incluidas y protocolo abajo. | Pendiente MySQL |
| P1 | docs/especificacion.md y tag spec-v1 antes de implementación, decisiones, contrato y mapeo de reglas. | Preparado; revisión de pareja pendiente |
| P2 | docs/plan.md, fases y responsabilidades del asistente; asignar responsables humanos reales. | Parcial |
| P3 | Esta matriz distingue evidencia real de pendiente. | Abierto hasta completar MySQL |
| P4 | AGENTS.md en la raíz. | Preparado |
| P5 | Tres incidentes reales y commits correctivos documentados abajo. | Documentado; pareja debe comprenderlos |
| Regla propia | server-side y metadatos; Postman y sector.test.js demuestran rechazo y éxito cuando se ejecuten. | Pendiente MySQL |
| Integración de puertas | Asignar en panel → visible en SPA; ganar en SPA → aparece en reporte de equipo. | Pendiente en Windows |
| Cambio docente | Actualizar requisito real, etiqueta spec-v2 y migración nueva si corresponde. | Aún no suministrado |
| Defensa y aportes | Ensayo, cambio de código en vivo y commits reales de ambos. | Trabajo de la pareja pendiente |

## Cifras de control: esperadas, no obtenidas todavía
Ejecute solo VerificacionSeeder en una base desechable y seleccione octubre 2026. No compare la empresa con ambas semillas cargadas porque el taller agrega oportunidades.

| Alcance | Ventas | Total esperado Q | Pronóstico esperado Q | Obtenido en MySQL 8.4 |
|---|---:|---:|---:|---|
| Valeria, octubre | 2 | 9250.00 | 2512.88 | Pendiente |
| Diego, octubre | 1 | 6000.00 | 112.50 | Pendiente |
| Carlos, octubre | 1 | 7200.00 | 4125.75 | Pendiente |
| Sergio, octubre | 3 | 15250.00 | 2625.38 | Pendiente |
| Sandra, octubre | 1 | 7200.00 | 4125.75 | Pendiente |
| Empresa, octubre | 4 | 22450.00 | 6751.13 | Pendiente |
| Valeria, noviembre | 1 | 3600.00 | 2512.88 | Pendiente |

Conteos esperados: 7 usuarios, 5 productos, 21 clientes, 11 oportunidades, 43 filas de historial y 4 actividades. Productos vendidos de octubre: Plan básico 5/Q6000; Plan avanzado 2/Q5200; Instalación 1/Q450; Soporte anual 3/Q10800. El precio actual del Plan avanzado es distinto del cotizado y no debe cambiar esas cifras.

## Protocolo integrado que falta ejecutar
Use la base desechable y conserve resultados reales y fecha en este archivo.

1. Cargar únicamente VerificacionSeeder. Ejecutar integration.test.js con RUN_DB_TESTS=1; comprueba conteos, resumen de Valeria, dos altas simultáneas de Carlos cuando tiene nueve clientes, teléfono equivalente duplicado simultáneo, búsqueda con inyección, toma repetida y transición simultánea sin doble historial. Limpia solo registros temporales que ella misma creó.
2. Ampliar la toma a diez peticiones de vendedores diferentes sobre un cliente disponible: exactamente un 200 y nueve 409. Para disponer de diez vendedores, crearlos desde el panel en la base desechable. No cambiar el seeder del ingeniero.
3. Dos peticiones de Valeria con la misma transición: una 200, otra 409 y una sola fila nueva. Dos vendedores intentando registrar el mismo teléfono normalizado: una 201, otra 409; comprobar COUNT=1.
4. Valeria intenta GET y PATCH sobre cliente de Diego y GET/PATCH/DELETE sobre sus oportunidades/líneas: 404 sin datos. Sergio intenta editar cliente del equipo de Sandra en panel: 404.
5. Desactivar a Valeria en panel con sesión/token abierto. Su siguiente llamada recibe 401 y vuelve a login. El supervisor desactivado tampoco conserva sesión de panel. El administrador no puede desactivarse a sí mismo.
6. Cotizar producto activo; cambiar precio y desactivarlo desde panel. La línea previa conserva precio; agregar el producto desactivado a otra cotización se rechaza. No se edita una oportunidad cerrada.
7. Reasignar cliente con cotización abierta y actividad. El nuevo vendedor las recibe; el anterior pierde acceso a las abiertas. Ventas cerradas mantienen crédito original. Liberar con trabajo pendiente se rechaza.
8. Intentar inyección SQL en búsqueda y etiquetas HTML en nombre/título/descripción. Revisar respuestas JSON sin llaves privadas y CORS desde otro origen.
9. Cargar ambas semillas y ejecutar sector.test.js con RUN_SECTOR_TESTS=1: sin mano de obra debe dar 422, conservar negociación y cuatro historiales; con mano de obra gana y deja cinco. Verificar la misma venta en panel.
10. Importar y ejecutar Postman; registrar capturas o salidas sin tokens ni contraseñas privadas. Reiniciar solo la base desechable antes de repetir.
11. Ejecutar scripts PowerShell en Windows, ensayar teclado y móvil con API real y registrar versiones instaladas. Los scripts no se ejecutaron en Windows durante esta construcción.

## Bitácora de revisión de IA: incidentes reales

| Incidente | Propuesta o código incorrecto | Cómo se detectó | Corrección y commit |
|---|---|---|---|
| 1 | Las plantillas Blade generadas omitían espacios en foreach. | artisan view:cache falló con “Malformed @foreach statement”. | Se corrigieron las expresiones y la compilación pasó; 419a8b5. |
| 2 | Se configuró español como idioma, pero no se incluyeron traducciones de validación. | Una prueba de login vacío esperaba “Debe ingresar su correo.” y obtuvo validation.required; 4 pasaron y 1 falló. | Se agregaron lang/es/validation.php y auth.php; luego 5/5 pasaron. Commit 99f6c1a. |
| 3 | El servicio de asignación del panel contaba con lectura consistente después de haber leído el cliente. En REPEATABLE READ podía reutilizar una instantánea anterior al bloqueo del vendedor. | Revisión del orden de lecturas y bloqueo frente al caso de dos asignaciones simultáneas con nueve clientes; no se afirmó una carrera ejecutada. | Se cambió el conteo por una lectura actual SELECT de ids con lockForUpdate antes de contar. Commit 99f6c1a. La prueba de carrera real queda pendiente. |

Adicionalmente se restauró byte por byte la migración original de users, que el formateador había modificado, para respetar la instrucción de extenderla con otra migración. Esa restauración está en 99f6c1a. No se fabricaron errores de estudiantes ni resultados de Postman.
