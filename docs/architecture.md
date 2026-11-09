# InterProc architecture

## Development architecture

The development topology has four main runtime services:

```text
┌───────────────────────┐      ┌───────────────────────┐
│ Host machine          │      │ Docker runtime        │
│                       │      │                       │
│ VS Code / source      │──────▶│ Angular container      │
│ editing               │      │ live reload on bind   │
│                       │      │ mount                 │
└───────────────────────┘      └───────────┬────────────┘
                                            │
                                            │ HTTP / REST
                                            ▼
                                   ┌───────────────────────┐
                                   │ ASP.NET Core API      │
                                   │ container             │
                                   │ dotnet watch          │
                                   └───────────┬───────────┘
                                               │
                                               │ EF Core / SQL
                                               ▼
                                   ┌───────────────────────┐
                                   │ PostgreSQL 18         │
                                   │ container             │
                                   │ persistent data       │
                                   └───────────┬───────────┘
                                               │
                                               │ proxy
                                               ▼
                                   ┌───────────────────────┐
                                   │ Nginx container       │
                                   │ reverse proxy         │
                                   └───────────────────────┘
```

### Development characteristics

- Source directories are bind-mounted into the containers.
- Angular uses a dev server and watches local files for changes.
- The .NET API uses `dotnet watch` for automatic recompilation during development.
- PostgreSQL stores files in a Docker-managed volume or a local bind directory.
- Nginx remains a container service and is always controlled through Docker Compose.

## Production architecture

Production uses the same service boundaries but a different execution model.

```text
Internet
  │
  ▼
Nginx container
  ├── serves built Angular frontend assets
  └── forwards API requests to the backend API container

ASP.NET Core API container
  └── handles REST endpoints

PostgreSQL container
  └── stores application data
```

### Production characteristics

- The Angular app is built ahead of time for static delivery.
- The API runs in a production-optimized container environment.
- Compose uses a production override file to disable development-only behavior.
- Service configuration is intentionally kept separate from the development Compose stack.

## Network and volume assumptions

- The backend, frontend, and PostgreSQL services share a private Docker network.
- Nginx is placed in front of the frontend and API to provide a single entry point.
- Bind mounts are used only in development so the host machine can edit project files directly.
- Persistent database storage is isolated from the application source tree.

## Initial scope

The backend remains a single ASP.NET Core Web API project. The Angular frontend lives in `frontend/interproc-web`; development uses a Node.js container with a bind mount and a Docker-managed `node_modules` volume, while production builds static assets into an Nginx container.
