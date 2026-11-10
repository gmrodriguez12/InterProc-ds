# TASK-001 — Plan propuesto de implementación

## Objetivo

Entregar InterProc por incrementos funcionales, primero resolviendo decisiones compartidas y luego construyendo los módulos en el orden de sus dependencias. Este plan cubre RF-01–RF-50; el orden queda pendiente de aprobación.

## Fases propuestas

| Fase | Prioridad | Alcance | RF | Salida y condición para avanzar |
|---|---|---|---|---|
| 0. Decisiones y fundaciones | P0 | Acordar usuarios/roles, mecanismo de bootstrap del administrador, auditoría, archivo, estados, versionado y convenciones de datos/códigos. | RF-02–04 y reglas transversales | Roles y reglas documentados; mecanismo del primer admin definido; modelo base y contratos de autorización/auditoría definidos. |
| 1. Acceso y shell de aplicación | P0 | Login por usuario/email, comando de inicialización .NET que crea el primer admin con Identity usando variables de entorno, gestión administrativa de cuentas, logout/contexto de sesión, autorización y estructura de navegación autenticada. | RF-01–04, RF-06 (estructura) | Acceso administrativo funciona; sin alta pública; primer admin `gonza@gmrodriguez.com` provisionado sin insertar directamente en SQL; acciones auditables según política acordada. |
| 2. Tipos y catálogo de procedimientos | P0 | CRUD de tipos y procedimientos, detalle/esquema, archivado, versiones e historial; única excepción de borrado físico para versiones no vigentes. | RF-13–22 | Catálogo usable y reglas de versionado/archivo verificables; base reutilizable para procesos y trabajos. |
| 3. Clientes | P0 | Listado/búsqueda local, ficha y edición, notas, trabajos asociados y archivado condicionado. Puede crearse antes la entidad mínima de trabajo requerida para asociaciones/contadores. | RF-23–29 | Clientes vinculables a trabajos y reglas para no archivar con trabajos abiertos. |
| 4. Procesos y costos | P1 | Plantillas ordenadas desde procedimientos, tiempos/cantidades, datos facturables, costos y cálculos, archivado y conversión a trabajo borrador. | RF-30–37 | Proceso reutilizable genera un trabajo con procedimientos en borrador; cálculos validados con reglas monetarias acordadas. |
| 5. Trabajos y ejecución | P0 | Entidad/código/cliente/estado, armado manual o desde proceso, ejecución de pasos, tiempos/notas, versiones atribuidas al trabajo, avance, historial y archivo. | RF-38–47 | Ciclo de trabajo desde borrador a ejecución con avance e historial consistentes. |
| 6. Dashboard operativo | P1 | Kanban, tarjetas, indicadores y preferencias de estados/densidad. | RF-07–12 | Vista refleja estado y avance persistidos y respeta definición acordada de activos. |
| 7. Archivo global, búsqueda y cierre transversal | P1 | Búsqueda global, listado de archivados/restauración, contadores finales por módulo y permisos asociados. | RF-05, RF-06 (contadores), RF-48–50 | Todos los módulos archivables pueden consultarse/restaurarse; búsqueda respeta autorización. |

## Orden recomendado

Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6 → Fase 7.

RF-06 se divide: shell/navegación en fase 1 y contadores cuando haya datos disponibles (fase 7). El archivado de cada entidad se construye en su fase funcional; fase 7 entrega la experiencia global de archivo y restauración. El trabajo base se crea en fase 3 solo si es necesario para satisfacer relaciones, y se completa en fase 5.

## Enfoque de entrega por fase

Para cada fase aprobada: especificar criterios de aceptación y reglas pendientes, implementar esquema/API/reglas de dominio, integrar interfaz, añadir pruebas, validar el recorrido en Docker y actualizar documentación/status. No se debe iniciar una fase dependiente mientras sus decisiones bloqueantes sigan abiertas.

## Decisiones de Product Owner requeridas

1. Aprobar o ajustar el orden y el alcance MVP de las fases.
2. Aplicar RF-02 según aclaración del Product Owner: no existe registro público; solo `admin` puede crear cuentas y asignarles `usuario` o `admin`. Provisionar `gonza@gmrodriguez.com` como primer admin con un comando .NET que use Identity y variables de entorno. La contraseña debe mantenerse fuera del repositorio y proveerse al comando como secreto de entorno.
3. Confirmar roles/permisos y eventos auditados.
4. Confirmar política de snapshots/versiones de procedimientos usados en trabajos.
5. Definir estados activos/abiertos, transiciones y reglas de avance.
6. Confirmar política financiera y de datos personales; solicitar revisión legal/compliance antes de cerrar esos requisitos.

## Fuera de este plan

No incluye estimaciones de calendario o esfuerzo: no hay dimensionamiento de equipo, capacidad ni criterios detallados suficientes. Tampoco aprueba cambios de alcance ni inicia implementación.
