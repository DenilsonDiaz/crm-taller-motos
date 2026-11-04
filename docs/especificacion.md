# Especificación del CRM MotoGest Xela

## Objetivo y sector
Controlar clientes, cotizaciones de repuestos y servicios, seguimiento comercial y ventas de un taller de motos de Quetzaltenango. Tres puertas funcionales: panel de administrador/supervisor, API propia y SPA del vendedor, sobre MySQL compartido.

## Alcance y arquitectura
El panel Laravel es monolítico Blade con Eloquent y autenticación basada en Breeze. La API Express usa SQL parametrizado con mysql2, nunca ORM. La SPA usa HTML Bootstrap y JavaScript de módulos sin framework. Solo Laravel ejecuta DDL mediante migraciones y crea cuentas/hashes. Siete tablas de negocio users, productos, clientes, oportunidades, oportunidad_productos, historial_etapas y actividades, más infraestructura Laravel.

## Decisiones obligatorias
- Transiciones: avance de una etapa entre abiertas; ganar solamente desde negociacion; perder desde cualquier abierta, para admitir la pérdida en propuesta de la semilla. Sin saltos ni retrocesos. Una transición no permitida y un cierre ya consumado dan 409; etapa inexistente 422.
- Reasignación: se transfieren al nuevo vendedor oportunidades abiertas y actividades del cliente. Las cerradas conservan vendedor y crédito histórico; no se exponen al nuevo vendedor. Se conserva el historial original. La API verifica propiedad de oportunidad y del cliente para trabajar abiertas. Un supervisor no puede reasignar fuera de su equipo.
- Liberación: se permite únicamente sin oportunidades abiertas; las actividades pendientes deben completarse antes de liberar. Las cerradas conservan autor. Quien toma el cliente podrá ver actividades históricas ligadas a él, nunca otras carteras.
- Desactivación: conserva la cartera hasta una reasignación explícita. En cada petición se comprueba cuenta activa y rol. Se impide modificar rol/supervisor de una cuenta con relaciones incompatibles. Un supervisor con vendedores activos no se desactiva; primero se reasigna el equipo. Un administrador no se desactiva ni se cambia su propio rol.
- Campos desconocidos: se ignoran mediante lista explícita de campos admitidos. Nunca se usan dueño, precio o etapa inicial enviados por el navegador.
- Dinero: DECIMAL en MySQL; en JavaScript operaciones de presentación y totales con centavos enteros; agregaciones SQL convertidas a números únicamente en el límite JSON. Pronóstico redondeado tras sumar, no por fila.
- Tiempo: conexiones de base UTC; ventanas de mes Guatemala se convierten a límites UTC en SQL. Entrada de actividades exige fecha válida con Z u offset explícito.
- Concurrencia: las asignaciones bloquean los vendedores afectados por orden de id, y luego el cliente; cambios de etapa bloquean la oportunidad. Cambios de productos bloquean primero la oportunidad. Transacciones y UNIQUE garantizan invariantes ante simultaneidad.
- La regla del sector usa metadatos de producto, no textos que el usuario puede renombrar.

## Regla propia del taller
productos requiere_instalacion boolean por defecto false; es_instalacion boolean por defecto false. Estas columnas adicionales no afectan el contrato ni la semilla común. Para ganar una oportunidad con al menos un producto requiere_instalacion=true debe existir una línea con producto es_instalacion=true. Se valida dentro de la transacción de cierre. SectorSeeder carga kit de cilindro que requiere instalación y mano de obra que satisface la regla; VerificacionSeeder deja ambos flags en false.
Dado un kit marcado y una oportunidad en negociación, cuando se intenta ganar sin mano de obra, entonces devuelve 422 con error de etapa y no cambia etapa, cierre ni historial. Cuando se agrega mano de obra y se repite, gana una sola vez. La semilla común conserva todas sus cifras.

## Criterios de aceptación
Cada L1–L7, A1–A8, F1–F6 y S1–S8 descrito en el contrato de referencia siguiente es obligatorio. Para cada regla se verifica el camino correcto y su rechazo mediante Postman y pruebas del servidor. No se marca como probado hasta ejecutar.
Dado un cliente asignado desde Laravel, cuando su vendedor consulta GET /clientes, entonces aparece en la SPA. Dada una venta ganada desde la SPA, cuando el supervisor consulta el reporte del mes, entonces se incluye con precio histórico y fecha de Guatemala.
Dado un vendedor con 10 clientes, cuando crea/toma/recibe otro, entonces 409 y conserva 10, incluso simultáneamente. Dados dos vendedores tomando el mismo disponible, exactamente uno recibe 200 y el otro 409.
Dado un recurso ajeno, leerlo o modificarlo responde 404 sin detalles. Dada una cuenta desactivada con token anterior, la siguiente petición da 401. Panel rechaza vendedor; API rechaza administrador/supervisor.
Dado un producto ya cotizado, al cambiar su precio en catálogo no cambia el total anterior. Dada oportunidad cerrada, todo intento de editar título, productos o etapa da 409.
Dadas dos solicitudes de transición de la misma etapa a la siguiente, una gana el bloqueo y la otra no produce un segundo historial.
Dado un NIT o teléfono equivalente normalizado, crear duplicado da 409; NIT CF se guarda NULL y se responde CF. Texto peligroso se muestra como texto. SQL recibe datos separados de instrucciones.
Dada fecha ambigua sin zona, 422; una fecha con offset se devuelve UTC. La interfaz siempre representa Guatemala, incluso en otro huso.
Dada pantalla de 375 px, no hay desplazamiento horizontal; todos los formularios conservan texto ante error, muestran errores por campo y estados de carga, y permiten teclado.

