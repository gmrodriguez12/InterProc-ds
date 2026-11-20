
# Product Requirements

## Overview

Functional requirements registered for this project.

## Requirements

| ID | Module | Description | Priority | Status | Feature |
|---|---|---|---|---|---|
| RF-01–RF-04 | Acceso y auditoría | Autenticación, alta administrativa, auditoría mínima de archivados/restauraciones y sesión. Fuente: `docs/InterProc_Requerimientos_Funcionales.md`, modificada por decisión del Product Owner del 2026-11-10. | Must | Validated | Base transversal |
| RF-05 | Acceso y auditoría | Búsqueda global. | Should | Proposed | Fase 7 |
| RF-06 | Acceso y auditoría | Navegación en fase 1; contadores definitivos en fase 7. | Must | Approved | Base transversal |
| RF-07–RF-12 | Dashboard de trabajos | Kanban, estados, tarjetas, indicadores y preferencias visuales. | Should | Proposed | Dashboard |
| RF-13–RF-19 | Procedimientos | Catálogo, detalle, versionado, archivo e historial. | Must | Validated | Catálogo |
| RF-20–RF-22 | Tipos de procedimiento | Alta, edición y archivado de tipos. | Must | Validated | Catálogo |
| RF-23–RF-29 | Clientes | Gestión, notas editables, trabajos asociados y archivado condicionado. | Must | Validated | Clientes |
| RF-30–RF-37 | Procesos | Plantillas, composición, costos, cálculos, creación de trabajo y archivado. | Should | Proposed | Procesos |
| RF-38–RF-47 | Trabajos | Armado, ejecución, avance, historial y archivado. | Must | Proposed | Trabajos |
| RF-48–RF-50 | Archivo | Listado, restauración y política de borrado. | Must | Proposed | Archivo |

## Status Definitions

- Proposed
- Approved
- In Progress
- Implemented
- Validated
- Cancelled

## Accepted Decisions for Phases 0–3

1. No hay registro público. Solo `admin` crea cuentas. El primer administrador se provisiona con un comando .NET/Identity y secretos de entorno.
2. La cuenta incluye nombre visible, username y email únicos, rol y estado. La contraseña inicial es temporal y debe cambiarse en el primer ingreso.
3. `admin` gestiona cuentas, roles, auditoría, restauraciones y borrados permitidos; ambos roles gestionan y archivan catálogo y clientes. El último administrador activo está protegido.
4. RF-03 queda modificado: solo archivados y restauraciones se auditan con actor y fecha/hora. Los eventos se guardan en PostgreSQL; los logs técnicos van a stdout de Docker.
5. Cada trabajo fija la versión del procedimiento. La edición en ejecución crea una versión y mueve solo ese ítem. Una versión usada no puede borrarse.
6. Solo el nombre del cliente es obligatorio. RUT es texto libre opcional, incluso extranjero, sin validación específica. Las notas son editables y muestran una advertencia sobre datos sensibles.
7. `Terminado` y `Cancelado` son estados cerrados; los demás bloquean el archivo del cliente.
8. Ambos roles ven todos los clientes en la primera versión. El producto es inicialmente de uso interno en Uruguay y admite clientes personas o empresas extranjeras.
9. RF-50 se aplica literalmente, sin retención diferenciada ni anonimización de datos personales. Debe revisarse profesionalmente antes de producción.

## Pending Clarifications

1. Definir precisión/redondeo y semántica financiera para RF-33–35 antes de la fase 4.
2. Completar las transiciones de estados de trabajos antes de las fases 5–6; para fase 3 basta considerar cerrados `Terminado` y `Cancelado`.
3. Precisar el alcance final de búsqueda, restauración y códigos TRB antes de sus fases completas.

## Notes

- Preserve original requirement identifiers.
- Do not modify approved requirements silently.
- Maintain traceability between requirements and features.
- Do not mark requirements as implemented without evidence.
