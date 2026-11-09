# InterProc architecture

## Development

Run the development overlay with:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up --build
```

The host reaches the application only through Nginx at `http://localhost:8080`. Nginx proxies Angular routes and live-reload WebSockets to the Node.js 24 development server and `/api/` requests to ASP.NET Core 10. PostgreSQL and the API have no published ports. Frontend and backend source directories are bind-mounted; polling supports Docker Desktop file events. Separate Docker volumes hold frontend dependencies, backend NuGet packages, PostgreSQL data, and ASP.NET Data Protection keys.

## Production

```bash
docker compose up --build -d
```

The frontend Docker build compiles Angular into static assets served by Nginx. A separate Nginx image contains the production reverse-proxy configuration; the production stack has no source or configuration bind mounts. Nginx is the only published application service and proxies `/api/` to the ASP.NET Core API. PostgreSQL and API ports remain internal to the Compose network. Named volumes preserve database files and cookie-protection keys.

Production authentication cookies are secure. Terminate HTTPS at the public edge and forward `X-Forwarded-Proto: https`; ASP.NET Core processes the forwarded scheme before issuing cookies. Do not expose the HTTP listener publicly without TLS.

## Database initialization

The API applies EF Core migrations when its process starts. Compose health-check dependencies ensure PostgreSQL is accepting connections first. Pending migrations run before the API reports healthy; EF's migration history makes initialization repeatable across restarts. Back up the database before schema deployments and use a single API instance while applying migrations.

The host only needs Docker Engine and Docker Compose. Angular, Node.js, the .NET SDK, PostgreSQL, and Nginx are provided by containers.
