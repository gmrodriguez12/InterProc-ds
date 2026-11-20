# TASK-001 — Análisis

## Alcance analizado

Se revisaron los 50 requerimientos agrupados en ocho módulos, el estado del workspace y la estructura/código actual.

## Estado técnico verificado

- El repositorio contiene frontend Angular, API ASP.NET Core, PostgreSQL/EF Core e infraestructura Docker.
- El backend ya usa ASP.NET Core Identity, cookies y antiforgery; hay migraciones iniciales e Identity.
- El frontend cuenta con pantallas de login/signup y un dashboard placeholder, además de guards.
- No se encontraron entidades ni módulos de negocio para procedimientos, tipos, clientes, procesos, trabajos o archivo.
- El esqueleto ofrece signup. El Product Owner aclaró RF-02: no hay registro público; solo `admin` crea cuentas y asigna el rol `usuario` o `admin`. El primer `admin` se provisionará mediante un comando .NET de inicialización que usa ASP.NET Core Identity y variables de entorno. La cuenta inicial será `gonza@gmrodriguez.com`; la contraseña no se guarda en los archivos del proyecto.

## Dependencias funcionales

1. Resolver identidad, roles, auditoría y políticas transversales.
2. Tipos preceden a procedimientos; procedimientos son la base de procesos y trabajos.
3. Clientes y catálogo preceden a la operación completa de trabajos.
4. Procesos dependen del catálogo; su conversión crea trabajos.
5. Ejecución e historial requieren trabajo, pasos y política de versiones definida.
6. Dashboard, contadores y búsqueda dependen de los módulos que agregan.
7. El archivo global depende de los flujos de archivado/restauración implementados por entidad.

## Criterios de aceptación del plan

- Cada RF está asignado a una fase.
- El orden respeta dependencias y pone temprano las decisiones con impacto transversal.
- Se diferencian el trabajo base de cada módulo y las vistas transversales.
- Las dudas que impiden diseñar correctamente se registran como decisiones pendientes.
- Ningún requerimiento se declara aprobado o implementado por este plan.

## Riesgos y decisiones previas

- Aplicar RF-02 frente al signup público existente: solo `admin` crea cuentas y asigna uno de los dos roles; provisionar el primer `admin` mediante comando .NET/Identity usando variables de entorno (correo inicial: `gonza@gmrodriguez.com`). No insertar el usuario directamente en SQL ni registrar la contraseña en el repositorio.
- Acordar roles/permisos y qué acciones/campos cubre la auditoría RF-03.
- Especificar estados activos/abiertos y transiciones de trabajo.
- Definir cómo los trabajos conservan una versión de procedimiento y cómo impacta la edición durante ejecución.
- Acordar redondeos y significados financieros de RF-33–35.
- Definir unicidad/formato de TRB, búsquedas y permisos de restauración/borrado de versiones.
- Los requisitos incluyen datos personales de clientes. La revisión legal/compliance es necesaria según AGENTS.md, pero no está disponible `agents/legal.toml` en este repositorio; no se realizó ni se presume una revisión legal.

## Fuentes

- `docs/InterProc_Requerimientos_Funcionales.md`
- `docs/architecture.md`
- Código actual de `backend/InterProc.Api` y `frontend/interproc-web/src/app`
- `workspace/project.md`, `workspace/status.md`, `workspace/backlog.md`
