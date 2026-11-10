
# Project Status

## Current phase

Development

## Active tasks

- TASK-001 — Plan de implementación RF-01–RF-50 (Proposed; pendiente de aprobación del Product Owner).

## Blocked tasks

None.

## Pending approvals

- TASK-001 — Orden general del roadmap RF-01–RF-50.

## Recent decisions

- RF-02: no hay registro público; solo `admin` crea cuentas y les asigna el rol `usuario` o `admin`. El primer admin (`gonza@gmrodriguez.com`) se provisionará con un comando .NET/Identity y variables de entorno; la contraseña no se almacena en el repositorio. `.env` y `.env.*` están excluidos por `.gitignore` (salvo `.env.example`).
- RF-01: cada cuenta tendrá nombre de usuario y email distintos, ambos únicos; se podrá iniciar sesión con cualquiera de los dos.
- Roles v1: `admin` administra cuentas y accede a toda la aplicación; `usuario` accede a los módulos operativos, sin administración de cuentas.
- RF-03: la auditoría funcional queda fuera de v1.
- RF-04: se muestran nombre y rol de la sesión y se permite cerrar sesión; no se muestra la etiqueta "auditada" en v1.
- TASK-002 aprobado: username de 3–50 caracteres sin `@`; contraseña temporal con cambio obligatorio; activar/desactivar cuentas incluido; datos existentes se preservan sin borrados automáticos.
- TASK-002 completado y validado el 10 de noviembre de 2026: builds .NET/Angular, pruebas backend/frontend, migración, Compose y auditorías de dependencias correctos.

## Recently completed

- TASK-002 — Acceso y gestión administrativa de cuentas v1 (Done).

## Next recommended work

1. Resolver la aprobación general de TASK-001.
2. Seleccionar el siguiente incremento del roadmap.
3. Mantener pendientes LEGAL-001–006 y la revisión profesional previa a producción.
