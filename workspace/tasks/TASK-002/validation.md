# TASK-002 — Validación

## Resultado

Validación completada el 10 de noviembre de 2026. La evidencia es suficiente para cerrar TASK-002.

## Evidencia ejecutada

- `dotnet build backend/InterProc.slnx --no-restore`: OK, 0 warnings y 0 errores.
- `dotnet test backend/tests/InterProc.Api.Tests/InterProc.Api.Tests.csproj --no-build --no-restore -m:1 -v:minimal`: OK, 1 prueba integral contra PostgreSQL 18 temporal.
- La prueba integral cubre: instalación vacía, bootstrap idempotente, CSRF, ausencia de signup, login por username/email, cambio obligatorio, lockout, 403 por rol, duplicado concurrente, desactivación, sesión invalidada y autodesactivación rechazada.
- `docker build --target test -f frontend/Dockerfile .`: OK, 2 archivos y 5 pruebas Vitest (restauración de sesión y guards).
- `docker build --target production -f frontend/Dockerfile .`: OK; bundle Angular productivo generado.
- `docker build --target production -f backend/Dockerfile .`: OK; publish .NET e imagen productiva generados.
- `docker compose --env-file .env.example -f compose.yaml config --quiet`: OK.
- `docker compose --env-file .env.example -f compose.yaml -f compose.dev.yaml config --quiet`: OK.
- `dotnet ef migrations script --idempotent ...`: OK; el script contiene los preflight de emails y roles.
- `dotnet list backend/InterProc.slnx package --vulnerable --include-transitive`: ningún paquete vulnerable conocido en API o tests.
- `npm ci` dentro de Docker: auditoría de 300 paquetes, 0 vulnerabilidades.
- `git diff --check`: OK.

## Observaciones

- El Node del host (22.16.0) no cumple el mínimo de Angular 22; pruebas y build frontend se validaron con Node 24 en Docker, que es el flujo oficial del repositorio.
- No se realizó despliegue, push ni modificación de un entorno productivo.
- LEGAL-001–006 y la revisión profesional previa a producción permanecen pendientes; no bloquean la entrega técnica v1.
