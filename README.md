# InterProc

InterProc is a Docker-first application with an Angular 22 frontend, ASP.NET Core 10 API, PostgreSQL 18, and an Nginx reverse proxy.

## Requirements

- Docker Engine or Docker Desktop with Docker Compose V2 (2.24 or later)
- OpenSSL for generating a local database password

Node.js, Angular CLI, .NET SDK, PostgreSQL, and Nginx are provided by containers and are not required on the host.

## Configure credentials

Create the Compose environment file and generate a strong random password:

```bash
cp .env.example .env
openssl rand -hex 32
```

Set the generated value as `POSTGRES_PASSWORD` in `.env`. Do not commit `.env`; credentials are read by Compose and are not stored in the repository.

## Development

Start the full development stack:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up --build
```

Open <http://localhost:8080>. Only Nginx is published to the host. It proxies `/` to Angular's live-reload server, including WebSocket connections, and `/api/` to the API. The frontend and API are available only within the Compose network. PostgreSQL data, frontend `node_modules`, backend NuGet packages, and ASP.NET Data Protection keys use Docker-managed volumes. Frontend and backend source are bind-mounted with polling enabled for Docker Desktop on macOS.

Common operations:

```bash
# Follow service logs
docker compose -f compose.yaml -f compose.dev.yaml logs -f

# Stop services without deleting volumes or PostgreSQL data
docker compose -f compose.yaml -f compose.dev.yaml down
```

### macOS hot-reload troubleshooting

- Confirm Docker Desktop is running and the repository is shared with Docker Desktop.
- Keep the Compose polling settings enabled: Angular uses `--poll 1000` and `CHOKIDAR_USEPOLLING`; .NET uses `DOTNET_USE_POLLING_FILE_WATCHER=1`.
- Check the watcher output with `docker compose -f compose.yaml -f compose.dev.yaml logs -f frontend api`. Angular reports component updates/rebuilds; .NET reports changed files and rebuilds.
- If dependencies or a watcher remain stale, restart only the affected service:

  ```bash
  docker compose -f compose.yaml -f compose.dev.yaml restart frontend
  docker compose -f compose.yaml -f compose.dev.yaml restart api
  ```

- `node_modules` and NuGet packages live in named Docker volumes, not in host folders. If a dependency manifest changes, recreate the matching dependency volume only when necessary; doing so removes its cached packages.

## Production

Build the Angular static assets, publish the API, and start the services:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f
```

Only Nginx publishes a host port (`80`). The frontend is served as static files by an Nginx container, and `/api/` is reverse-proxied to the API. PostgreSQL and the API have no published host ports. PostgreSQL data and ASP.NET Data Protection keys persist in named volumes.

Production authentication cookies are `Secure`, `HttpOnly`, and same-site. **Serve production traffic over HTTPS.** This Compose stack listens on HTTP port 80; put it behind an HTTPS-terminating reverse proxy/load balancer, do not expose the HTTP endpoint publicly, and preserve the `X-Forwarded-Proto: https` header to Nginx. The API sets secure cookies in production, so browser authentication will not work over plain HTTP. Local development uses non-secure cookies only on the localhost development endpoint.

Stop the production stack without deleting persistent data:

```bash
docker compose down
```

Do not use `docker compose down -v` unless you intend to delete the database and Data Protection keys.

## Environment configuration

Compose reads `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` from the root `.env` file. Start from `.env.example`, replace the placeholder password with a generated secret, and keep `.env` out of version control. The API receives the database connection through the internal Compose network; database credentials are not published as ports or committed to source.

PostgreSQL uses these values only when its data directory is first initialized. Editing `.env` later does not change the password of an existing database volume. Back up the data and update the database role deliberately before changing the configured credential; do not delete the volume to rotate a password.

## Database migrations and backups

The API applies pending EF Core migrations during startup using the EF migration history table. Compose waits for PostgreSQL's health check before starting the API; the API does not become healthy until migration completes. Startup migration is repeatable for migrations that have already been applied.

Before deploying a schema change, take a database backup:

```bash
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > interproc-backup.sql
```

Then build and restart the API so it applies migrations before serving requests:

```bash
docker compose up --build -d api
docker compose logs -f api
```

Deploy schema changes with a single API instance, review destructive migrations, and verify the backup before upgrading. Keep the backup securely; it contains application data.

## Testing and verification

Validate the Compose files before starting services:

```bash
docker compose -f compose.yaml -f compose.dev.yaml config --quiet
docker compose -f compose.yaml config --quiet
```

In development, verify the reverse proxy and API health:

```bash
curl -i http://localhost:8080/login
curl -i http://localhost:8080/api/health
curl -i http://localhost:8080/api/auth/setup-status
```

For an authentication smoke test, use the browser at `http://localhost:8080`: create the first account, refresh the dashboard, sign out, sign in again, and verify that a later account receives the User role. Confirm that opening `/dashboard` while signed out redirects to `/login`. A state-changing request without a CSRF token should return HTTP 400.

Verify persistence without deleting data by restarting PostgreSQL and checking the health endpoint and setup status again:

```bash
docker compose -f compose.yaml -f compose.dev.yaml restart db
curl -i http://localhost:8080/api/health
curl -i http://localhost:8080/api/auth/setup-status
```

Build both application targets using container-provided toolchains:

```bash
docker compose -f compose.yaml -f compose.dev.yaml exec frontend npm run build
docker compose -f compose.yaml -f compose.dev.yaml exec api dotnet build InterProc.Api/InterProc.Api.csproj --no-restore
docker compose build
```

The production browser smoke test must use the public HTTPS address behind the TLS-terminating proxy; verify that `/` serves the Angular app and `/api/health` is reachable through the same origin. Do not test production authentication by exposing the HTTP listener directly.

## Application

- `frontend/interproc-web` is a standalone Angular application with strict TypeScript, Router, HttpClient, and reactive forms.
- `/login`, `/signup`, and `/dashboard` integrate with the cookie-based auth API. The frontend uses the CSRF cookie/header and stores no authentication tokens in browser storage.
- The backend is a single ASP.NET Core Web API project in `backend/InterProc.Api`.
- Authenticated sessions are protected by ASP.NET Core Identity and PostgreSQL. Data Protection keys persist across container restarts.