## Semillas y cifras
VerificacionSeeder es independiente y exacto: 7 cuentas, 5 productos, 21 clientes (3 Valeria, 2 Diego, 9 Carlos, 1 Iván, 6 libres), 11 oportunidades, 43 cambios históricos y 4 actividades. SectorSeeder se ejecuta después y utiliza correos/teléfonos/NIT distintos y vendedores propios. migrate:fresh --seed carga ambas; --seeder=VerificacionSeeder carga únicamente los datos del ingeniero.
Octubre 2026: Valeria 2 ventas Q9250.00 pronóstico Q2512.88, Diego 1 Q6000.00 pronóstico Q112.50, Carlos 1 Q7200.00 pronóstico Q4125.75. Empresa 4 Q22450.00 pronóstico Q6751.13. Noviembre Valeria 1 Q3600.00. Se contrasta además el desglose por producto y equipo del enunciado.

## Contrato completo y requisitos del núcleo
La siguiente transcripción de las secciones técnicas del enunciado es parte de esta especificación. Se conserva el contrato externo aunque las pantallas utilicen vocabulario del taller. Las decisiones anteriores completan las preguntas abiertas.

Programación Web · Proyecto final · CRM de ventas 
Página 5 de 22 
Entorno y versiones 
Herramienta 
Versión 
Observación 
PHP y Composer 
PHP 8.4 
Laravel 13 exige PHP 8.3 o superior 
Laravel 
13, con Breeze (stack Blade) 
Breeze se instala aparte; vea la nota 
Base de datos 
MySQL 8.4 LTS 
Las restricciones CHECK son parte del proyecto, y 
MySQL 8.4 las aplica 
Node.js 
24 LTS 
 
API 
Express 5, mysql2, jsonwebtoken, bcryptjs 
y cors 
Ningún otro paquete es obligatorio 
SPA 
Bootstrap 5.3 y módulos de JavaScript 
Se sirve con Live Server o con cualquier servidor 
estático 
Pruebas de la API 
Postman 
Su colección se entrega en el repositorio 
 
Trampas de instalación 
Breeze no aparece en el asistente de laravel new. Cree el proyecto sin kit de inicio y luego ejecute 
composer require laravel/breeze --dev y php artisan breeze:install blade. 
Laravel usa SQLite por omisión. Si no cambia DB_CONNECTION y los datos de conexión en .env, el 
panel y la API trabajarán sobre bases distintas sin que nada falle a la vista. 
Los estilos de Breeze se compilan. Si agrega clases en sus vistas y no aparecen, falta npm run dev 
o npm run build. 
 
5. Roles y puertas 
Rol 
Puerta 
Qué puede hacer 
Qué no puede hacer 
Administrador 
Panel 
Crear y editar cuentas; administrar el catálogo; ver y 
administrar todos los clientes; ver todas las 
oportunidades y los reportes de toda la empresa 
Entrar a la API. Borrar cuentas: 
se desactivan 
Supervisor 
Panel 
Ver a los vendedores de su equipo, los clientes de su 
equipo y los disponibles; crear clientes y asignarlos, 
reasignarlos o liberarlos dentro de su equipo; ver las 
oportunidades y los reportes de su equipo 
Ver otros equipos. Administrar 
cuentas o catálogo. Entrar a la 
API 
Vendedor 
SPA, a través de 
la API 
Trabajar su cartera, tomar clientes disponibles, llevar 
sus oportunidades y sus productos, registrar 
actividades y ver su resumen del mes 
Entrar al panel. Ver o tocar 
datos de otro vendedor 
 
Cada vendedor pertenece al equipo de un supervisor. Una cuenta desactivada no entra por ninguna de las 
dos puertas y, si tenía una sesión abierta, la pierde en su siguiente petición. 
6. Modelo de datos 
Las tablas son las mismas para todas las parejas. Los tipos de la columna "Tipo" son los de MySQL; las 
migraciones los expresan con los métodos de Laravel. Todas las fechas se guardan en UTC. 


Programación Web · Proyecto final · CRM de ventas 
Página 6 de 22 
users 
La tabla que crea Laravel, más tres columnas que agrega una migración propia: 
Columna 
Tipo 
Reglas 
rol 
administrador, supervisor o 
vendedor 
Obligatorio; por omisión, vendedor 
supervisor_id 
Referencia a users.id, o vacío 
Obligatorio para los vendedores y vacío para los demás. Debe 
ser una cuenta con rol supervisor 
activo 
Booleano 
Por omisión, verdadero. Las cuentas no se borran: se 
desactivan 
 
productos 
Columna 
Tipo 
Reglas 
nombre 
VARCHAR(120) 
Obligatorio y único 
precio 
DECIMAL(10,2) 
Mayor que cero, en quetzales 
activo 
Booleano 
Solo los activos se agregan a una oportunidad. Los productos 
no se borran: se desactivan 
 
