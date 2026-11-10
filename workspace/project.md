
# InterProc — Project Overview

## Project Name

InterProc

## Business Objective

To be defined as functional requirements
are introduced.

## Technology Stack

- Frontend: Angular 22
- Backend: ASP.NET Core .NET 10
- Database: PostgreSQL 18
- ORM: Entity Framework Core
- Infrastructure: Docker Compose
- Reverse Proxy: Nginx inside Docker

## Development Environment

All application services run using Docker.

Development requirements:
- Angular automatic reload
- ASP.NET Core dotnet watch
- PostgreSQL persistent storage
- Nginx reverse proxy

## Authentication

Initial requirements:
- Authentication using ASP.NET Core Identity.
- Login with username or email and password.
- No public signup; administrators create internal accounts.
- The initial administrator is provisioned by an idempotent .NET/Identity command.
- New accounts use a temporary password that must be changed at first login.
- Accounts can be activated and deactivated; email approval is not required.

## Architecture

Inspect the repository to identify:
- Current solution structure
- Backend projects
- Angular application structure
- Database configuration
- Docker services and networking

Do not assume a component is implemented
until verified in the source code.

## Engineering Constraints

- Preserve the existing Docker-based workflow.
- Avoid introducing host-level service dependencies.
- Follow established project conventions.
- Prioritize maintainability and security.
- Document significant architectural decisions.
```

Este documento establece el contexto inicial. **No significa que todas esas funcionalidades ya estén implementadas**: Codex deberá comprobarlo en el repositorio.

## Paso 7. Revisar el `AGENTS.md` instalado

Este paso es especialmente importante porque recientemente evolucionamos DevHarness hacia un modelo donde **Codex principal coordina y también implementa**.

Abrí:

```bash
nano AGENTS.md
```

Comprobá que incluya el nuevo `Development Workflow`:

```markdown
## Development Workflow

For complex features:

1. Register the development request.
2. Delegate functional and technical analysis.
3. Consolidate an implementation plan.
4. Request explicit user approval.
5. Implement the approved plan using the main Codex agent.
6. Execute relevant tests.
7. Document implementation and results.
8. Update task status and project documentation.

Do not implement complex features before
the user approves the plan.

For small, low-risk changes, the Coordinator
may implement directly unless the user
requests analysis first.

Never deploy, push changes, or modify
production environments without
explicit authorization.
```

También verificá que ya no esté esta restricción antigua:

```text
Stage 1 is analysis-only.
Do not implement application code.
```

Si todavía aparece, la plantilla central está desactualizada y conviene actualizarla antes de seguir.

## Paso 8. Verificar los agentes y skills compartidos

No vamos a reinstalarlos. Solamente comprobaremos que Codex puede acceder a ellos.

Ejecutá:

```bash
test -f ~/.codex/agents/analyst.toml \
  && echo "Analyst OK" \
  || echo "Analyst NO encontrado"

test -f ~/.codex/agents/architect.toml \
  && echo "Architect OK" \
  || echo "Architect NO encontrado"

test -f ~/.agents/skills/dev-task/SKILL.md \
  && echo "dev-task OK" \
  || echo "dev-task NO encontrado"
```

Deberías obtener:

```text
Analyst OK
Architect OK
dev-task OK
```

Si ya creaste el nuevo skill `dev-implement`, comprobalo también:

```bash
test -f ~/.agents/skills/dev-implement/SKILL.md \
  && echo "dev-implement OK" \
  || echo "dev-implement pendiente"
```

Si aparece `dev-implement pendiente`, no es un error de instalación: ese skill todavía está por crearse.

## Paso 9. Inicializar el estado del workspace

Abrí:

```bash
nano workspace/status.md
```

Contenido inicial recomendado:

```markdown
# InterProc — Project Status

## Current Phase

Development

## Active Tasks

None registered in DevHarness.

## Pending Approvals

None.

## Environment

Docker-based development environment.

Existing services and their working state
must be verified against the repository.

## Next Steps

1. Verify existing implementation.
2. Register the first development feature.
3. Analyze and plan implementation.
```

No hace falta modificar `backlog.md` si ya contiene su estructura inicial.

## Paso 10. Primera prueba con Codex

Desde la raíz de InterProc:

```bash
cd /Users/grodriguez/Documents/Proyectos/InterProc-ds

