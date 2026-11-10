
# Product Requirements

## Overview

Functional requirements registered for this project.

## Requirements

| ID | Module | Description | Priority | Status | Feature |
|---|---|---|---|---|---|
| RF-01–RF-06 | Acceso y auditoría | Autenticación, alta administrativa, auditoría, sesión, búsqueda y navegación. Fuente: `docs/InterProc_Requerimientos_Funcionales.md`. | Must | Proposed | Base transversal |
| RF-07–RF-12 | Dashboard de trabajos | Kanban, estados, tarjetas, indicadores y preferencias visuales. | Should | Proposed | Dashboard |
| RF-13–RF-19 | Procedimientos | Catálogo, detalle, versionado, archivo e historial. | Must | Proposed | Catálogo |
| RF-20–RF-22 | Tipos de procedimiento | Alta, edición y archivado de tipos. | Must | Proposed | Catálogo |
| RF-23–RF-29 | Clientes | Gestión, notas, trabajos asociados y archivado condicionado. | Must | Proposed | Clientes |
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

## Pending Clarifications

1. RF-02 aclarado por el Product Owner: no hay registro público; solo `admin` puede crear cuentas, y asigna a cada una el rol `usuario` o `admin`. El primer `admin` se provisionará mediante un comando de inicialización .NET que usa ASP.NET Core Identity y recibe sus datos por variables de entorno. Cuenta inicial: `gonza@gmrodriguez.com`. No guardar la contraseña en el repositorio. El esqueleto actual ofrece signup y debe ajustarse a esta regla.
2. Definir alcance de RF-03 (qué eventos se auditan y política de retención); roles disponibles y capacidad de alta ya están definidos.
3. Definir estados activos/abiertos y transiciones válidas de trabajos; afectan RF-07, RF-11, RF-29 y RF-44.
4. Definir si cada trabajo fija una versión de procedimiento o sigue la vigente; precisar el efecto de editar pasos desde ejecución (RF-16, RF-18, RF-42–43).
5. Definir políticas de datos personales de clientes (RUT, contacto, email, teléfono, dirección), retención y acceso. Revisión legal/compliance pendiente; no hay configuración de `agents/legal.toml` disponible en este repositorio.
6. Definir precisión/redondeo y semántica financiera para costos, ganancia y margen (RF-33–35).
7. Precisar formato/unicidad del código TRB, alcance de la búsqueda y permisos de restauración/borrado de versiones.

## Notes

- Preserve original requirement identifiers.
- Do not modify approved requirements silently.
- Maintain traceability between requirements and features.
- Do not mark requirements as implemented without evidence.