clientes 
Columna 
Tipo 
Reglas 
vendedor_id 
Referencia a users.id, o vacío 
El vendedor responsable. Vacío significa que el cliente está 
disponible 
nombre 
VARCHAR(150) 
Obligatorio 
nit 
VARCHAR(12), o vacío 
NIT válido guardado compacto (4521817K), o vacío para 
consumidor final. Único 
telefono 
CHAR(8) 
Teléfono de Guatemala, solo los 8 dígitos. Único 
correo 
VARCHAR(150), o vacío 
Formato de correo válido 
 
oportunidades 
Columna 
Tipo 
Reglas 
cliente_id 
Referencia a clientes.id 
Obligatorio 
vendedor_id 
Referencia a users.id 
El dueño de la oportunidad 
titulo 
VARCHAR(150) 
Obligatorio 
etapa 
prospecto, calificado, propuesta, 
negociacion, ganada o perdida 
Por omisión, prospecto 
motivo_perdida 
VARCHAR(255), o vacío 
Presente si y solo si la etapa es perdida 
fecha_cierre 
DATETIME, o vacío 
Presente si y solo si la etapa es ganada o perdida 
 
oportunidad_productos 
Cada fila es una línea de la oportunidad: un producto, su cantidad y el precio al que se cotizó. 
Columna 
Tipo 
Reglas 
oportunidad_id 
Referencia a oportunidades.id 
Al borrar la oportunidad se borran sus líneas 


Programación Web · Proyecto final · CRM de ventas 
Página 7 de 22 
Columna 
Tipo 
Reglas 
producto_id 
Referencia a productos.id 
Un producto aparece una sola vez en cada oportunidad (índice 
único) 
cantidad 
SMALLINT 
De 1 a 999 
precio_unitario 
DECIMAL(10,2) 
El precio del catálogo en el momento de agregar el producto. 
Mayor que cero 
 
historial_etapas 
Columna 
Tipo 
Reglas 
oportunidad_id 
Referencia a oportunidades.id 
Al borrar la oportunidad se borra su historial 
usuario_id 
Referencia a users.id 
Quién hizo el cambio 
etapa_anterior 
Una etapa, o vacío 
Vacío en el registro de creación 
etapa_nueva 
Una etapa 
Obligatoria 
created_at 
DATETIME 
Cuándo ocurrió el cambio 
 
actividades 
Columna 
Tipo 
Reglas 
cliente_id 
Referencia a clientes.id 
Al borrar el cliente se borran sus actividades 
vendedor_id 
Referencia a users.id 
Quién la registró 
tipo 
llamada, reunion o tarea 
Obligatorio 
descripcion 
VARCHAR(500) 
Obligatoria 
vence_en 
DATETIME, o vacío 
Cuándo vence 
completada 
Booleano 
Por omisión, falso 
 
Todas las tablas, salvo historial_etapas, tienen created_at y updated_at. 
Las reglas también viven en la base 
Dos aplicaciones escriben en estas tablas. Una regla que solo vive en una de ellas no protege nada. 
Por eso, además de validar en el panel y en la API, la base hace cumplir lo que puede: llaves 
foráneas, índices únicos (NIT, teléfono, producto por oportunidad) y restricciones CHECK (precios y 
cantidades, formato del teléfono, y la relación entre la etapa, el motivo de pérdida y la fecha de cierre). 
 
7. Reglas del núcleo 
Estas reglas son las que verifican las pruebas automáticas. Cada una se cumple en todas las puertas 
donde aplica. 
R1 · Acceso por rol 
• Cada rol entra solo por su puerta (sección 5). Un vendedor que intenta usar el panel, o un 
administrador o supervisor que intenta usar la API, recibe un rechazo claro. 
• Una cuenta desactivada no entra por ninguna puerta, y lo que ya tenía abierto deja de servirle: su 
sesión del panel o su token de la API. 


Programación Web · Proyecto final · CRM de ventas 
Página 8 de 22 
R2 · Propiedad 
• Un vendedor solo ve y modifica sus clientes, sus oportunidades y las actividades de los clientes de su 
cartera. Lo ajeno responde 404, no 403: la respuesta no confirma que exista. 
• Un supervisor solo ve a su equipo y a los clientes disponibles. 
• El dueño de un registro nunca viene del cuerpo de la petición: sale de la sesión o del token. 
R3 · Cartera 
• Un vendedor tiene como máximo 10 clientes. Crear, tomar o asignar un cliente a un vendedor con la 
cartera llena se rechaza (409 en la API). 
• Un cliente sin vendedor está disponible. Cualquier vendedor con espacio en su cartera puede tomarlo. 
La lista de disponibles muestra solo el id y el nombre: sin NIT, teléfono ni correo. 
• Tomar un cliente es atómico: si dos vendedores lo intentan al mismo tiempo, exactamente uno lo 
consigue y el otro recibe 409. Del mismo modo, la cartera máxima se respeta aunque lleguen varias 
operaciones simultáneas del mismo vendedor. 
R4 · Identidad del cliente 
NIT. Se acepta un NIT de Guatemala válido o CF (consumidor final). Antes de validar, el NIT se compacta: 
se quitan espacios y guiones, se pasa a mayúsculas y se quitan los ceros a la izquierda. El último carácter 
es un dígito verificador (0 a 9, o K) que se calcula con módulo 11: 
1. Separe el cuerpo (todo menos el último carácter) del verificador. 
2. Multiplique cada dígito del cuerpo, de derecha a izquierda, por 2, 3, 4… y sume los productos. 
3. Calcule (11 − (suma mód 11)) mód 11. Si da 10, el verificador es K; si no, es ese número. 
 
