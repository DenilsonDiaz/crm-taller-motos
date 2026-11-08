# MotoGest Xela · CRM para taller de motos
Proyecto académico de Programación Web. Administra seguimiento comercial, clientes y cotizaciones de repuestos y servicios de un taller ficticio de Quetzaltenango. Interfaz en español, quetzales y fechas de Guatemala.

## Estado de esta versión
La etiqueta `spec-v1` precede a la implementación. En Windows se comprobaron las cifras de control, las peticiones simultáneas, la regla del taller y el recorrido panel–API–reporte con MySQL 8.4. Los resultados y pendientes están en [docs/verificacion.md](docs/verificacion.md#verificacion-del-7-de-noviembre-de-2026).

## Estructura y tecnologías
| Carpeta | Función | Tecnología |
|---|---|---|
| laravel/ | Panel de administrador y supervisor; cuentas y catálogo; migraciones y semillas | Laravel 13, Breeze Blade adaptado, Eloquent, Vite |
| api/ | API REST de vendedores | Express 5, mysql2, SQL con parámetros, JWT HS256, bcryptjs |
| frontend/ | Aplicación del vendedor | HTML, Bootstrap 5.3, CSS y JavaScript con módulos, sin framework |
| docs/ | Especificación, plan, verificación, Postman, precios y guía de defensa | Markdown y JSON |
| scripts/ | Preparación y arranque local | PowerShell y Node |

Una sola base MySQL compartida. Laravel es el único que ejecuta DDL y genera hashes de contraseñas. No hay registro público. Las cuentas se desactivan; los productos también. Las ventas conservan precio y vendedor históricos. La regla del taller impide ganar una cotización con un repuesto que requiere instalación si no incluye mano de obra de instalación.

## 1. Abrir el proyecto
Use PowerShell **normal** en Visual Studio Code. No hace falta ser administrador para programar.

Abra la carpeta donde quiere guardar el proyecto y clone el repositorio. Si ya tiene una copia local, abra esa carpeta.

```powershell
git clone https://github.com/DenilsonDiaz/crm-taller-motos.git
cd crm-taller-motos
code .
php -v
composer --version
node -v
npm.cmd -v
git --version
```

Requisitos del enunciado: PHP 8.4, Composer 2, Node 24, MySQL 8.4 y Git. Las dependencias exactas están fijadas en `composer.lock` y los dos `package-lock.json`.

## 2. Instalar dependencias
Desde la raíz:

```powershell
.\scripts\preparar.ps1
```

Si PowerShell bloquea el archivo por haber sido descargado, después de revisar el contenido puede desbloquear estos archivos con `Get-ChildItem .\scripts\*.ps1 | Unblock-File`. Como alternativa, ejecute los pasos manuales siguientes; no necesita cambiar permanentemente la política de ejecución.

```powershell
Copy-Item laravel\.env.example laravel\.env
Copy-Item api\.env.example api\.env
cd laravel
composer install
php artisan key:generate
npm.cmd ci
npm.cmd run build
cd ..\api
npm.cmd ci
cd ..
```

Los `Copy-Item` anteriores son para la primera instalación: no los repita sobre un `.env` que ya configuró. Breeze Blade ya está integrado y adaptado; ejecutar otra vez `breeze:install` sobrescribiría las vistas y rutas del proyecto.

## 3. Crear la base y el usuario local
MySQL84 debe estar iniciado. Abra el cliente con el comando que ya funcionó en su PC:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -h 127.0.0.1 -P 3306 -u root -p
```

Ingrese su contraseña de root solamente cuando el cliente la pida. No la comparta ni la escriba en el repositorio. En la consola MySQL cree una base **nueva** y un usuario de desarrollo; reemplace la contraseña de ejemplo antes de ejecutar:

```sql
CREATE DATABASE crm_taller_motos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'crm_app'@'localhost' IDENTIFIED BY 'REEMPLACE_CON_SU_CLAVE_PRIVADA';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES
ON crm_taller_motos.* TO 'crm_app'@'localhost';
EXIT;
```

Si esa base o cuenta ya existe, no la borre: revise primero cómo está configurada. Es una cuenta de desarrollo para la base del proyecto; no necesita privilegios sobre otras bases.

## 4. Conectar Laravel y la API a esa misma base
Edite `laravel/.env` y `api/.env` localmente. En ambos use los mismos cinco valores:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=crm_taller_motos
DB_USERNAME=crm_app
DB_PASSWORD="SU_CLAVE_PRIVADA"
```

Conserve `DB_CONNECTION=mysql` y el `APP_KEY` generado en Laravel. En `api/.env`, conserve:

```dotenv
PORT=3000
JWT_EXPIRES_IN=2h
SPA_ORIGIN=http://127.0.0.1:5500
```

Genere un secreto JWT aleatorio desde PowerShell:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copie el resultado en `JWT_SECRET=` de `api/.env`, sin publicarlo. Son 96 caracteres aleatorios. No use el valor de ejemplo de una guía como secreto. Reinicie la API cuando cambie su `.env`.

`frontend/js/config.js` ya apunta a `http://localhost:3000/api`. Abra el frontend con **127.0.0.1:5500**, que coincide con CORS. `localhost:5500` es otro origen.

## 5. Migrar y cargar ejemplos
Para la primera instalación, en la base nueva y vacía:

```powershell
cd laravel
php artisan config:clear
php artisan migrate --seed
cd ..
```

Esto crea las tablas y ejecuta primero `VerificacionSeeder` y luego `SectorSeeder`. No ejecute `db:seed` otra vez encima de esos datos: las semillas tienen valores únicos.

Solo en una base de **pruebas desechable**, estos comandos reinician todos sus datos:

```powershell
cd laravel
php artisan migrate:fresh --seeder=VerificacionSeeder
# O ambas semillas:
php artisan migrate:fresh --seed
cd ..
```

`migrate:fresh` borra todas las tablas de la base configurada. Use una segunda base, como `crm_taller_motos_pruebas`, para Postman y pruebas automáticas; cambie ambos `.env` a esa base antes de probar. El reinicio no es un comando de arranque diario.

## 6. Encender las tres piezas
Puede abrirlas con:

```powershell
.\scripts\iniciar.ps1
```

O use tres terminales normales independientes:

```powershell
# Terminal 1: panel, desde la raíz del proyecto
cd laravel
php artisan serve --host=127.0.0.1 --port=8000
```

```powershell
# Terminal 2: API, desde la raíz del proyecto
cd api
npm.cmd run dev
```

```powershell
# Terminal 3: frontend, desde la raíz del proyecto
npm.cmd run frontend
```

Panel: http://127.0.0.1:8000/login · Vendedores: http://127.0.0.1:5500.
Mantenga las terminales abiertas. `Ctrl+C` apaga cada servidor. Para arrancar otro día, inicie MySQL si está detenido y repita únicamente estos tres servidores; no reinstale ni reinicie la base.

No necesita `npm run dev` de Vite para ver el panel: el paso de preparación ya compiló los estilos. Si modifica `laravel/resources/css` o `resources/js`, ejecute de nuevo `npm.cmd --prefix laravel run build`.

## Cuentas de demostración
Contraseña pública de todas las semillas: **Ventas2026**. Exclusiva para demostración local; cree contraseñas privadas para otras cuentas.

| Cuenta | Puerta | Alcance |
|---|---|---|
| admin@crm.test | Panel | Alicia, administración completa |
| sergio@crm.test | Panel | Equipo Valeria y Diego |
| sandra@crm.test | Panel | Equipo Carlos e Iván |
| valeria@crm.test | SPA | Tres clientes comunes |
| diego@crm.test | SPA | Dos clientes comunes |
| carlos@crm.test | SPA | Nueve clientes comunes |
| ivan@crm.test | Ninguna | Desactivado para probar rechazo |
| supervision@motogest.test | Panel | Mariana, equipo del taller |
| asesor@motogest.test | SPA | Andrés, seis clientes del taller |

Las últimas dos cuentas solo existen con SectorSeeder. Las semillas usan datos ficticios, no clientes reales.

## API: contrato de veinte endpoints
Base: `http://localhost:3000/api`. Todos salvo login exigen `Authorization: Bearer <token>`. Cuerpos JSON, montos numéricos, fechas de salida UTC, errores `{error}` o validación 422 `{errores:{campo:mensaje}}`.

| Método | Ruta | Entrada principal | Éxito |
|---|---|---|---|
| POST | /auth/login | correo, clave | 200 |
| GET | /productos | Sin parámetros | 200 |
| GET | /clientes | q opcional | 200 |
| POST | /clientes | nombre, nit, telefono, correo opcional | 201 |
| GET | /clientes/disponibles | Sin parámetros | 200 |
| POST | /clientes/:id/tomar | Sin cuerpo | 200 |
| GET | /clientes/:id | Sin parámetros | 200 |
| PATCH | /clientes/:id | Campos del cliente por modificar | 200 |
| POST | /clientes/:id/actividades | tipo, descripcion, vence_en opcional con zona | 201 |
| GET | /actividades | estado pendiente o completada, opcional | 200 |
| PATCH | /actividades/:id | completada boolean | 200 |
| GET | /oportunidades | etapa opcional | 200 |
| POST | /oportunidades | cliente_id, titulo | 201 |
| GET | /oportunidades/:id | Sin parámetros | 200 |
| PATCH | /oportunidades/:id | titulo | 200 |
| PATCH | /oportunidades/:id/etapa | etapa; motivo_perdida al perder | 200 |
| POST | /oportunidades/:id/productos | producto_id, cantidad | 201 |
| PATCH | /oportunidades/:id/productos/:lineaId | cantidad | 200 |
| DELETE | /oportunidades/:id/productos/:lineaId | Sin cuerpo | 204 |
| GET | /reportes/resumen | mes AAAA-MM opcional | 200 |

`:lineaId` es el id de la línea de cotización. Nunca se usa vendedor_id ni precio_unitario enviados por el navegador. Los filtros desconocidos dan 400. Un recurso ajeno da 404; una cuenta del rol equivocado da 403 al login. Contraseña incorrecta y correo inexistente dan el mismo 401.

## Pruebas
Sin base de datos:

```powershell
npm.cmd --prefix api test
cd laravel
php artisan test
php artisan view:cache
cd ..
npm.cmd --prefix laravel run build
```

Las pruebas HTTP usan usuarios ficticios en memoria para probar Express, JWT y respuestas. No sustituyen MySQL. La prueba integrada se omite por defecto; solo se habilita en una base de pruebas cargada **únicamente con VerificacionSeeder**:

```powershell
cd api
$env:RUN_DB_TESTS='1'
node --env-file=.env --test tests/integration.test.js
Remove-Item Env:RUN_DB_TESTS
cd ..
```

Para probar automáticamente la regla del taller, con ambas semillas en la base de pruebas:

```powershell
cd api
$env:RUN_SECTOR_TESTS='1'
node --env-file=.env --test tests/sector.test.js
Remove-Item Env:RUN_SECTOR_TESTS
cd ..
```

Importe `docs/api.postman_collection.json` en Postman y ejecútela en la base de pruebas con ambas semillas. Incluye al menos una petición por endpoint, errores y la regla del taller. La colección crea y modifica registros; para repetirla cargue de nuevo la base desechable. Revise los rechazos cruzados y las pruebas simultáneas de `docs/verificacion.md`; no marque como aprobadas pruebas que no ejecutó.

Con solo VerificacionSeeder, octubre de 2026 debe mostrar Valeria 2 ventas/Q9250, Diego 1/Q6000, Carlos 1/Q7200 y empresa 4/Q22450. Pronóstico de empresa Q6751.13. Al agregar la semilla del taller, los totales de la empresa cambian: use el supervisor del equipo común o la base con solo verificación para comparar.

## Git y trabajo en pareja
El historial incluido registra la preparación del asistente con su propia identidad. No representa aportes de los estudiantes. Los dos integrantes deben configurar sus cuentas y hacer cambios reales, comprensibles y repartidos durante el desarrollo:

```powershell
git log --oneline --decorate
git tag
git status
# Configure su propio nombre y correo con git config antes de su primer commit.
```

No se incluyeron contraseñas privadas ni `.env`. No ignore los archivos lock. Antes de publicar la entrega, comprueben que `origin` apunta al repositorio que compartirá la pareja con el catedrático.

El cambio del catedrático se documentará primero en la especificación, se etiquetará `spec-v2` y se implementará con una migración nueva si cambia la base. `entrega-final` se crea después de cerrar la matriz de pruebas y ensayar la defensa.

## Documentos para estudiar
- [Especificación y contrato](docs/especificacion.md)
- [Plan y responsabilidades pendientes de asignar a la pareja](docs/plan.md)
- [Resultados y pruebas pendientes](docs/verificacion.md)
- [Guía de defensa en lenguaje sencillo](docs/guia-defensa.md)
- [Referencias del catálogo](docs/precios-sector.md)

## Dependencias y licencias
La autenticación parte de los stubs Blade de Laravel Breeze 2.x (MIT), adaptados para roles y sin registro. Laravel es MIT. Bootstrap 5.3 conserva su aviso de licencia en los CSS distribuidos localmente. Las otras dependencias conservan sus licencias en sus paquetes; consulte los lockfiles. Los estilos propios y los módulos de la SPA no requieren un framework de interfaz.
