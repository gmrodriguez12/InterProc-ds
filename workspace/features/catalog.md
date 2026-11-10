# Catálogo de procedimientos

## Alcance implementado

- RF-13–RF-22.
- Tipos activos con nombre único normalizado y archivo condicionado a no tener procedimientos activos.
- Procedimientos con pasos en texto, Mermaid opcional y tiempo estimado en minutos.
- Versión nueva solo al cambiar pasos o Mermaid, con motivo obligatorio.
- Historial inmutable; borrado irreversible reservado a `admin` para versiones no vigentes y no utilizadas.
- Archivo lógico y restauración con auditoría de actor y fecha UTC.

## Decisiones técnicas

- Unicidad mediante valores normalizados e índices parciales PostgreSQL sobre registros activos.
- Concurrencia optimista mediante token por agregado.
- Mermaid se carga bajo demanda con `securityLevel: strict`; una sintaxis inválida produce una advertencia y no rompe la ficha.
