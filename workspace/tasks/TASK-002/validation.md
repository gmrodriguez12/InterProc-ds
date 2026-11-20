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

- `dotnet test backend/InterProc.slnx`: 12 pruebas aprobadas; 0 fallidas.
- Build Angular de producción en Docker: correcto.
- Migraciones desde PostgreSQL 18 vacío: correctas en validación aislada.
- Smoke API: cliente con identificador extranjero libre, alta y edición de nota: correcto.
- Smoke de integridad: trabajo `En Ejecución` bloquea archivo con 409; al pasar a `Terminado`, el archivo devuelve 204 y genera auditoría: correcto.
- La pila aislada y sus volúmenes temporales se eliminaron; no se tocaron volúmenes del proyecto.

## Validación final integrada

- `docker compose build` de API, frontend y Nginx de producción: correcto.
- Compose de desarrollo completo con PostgreSQL 18, API, Angular y Nginx en proyecto aislado: cuatro servicios saludables.
- Las cinco migraciones, incluida `AddClientsAndWorkFoundation`, se aplicaron desde una base vacía.
- A través de Nginx: `/login` devolvió 200, `/api/health` devolvió `Healthy` y `/api/auth/setup-status` respondió correctamente.
- Suite final: 12 pruebas aprobadas, 0 fallidas.
- Auditoría final de NuGet y npm: 0 vulnerabilidades conocidas según las fuentes configuradas.
- `git diff --check`: correcto.
- Los contenedores, red y volúmenes de validación se eliminaron al finalizar. No se modificaron datos ni entornos persistentes del proyecto.
