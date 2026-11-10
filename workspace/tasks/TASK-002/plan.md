# TASK-002 — Plan propuesto

## Objetivo

Entregar acceso interno seguro y administración inicial de cuentas para RF-01, RF-02 y RF-04, eliminando el registro público y manteniendo la arquitectura Docker/Identity existente.

## Implementación propuesta

### 1. Modelo e Identity

- Introducir un usuario de aplicación compatible con las tablas de Identity para soportar el estado activo si se aprueba.
- Centralizar nombres de roles y políticas de autorización.
- Configurar explícitamente política de contraseña y lockout.
- Agregar un índice único de base de datos para email normalizado.
- Crear migración EF segura; no transformar cuentas existentes sin una decisión explícita.

### 2. Bootstrap administrativo

- Agregar un modo de comando al ejecutable .NET para crear los roles y el primer `admin`.
- Leer username, email y contraseña desde variables de entorno requeridas.
- Validar colisiones, ser idempotente y no registrar secretos.
- Documentar su ejecución dentro del flujo Docker y las variables sin valores reales.

### 3. API de autenticación y cuentas

- Eliminar signup y el criterio "primer usuario es admin".
- Cambiar login a un identificador que resuelva username o email sin enumerar cuentas.
- Mantener cookie, antiforgery, logout y restauración de sesión; incluir username/email/rol.
- Crear endpoints administrativos para listar y crear cuentas, protegidos con rol `admin`.
- Si se aprueba, agregar activar/desactivar e invalidar las sesiones de una cuenta desactivada.
- Exponer únicamente datos mínimos y mapear errores seguros de validación/unicidad.

### 4. Interfaz Angular

- Eliminar página, ruta, enlace y redirecciones de signup.
- Adaptar login a "usuario o email".
- Mostrar username y rol en el shell autenticado, con logout.
- Agregar vista administrativa mínima de Cuentas: listado y alta; activación/desactivación si se aprueba.
- Proteger rutas por autenticación/rol y mantener la autorización real en API.
- No implementar todavía sidebar completo ni contadores de RF-06.

### 5. Pruebas y validación

- Crear infraestructura de pruebas backend y frontend necesaria para el alcance.
- Cubrir bootstrap, signup inexistente, login por ambos identificadores, normalización, lockout, CSRF, logout, sesión, roles, 403, duplicados y concurrencia.
- Cubrir interfaz sin signup, formulario de login, guards, identidad/rol y administración.
- Ejecutar builds de .NET/Angular, pruebas, validación de migración, `docker compose config` y recorrido completo en Docker.
- Registrar cualquier validación que no pueda ejecutarse; no marcar `Done` sin evidencia.

## Documentación

- Actualizar arquitectura de identidad/autorización, variables de bootstrap y operación Docker.
- Registrar implementación, migración y resultados en TASK-002.
- Mantener RF-03 diferido y RF-06 parcialmente cubierto.
- Mantener trazabilidad de LEGAL-001–006 y separar controles técnicos de revisión profesional.

## Decisiones incluidas en la aprobación

La aprobación del plan debe confirmar o ajustar:

1. Username con 3–50 caracteres, `[A-Za-z0-9._-]`, sin `@` y único case-insensitive.
2. Contraseña inicial permanente o temporal con cambio obligatorio.
3. Inclusión de activar/desactivar cuentas en TASK-002.
4. Existencia de cuentas que deban migrarse.

## Estado

Done. Aprobado por el Product Owner el 9 de noviembre de 2026 con las cuatro opciones recomendadas: formato de username sin `@`, contraseña temporal con cambio obligatorio, activación/desactivación y preservación de datos existentes sin borrado automático. Implementación y validación completadas el 10 de noviembre de 2026.
