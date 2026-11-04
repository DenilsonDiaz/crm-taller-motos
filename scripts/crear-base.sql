-- Ejecute como administrador de MySQL en su instalación local.
-- Cree primero un usuario crm_app con contraseña privada, usando Workbench o CREATE USER.
CREATE DATABASE IF NOT EXISTS crm_taller_motos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- DDL lo ejecuta Laravel. La API nunca crea ni altera tablas.
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES
ON crm_taller_motos.* TO 'crm_app'@'localhost';
-- Después de migrar puede usar una cuenta separada para la API con solo SELECT/INSERT/UPDATE/DELETE.
