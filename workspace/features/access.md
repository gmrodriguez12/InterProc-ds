# Acceso y cuentas

## Alcance implementado

- Login por username o email y contraseña.
- Sin registro público.
- Bootstrap idempotente del primer administrador mediante comando .NET y variables de entorno.
- Cuentas con nombre visible, username, email, rol y estado activo/inactivo.
- Contraseña temporal y cambio obligatorio antes de acceder a funciones de negocio.
- Administración de cuentas y auditoría reservada a `admin`.
- Protección del último administrador activo.
- Auditoría funcional limitada a archivados y restauraciones, según RF-03 modificado.

## Seguridad

Cookies HttpOnly, antiforgery por cookie/header, roles de Identity, revocación de sesiones de cuentas inactivas y secretos de bootstrap fuera del repositorio.
