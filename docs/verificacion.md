# Verificación de MotoGest Xela

Este documento conserva la revisión inicial del 4 de noviembre de 2026 y las verificaciones posteriores. La [matriz de cierre](#matriz-de-cierre) distingue los resultados de MySQL, las pruebas con respuestas simuladas y las comprobaciones que siguen abiertas.

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

## Matriz por criterio de la revisión inicial
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

## Corrección A: liberación concurrente de clientes

Revisión del 4 de noviembre de 2026. No cambia el requisito de liberación de la especificación.

- Causa confirmada por revisión de código: `Cartera::asignar()` lee primero el cliente sin bloqueo y establece una instantánea en REPEATABLE READ. Después puede esperar el bloqueo del vendedor. Las consultas ordinarias `exists()` de oportunidades abiertas y actividades pendientes podían seguir leyendo esa instantánea, aunque la API hubiera confirmado trabajo antes de que el panel obtuviera el bloqueo.
- Corrección: ambas comprobaciones usan `lockForUpdate()->first(['id'])`, una lectura actual de una fila, dentro de la misma transacción. Se conservan los bloqueos de vendedores por id y después del cliente; las comprobaciones del trabajo se hacen a continuación. La API ya bloquea al vendedor antes de crear oportunidades, crear actividades o modificar su estado; no se modificó la API ni el aislamiento global.
- Regresión: `laravel/tests/Feature/LiberacionConcurrenteTest.php`, con dos casos independientes (oportunidad abierta y actividad pendiente). Un proceso Node invoca el servicio real de la API; detiene su COMMIT hasta observar en `performance_schema.data_lock_waits` que la conexión del panel está esperando a esa conexión API. Después confirma. El panel debe rechazar la liberación con el mensaje esperado, conservar al vendedor y mantener el trabajo confirmado. También comprueba que, retirado/completado el trabajo temporal, sí se puede liberar.
- La prueba no utiliza `RefreshDatabase`, no ejecuta migraciones ni semillas, y elimina únicamente sus propias filas temporales. Las cuentas y hashes temporales los crea Laravel. Las credenciales del proceso Node se transmiten por stdin, no como argumentos ni mensajes.

### Verificación ejecutada en esta revisión

| Comprobación | Resultado real |
|---|---|
| `php -l app/Services/Cartera.php` y `php -l tests/Feature/LiberacionConcurrenteTest.php`, desde Laravel | Ambos sin errores de sintaxis. |
| Código Node devuelto por `apiWorker()`, comprobado con `node --input-type=module --check` | Sin errores de sintaxis; no ejecuta operaciones de base. |
| `php vendor/bin/phpunit --do-not-cache-result`, desde Laravel | 7 aprobadas, 14 aserciones; los 2 casos concurrentes omitidos. |
| Regresión con MySQL 8.4 y Node real | En la revisión inicial del asistente quedó omitida. Posteriormente el usuario informó la ejecución aprobada que se registra a continuación. |

### Ejecución de la regresión A realizada por el usuario

Resultado real comunicado por el usuario: `LiberacionConcurrenteTest` ejecutado en Windows, con PHP 8.4.0, MySQL 8.4.13 y la base exclusiva `crm_taller_motos_pruebas`.

```text
OK (2 tests, 26 assertions)
Tiempo: 2.280 segundos.
```

Ejecución realizada por el usuario, no por el asistente. El resultado corresponde a los dos casos de liberación concurrente (oportunidad abierta y actividad pendiente); no constituye una comprobación de todo el sistema. La comparación con el código anterior `exists()` sigue pendiente.

### Cómo repetir la regresión en una base exclusiva

1. Disponga de una base **exclusiva de pruebas**, con nombre terminado en `_pruebas`, y con las migraciones del proyecto ya aplicadas mediante Laravel. No requiere semillas. No use ni reinicie la base de desarrollo. El usuario MySQL usado para esta prueba debe tener permisos de datos solo sobre esa base y permiso SELECT sobre `performance_schema.data_lock_waits` y `performance_schema.threads` para observar la espera. Un administrador de MySQL debe preparar esos permisos si faltan.
2. Use las dependencias PHP y Node ya instaladas. Desde una terminal PowerShell nueva, en `laravel`, configure los datos de esa base. El diálogo de credenciales evita escribir la contraseña en el comando:

```powershell
$env:TEST_DB_HOST='127.0.0.1'
$env:TEST_DB_PORT='3306'
$env:TEST_DB_DATABASE='crm_taller_motos_pruebas'
$credencial=Get-Credential -Message 'Cuenta MySQL exclusiva de pruebas'
$env:TEST_DB_USERNAME=$credencial.UserName
$env:TEST_DB_PASSWORD=$credencial.GetNetworkCredential().Password
$env:RUN_CONCURRENCY_TESTS='1'
php vendor/bin/phpunit --do-not-cache-result --filter LiberacionConcurrenteTest
Remove-Item Env:TEST_DB_PASSWORD
Remove-Item Env:RUN_CONCURRENCY_TESTS
```

3. Registre el resultado real de ambos casos. La prueba exige MySQL 8.4 y fija REPEATABLE READ solamente en sus conexiones de prueba. Sin la habilitación explícita se omite; no toma los valores `DB_*` de desarrollo. Si faltan permisos de observación, debe corregirse la configuración de pruebas antes de repetir; un tiempo agotado no cuenta como una liberación rechazada correctamente.

Para comprobar que detecta el defecto original, en una copia de trabajo separada puede ejecutar los mismos casos con las dos comprobaciones anteriores `exists()`: deberían fallar porque se permite liberar. Esa comprobación comparativa también queda pendiente de la base exclusiva; no se afirma que se haya ejecutado.

## Corrección B: error junto a la cantidad de una línea

- Cambio en `frontend/js/views.js`: se agregó `<div class="field-error" data-error="cantidad"></div>` inmediatamente después del input de cada formulario de modificación de cantidad, siguiendo el estilo de los otros campos.
- Revisión de `frontend/js/app.js`: `formErrors()` busca el mensaje dentro del formulario enviado y lo coloca mediante `textContent`. El manejo de errores del envío no llama a `render()`, no reinicia el formulario ni sustituye el valor del input. No fue necesario modificar este archivo para conservar lo escrito ante un 422.
- Verificación ejecutada por el asistente: `node --check frontend/js/views.js` sin errores; generación del HTML con Node y datos ficticios de dos líneas, comprobando un elemento de error de cantidad en cada formulario, sus valores iniciales y ausencia de formularios de edición en una oportunidad cerrada. No se llamó a la API ni a MySQL. `git diff --check` sin errores de espacios.

### Prueba manual B realizada por el usuario en navegador

El usuario informó que, en «Consulta de mantenimiento», cambió la cantidad del aceite de 1 a 0, desactivando temporalmente la validación HTML. Al guardar apareció «Escriba una cantidad entera de 1 a 999» junto al campo, permaneció el 0 escrito y el total mostrado siguió en Q60.00.

Este resultado corresponde al recorrido manual realizado por el usuario, no por el asistente. No se informa como comprobada la repetición sobre otra línea ni la revisión específica de la rehabilitación del botón.

## Corrección C: conservar formularios al fallar acciones de botones

Cambio limitado a `frontend/js/app.js`: el error de una acción conserva temporalmente en `state.formDraft` los valores de campos con id y las secciones `details` desplegadas. Se excluyen campos de contraseña y archivos. `render()` muestra el aviso desde el estado, restaura los campos y descarta esa copia temporal. `logout()` también limpia el borrador. Si la sesión ya se cerró o cambió, el error de la acción no restaura datos ni reemplaza el aviso de cierre. No se guardan formularios en localStorage.

### Comprobaciones realizadas por el asistente

- `node --check frontend/js/app.js`: sin errores de sintaxis.
- Ejecución de los módulos reales del frontend en Node, con un DOM mínimo simulado y `fetch` sustituido por respuestas ficticias. No se usó navegador ni se llamó a la API real o a MySQL.
  - Se completaron nombre, NIT, teléfono y correo de un cliente nuevo sin guardar, y se dejó desplegado su formulario. Al intentar tomar un disponible y recibir un 409 simulado, el HTML contenía el aviso, los cuatro valores permanecían y el formulario seguía desplegado. El botón se volvió a habilitar.
  - Se cambió el nombre del borrador y se repitió la acción con un 500 simulado: permaneció el valor más reciente y se mostró el nuevo aviso en el HTML.
  - Se repitió la acción con un 401 simulado: se eliminó la sesión de localStorage, desapareció el formulario de cliente, el login quedó con correo y contraseña vacíos y se conservó el aviso de cierre de sesión sin restaurar el borrador.
  - Tras el error 409, se comprobó que localStorage mantenía únicamente la sesión y no contenía el nombre escrito en el borrador.
- `git diff --check`: sin errores de espacios.

Estos resultados del asistente comprueban el flujo con objetos DOM simulados, no la presentación visual. La comprobación manual posterior del usuario se registra a continuación.

### Prueba manual C realizada por el usuario en navegador

El usuario informó que escribió «prueba de conservacion» en el formulario de cliente, detuvo la API e intentó tomar un cliente disponible. Apareció el aviso de conexión y el formulario permaneció abierto con el nombre escrito. Después reinició la API.

Esta es una prueba manual realizada por el usuario del error de conexión. Los casos de respuesta 409 y 401 siguen pendientes de comprobar en navegador; sus simulaciones en Node no sustituyen esos recorridos. Estos resultados y el caso B no constituyen una verificación completa del sistema.

## Revisión previa a guardar los cambios en Git

Comprobaciones realizadas por el asistente, sin ejecutar migraciones ni pruebas que escriban en MySQL:

- Compatibilidad PHP: `composer.json` fija `config.platform.php` en `8.4.0` y el lock registra esa plataforma. El cambio selecciona componentes Symfony compatibles con PHP 8.4.0 en lugar de versiones que exigían 8.4.1; también incluye la actualización ya existente de phpdotenv de 5.7.0 a 5.8.0.
- `composer --no-plugins --no-scripts validate --strict --no-check-publish`: aprobado, incluido el estado del archivo lock.
- `composer --no-plugins --no-scripts check-platform-reqs --lock`: todos los requisitos de plataforma aprobados con PHP 8.4.0. No se instalaron ni actualizaron dependencias durante esta revisión.
- `php vendor/bin/phpunit --do-not-cache-result tests/Feature/PanelTest.php tests/Feature/FieldComponentTest.php tests/Unit/IdentidadTest.php`: 7 pruebas aprobadas, 14 aserciones. Esta selección no ejecuta `LiberacionConcurrenteTest`; su resultado MySQL sigue atribuido al usuario en el apartado A.
- Sintaxis: `php -l` en `Cartera.php` y `LiberacionConcurrenteTest.php`, y `node --check` en `frontend/js/app.js` y `frontend/js/views.js`, sin errores.
- Archivos locales: `git check-ignore` confirmó que los `.env` de Laravel/API y `laravel/.env.liberacion.ps1` están ignorados. La lista de archivos `.env*` versionados contiene únicamente los ejemplos de Laravel y API.


## Verificación del 7 de noviembre de 2026

Ejecutamos las pruebas en Windows con PHP 8.4.0, Node 24.19.0 y MySQL 8.4.13. Usamos bases de pruebas separadas de la base de demostración. Los apartados anteriores conservan los resultados históricos.

| Comprobación | Resultado |
|---|---|
| API sin MySQL | 14 pruebas aprobadas. Las 2 que requieren MySQL se ejecutaron por separado y pasaron. |
| Laravel con la prueba de liberación concurrente habilitada | 9 pruebas y 40 aserciones aprobadas. |
| Propiedad en la API | 12 peticiones a recursos ajenos devolvieron 404, con datos válidos e inválidos. Un teléfono inválido en un cliente propio devolvió 422. |
| Permisos en el panel | Sergio recibió 404 al abrir e intentar guardar la edición de un cliente del equipo de Sandra. |
| Errores API | Una codificación JSON incompatible devolvió 400. Un alta con cuatro campos inválidos devolvió los cuatro mensajes en un 422. |
| Formularios Laravel | Se mostró el mensaje por campo al enviar un NIT o teléfono duplicado y se conservó el texto ingresado. Editar el correo de un cliente de Iván conservó su asignación. |
| Concurrencia | Diez vendedores intentaron tomar un mismo cliente. Hubo un 200 y nueve 409. Dos destinos de etapa partieron de la misma etapa y solo uno dejó una fila nueva de historial. La integración de cupo y duplicados simultáneos también pasó. |
| Cifras de control | Coincidieron las cuatro filas de vendedores en la API y los totales de ambos equipos, empresa y cuatro productos en el panel, con solo la semilla de verificación. |
| Integración panel–API–reporte | Sergio asignó un cliente, Valeria pudo leerlo y ganar una venta por la API, y el reporte del equipo reflejó el importe. Este recorrido se ejecutó por HTTP. |
| Regla del taller | Pasó la prueba MySQL que rechaza el cierre sin instalación y lo acepta al agregar el servicio. |
| Colección Postman | Newman ejecutó las 36 peticiones y aprobó 74 aserciones. El primer recorrido reveló un selector que no encontraba el nombre de la línea de instalación. Se corrigió y se repitió con datos iniciales en otra base. |

Al cierre del 7 de noviembre quedaban pendientes el recorrido con la SPA en navegador, el ensayo de la defensa y el cambio del catedrático si ya se publicó. Las comprobaciones posteriores están en la matriz de cierre.

## Matriz de cierre

| Criterios | Evidencia disponible | Alcance pendiente |
|---|---|---|
| L1 | Migraciones y ambas semillas ejecutadas en Windows. La integración con solo `VerificacionSeeder` pasó los conteos. | |
| L2 | Pruebas Laravel de acceso y ausencia de registro. En MySQL se comprobó el alcance de Sergio y la conservación de una asignación a Iván inactivo. | Comprobar en el panel una sesión abierta que pierde acceso. |
| L3, A4 | Newman comprobó las operaciones de cotización y el cierre con instalación. Denilson ejecutó además una prueba local de precio histórico contra MySQL que cubrió cambios de catálogo, cantidad y desactivación. | Repetir desde la interfaz el cambio de precio del catálogo y la consulta de la cotización anterior. |
| L4, L5, L7, A3 | Se verificaron mensajes de duplicados, alcance por equipo, integración de asignación, cupo y toma simultánea. Denilson obtuvo dos casos y 26 aserciones en la regresión de liberación. | |
| L6, A6 | El equipo informó que los resultados de vendedor, equipo, empresa y productos coincidieron con la tabla de control. | |
| A1, A2, A7 | El login y el formato de errores pasaron en Express. Denilson informó nueve pruebas locales aprobadas de permisos HTTP con MySQL. El ensayo final comprobó que desactivar a Valeria desde Laravel invalida su token y el navegador vuelve al inicio de sesión. | Pruebas con vencimiento y firma alterada sobre la conexión real. |
| A5, A8 | Newman pasó 36 peticiones y 74 aserciones, incluyendo actividades y la regla del taller. | |
| F1–F6 | El ensayo en Chromium con MySQL real cubrió ingreso, cartera, cotización, reporte y actividades. Pasaron los casos `401`, `409` y `422`, y se comprobó el ancho de 375 px en el reporte, la cartera y la cotización cerrada. | Completar la revisión de navegación por teclado y de las demás pantallas a 375 px. |
| S1–S4 | Hash generado en PHP y verificado en Node. Solo se versionan los `.env.example`. Pasaron las pruebas de búsqueda con entrada de inyección y de respuesta pública del login. | |
| S5–S8 | Se comprobó `404` para recursos ajenos, origen CORS en pruebas HTTP, escape en una prueba de interfaz simulada y concurrencia con MySQL. | Repetir escape y CORS desde un navegador conectado a la API real. |
| P1, P2, P4, P5 | `spec-v1` precede al código. El plan enlaza aportes comprobables en Git. Están incluidos `AGENTS.md` y la bitácora de tres incidentes con sus commits. | El cambio del catedrático requiere el texto publicado en el aula para documentarlo e implementarlo. |
| P3 y regla propia | Los resultados de MySQL y Newman están arriba. La prueba de instalación rechazó el primer cierre y lo aceptó al agregar el servicio. | |

### Revisión del código en `c41c6be`

El 9 de noviembre se repitieron las pruebas de Node sin MySQL desde una copia limpia de GitHub. Pasaron 14 y se omitieron las dos integraciones que requieren MySQL. También se instaló el frontend de Laravel desde su archivo lock y Vite compiló sus recursos correctamente. Los resultados de PHP y MySQL de los apartados anteriores corresponden a las ejecuciones en Windows.

## Ensayo final del 9 de noviembre de 2026

Se probó el código del commit `722b3c6bd8142a829bc7830067eab5052dc23a06` en una copia aislada con Node 24.22.1, PHP 8.4.27 y MySQL 8.4.13. Se usó una base con solo `VerificacionSeeder` para las cifras de control y el navegador, y otra con ambas semillas para la regla del taller y la colección de Postman.

| Comprobación | Resultado |
|---|---|
| Migraciones y semillas | Se aplicaron las cinco migraciones en cada base. Se cargó `VerificacionSeeder` en la primera y ambas semillas en la segunda. |
| API | Pasaron 14 pruebas base y, por separado, las dos integraciones de MySQL. La primera comprobó los conteos, el resumen de Valeria, el cupo, los duplicados y las transiciones simultáneas. La segunda rechazó ganar sin instalación y aceptó el cierre al añadir el servicio. |
| Laravel | Pasaron 9 pruebas y 40 aserciones con MySQL habilitado para los dos casos de liberación concurrente. Las vistas Blade y los recursos de Vite compilaron correctamente. |
| Postman con Newman | Pasaron 36 peticiones y 74 aserciones, sin fallos. |
| Reporte de control en Chromium | Sergio vio 3 ventas por Q15,250.00 y un pronóstico de Q2,625.38 en octubre de 2026. |
| Panel, portal y reporte | Sergio asignó un cliente desde Laravel. Valeria lo vio en su cartera, creó una cotización de Q1,200.00 y la ganó con cinco entradas de historial. El reporte del mes del cierre aumentó en una venta y Q1,200.00. |
| Permisos y formularios | El cliente de otro vendedor respondió `404`. Una toma rechazada con `409` conservó el nombre y teléfono del borrador. La cantidad cero devolvió `422`, conservó el valor escrito y mostró el error junto al campo. |
| Actividades y sesión | Una actividad para las 09:00 de Guatemala se guardó a las 15:00 UTC y pudo completarse desde el portal. Al desactivar a Valeria desde el panel, la siguiente consulta devolvió `401`, se eliminó la sesión y reapareció el inicio de sesión. |
| Ancho móvil | El reporte de Sergio, la cartera y el detalle de la cotización cerrada se comprobaron a 375 px, sin desbordamiento horizontal. |
