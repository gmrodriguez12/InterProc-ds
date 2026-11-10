# Autenticación y administración de cuentas

## Alcance vigente

- ASP.NET Core Identity con `ApplicationUser` sobre PostgreSQL.
- Cookie de sesión HTTP-only, antiforgery de doble cookie/header y claves de Data Protection persistentes.
- Login case-insensitive por username o email; no existe registro público.
- Roles cerrados y exclusivos: `admin` y `usuario`.
- `admin` lista, crea, activa y desactiva cuentas; `usuario` no accede a administración.
- Toda cuenta creada usa contraseña temporal y queda limitada al cambio de contraseña hasta completarlo.

## Bootstrap

El primer administrador se crea con `bootstrap-admin`. El servicio Compose de perfil `tools` recibe los secretos solo durante esa ejecución. El comando crea roles, valida colisiones y es idempotente para la misma cuenta administradora activa; nunca reemplaza contraseña ni rol existentes.

## Estado e invalidación

`IsActive` controla acceso. Cambiarlo actualiza el security stamp y la cookie se revalida en cada solicitud. Una cuenta desactivada pierde la sesión; restaurar `/api/auth/session` devuelve sesión anónima para que Angular vuelva al login. No se permite autodesactivación ni desactivar al último administrador activo. La comprobación del último admin se serializa con advisory lock de PostgreSQL y consulta sin tracking dentro de la transacción.

## Persistencia y migración

Username y email normalizados tienen índices únicos. La migración preserva cuentas existentes y agrega `IsActive=true` y `MustChangePassword=false`. Antes de crear el índice único o renombrar el rol histórico `USER`, aborta con un mensaje accionable si encuentra emails duplicados o coexistencia de roles `USER`/`USUARIO`; esos datos deben corregirse deliberadamente antes de reintentar.

## Límites

RF-03 (auditoría funcional), recuperación pública, reset administrativo, edición/eliminación de cuentas y navegación completa de RF-06 quedan fuera. Los hallazgos LEGAL-001–006 de TASK-002 siguen pendientes para una revisión profesional previa a producción; esta arquitectura no constituye una declaración de cumplimiento legal.
