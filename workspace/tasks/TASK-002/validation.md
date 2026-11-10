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

- `dotnet test backend/InterProc.slnx`: 6 pruebas aprobadas; 0 fallidas.
- `dotnet build backend/InterProc.slnx`: correcto, sin advertencias.
- Build Angular de producción en Docker: correcto. Mermaid queda fuera del bundle inicial y se carga bajo demanda.
- `npm audit`: 0 vulnerabilidades durante la instalación reproducible del build Docker.
- Migraciones desde PostgreSQL 18 vacío: correctas.
- Smoke API en Docker: alta de tipo y procedimiento, creación de versión 2, bloqueo 409 al archivar un tipo con procedimientos activos, archivo en orden correcto y auditoría: correcto.
- La pila aislada y sus volúmenes temporales se eliminaron; no se tocaron volúmenes del proyecto.

## Fase 3

Pendiente.
