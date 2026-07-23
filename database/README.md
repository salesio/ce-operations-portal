# Database (local Docker PostgreSQL)

This folder holds **local development** SQL for the Docker Compose Postgres service.

| File | Purpose |
|------|---------|
| `schema.sql` | Placeholder tables for future church ops domains |
| `seed.sql` | Minimal sample rows for connectivity checks |
| `README.md` | This file |

## When scripts run

On **first** Postgres container start only, Docker mounts these into:

`/docker-entrypoint-initdb.d/`

Re-running `docker compose up` does **not** re-apply them if the volume already exists.

To re-initialize:

```bash
docker compose down -v
docker compose up -d
```

## Connection

| From | Connection string |
|------|-------------------|
| Host (apps, GUI tools) | `postgresql://ce_admin:ce_dev_password@localhost:5433/ce_dashboard` |
| Other Docker services | `postgresql://ce_admin:ce_dev_password@postgres:5432/ce_dashboard` |

## Relation to Supabase

- **Local Docker Postgres** → this folder (`database/`)
- **Supabase cloud schema** → `../supabase/schema.sql` + `SUPABASE_SETUP.md`

The dashboard still works with **localStorage mock data** or Supabase; wiring the app to this local Postgres is a future step.

## Planned tables

See comments at the top of `schema.sql` for the full planned list (members, first timers, foundation school, finance, cells, media, etc.).