Ejemplo: 452 1817-k se compacta a 4521817K. Cuerpo 4521817: 7×2 + 1×3 + 8×4 + 1×5 + 2×6 + 5×7 + 
4×8 = 133; 133 mód 11 = 1; 11 − 1 = 10, que es K. Válido. Un NIT compacto tiene entre 2 y 12 caracteres. 
CF se guarda como vacío (NULL) y la API lo devuelve como "CF". Así varios clientes pueden ser 
consumidor final sin chocar con el índice único del NIT. 
Teléfono. Se aceptan espacios, guiones, puntos, paréntesis y el prefijo +502 o 502; todo eso se quita antes 
de guardar. Lo que queda deben ser 8 dígitos que empiecen con 2 a 9. 
Sin repetidos. El NIT (cuando no es CF) y el teléfono no se repiten entre clientes, comparados ya 
normalizados: 4521817-k y 4521817K son el mismo NIT. Un repetido responde 409 en la API. 
R5 · Embudo de ventas 
Etapa 
prospecto 
calificado 
propuesta 
negociacion 
ganada 
perdida 
Probabilidad 
10 % 
25 % 
50 % 
75 % 
100 % 
0 % 
 
• Toda oportunidad nace en prospecto, para un cliente de la cartera de quien la crea. Las cuatro primeras 
etapas están abiertas; ganada y perdida están cerradas. 
• Como mínimo, siempre se puede avanzar una etapa a la vez entre las abiertas, ganar desde 
negociación y perder desde negociación. Los saltos, los retrocesos y desde qué otras etapas se gana o 
se pierde los decide su especificación. 
• Ganar exige al menos un producto en la oportunidad. Perder exige un motivo (de 1 a 255 caracteres, 
sin contar espacios sobrantes). 


Programación Web · Proyecto final · CRM de ventas 
Página 9 de 22 
• Al cerrarse, la oportunidad registra su fecha de cierre. Una oportunidad cerrada ya no cambia: ni título, 
ni etapa, ni productos (409). 
• El historial registra la creación (con etapa anterior vacía) y cada cambio de etapa, con quién y cuándo, 
en la misma transacción que el cambio. Un intento rechazado no deja registro, y dos cambios 
simultáneos sobre la misma oportunidad no pueden dejar dos registros. 
R6 · Dinero 
• Los montos son quetzales con dos decimales y se guardan como DECIMAL, nunca como FLOAT. 
• Al agregar un producto a una oportunidad, su precio se copia del catálogo a la línea. Si después 
cambia el precio del catálogo, la oportunidad no cambia. Quien hace la petición nunca envía el precio. 
• El total de una oportunidad es la suma de cantidad × precio unitario de sus líneas, y lo calcula el 
servidor. 
• Solo se agregan productos activos. Un producto que ya está en la oportunidad no se agrega otra vez 
(409): se cambia su cantidad, que es un entero de 1 a 999. 
R7 · Reportes 
• Una venta es una oportunidad ganada. Su mes es el mes calendario de su fecha de cierre en hora de 
Guatemala (UTC−6, sin horario de verano), aunque la base guarde UTC. 
• Total vendido: la suma de los totales de las ventas del mes. 
• Pronóstico: la suma de total × probabilidad de las oportunidades abiertas, sin filtro de mes, redondeada 
a dos decimales. 
• Los reportes se calculan en la base de datos (SQL en la API; Eloquent o el constructor de consultas en 
el panel) y la API los devuelve como números, no como texto. 
R8 · Respuestas y fechas 
• La API nunca devuelve hashes de contraseñas, llaves internas como vendedor_id, user_id o 
supervisor_id, ni datos de otro vendedor. 
• Las fechas viajan en ISO 8601 y en UTC (2026-10-05T16:00:00.000Z). La SPA las muestra en hora 
de Guatemala. 
• Una fecha que llega a la API sin zona horaria (2026-12-01T10:00) es ambigua y se rechaza con 422. 
Con zona (2026-12-01T10:00:00-06:00) se guarda en UTC. 
• Una actividad está vencida si no está completada y su fecha de vencimiento ya pasó. 
Decisiones que su especificación debe tomar 
El enunciado deja abiertas estas preguntas a propósito. Su especificación las responde, con la alternativa 
que descartaron y por qué. Lo que decidan debe respetar las reglas de arriba. 
Pregunta 
Lo que deben considerar 
¿Qué transiciones del embudo permiten, además 
del mínimo? 
Saltos de etapa, retrocesos, perder o ganar desde otras etapas, y qué 
responde la API a lo que no permiten 
¿Qué pasa con las oportunidades y actividades 
de un cliente reasignado? 
Quién conserva el crédito de las ventas ya cerradas y quién sigue las abiertas 
¿Se puede liberar un cliente con oportunidades 
abiertas? 
Qué pasa con esas oportunidades si el cliente queda disponible 
¿Qué pasa con la cartera de un vendedor 
desactivado? 
Si sus clientes quedan asignados, se liberan o esperan a ser reasignados 


