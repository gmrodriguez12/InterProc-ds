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
│   ├── InterProc.Api/
│   ├── InterProc.slnx
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

## Backend project

The backend is scaffolded as a single ASP.NET Core Web API project located at `backend/InterProc.Api` and is grouped in the solution file `backend/InterProc.slnx`.

### Backend project conventions

- Target framework: `net10.0`
- API type: ASP.NET Core Web API with controllers
- Dependency injection enabled through the default ASP.NET Core service container
- Nullable reference types enabled
- EF Core 10 with the Npgsql provider configured for PostgreSQL 18.6
- OpenAPI enabled only in the Development environment
- Health endpoint: `GET /api/health` returns `200 OK`
- PostgreSQL connection is configured via environment variables and not hardcoded in source files

### Configure environment variables

Create a local `.env` file from the sample file before running the project:

```bash
cp .env.example .env
```

Then update the values in `.env` for your local environment.

### Run the backend locally

From the repository root:

```bash
export ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=interproc;Username=interproc;Password=change_me"
dotnet restore backend/InterProc.slnx
dotnet build backend/InterProc.slnx
dotnet run --project backend/InterProc.Api --urls http://localhost:5123
```

Then verify the health endpoint:

```bash
curl http://localhost:5123/api/health
```

### Apply EF Core migrations

Use the .NET CLI from the repository root:

```bash
export ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=interproc;Username=interproc;Password=change_me"
dotnet ef migrations add InitialCreate --project backend/InterProc.Api --startup-project backend/InterProc.Api --output-dir Data/Migrations
```

To apply the migrations to PostgreSQL:

```bash
dotnet ef database update --project backend/InterProc.Api --startup-project backend/InterProc.Api
```

The project intentionally does not create application entities yet, so the initial migration is a database-setup migration only.

### Development environment settings

The API uses environment-specific configuration files under `backend/InterProc.Api`:

- `appsettings.json` for shared configuration
- `appsettings.Development.json` for development-specific values
- `appsettings.Production.json` for production-specific values

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

- The backend is scaffolded as a single API project at this stage.
- Source code and documentation are written in English.
- Angular app scaffolding is still pending; the backend is already initialized and ready for further development.
