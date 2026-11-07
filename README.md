# InterProc

InterProc is a Docker-first full-stack application with a containerized Angular frontend, a single ASP.NET Core Web API backend, a PostgreSQL database, and an Nginx reverse proxy.

The repository is intentionally initialized without generated application projects so the architecture and container workflow are defined before scaffolding the actual apps.

## Stack

- Angular 22
- ASP.NET Core Web API .NET 10
- Entity Framework Core 10
- PostgreSQL 18
- Docker Compose V2
- Nginx

## Architecture overview

### Development architecture

The development environment is optimized for local editing directly on the Mac while keeping the runtime in containers.

- Angular runs in a Docker container with a bind-mounted source directory for live reload.
- The ASP.NET Core API runs in a Docker container with `dotnet watch` enabled for hot reload.
- PostgreSQL runs in its own container with a bind-mounted data volume for local persistence.
- Nginx runs inside Docker and proxies requests to the frontend and API.
- Source code directories are mounted from the host into the containers, so files can be edited locally and reflected immediately in the running services.

### Production architecture

The production environment keeps the same logical topology but uses production-oriented configuration and static serving defaults.

- Angular is built into production assets in a dedicated container stage.
- The .NET API is published as a production container image.
- PostgreSQL remains a containerized data service with persistent storage.
- Nginx serves the frontend build and proxies API traffic to the backend.
- Production uses a separate Compose profile and environment configuration from development.

## Repository layout

```text
.
├── AGENTS.md
├── README.md
├── .gitignore
├── .dockerignore
├── docker-compose.yml
├── docker-compose.override.yml
├── docker-compose.prod.yml
├── docs/
│   └── architecture.md
├── backend/
│   ├── src/
│   └── tests/
├── frontend/
│   └── src/
├── docker/
│   ├── nginx/
│   │   ├── dev/
│   │   └── prod/
│   └── postgres/
│       └── init/
└── .data/
    └── postgres/
```

## Local development workflow

Use Docker Compose V2 only. No local Node.js, Angular CLI, .NET SDK, PostgreSQL, or Nginx installation is required.

```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml up --build
```

This setup uses bind mounts so the code remains editable from the host machine while the services run inside Docker.

## Production workflow

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

The production configuration is intentionally separate from the development environment.

## Notes

- The backend remains a single API project at this stage.
- Source code and documentation are written in English.
- The project intentionally does not yet scaffold Angular or .NET app sources; that step happens after the architecture is in place.
