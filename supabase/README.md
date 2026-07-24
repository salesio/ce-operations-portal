# Supabase folder (Backend Phase 1)

Cloud-oriented SQL and CLI config for future Supabase projects.

| Path | Purpose |
|------|---------|
| `migrations/` | Versioned SQL to apply in Supabase (or local Postgres) |
| `seeds/` | Optional seed snippets for cloud/dev |
| `config.example.toml` | Example Supabase CLI config (copy → `config.toml` if using CLI) |
| `schema.sql` | Legacy / earlier finance-oriented schema (kept for reference) |
| `../database/` | Canonical **Phase 1 foundation** schema used by Docker + docs |

## Rules

- Frontend still uses `VITE_DATA_SOURCE=mock|local` by default.
- Only **anon** key in the browser (`VITE_SUPABASE_ANON_KEY`).
- **Service role** is backend-only (`SUPABASE_SERVICE_ROLE_KEY`) — never in Vite client.
- Do not enable strict RLS until Auth pilot (Phase 2).
- Prefer applying `database/schema.sql` + `database/seed.sql` (+ rls/storage notes) as the source of truth for Phase 1 tables.

## Apply foundation (Supabase SQL Editor)

1. Create project in Supabase dashboard.
2. Run `database/schema.sql`.
3. Run `database/seed.sql`.
4. Review `database/rls.sql` (commented policies).
5. Review `database/storage.sql` for bucket plan.
6. Or run migration: `supabase/migrations/20260724_backend_phase1_foundation.sql`.

## CLI (optional)

```bash
# optional — not required for app build/tests
cp supabase/config.example.toml supabase/config.toml
# supabase link / supabase db push — when project is ready
```

Missing Supabase CLI must **not** break `npm run build` or data-layer tests.