Programación Web · Proyecto final · CRM de ventas 
Página 10 de 22 
Pregunta 
Lo que deben considerar 
¿Qué hace la API con campos que el contrato no 
lista? 
Ignorarlos o rechazarlos con 422; nunca usarlos 
¿Cuál es su regla propia? 
Por qué tiene sentido en su sector, dónde se cumple y cómo se prueba 
 
8. Contrato de la API 
Base: http://localhost:3000/api. Todo viaja en JSON. Todas las rutas exigen Authorization: 
Bearer <token>, salvo el inicio de sesión. Pueden agregar endpoints, pero no cambiar estos: el catedrático 
los verifica con pruebas automáticas. 
Método 
Ruta 
Cuerpo o parámetros 
Respuesta correcta 
Errores 
POST 
/auth/login 
{ correo, clave } 
200 { token, usuario } 
400, 401, 403, 
422 
GET 
/productos 
 
200, productos activos 
401 
GET 
/clientes 
?q= (contiene, en nombre o NIT) 
200, clientes de su 
cartera 
401 
POST 
/clientes 
{ nombre, nit, telefono, 
correo }; correo opcional 
201, el cliente, ya en su 
cartera 
400, 401, 409, 
422 
GET 
/clientes/disponibles 
 
200, [{ id, nombre }] 
401 
POST 
/clientes/:id/tomar 
 
200, el cliente, ya en su 
cartera 
401, 404, 409 
GET 
/clientes/:id 
 
200, el cliente 
401, 404 
PATCH 
/clientes/:id 
Los campos que cambian 
200, el cliente 
400, 401, 404, 
409, 422 
POST 
/clientes/:id/actividades 
{ tipo, descripcion, 
vence_en }; vence_en opcional 
201, la actividad 
400, 401, 404, 
422 
GET 
/actividades 
?estado=pendiente o 
completada 
200, actividades de los 
clientes de su cartera 
400, 401 
PATCH 
/actividades/:id 
{ completada } 
200, la actividad 
400, 401, 404, 
422 
GET 
/oportunidades 
?etapa= 
200, resumen de sus 
oportunidades 
400, 401 
POST 
/oportunidades 
{ cliente_id, titulo } 
201, detalle, en prospecto 
400, 401, 422 
GET 
/oportunidades/:id 
 
200, detalle 
401, 404 
PATCH 
/oportunidades/:id 
{ titulo } 
200, detalle 
400, 401, 404, 
409, 422 
PATCH 
/oportunidades/:id/etapa 
{ etapa, motivo_perdida }; 
motivo solo al perder 
200, detalle 
400, 401, 404, 
409, 422 
POST 
/oportunidades/:id/productos 
{ producto_id, cantidad } 
201, detalle 
400, 401, 404, 
409, 422 
PATCH 
/oportunidades/:id/productos/:lineaId 
{ cantidad } 
200, detalle 
400, 401, 404, 
409, 422 
DELETE 
/oportunidades/:id/productos/:lineaId  
204, sin cuerpo 
401, 404, 409 
GET 
/reportes/resumen 
?mes=AAAA-MM; por omisión, el 
mes actual de Guatemala 
200, resumen del mes 
400, 401 
 


Programación Web · Proyecto final · CRM de ventas 
Página 11 de 22 
:lineaId es el id de la línea, el que aparece en productos dentro del detalle. Los campos que el contrato 
no lista (por ejemplo vendedor_id, etapa al crear o precio_unitario) nunca se usan. 
Forma de las respuestas 
Cliente (en una lista, cada elemento tiene esta forma) 
{ "id": 1, "nombre": "Comercial El Quetzal", "nit": "4521817K", 
  "telefono": "55551234", "correo": "compras@elquetzal.test" } 
Inicio de sesión correcto 
{ "token": "eyJhbGciOiJIUzI1NiIs...", 
  "usuario": { "id": 4, "nombre": "Valeria López", "correo": "valeria@crm.test" } } 
Detalle de una oportunidad (el resumen de la lista no trae productos ni historial) 
{ 
  "id": 1, 
  "cliente": { "id": 1, "nombre": "Comercial El Quetzal" }, 
  "titulo": "Renovación de planes", 
  "etapa": "ganada", 
  "probabilidad": 100, 
  "total": 5650, 
  "fecha_cierre": "2026-10-05T16:00:00.000Z", 
  "motivo_perdida": null, 
  "productos": [ 
    { "id": 1, "producto_id": 2, "nombre": "Plan avanzado", 
      "cantidad": 2, "precio_unitario": 2600, "subtotal": 5200 }, 
    { "id": 2, "producto_id": 3, "nombre": "Instalación", 
      "cantidad": 1, "precio_unitario": 450, "subtotal": 450 } 
  ], 
  "historial": [ 
    { "etapa_anterior": null, "etapa_nueva": "prospecto", 
      "usuario": "Valeria López", "fecha": "2026-09-23T16:00:00.000Z" } 
  ] 
} 
Actividad 
{ "id": 2, "cliente": { "id": 2, "nombre": "Ferretería Xela" }, 
  "tipo": "tarea", "descripcion": "Enviar propuesta de capacitación", 
  "vence_en": "2030-01-15T15:00:00.000Z", "completada": false, "vencida": false } 
Resumen del mes 
{ "mes": "2026-10", "ventas": 2, "total": 9250, "pronostico": 2512.88, 
  "cartera": { "clientes": 3, "maximo": 10 } } 
