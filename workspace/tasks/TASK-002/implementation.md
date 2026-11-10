# TASK-002 — Implementación

## Fases 0–1 — Fundaciones y acceso

- Se reemplazó `IdentityUser` por un usuario de aplicación con nombre visible, username, email, estado y cambio obligatorio de contraseña temporal.
- Se eliminó el signup público y se agregó un comando idempotente de bootstrap del primer administrador mediante variables de entorno.
- El login acepta username o email. Las cuentas inactivas no pueden iniciar ni conservar sesión.
- Se agregaron administración de cuentas, roles `admin`/`usuario`, protección del último administrador y restablecimiento de contraseña temporal.
- Se creó el modelo de auditoría mínima para futuros eventos de archivo/restauración y su consulta administrativa.
- Se actualizaron la navegación Angular, guards, cambio de contraseña y documentación operativa.
- Se actualizaron dependencias .NET 10 a versiones corregidas; el escaneo de NuGet no reportó paquetes vulnerables.

## Fase 2 — Catálogo

- Se implementaron tipos de procedimiento con nombre activo único, ícono, conteo, edición y archivo condicionado.
- Se implementaron procedimientos con tipo, ícono, descripción, pasos, Mermaid opcional, tiempo estimado, archivo y restauración.
- El alta genera la versión 1. Cambiar pasos o Mermaid exige motivo y crea una versión inmutable; los demás campos no versionan.
- El historial conserva autor, fecha, motivo y trabajo de origen. Solo `admin` puede eliminar versiones no vigentes y no utilizadas.
- Los archivos y restauraciones generan los únicos eventos de auditoría funcional aprobados.
- Angular incorpora pestañas por tipo, búsqueda, formularios, historial y render Mermaid seguro con carga diferida.

## Fase 3 — Clientes

Pendiente.