codex
```

Para comprobar primero que el coordinador reconoce el contexto, utilizá este prompt:

<box border radius="lg" padding={3} gap={2}>
  <text color="secondary" weight="medium" size="xs">PROMPT DE VERIFICACIÓN</text>
  <text size="sm">Verificá que DevHarness esté correctamente configurado en InterProc.

    1. Leé AGENTS.md y los archivos principales del workspace.
    2. Identificá los agentes Analyst y Architect disponibles.
    3. Verificá que el skill dev-task esté disponible.
    4. Inspeccioná brevemente la estructura existente de Angular, .NET, PostgreSQL y Docker.
    5. Informame qué componentes están implementados y cuáles no podés confirmar.

    No modifiques código ni documentación.

    Respondé de forma muy concisa.
  </text>
  <row justify="end">
    <button size="sm" color="secondary" variant="outline" onClick={()=>GenUI.copy("Verificá que DevHarness esté correctamente configurado en InterProc.\n\n1. Leé AGENTS.md y los archivos principales del workspace.\n2. Identificá los agentes Analyst y Architect disponibles.\n3. Verificá que el skill dev-task esté disponible.\n4. Inspeccioná brevemente la estructura existente de Angular, .NET, PostgreSQL y Docker.\n5. Informame qué componentes están implementados y cuáles no podés confirmar.\n\nNo modifiques código ni documentación.\nRespondé de forma muy concisa.")}>
      <icon name="copy" inline/> Copiar prompt
    </button>
  </row>
</box>

En esta prueba todavía no le estamos solicitando una feature. Solo queremos comprobar que reconoce las instrucciones y el estado real del proyecto.

## Paso 11. Versionar la instalación

Antes de registrar la primera tarea, verificá exactamente qué archivos cambiaron:

```bash
git status --short
```

Si solamente agregaste la configuración de DevHarness:

```bash
git add AGENTS.md workspace/
git commit -m "chore: initialize DevHarness workspace"
```

Este commit dejará una referencia clara del momento en el que incorporaste DevHarness a InterProc. No sube los cambios al repositorio remoto.

---

## Resultado esperado

<box border radius="xl" padding={3} gap={2}>
  <row align="center" gap={2}>
    <icon name="folder-check" color="success"/>
    **InterProc + DevHarness**
  </row>
  <divider color="subtle"/>
  <table>
    <table-row><table-cell>Coordinator</table-cell><table-cell>Codex principal</table-cell></table-row>
    <table-row><table-cell>Analyst</table-cell><table-cell>Compartido globalmente</table-cell></table-row>
    <table-row><table-cell>Architect</table-cell><table-cell>Compartido globalmente</table-cell></table-row>
    <table-row><table-cell>Skill `dev-task`</table-cell><table-cell>Compartido globalmente</table-cell></table-row>
    <table-row><table-cell>Workspace</table-cell><table-cell>Exclusivo de InterProc</table-cell></table-row>
    <table-row><table-cell>Activación</table-cell><table-cell>Solo en InterProc</table-cell></table-row>
  </table>
</box>

## Paso 12. Primera feature de InterProc

Una vez validada la instalación, mi recomendación es comenzar con una feature que puedas implementar y probar completamente en Docker.

Por ejemplo, podés continuar con la autenticación de InterProc, aprovechando lo que ya tengas implementado de EF Core e Identity.

El primer pedido al coordinador podría ser:

> `$dev-task` Analizá el estado actual de la autenticación de InterProc y proponé las tareas necesarias para completar login, signup y protección de rutas. Investigá qué está implementado y qué falta, delegando a Analyst y Architect. Registrá la tarea y presentame un plan para aprobación. No modifiques código todavía.

Cuando apruebes el plan, Codex principal podrá desarrollar siguiendo el nuevo workflow. Para estandarizar ese segundo tramo todavía tendremos que crear `dev-implement`.

**Mi recomendación es no hacer más cambios al harness hasta ejecutar esta primera prueba de reconocimiento.** Así podremos comprobar que la instalación funciona correctamente antes de evaluar el ciclo completo de desarrollo.