Errores: el primero para cualquier código; el segundo, para 422 (un mensaje por campo) 
{ "error": "Su cartera ya tiene 10 clientes, el máximo permitido." } 
  
{ "errores": { 
    "nit": "Escriba un NIT válido (con su dígito verificador) o CF.", 
    "telefono": "Escriba un teléfono de Guatemala de 8 dígitos." } } 
Los ids de los ejemplos son ilustrativos. Los montos viajan como números: 9250 y 9250.00 son el mismo 
número en JSON. 
Códigos de estado 
Código 
Cuándo se usa en este proyecto 
200 OK 
Lectura o modificación correcta 
201 Created 
Se creó un cliente, una oportunidad, una línea o una actividad 
204 No Content 
Se quitó un producto de una oportunidad; no hay cuerpo 
400 Bad Request 
La petición no se puede interpretar: JSON mal formado, falta el cuerpo, o un filtro o parámetro 
no existe 
401 Unauthorized 
Credenciales incorrectas; o falta el token, está alterado, venció o su cuenta ya no es válida 


Programación Web · Proyecto final · CRM de ventas 
Página 12 de 22 
Código 
Cuándo se usa en este proyecto 
403 Forbidden 
Credenciales correctas, pero la cuenta no puede usar la API: no es de vendedor o está 
desactivada 
404 Not Found 
El recurso no existe o es de otro vendedor 
409 Conflict 
La petición choca con el estado actual: cartera llena, cliente ya tomado, NIT o teléfono repetido, 
producto repetido, oportunidad cerrada 
422 Unprocessable Content 
La petición se entiende, pero los datos violan una regla 
500 Internal Server Error 
Error inesperado. El mensaje es genérico; el detalle queda en la consola del servidor 
 
9. Requisitos 
Cada requisito se cumple cuando se cumplen todos sus criterios. En su especificación los reescribirán con 
sus palabras y con criterios verificables. 
Pieza 
Códigos 
Requisitos 
Panel Laravel 
L1 a L7 
Esquema y semillas, cuentas, catálogo, clientes, equipos, reportes y 
validación 
API 
A1 a A8 
Sesión, middleware, clientes, oportunidades, actividades, resumen, errores 
y documentación 
SPA 
F1 a F6 
Sesión, cartera, embudo, actividades, resumen y calidad de la interfaz 
Todo el sistema 
S1 a S8 
Seguridad (sección 10) 
Proceso 
P1 a P5 
Especificación, plan, verificación y uso de IA (sección 12) 
 
Panel Laravel 
L1 · Esquema y semillas 
• Las migraciones crean las tablas de la sección 6 con sus llaves foráneas, índices únicos y restricciones 
CHECK. La tabla users se extiende con una migración nueva, sin editar la que trae Laravel. 
• VerificacionSeeder carga exactamente la semilla de la sección 11; SectorSeeder carga los datos de 
su sector. 
• php artisan migrate:fresh --seed deja la base lista con las dos semillas, sin pasos manuales, y 
php artisan migrate:fresh --seeder=VerificacionSeeder la deja solo con la de verificación. 
L2 · Cuentas y roles 
• Inicio y cierre de sesión con Breeze (stack Blade). La página de registro y su ruta no existen. 
• El administrador crea y edita cuentas: nombre, correo, contraseña, rol, supervisor (solo para 
vendedores, y debe ser un supervisor activo) y estado. 
• Las cuentas no se borran: se desactivan. El administrador no puede desactivarse ni quitarse el rol a sí 
mismo. 
• Un vendedor no puede iniciar sesión en el panel: ve un mensaje que lo envía a la SPA. Una cuenta 
desactivada no inicia sesión y, si tenía una sesión abierta, la pierde en su siguiente petición. 
L3 · Catálogo 
• El administrador agrega y edita productos; no los borra, los desactiva. 
• El precio se valida mayor que cero y con dos decimales como máximo. 


Programación Web · Proyecto final · CRM de ventas 
Página 13 de 22 
• Cambiar un precio no modifica ninguna oportunidad existente ni ningún reporte. 
L4 · Clientes y asignación 
• El administrador y el supervisor ven la lista de clientes que les corresponde, con búsqueda por nombre 
o NIT y filtro por vendedor y por "sin asignar". 
• Crean y editan clientes con las reglas de R4: el NIT y el teléfono se normalizan antes de comprobar que 
no se repitan. 
• Asignan un cliente a un vendedor activo, lo reasignan o lo liberan, respetando la cartera máxima de R3 
y lo que su especificación decidió. 
• El administrador elimina un cliente solo si no tiene oportunidades. 
L5 · Equipos y visibilidad 
• El supervisor ve únicamente a su equipo, a los clientes de su equipo y a los disponibles. Un cliente de 
otro equipo responde 404, aunque escriba su dirección a mano. 
• Solo asigna a vendedores activos de su equipo. 
• Tiene una página de su equipo con la cartera de cada vendedor (cuántos de 10) y sus ventas del mes. 
L6 · Oportunidades y reportes 
• El administrador ve todas las oportunidades y el supervisor las de su equipo, con filtro por etapa y por 
vendedor, el total de cada una y la fecha de cierre en hora de Guatemala. En el panel son de solo 
lectura: las trabaja el vendedor. 
• El reporte del mes, con selector de mes, muestra ventas, total vendido y pronóstico, por vendedor y por 
producto, con las reglas de R7. El supervisor ve su equipo; el administrador, a todos. 
• Con la semilla de verificación, el reporte coincide con las cifras de control de la sección 11. 
L7 · Validación en el servidor 
• Toda entrada se valida en el servidor (FormRequest o validate) con mensajes en español que tratan 
de usted. Si falla, el formulario vuelve con los datos escritos y el mensaje junto a cada campo. 
• Las reglas de R3 y R4 dan el mismo resultado en el panel y en la API. Si las dos puertas validan 
distinto, el proyecto tiene un defecto aunque cada una funcione por separado. 
API REST 
A1 · Inicio de sesión con JWT 
• POST /api/auth/login verifica la contraseña contra la tabla users. 
• Un vendedor activo recibe 200 con { token, usuario }. Un administrador, un supervisor o una 
cuenta desactivada, con la contraseña correcta, reciben 403 y ningún token. 
• Correo inexistente y contraseña incorrecta responden 401 con exactamente la misma respuesta. 
• El token es un JWT firmado con HS256, con el id del usuario en sub y una expiración configurable en 
.env. 
Use bcryptjs, no bcrypt 
PHP escribe sus hashes con el prefijo $2y$. El paquete bcryptjs los compara bien. El paquete 
bcrypt (nativo) responde false con la contraseña correcta, sin mostrar ningún error. Si su inicio de 
sesión falla siempre, revise primero esto. 
 


