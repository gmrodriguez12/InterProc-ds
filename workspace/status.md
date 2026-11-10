
# Project Status

## Current phase

DevHarness — Implementación

## Active tasks

- TASK-002 — Implementación de fases 0–3 (In Progress; autorizada por el Product Owner el 2026-11-10).

## Blocked tasks

None.

## Pending approvals

None.

## Recent decisions

- RF-02: no hay registro público; solo `admin` crea cuentas y les asigna el rol `usuario` o `admin`. El primer admin (`gonza@gmrodriguez.com`) se provisionará con un comando .NET/Identity y variables de entorno; la contraseña no se almacena en el repositorio. `.env` y `.env.*` están excluidos por `.gitignore` (salvo `.env.example`).
- El Product Owner aprobó el roadmap y el orden de las fases 0–3 el 2026-11-10.
- RF-03 se limita a auditar archivados y restauraciones; la auditoría funcional se guarda en PostgreSQL y los logs técnicos se emiten por la salida estándar de Docker.
- Las cuentas tienen nombre visible, username, email, rol y estado; usan contraseña temporal con cambio obligatorio. `admin` administra cuentas y auditoría; ambos roles operan catálogo y clientes.
- Los trabajos fijan una versión de cada procedimiento. Solo `admin` puede borrar una versión no vigente y nunca si fue utilizada.
- Los clientes pueden ser personas o empresas uruguayas o extranjeras. Solo el nombre es obligatorio; RUT es texto libre opcional. Las notas pueden editarse y advierten que no se incluyan datos sensibles.
- RF-50 se aplicará literalmente: no se borrarán ni anonimizarán datos de clientes archivados. Esta decisión requiere revisión profesional antes de producción.

## Next recommended work

1. Implementar y validar la fase 2 (catálogo).
2. Implementar y validar la fase 3 (clientes).
3. Crear commits locales por incremento; no hacer push ni desplegar.
