# InterProc — Project Overview

## Product objective

Gestionar procedimientos reutilizables y su ejecución en trabajos para clientes, manteniendo historial auditable de cambios y resultados.

## Technology stack

- Frontend: Angular 22.
- Backend: ASP.NET Core .NET 10.
- Database: PostgreSQL 18 con Entity Framework Core.
- Infrastructure: Docker Compose y Nginx.

## Development environment

Todos los servicios de aplicación se ejecutan mediante Docker. El entorno de desarrollo mantiene recarga automática de Angular y `dotnet watch`, almacenamiento PostgreSQL persistente y Nginx como único punto publicado al host.

## Authentication and authorization

- ASP.NET Core Identity con cookies y antiforgery.
- No existe registro público.
- El primer administrador se provisiona con un comando .NET y secretos de entorno.
- Solo `admin` administra cuentas, roles, restauraciones, auditoría y borrados irreversibles permitidos.
- `admin` y `usuario` gestionan catálogo y clientes.

## Implemented scope

- Fases 0–1: fundaciones, acceso, cuentas y auditoría mínima.
- Fase 2: tipos y catálogo versionado de procedimientos.
- Fase 3: clientes, notas y fundación mínima de trabajos.
- Interfaz: sistema visual Lumen Dark del template InterProc, UI en español, assets locales y navegación responsive.

El estado verificable y los resultados de validación se mantienen en `workspace/status.md` y `workspace/tasks/`.

## Engineering constraints

- Preservar el flujo Docker existente y evitar dependencias de servicios instalados en el host.
- Mantener compatibilidad hacia atrás cuando corresponda.
- No desplegar, hacer push ni modificar producción sin autorización explícita.
- No declarar cumplimiento legal a partir de revisión de código. La retención literal aprobada para RF-50 requiere revisión profesional antes de producción.
