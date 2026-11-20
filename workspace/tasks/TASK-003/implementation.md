# TASK-003 — Implementación

## Sistema visual

- Se incorporaron dentro del frontend los tokens y componentes Lumen Dark del template.
- Se agregaron Geist, Geist Mono, Font Awesome Free y sus licencias como assets locales.
- Se excluyeron los SVG innecesarios y el Mermaid vendorizado; la aplicación conserva Mermaid npm con carga diferida.
- Se reemplazó el tema claro legacy por adaptadores Angular sobre el sistema visual aprobado.

## Shell y navegación

- Se reemplazó el header horizontal por sidebar, topbar, usuario, rol, estado auditado y cierre de sesión.
- La navegación muestra Dashboard, Procedimientos y Clientes; Cuentas y Auditoría solo aparecen para `admin`.
- Se eliminaron el enlace obsoleto de signup y los accesos a features todavía no implementadas.
- En móvil, el sidebar funciona como drawer colapsable con scrim, Escape y atributos ARIA.

## Pantallas

- Login alineado visualmente con `interproc-template/login.html`.
- Cambio obligatorio de contraseña integrado con el patrón de autenticación.
- Dashboard con indicadores reales disponibles y placeholder explícito para el tablero futuro, sin datos ficticios.
- Procedimientos y tipos con tabs, cards, íconos reales, formulario, versiones, archivo/restauración y estados vacíos.
- Clientes con búsqueda, tabla, editor, trabajos asociados, notas, advertencia de privacidad y diálogo de salida.
- Cuentas y Auditoría adaptadas a formularios, tablas, badges y feedback del design system.
- Mermaid usa tema oscuro y conserva `securityLevel: strict` y sanitización.
- Toda la interfaz visible fue traducida al español.

## Decisiones técnicas

- No se modificaron servicios de negocio, API, base de datos ni migraciones.
- Los assets se copiaron dentro del proyecto Angular porque Docker de desarrollo solo monta `frontend/`.
- Se agregaron `dist/` a `.gitignore` y `.dockerignore` para excluir resultados generados.
