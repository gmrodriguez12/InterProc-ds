# TASK-002 — Validación

## Fases 0–1

- `dotnet build backend/InterProc.slnx`: correcto, sin advertencias.
- Build de producción Angular con Node 24 dentro de Docker: correcto.
- Validación de Compose para desarrollo y producción: correcta con variables de prueba.
- Migraciones aplicadas desde una base PostgreSQL 18 vacía en una pila Docker aislada: correcto.
- Bootstrap del primer administrador: correcto.
- Smoke test de login por username, consulta de sesión, cambio obligatorio de contraseña y acceso administrativo: correcto.
- `dotnet list package --vulnerable --include-transitive`: sin paquetes vulnerables según las fuentes configuradas.
- La pila aislada y sus volúmenes temporales se eliminaron después de validar; no se tocaron volúmenes del proyecto.

## Fase 2

Pendiente.

## Fase 3

Pendiente.
