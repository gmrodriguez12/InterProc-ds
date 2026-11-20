# TASK-002 — Plan propuesto de implementación

## Objetivo

Entregar secuencialmente las fases 0–3, validando cada incremento antes de iniciar el dependiente.

## Incremento A — Fundaciones y acceso (fases 0–1)

1. Extender Identity con nombre visible, username, email, estado y cambio obligatorio de contraseña.
2. Crear roles y un comando .NET idempotente para provisionar el primer administrador mediante variables de entorno.
3. Retirar signup público y el redireccionamiento asociado.
4. Permitir login por username o email, cambio inicial de contraseña, logout y contexto de sesión.
5. Implementar administración de cuentas por `admin`, incluida protección del último administrador activo.
6. Crear políticas de autorización, shell autenticado y navegación inicial.
7. Incorporar el modelo transaccional de archivado/restauración y su auditoría mínima.

### Condición de salida

No existe alta pública; el bootstrap es seguro e idempotente; un administrador puede gestionar cuentas; ambos roles acceden solo a las funciones autorizadas; archivados y restauraciones generan auditoría.

## Incremento B — Catálogo (fase 2)

1. Implementar tipos de procedimiento con unicidad normalizada, conteo, edición y archivo condicionado.
2. Implementar procedimientos, detalle, pasos, esquema Mermaid opcional, tiempo estimado y archivo.
3. Crear versión 1 al alta y nuevas versiones solo cuando cambien pasos o esquema, con motivo obligatorio.
4. Mostrar historial, versión vigente, autor, fecha, motivo y trabajo de origen.
5. Restringir a `admin` el borrado irreversible de versiones no vigentes y rechazarlo si fueron utilizadas.
6. Renderizar Mermaid de forma segura y mostrar errores de sintaxis sin romper la vista.

### Condición de salida

RF-13–RF-22 funcionan por API e interfaz, con reglas de versión, archivo, permisos e integridad cubiertas por pruebas.

## Incremento C — Clientes (fase 3)

1. Implementar clientes personas o empresas con nombre único obligatorio y campos opcionales de RUT libre, contacto, email, teléfono y dirección.
2. Implementar listado, búsqueda local, ficha, alta, edición y aviso de cambios sin guardar.
3. Implementar notas generales o vinculadas a un trabajo, editables, con autor y fechas, y advertencia visible sobre datos sensibles.
4. Crear la entidad mínima de trabajo con nombre, código, cliente, estado y avance para asociaciones y contadores.
5. Listar trabajos del cliente y bloquear su archivo mientras exista alguno que no esté `Terminado` o `Cancelado`.
6. Mantener las relaciones por identificador para que un cambio de nombre se refleje en los trabajos.

### Condición de salida

RF-23–RF-29 funcionan por API e interfaz; las restricciones de archivo y relaciones se verifican con pruebas.

## Validación por incremento

- Pruebas unitarias y de integración del backend para reglas, permisos, concurrencia e integridad.
- Pruebas del frontend para formularios, guards, estados y recorridos principales.
- Build de backend y frontend.
- Migraciones desde base limpia y desde el esquema actual.
- Recorrido funcional en Docker Compose a través de Nginx.
- Revisión de regresiones de autenticación, CSRF, cookies y manejo de errores.

## Límites

- No se implementarán fases 4–7.
- La entidad mínima de trabajo no incluirá todavía armado, ejecución ni historial completo.
- No se desplegará ni se hará push sin autorización explícita.
- Una desviación material de alcance o arquitectura requerirá una nueva decisión del Product Owner.
