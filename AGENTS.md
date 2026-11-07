# AGENTS.md

## Project

InterProc is a Docker-first application stack built with Angular 22, ASP.NET Core Web API .NET 10, Entity Framework Core 10, PostgreSQL 18, Nginx, and Docker Compose V2.

## Working rules

- Use English for all source code, comments, commit messages, and documentation.
- Keep the backend as a single ASP.NET Core Web API project during the initial setup.
- Do not scaffold generated Angular or .NET applications before the project structure is defined.
- Prefer simple, direct solutions over architectural abstractions or extra tooling.
- Keep the repository clean, focused, and easy to run with Docker only.
- All application runtime dependencies must be delivered through containers; local installations are not required.
- Development must use bind mounts so source files remain editable directly from the Mac host.
- Development and production environments must remain separate and clearly distinct in Docker Compose configuration.
- Nginx must always run inside Docker; do not rely on a host-installed Nginx process.
- Angular development must support live reload via a containerized dev server.
- .NET development must support hot reload through dotnet watch.

## Repository conventions

- Root-level configuration files belong in the project root.
- Keep Docker configuration under `docker/` and Compose files at the project root.
- Backend source belongs under `backend/`.
- Frontend source belongs under `frontend/`.
- Use `docs/` for architecture and operational documentation.
- Do not add unnecessary dependencies or generator tooling before the project is intentionally expanded.
- Validate changes with the smallest practical command that checks the edited behavior.

## Environment assumptions

- Docker Compose V2 is the supported orchestration tool.
- PostgreSQL runs as a containerized service and is not installed locally.
- Node.js, Angular CLI, .NET SDK, and Nginx are provided in Docker images, not on the host machine.
- The project should be easy for contributors to run with a standard Docker Compose workflow.
