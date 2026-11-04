# CRM MotoGest Xela
Proyecto de Programación Web. Sector taller de motos. Código claro, funciones pequeñas, sin arquitecturas innecesarias.
Leer docs/especificacion.md y docs/plan.md antes de editar. Los cambios de requisitos se documentan antes de programar. La etiqueta spec-v1 precede a la implementación; spec-v2 se reserva para el cambio publicado por el docente.
Laravel 13 + Breeze Blade + Eloquent. Solo Laravel crea/modifica esquema y genera hashes/cuentas. MySQL 8.4 compartido. API Express 5, mysql2 con SQL parametrizado sin ORM, JWT HS256, bcryptjs. Frontend HTML Bootstrap 5.3 JavaScript módulos sin framework, estado→render y delegación.
Respetar exactamente rutas, JSON, permisos, semilla y cifras del enunciado. Fechas UTC en base y Guatemala en interfaz/reportes. Datos ajenos 404. Transacciones y bloqueo al tomar clientes y cambiar etapas. Índices únicos como última defensa de duplicados.
No secretos ni .env versionados. No inventar resultados, incidentes ni aportes humanos. Registrar verificación real y pendientes. Mensajes al usuario en español, tratamiento de usted.
No ejecutar migrate:fresh fuera de una base dedicada de pruebas sin autorización; borra sus datos. No publicar ni desplegar por defecto.
