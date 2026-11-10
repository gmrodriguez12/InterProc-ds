# TASK-003 — Análisis

## Conclusión

La adaptación es viable exclusivamente en Angular. No requiere cambios de API, dominio, base de datos, Docker ni nuevas dependencias. Es un cambio transversal porque reemplaza el tema claro actual por Lumen Dark, cambia el header horizontal por el shell lateral del template y migra todas las pantallas implementadas a sus patrones visuales.

La implementación debe ser atómica por capas: incorporar assets, sustituir el shell y adaptar todas las vistas en la misma tarea. Cargar el CSS nuevo encima del anterior sin refactor no es seguro porque existen colisiones en selectores globales como `.brand`, `.topbar`, `.eyebrow`, `.badge`, `.tabs`, tablas y formularios.

## Alcance funcional preservado

- Rutas y guards actuales.
- Login, cambio obligatorio de contraseña y logout.
- Permisos `admin`/`usuario`.
- Administración de cuentas y protección del último administrador.
- Catálogo, tipos, versiones, Mermaid, archivo y restauración.
- Clientes, trabajos asociados, notas y diálogo de cambios sin guardar.
- Auditoría mínima.
- Validaciones, concurrencia y llamadas HTTP existentes.

No se incorporarán datos de ejemplo ni funcionalidad de fases futuras. Kanban, Procesos, Trabajos, Archivo dedicado y búsqueda global quedan fuera del alcance.

## Correspondencia visual

- `login.html`: login y cambio obligatorio de contraseña.
- Shell de `app.html`: sidebar, topbar, identidad, rol y logout para rutas autenticadas.
- Dashboard: lenguaje visual, indicadores disponibles y estado vacío, sin simular el Kanban futuro.
- `componentes.html`: botones, badges, tabs, tarjetas, formularios, tablas, alertas, Mermaid, versiones y diálogos.
- Administración: grupo propio del sidebar, visible solo para `admin`, con Cuentas y Auditoría.

## Assets

- Copiar al frontend los CSS del design system, Geist/Geist Mono, Font Awesome CSS/webfonts y licencias.
- No copiar los SVG individuales de Font Awesome.
- No copiar Mermaid del template: la aplicación ya usa Mermaid npm 12.3 con carga diferida, modo estricto y sanitización.
- Los assets deben vivir dentro de `frontend/interproc-web`; el contenedor de desarrollo no monta `interproc-template/` y una referencia directa rompería Docker.

## Criterios de aceptación

1. Toda la UI implementada usa la paleta, tipografía, elevación, radios y componentes del template; no permanecen estilos azules/claros anteriores.
2. Login es independiente y no ofrece registro público.
3. Las rutas autenticadas usan sidebar/topbar; la ruta activa, usuario, rol y logout son visibles.
4. Cuentas y Auditoría solo aparecen para `admin`.
5. Procedimientos usa tabs, tarjetas, íconos Font Awesome reales, formulario, Mermaid, versiones y estados archivados/vacíos.
6. Clientes usa tabla, buscador, editor, trabajos, notas, advertencia de privacidad y diálogo de salida.
7. Cuentas y Auditoría comparten formularios, tablas, badges y feedback del sistema visual.
8. No existen enlaces muertos, datos ficticios ni controles para funciones todavía no implementadas.
9. Mermaid usa tema oscuro y conserva `securityLevel: strict` y sanitización.
10. La interfaz funciona con teclado, foco visible y nombres accesibles para iconos/acciones.
11. La vista es usable a 1440, 1024, 768 y 390 px; tablas y diagramas no rompen el viewport.
12. Build Angular, build Docker y pruebas existentes finalizan correctamente.

## Decisiones recomendadas

- Traducir toda la interfaz al español para coincidir con el template y el producto.
- Mantener el Dashboard sin Kanban ni estadísticas inventadas hasta que existan los endpoints y features correspondientes.
- Ocultar Procesos, Trabajos, Archivo y búsqueda global hasta su implementación.
- Mejorar el comportamiento móvil del template con un sidebar tipo drawer accesible bajo 860 px.

## Riesgos y mitigaciones

- Colisiones CSS: reemplazar estilos legacy y migrar todas las vistas en un solo cambio.
- Tamaño de assets: copiar solo CSS/webfonts necesarios y licencias.
- Íconos dinámicos: aplicar las clases como binding, nunca como HTML.
- Responsive limitado del template: agregar navegación móvil sin alterar la identidad visual.
- Diálogos estáticos del wireframe: conservar semántica, Escape, foco y navegación por teclado en la implementación Angular.
