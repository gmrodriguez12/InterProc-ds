# TASK-002 — Análisis consolidado

## Estado actual

- ASP.NET Core Identity, cookies, antiforgery, EF Core y PostgreSQL ya están configurados.
- El alta pública actual crea el primer administrador y luego usuarios; debe reemplazarse por bootstrap por comando y alta administrativa.
- Angular tiene login, signup, guards y un dashboard placeholder.
- No existen todavía entidades de catálogo, clientes ni trabajos.

## Decisiones de diseño aprobadas

- Cuentas con nombre visible, username, email, rol, estado y cambio obligatorio de contraseña temporal.
- Roles `admin` y `usuario`; ambos gestionan catálogo y clientes, con capacidades administrativas reservadas.
- Auditoría exclusivamente para archivados y restauraciones, persistida en PostgreSQL.
- Versiones de procedimientos inmutables y fijadas por trabajo.
- Clientes con solo nombre obligatorio, RUT libre opcional, notas editables y acceso global para ambos roles.
- Soft delete literal según RF-50; solo RF-19 admite borrado físico.

## Riesgos y mitigaciones

- La migración desde `IdentityUser` a un usuario de aplicación debe preservar compatibilidad con la base existente y probarse desde una base limpia y una migrada.
- El borrado de versiones requiere integridad referencial para impedir eliminar versiones utilizadas.
- Las operaciones de archivado/restauración y sus eventos de auditoría deben ser transaccionales.
- Se usará concurrencia optimista para impedir que ediciones simultáneas sobrescriban cambios silenciosamente.

## Hallazgos legales y de privacidad

- **LEGAL-001:** InterProc será inicialmente de uso interno en Uruguay, pero almacenará datos de personas y empresas extranjeras. Deben confirmarse jurisdicciones y eventuales transferencias antes de producción.
- **LEGAL-002:** RF-50 se aplicará literalmente y no habrá retención diferenciada. Esto puede entrar en tensión con obligaciones o solicitudes válidas sobre datos personales; requiere revisión profesional antes de producción.
- **LEGAL-003:** ambos roles verán todos los clientes en el MVP. Debe revisarse si el crecimiento del equipo requiere segmentación o mínimo privilegio.
- **LEGAL-004:** el primer administrador será responsable de solicitudes e incidentes. Antes de producción debe existir un procedimiento operativo verificable.

No se declara cumplimiento legal a partir de este análisis.
