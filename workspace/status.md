
# Project Status

## Current phase

DevHarness — Planificación de producto

## Active tasks

- TASK-001 — Plan de implementación RF-01–RF-50 (Proposed; pendiente de aprobación del Product Owner).

## Blocked tasks

None.

## Pending approvals

None.

## Recent decisions

- RF-02: no hay registro público; solo `admin` crea cuentas y les asigna el rol `usuario` o `admin`. El primer admin (`gonza@gmrodriguez.com`) se provisionará con un comando .NET/Identity y variables de entorno; la contraseña no se almacena en el repositorio. `.env` y `.env.*` están excluidos por `.gitignore` (salvo `.env.example`).

## Next recommended work

1. Revisar y aprobar el orden propuesto en `workspace/product/roadmap.md`.
2. Resolver las decisiones bloqueantes listadas en TASK-001, empezando por el modelo de alta de usuarios frente a RF-02.
3. Registrar y analizar la primera fase aprobada antes de implementar.
``
