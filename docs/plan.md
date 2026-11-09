# Plan de trabajo
1. Especificación y decisiones; revisión humana; etiqueta spec-v1 antes de implementación.
2. Laravel base Breeze Blade, migraciones nuevas para extensión users y dominio, semillas verificables y reglas compartidas del panel.
3. API Express: validaciones puras, autenticación JWT, clientes con transacciones, oportunidades/historial, actividades, resumen SQL y contrato de errores.
4. Panel: cuentas, catálogo, asignación/equipos, consultas de oportunidades y reportes, validaciones en español.
5. SPA: sesión, cartera, embudo, detalle, actividades y resumen; diseño móvil, escape, carga y errores.
6. Verificación: pruebas unitarias, sintaxis, colección Postman completa, integración contra MySQL, concurrencia y cifras exactas. Correcciones con registro real.
7. Conexión en Windows: dependencias, .env locales, base dedicada, migraciones/semillas, tres servidores. Ensayo y cambios en vivo. Git remoto y aportes reales de ambos estudiantes.
Responsabilidad: el paquete inicial es preparado por el asistente. La pareja asignará sus responsables reales antes del trabajo colaborativo; no se inventan nombres ni commits de estudiantes.
Los prompts por fase deben pedir solo el alcance de la fase, mantener el contrato y reportar resultados reales. Si cambia el requisito docente, actualizar primero especificación con spec-v2 y agregar migraciones nuevas, sin reescribir las anteriores.

## Estado al entregar el paquete inicial
Las fases de implementación están preparadas. Se ejecutaron pruebas sin base y revisión visual; la fase 6 sigue abierta para MySQL 8.4 y permisos integrados, según verificacion.md. La fase 7 se hará con el estudiante en Windows. Los scripts y README dejan una secuencia concreta de instalación, configuración y arranque. No se considera terminada la validación por tener pantallas completas.

La preparación actual se identifica con commits del asistente. La pareja asignará responsable real para: panel/cuentas y prueba de equipo; API/transacciones y pruebas simultáneas; SPA y revisión móvil; integración/reportes; requisito nuevo y ensayo. Cada integrante debe explicar también la parte del otro. La guía de defensa resume las solicitudes de desarrollo y el propósito de cada archivo.

## Aportes registrados en Git

| Integrante | Trabajo registrado | Commits de referencia |
|---|---|---|
| Denilson Díaz | Corrigió el componente Blade, comprobó la liberación concurrente y ajustó los formularios de la SPA para mostrar el error de cantidad y conservar los datos escritos. | `e239c3b`, `fb17e7d`, `81bff34`, `177de6b`, `9ec406f`, `edfef0b` |
| `Gorozco710` | Reforzó la autorización y la concurrencia de la API, ajustó la gestión de clientes del panel, corrigió la colección Postman, documentó las pruebas MySQL y actualizó el diseño de ambas interfaces. | `54e8793`, `ce3794e`, `4376df4`, `480eaf4`, `f74025a`, `d01c266`, `8dbb5ae`, `c41c6be` |

Estos aportes corresponden al historial posterior al plan inicial. El trabajo con el agente se organizó por fase. La especificación fijó primero el contrato y los criterios. La implementación se dividió entre el panel, la API y la SPA. La verificación se centró en ejecutar casos normales, rechazos y pruebas simultáneas, y en registrar el resultado de cada caso. Las solicitudes resumidas por fase están en [la guía de defensa](guia-defensa.md#resumen-de-solicitudes-usadas-para-desarrollar).
