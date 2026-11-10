
# Product Roadmap

## Status

Approved — orden y alcance de las fases 0–3 aprobados por el Product Owner el 2026-11-10 (TASK-001).

## Product Objective

Gestionar procedimientos reutilizables y su ejecución en trabajos para clientes, manteniendo historial auditable de cambios y resultados.

## MVP Scope

Base de acceso administrativo y auditoría, catálogo de tipos/procedimientos con versionado, clientes, procesos reutilizables y trabajos con armado, ejecución e historial. El dashboard y el archivo global completan la operación del MVP. La búsqueda global se propone para una iteración posterior al flujo operativo inicial.

## Implementation Phases

| Phase | Objective | Features | Dependencies | Status |
|---|---|---|---|---|
| 0. Decisiones y fundaciones | Resolver reglas transversales, modelo de datos común y autorización. | RF-02–04; auditoría; roles; archivado; estados; versionado | Decisiones aprobadas | Approved |
| 1. Acceso y estructura de aplicación | Habilitar acceso seguro, administración de cuentas y navegación autenticada. | RF-01–04, RF-06 (estructura inicial) | Fase 0 | Approved |
| 2. Catálogo | Crear tipos y procedimientos, con detalle, historial, versionado y archivo. | RF-13–22 | Fase 1 | Approved |
| 3. Clientes | Gestionar clientes, notas, asociación/listado de trabajos y restricciones de archivo. | RF-23–29 | Fase 1; entidad mínima de trabajo | Approved |
| 4. Procesos | Crear plantillas ordenadas, costos y conversión a trabajo borrador. | RF-30–37 | Fase 2; decisiones financieras | Proposed |
| 5. Trabajos | Completar armado, ejecución, avance e historial. | RF-38–47 | Fases 2–4; versión de procedimiento fijada por trabajo | Proposed |
| 6. Dashboard | Exponer tablero Kanban, tarjetas, indicadores y preferencias. | RF-07–12 | Fases 3–5; reglas de estados/activos | Proposed |
| 7. Archivo global y búsqueda | Unificar restauración, visibilidad y búsqueda transversal. | RF-05, RF-48–50 | Fases 2–6; permisos y política de borrado | Proposed |

## Implementation Order

Fase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7. Dentro de fases, priorizar API/modelo y reglas de dominio, luego interfaz y pruebas de aceptación. El archivo por entidad se implementa junto a cada módulo; la fase 7 agrega su vista/restauración transversal.

## Next Recommended Feature

Fase 0: resolver decisiones de producto y actualizar el modelo de acceso antes de desarrollar módulos de negocio.

## Pending Decisions

Las decisiones necesarias para las fases 0–3 están cerradas. Continúan pendientes las reglas financieras y otros detalles propios de las fases 4–7.

## Roadmap Changes

- 2026-11-10: aprobadas las fases 0–3 y sus decisiones transversales.
- 2026-11-10: fase 3 incluirá una entidad mínima de trabajo para asociaciones, contadores y restricciones de archivo.

## Rules

- The PM proposes priorities and sequencing.
- The Coordinator consolidates and documents.
- The Product Owner approves the roadmap.
- Preserve requirement-to-feature traceability.
- Do not change approved priorities silently.
