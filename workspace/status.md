
# Project Status

## Current phase

Development — Fases 0–3 y adaptación visual entregadas

## Active tasks

None.

## Blocked tasks

None.

## Pending approvals

None.

## Recent decisions

- El Product Owner aprobó TASK-003 el 2026-11-10: UI en español, Dashboard sin datos ficticios, navegación futura oculta y sidebar móvil colapsable.
- TASK-003 adoptó el template Lumen Dark en todas las pantallas existentes; build Docker, assets locales, responsive y 12 pruebas backend quedaron validados el 2026-11-10.
- RF-02: no hay registro público; solo `admin` crea cuentas y les asigna el rol `usuario` o `admin`. El primer admin (`gonza@gmrodriguez.com`) se provisionará con un comando .NET/Identity y variables de entorno; la contraseña no se almacena en el repositorio. `.env` y `.env.*` están excluidos por `.gitignore` (salvo `.env.example`).
- El Product Owner aprobó el roadmap y el orden de las fases 0–3 el 2026-11-10.
- RF-03 se limita a auditar archivados y restauraciones; la auditoría funcional se guarda en PostgreSQL y los logs técnicos se emiten por la salida estándar de Docker.
- Las cuentas tienen nombre visible, username, email, rol y estado; usan contraseña temporal con cambio obligatorio. `admin` administra cuentas y auditoría; ambos roles operan catálogo y clientes.
- Los trabajos fijan una versión de cada procedimiento. Solo `admin` puede borrar una versión no vigente y nunca si fue utilizada.
- Los clientes pueden ser personas o empresas uruguayas o extranjeras. Solo el nombre es obligatorio; RUT es texto libre opcional. Las notas pueden editarse y advierten que no se incluyan datos sensibles.
- RF-50 se aplicará literalmente: no se borrarán ni anonimizarán datos de clientes archivados. Esta decisión requiere revisión profesional antes de producción.
- TASK-002 completó y validó las fases 0–3 el 2026-11-10. No se realizó despliegue ni push.

## Next recommended work

1. Resolver las decisiones financieras y de proceso necesarias para la fase 4.
2. Registrar y aprobar la siguiente tarea antes de implementar fases 4–7.
3. Realizar revisión profesional de privacidad y retención antes de producción.
