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

- Se implementaron clientes personas o empresas con nombre activo único y RUT/identificador extranjero libre, contacto, email, teléfono y dirección opcionales.
- La ficha incluye listado y contadores de trabajos, estados y avance. El nombre se resuelve por relación, por lo que sus cambios se reflejan en los trabajos.
- Se agregó la fundación mínima de trabajo con código, cliente, estado, avance e integridad de estados/porcentajes.
- El archivo de un cliente se bloquea si tiene un trabajo activo que no esté `Terminado` o `Cancelado`.
- Se implementaron notas generales o vinculadas a trabajos, editables, con autor y fechas de creación/edición.
- La interfaz muestra la advertencia aprobada sobre datos sensibles y un diálogo con `Descartar y salir`, `Guardar y salir` y `Permanecer` ante cambios sin guardar.
- Archivo y restauración mantienen la política literal de RF-50 y registran la auditoría mínima.
