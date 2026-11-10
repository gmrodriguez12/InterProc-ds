# TASK-002 — Análisis

## Conclusión

La autenticación existente se puede reutilizar, pero el flujo actual contradice RF-01/RF-02: expone signup público, asigna `Admin` al primer registro, usa email como `UserName` y redirige a signup cuando la base está vacía. El incremento debe refactorizar ese flujo y agregar administración de cuentas protegida en servidor.

## Alcance funcional recomendado

- Login con nombre de usuario o email y contraseña, normalizado sin distinguir mayúsculas.
- Nombre de usuario y email obligatorios, distintos y únicos.
- Roles únicos y cerrados: `admin` y `usuario`.
- Sin registro público en API, rutas, enlaces ni redirecciones.
- Comando idempotente para crear roles y el primer administrador desde variables de entorno, sin exponer la contraseña.
- Administración mínima por `admin`: listar y crear cuentas; se propone incluir activar/desactivar por seguridad del ciclo de vida.
- Sesión con username, email y un único rol; shell mínimo con username, rol, logout y acceso a Cuentas para `admin`.
- RF-03 fuera de v1; RF-04 sin etiqueta "auditada".
- RF-06 solo aporta el shell mínimo; menú lateral completo y contadores quedan pendientes.

Quedan fuera salvo aprobación expresa: edición de username/email/rol, eliminación, restablecimiento de contraseña y recuperación pública.

## Estado técnico verificado

- ASP.NET Core Identity, EF Core/PostgreSQL, cookies, antiforgery y persistencia de claves ya existen.
- `POST /api/auth/signup` es público, inicia sesión automáticamente y asigna roles según la existencia de usuarios.
- Login acepta solo email; la respuesta de sesión no contiene username.
- `setup-status`, guards y navegación sostienen el bootstrap mediante signup.
- Identity garantiza username normalizado único; el índice de email normalizado no es único en base de datos.
- No existen proyectos de pruebas automatizadas.
- El entorno Docker local no pudo inspeccionarse porque no hay valores de PostgreSQL cargados; no se confirmó si existen cuentas persistidas.

## Reglas y casos límite

- Prohibir `@` en username evita que el username de una cuenta coincida con el email de otra y elimina ambigüedad en login.
- Duplicados case-insensitive deben rechazarse incluso ante altas concurrentes.
- Solo se aceptan `admin` y `usuario`, exactamente uno por cuenta.
- Credenciales inválidas producen el mismo mensaje genérico.
- El comando bootstrap es repetible: valida una cuenta coincidente y no sobrescribe contraseña/rol ante colisiones.
- Ninguna contraseña, hash o secreto debe aparecer en respuestas, logs o archivos versionados.
- La API impone autorización; ocultar controles en Angular no reemplaza el control del servidor.
- Cuentas históricas con `UserName == Email` requieren decisión de migración; no se deben alterar ni borrar silenciosamente.

## Criterios de aceptación resumidos

1. Una instalación vacía no ofrece signup e indica ejecutar el bootstrap administrativo.
2. El bootstrap valida variables requeridas, crea roles/admin una vez y es idempotente.
3. Login funciona con username o email y aplica lockout configurado explícitamente.
4. Un `usuario` obtiene 403 al acceder a administración de cuentas.
5. Un `admin` lista y crea cuentas con validaciones de username, email, contraseña y rol.
6. Si se aprueba el ciclo de vida, un `admin` desactiva/reactiva cuentas y una cuenta desactivada no inicia ni conserva sesión válida.
7. La sesión muestra username y rol; logout invalida la sesión y vuelve al login.
8. No existe endpoint, página, enlace ni redirección de registro público.

## Revisión de privacidad y compliance

Revisión preliminar de solo lectura realizada sin el perfil `legal` configurado; no permite afirmar cumplimiento legal.

- **LEGAL-001 — Transparencia, finalidad y base jurídica (alta):** username y email son datos personales. Antes de producción se debe identificar responsable/finalidad/base, informar al usuario y definir un canal para ejercer derechos. La interpretación aplicable requiere revisión profesional según jurisdicción.
- **LEGAL-002 — Ciclo de vida y retención (alta):** alta/listado sin desactivación deja acceso a usuarios desvinculados. Se recomienda incluir desactivación e invalidación de sesión y definir retención/baja antes de producción.
- **LEGAL-003 — Seguridad y minimización (alta):** mantener cookies seguras, CSRF, respuesta genérica, autorización de servidor y datos mínimos; verificar HTTPS, lockout, secretos y pruebas automatizadas.
- **LEGAL-004 — Incidentes y logs técnicos (media/alta):** diferir RF-03 no impide el incremento, pero antes de producción se requieren logs técnicos sin credenciales, acceso restringido y procedimiento de incidentes.
- **LEGAL-005 — Proveedores y transferencias (media):** faltan hosting, backups, ubicación y terceros; inventariarlos y revisarlos antes de producción.
- **LEGAL-006 — Cookies técnicas (media):** documentar finalidad y duración de las cookies de sesión; validar obligaciones locales.

Evidencia faltante: jurisdicción/mercados, responsable del tratamiento, población usuaria, retención, baja, incidentes, hosting/backups y contratos. Los hallazgos se mantienen pendientes de aceptación del Product Owner y revisión profesional cuando corresponda.

## Decisiones pendientes del Product Owner

1. Formato propuesto de username: 3–50 caracteres, letras, números, `.`, `_` y `-`, sin `@`, único sin distinguir mayúsculas.
2. Contraseña inicial: elegir entre contraseña permanente definida por el admin o temporal con cambio obligatorio en el primer acceso.
3. Confirmar si se incluye activar/desactivar cuentas en este incremento. Se recomienda incluirlo por LEGAL-002.
4. Indicar si existen cuentas/datos que deban conservarse y migrarse; de lo contrario se tratará el entorno actual como desarrollo sin datos productivos, sin borrar automáticamente nada.
5. El username del primer administrador se entregará al comando por variable de entorno; no necesita quedar fijado en el repositorio.

## Fuentes técnicas

- `backend/InterProc.Api/Program.cs`
- `backend/InterProc.Api/Controllers/AuthController.cs`
- `backend/InterProc.Api/Services/AuthService.cs`
- `backend/InterProc.Api/Data/ApplicationDbContext.cs`
- `frontend/interproc-web/src/app/services/auth.service.ts`
- `frontend/interproc-web/src/app/guards/auth.guards.ts`
- `frontend/interproc-web/src/app/app.routes.ts`
- `frontend/interproc-web/src/app/app.component.ts`