Programación Web · Proyecto final · CRM de ventas 
Página 14 de 22 
A2 · Middleware de autenticación 
• Todas las rutas, salvo el inicio de sesión, exigen Authorization: Bearer <token>. 
• Sin token, o con un token alterado, vencido o firmado con otro algoritmo, la respuesta es 401. 
• En cada petición se vuelve a leer al usuario en la base: si fue desactivado o ya no es vendedor, su 
token deja de servir. 
A3 · Clientes y cartera 
• Implementa los endpoints de clientes del contrato con R2, R3 y R4. 
• Tomar un cliente es atómico: si diez vendedores intentan tomar el mismo cliente a la vez, exactamente 
uno lo consigue. 
• La cartera máxima se respeta aunque lleguen varias altas o tomas simultáneas del mismo vendedor. 
A4 · Oportunidades y productos 
• Implementa los endpoints de oportunidades del contrato con R5 y R6. 
• El precio de cada línea se copia del catálogo y el total lo calcula el servidor. 
• El cambio de etapa, su registro en el historial y la fecha de cierre ocurren en una sola transacción; dos 
cambios simultáneos sobre la misma oportunidad no pueden dejar dos registros en el historial. 
A5 · Actividades 
• Implementa los endpoints de actividades del contrato con R2 y R8. 
• vence_en se recibe en ISO 8601 con zona horaria y se devuelve en UTC; vencida se calcula al 
responder. 
A6 · Resumen del mes 
• GET /api/reportes/resumen calcula ventas, total y pronóstico con SQL, con las reglas de R7, y 
devuelve números. 
• Con la semilla de verificación coincide con las cifras de control de la sección 11. 
A7 · Errores, códigos y formato 
• Cada respuesta usa el código de la sección 8 y siempre es JSON, nunca una página HTML. 
• Los errores de validación responden 422 con un mensaje por campo; los demás errores, { error }. 
• Un error inesperado responde 500 con un mensaje genérico, y el detalle queda solo en la consola del 
servidor. 
A8 · Documentación 
• El README tiene la tabla de endpoints y los pasos exactos para levantar las tres piezas desde cero. 
• La carpeta docs/ incluye su colección de Postman: al menos una petición por endpoint, los casos de 
error principales y la prueba de su regla propia. 
SPA 
F1 · Sesión 
• Hay una vista de inicio de sesión. Si la cuenta no es de vendedor, la SPA muestra el mensaje del 403. 
• El token se guarda al entrar y se borra al cerrar sesión. LocalStorage solo guarda la sesión. 
• Si cualquier petición responde 401 en plena sesión, la SPA vuelve al inicio de sesión con un aviso. 


