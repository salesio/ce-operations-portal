# Database (local Docker PostgreSQL + foundation SQL)

| File | Purpose |
|------|---------|
| `schema.sql` | Backend Phase 1 core + pilot tables |
| `seed.sql` | Dev roles, HQ church, default settings |
| `rls.sql` | RLS principles / stubs (not fully enforced yet) |
| `storage.sql` | Storage bucket plan notes |
| `README.md` | This file |

## Relation to app

- Browser uses **data layer** (`VITE_DATA_SOURCE=mock|local`) today.
- This SQL is for **local Postgres** (Docker) and future **Supabase**.
- **Never** point the browser at `DATABASE_URL` with a superuser password.

## Docker init

On first container start, scripts under `/docker-entrypoint-initdb.d/` run once.

```bash
docker compose down -v
docker compose up -d
```

## Connection (dev only)

| From | URL |
|------|-----|
| Host | `postgresql://ce_admin:ce_dev_password@localhost:5433/ce_dashboard` |
| Docker network | `postgresql://ce_admin:ce_dev_password@postgres:5432/ce_dashboard` |

## Supabase

Cloud migrations / seeds live under `../supabase/`.  
Setup guide: `../SUPABASE_SETUP.md` and `../docs/backend/SUPABASE_SETUP_PLAN.md`.
