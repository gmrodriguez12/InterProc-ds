# TASK-002 — Implementación

## Resultado

Se implementaron RF-01, RF-02 y el alcance v1 de RF-04: acceso interno por username/email, bootstrap del primer administrador, administración mínima de cuentas y sesión con identidad/rol/logout. RF-03 permanece fuera de alcance y RF-06 solo conserva el shell mínimo.

## Cambios principales

- Se introdujo `ApplicationUser` con estado activo y cambio obligatorio de contraseña.
- Identity quedó configurado con roles `admin`/`usuario`, contraseña fuerte, lockout e índices únicos normalizados.
- Se eliminó signup público y se agregó login por username/email, sesión, cambio de contraseña atómico y logout.
- Se agregó API admin para listar, crear y activar/desactivar cuentas, con protección concurrente del último administrador.
- Se agregó `bootstrap-admin` idempotente y un servicio Compose de perfil `tools`; los secretos no llegan al API de larga vida.
- Angular incorporó guards por sesión/rol, cambio obligatorio, vista de cuentas e identidad/rol en el shell.
- La migración preserva datos históricos y ejecuta preflight ante emails o roles incompatibles.
- Se agregó infraestructura de pruebas .NET/Testcontainers y Angular/Vitest.
- Se actualizaron paquetes .NET 10 a parches compatibles sin vulnerabilidades conocidas reportadas por NuGet.

## Decisiones técnicas

- La invalidación de cuenta usa security stamp con validación en cada request.
- Advisory locks de PostgreSQL serializan altas y cambios de estado críticos.
- La migración no corrige silenciosamente colisiones históricas: falla con diagnóstico y requiere intervención deliberada.
- No se agregaron edición, borrado, recuperación ni reset administrativo porque no forman parte del plan aprobado.