Programación Web · Proyecto final · CRM de ventas 
Página 15 de 22 
F2 · Cartera 
• Lista de sus clientes con búsqueda en el servidor, y cuántos tiene de 10. 
• Alta de cliente: los errores del servidor aparecen junto a cada campo y lo escrito se conserva. 
• Lista de clientes disponibles con la acción de tomarlos. Si otro vendedor lo tomó antes, la SPA muestra 
el mensaje del 409. 
F3 · Embudo 
• Tablero con una columna por etapa abierta, y la lista de oportunidades cerradas. 
• Detalle de cada oportunidad: productos con cantidad, precio guardado y subtotal; el total; y el historial 
con fecha y hora de Guatemala. 
• Agregar productos del catálogo, cambiar cantidades, quitar productos y cambiar de etapa según las 
transiciones de su especificación. Perder pide el motivo. 
F4 · Actividades 
• Lista de pendientes y completadas; las vencidas se distinguen. 
• Nueva actividad con fecha y hora local, que se envía en ISO 8601 con zona horaria. Marcar como 
completada. 
F5 · Resumen del mes 
• Selector de mes; ventas, total vendido, pronóstico y cartera, con montos en quetzales. 
• Las fechas se muestran en hora de Guatemala, sin importar la zona horaria de la computadora. 
F6 · Calidad de la interfaz 
• Se aplican el patrón estado → render y la delegación de eventos. 
• Un indicador de carga se muestra mientras hay peticiones en curso. Si la API está apagada, el usuario 
ve un mensaje que lo explica, no una pantalla vacía. 
• Todo texto que viene de la API se escapa antes de insertarlo como HTML. 
• Se usa en un teléfono sin desplazamiento horizontal a 375 píxeles de ancho. 
10. Seguridad: lo que no se negocia 
Un proyecto que falla en cualquiera de estos puntos tiene un defecto grave, aunque todo lo demás 
funcione. 
Código 
Regla 
Cómo se comprueba 
S1 
Solo Laravel genera hashes de contraseñas; la API solo los verifica. 
Ninguna contraseña en texto plano en la base; en el código, solo la 
contraseña pública de las semillas. 
Revisión de users y del código 
S2 
Los secretos no entran al repositorio: .env está en .gitignore en 
laravel/ y en api/, y el repositorio incluye .env.example sin valores 
reales. JWT_SECRET tiene al menos 32 caracteres aleatorios. 
Historial de Git. Borrar un .env en un commit 
posterior no lo saca del historial: si se filtró, 
cambie el secreto 
S3 
Ningún dato del usuario se concatena en el SQL: la API usa 
parámetros (?) y el panel usa Eloquent o enlaces de parámetros, 
nunca DB::raw con datos del usuario. 
Revisión de código y prueba de inyección en 
la búsqueda 
S4 
Las respuestas no exponen hashes, llaves internas ni datos de otro 
vendedor (R8). 
Respuestas en Postman 
S5 
Lo ajeno responde 404 en las dos puertas: un vendedor con lo de otro 
vendedor en la API, un supervisor con lo de otro equipo en el panel. 
Valeria intenta leer y modificar un cliente de 
Diego; Sergio intenta editar un cliente del 
equipo de Sandra 


Programación Web · Proyecto final · CRM de ventas 
Página 16 de 22 
Código 
Regla 
Cómo se comprueba 
S6 
CORS acepta solo el origen exacto de la SPA (por ejemplo, 
http://127.0.0.1:5500), configurado en .env. Nunca *. 
Una página servida desde otro origen no 
puede llamar a la API 
S7 
La SPA escapa todo texto antes de insertarlo con innerHTML, o usa 
textContent. En Blade nunca se usa {!! !!} con datos del usuario. 
Un cliente llamado <img src=x 
onerror=alert(1)> se muestra como texto 
S8 
Las reglas aguantan peticiones simultáneas: tomar un cliente, la 
cartera máxima, el cambio de etapa y los duplicados. Para los 
duplicados, el árbitro final es el índice único de la base: una consulta 
previa, sola, no alcanza. 
Peticiones simultáneas contra la API 
 
Por qué S7 importa más en este proyecto 
La SPA guarda el token en LocalStorage. Cualquier script que logre ejecutarse en la página puede 
leerlo y actuar en nombre del vendedor. Escapar el texto es lo que impide que el nombre de un cliente 
se convierta en código.

## Decisiones y alternativas descartadas
Esta revisión documental conserva las reglas de spec-v1 y precisa sus motivos; no representa el cambio docente pendiente.

| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| Avance de una etapa; perder desde cualquiera abierta | Saltos libres y retrocesos | Seguimiento fácil de explicar y compatible con la pérdida en propuesta de la semilla. |
| Transferir abiertas y actividades al reasignar | Transferir también ventas cerradas | Conservar crédito e informes históricos del vendedor que cerró. |
| Liberar solo sin abiertas ni actividades pendientes | Liberar siempre | Evitar dejar trabajo sin responsable. |
| Cuenta desactivada conserva cartera hasta reasignación explícita | Liberación automática | Evitar perder responsabilidad comercial sin revisión del encargado. |
| Solo campos permitidos | Usar directamente todo el cuerpo JSON | Impedir que el cliente cambie dueño, precio o etapa inicial. |
| Metadatos de instalación | Buscar palabras en el nombre | Renombrar un producto no debe evadir la regla del taller. |
| UTC y mes de Guatemala | Fecha local del servidor | Las computadoras pueden usar husos distintos. |

## Modelo y lugar donde se cumple cada regla
| Tabla | Relación principal | Restricción o servicio |
|---|---|---|
| users | Vendedor pertenece a supervisor | FK, enum y CHECK; PanelController, PanelAccess y middleware JWT verifican rol/activo. |
| productos | Catálogo referenciado por líneas | Nombre único, DECIMAL positivo; validación en panel; desactivación lógica. |
| clientes | Vendedor opcional | NIT nullable único y teléfono único/check; Identidad y domain.js normalizan; Cartera/transaction bloquean para cupo. |
| oportunidades | Cliente y vendedor | CHECK de cierre/motivo; service.js valida transiciones y propiedad; Cartera transfiere abiertas. |
| oportunidad_productos | Oportunidad y producto | Par único, cantidad y precio con CHECK; service.js copia precio y bloquea oportunidad. |
| historial_etapas | Oportunidad y usuario | Misma transacción que creación/transición; no existe ruta para editarlo. |
| actividades | Cliente y vendedor | Enum y boolean; ISO con zona validado en API; vistas convierten a Guatemala. |
