# TASK-003 — Plan propuesto

## Supuestos sujetos a aprobación

1. Traducir toda la UI al español.
2. No implementar ni simular Kanban o módulos de fases futuras.
3. Ocultar navegación y búsqueda sin funcionalidad actual.
4. Incorporar un sidebar móvil colapsable, manteniendo el diseño del template en escritorio.

## Implementación

1. Incorporar dentro del frontend el design system, Geist, Font Awesome y licencias, excluyendo Mermaid vendorizado y SVGs innecesarios.
2. Configurar el orden global de estilos: Font Awesome, tokens/componentes, layout InterProc y adaptaciones Angular.
3. Reemplazar el CSS legacy por adaptadores específicos, estados de interacción, responsive, foco y reducción de movimiento.
4. Reestructurar `AppComponent` con layout independiente para autenticación y shell autenticado con sidebar/topbar.
5. Adaptar y traducir Login, Cambio de contraseña y Dashboard.
6. Adaptar Procedimientos/Tipos: tabs, tarjetas, editor, pasos, versiones, íconos y estados.
7. Adaptar Clientes: búsqueda, tabla, editor, trabajos, notas, advertencias y diálogo de cambios pendientes.
8. Adaptar Cuentas y Auditoría, respetando visibilidad por rol.
9. Ajustar Mermaid al tema oscuro, conservando carga diferida y seguridad actual.
10. Validar builds, pruebas, Docker, assets locales, permisos, operaciones actuales, teclado y anchos responsive.

## Archivos principales

- `frontend/interproc-web/angular.json`
- `frontend/interproc-web/src/styles.css`
- `frontend/interproc-web/src/index.html`
- `frontend/interproc-web/src/app/app.component.ts`
- páginas y componente Mermaid bajo `frontend/interproc-web/src/app/`
- nuevos assets y licencias dentro del proyecto Angular

No se modificarán servicios, API, migraciones ni modelo de datos salvo que una incompatibilidad material no visible durante el análisis obligue a detener la tarea y solicitar una nueva decisión.

## Validación

- `npm run build`.
- `dotnet test backend/InterProc.slnx` como regresión.
- Build del frontend y stack completo mediante Docker.
- Verificación de que fuentes e íconos se sirven localmente sin errores.
- Smoke de login, cambio de contraseña, logout y rutas por rol.
- Smoke de catálogo/versiones/Mermaid, clientes/notas/archivo, cuentas y auditoría.
- Revisión responsive a 1440, 1024, 768 y 390 px.
- Revisión de teclado, foco, etiquetas y ausencia de enlaces muertos.
