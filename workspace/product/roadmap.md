
# Product Roadmap

## Status

Proposed — pendiente de aprobación del Product Owner (TASK-001).

## Product Objective

Gestionar procedimientos reutilizables y su ejecución en trabajos para clientes, manteniendo historial auditable de cambios y resultados.

## MVP Scope

Base de acceso administrativo y auditoría, catálogo de tipos/procedimientos con versionado, clientes, procesos reutilizables y trabajos con armado, ejecución e historial. El dashboard y el archivo global completan la operación del MVP. La búsqueda global se propone para una iteración posterior al flujo operativo inicial.

## Implementation Phases

| Phase | Objective | Features | Dependencies | Status |
|---|---|---|---|---|
| 0. Decisiones y fundaciones | Resolver reglas transversales, modelo de datos común y autorización. | RF-02–04; auditoría; roles; archivado; estados; versionado | Aprobación de roadmap y decisiones pendientes | Proposed |
| 1. Acceso y estructura de aplicación | Habilitar acceso seguro, administración de cuentas y navegación autenticada. | RF-01–04, RF-06 (estructura inicial) | Fase 0 | Proposed |
| 2. Catálogo | Crear tipos y procedimientos, con detalle, historial, versionado y archivo. | RF-13–22 | Fase 1; decisiones de versiones y auditoría | Proposed |
| 3. Clientes | Gestionar clientes, notas, asociación/listado de trabajos y restricciones de archivo. | RF-23–29 | Fase 1; entidades de trabajo mínimas para contadores y asociación | Proposed |
| 4. Procesos | Crear plantillas ordenadas, costos y conversión a trabajo borrador. | RF-30–37 | Fase 2; decisiones financieras | Proposed |
| 5. Trabajos | Completar armado, ejecución, avance e historial. | RF-38–47 | Fases 2–4; versión de procedimiento fijada por trabajo | Proposed |
| 6. Dashboard | Exponer tablero Kanban, tarjetas, indicadores y preferencias. | RF-07–12 | Fases 3–5; reglas de estados/activos | Proposed |
| 7. Archivo global y búsqueda | Unificar restauración, visibilidad y búsqueda transversal. | RF-05, RF-48–50 | Fases 2–6; permisos y política de borrado | Proposed |

## Implementation Order

Fase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7. Dentro de fases, priorizar API/modelo y reglas de dominio, luego interfaz y pruebas de aceptación. El archivo por entidad se implementa junto a cada módulo; la fase 7 agrega su vista/restauración transversal.

## Next Recommended Feature

Fase 0: resolver decisiones de producto y actualizar el modelo de acceso antes de desarrollar módulos de negocio.

## Pending Decisions

Ver `workspace/product/requirements.md` y `workspace/tasks/TASK-001/analysis.md`. RF-02 quedó aclarado: solo `admin` crea cuentas y les asigna el rol `usuario` o `admin`; no hay registro público. El primer `admin` se provisiona mediante un comando .NET que usa Identity y variables de entorno; no se insertará directamente con SQL. Quedan por definir el alcance de auditoría, las políticas de versión y los estados.

## Roadmap Changes

Record significant changes to priorities,
scope or implementation order.

## Rules

- The PM proposes priorities and sequencing.
- The Coordinator consolidates and documents.
- The Product Owner approves the roadmap.
- Preserve requirement-to-feature traceability.
- Do not change approved priorities silently.
