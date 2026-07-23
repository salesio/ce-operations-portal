# Docker setup — CE Mozambique Operations Dashboard

Development-only Docker support. The existing **npm** workflow is unchanged and remains the default for day-to-day work.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) for Windows (WSL 2 backend recommended)
- Docker Compose v2+ (`docker compose version`)

## Quick start (Docker)

```bash
# From the project root
cp .env.example .env

# Start frontend + Postgres + pgAdmin
docker compose up -d

# Follow logs
docker compose logs -f

# Stop (keep data)
docker compose down

# Stop and wipe Postgres volume
docker compose down -v
```

Or via npm scripts:

```bash
npm run docker:up
npm run docker:logs
npm run docker:down
npm run docker:reset
```

## Access URLs

| Service | URL / host |
|---------|------------|
| **Frontend (dashboard)** | http://localhost:5173 |
| **PostgreSQL (host)** | `localhost:5433` |
| **PostgreSQL (Docker network)** | `postgres:5432` |
| **pgAdmin** | http://localhost:5050 |

> **Port note:** Host Postgres is published on **5433** (not 5432) so it can run next to other local databases (for example VONANA on 5432). Inside Compose, the service still listens on 5432.

### Demo dashboard login (unchanged app behaviour)

- Email: `admin@ce-mozambique.org`
- Password: `demo`

### Postgres credentials (dev only)

- Database: `ce_dashboard`
- User: `ce_admin`
- Password: `ce_dev_password`

### pgAdmin login

- Email: `admin@example.com`
- Password: `admin123`

In pgAdmin, add a server:

- Host: `postgres` (from inside Docker) or `host.docker.internal` / `localhost` depending on network
- From the pgAdmin container, host is usually **`postgres`**
- Port: `5432`
- User / password / db: as above

## Without Docker (normal npm workflow)

The static dashboard does not require Postgres to open in the browser.

```bash
npm install

# Serve the dashboard (Vite static server)
npm run dev
# → http://localhost:5173

# Rebuild Supabase client bundle into js/supabase-bundle.js
npm run build
# same as: npm run build:supabase

# Watch rebuild of Supabase bundle
npm run dev:supabase
```

Optional: run **only** Postgres with Docker while developing the UI on the host:

```bash
docker compose up -d postgres
# Connect from host with DATABASE_URL in .env
```

## Environment variables

Copy `.env.example` → `.env`:

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Optional Supabase cloud backend |
| `DATABASE_URL` | Host → local Postgres (`localhost:5432`) |
| `DATABASE_URL_DOCKER` | Container → Postgres service (`postgres:5432`) |
| `POSTGRES_*` | Official Postgres image bootstrap |

The dashboard **does not yet** read `DATABASE_URL` for app features (still localStorage / Supabase). Postgres is provisioned for upcoming data work and VPS prep.

## Project layout (Docker-related)

```
Dockerfile
docker-compose.yml
.dockerignore
.env.example
DOCKER_SETUP.md
database/
  schema.sql
  seed.sql
  README.md
```

## Windows notes

- Use Docker Desktop with the WSL 2 engine.
- Source is bind-mounted; `node_modules` uses a named volume so Linux packages are not replaced by the Windows host folder.
- Host Postgres uses **5433** by default so it does not fight with other projects on 5432. Change the left side of `"5433:5432"` in `docker-compose.yml` if needed.
- First `docker compose up` builds the frontend image and may take a few minutes.

## Reset database

```bash
docker compose down -v
docker compose up -d
```

Schema and seed re-apply only on a **fresh** volume.

## Production / VPS

Not covered here. This stack is for **local development** only. Ubuntu VPS deployment can reuse the same `Dockerfile` / Compose ideas later without changing the current static GitHub Pages flow.
