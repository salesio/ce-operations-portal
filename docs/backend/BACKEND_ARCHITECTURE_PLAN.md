# Backend Architecture Plan — CE Mozambique Dashboard

**Phase:** Backend Phase 1 — Foundation  
**Status:** Prepared (not live for domain modules)

---

## 1. Current architecture

```
Browser (static HTML + js/*)
  └── data layer (src/data → js/supabase-bundle.js)
        ├── mockProvider      (default / safe)
        ├── localStorageProvider (ce-data-layer:*)
        ├── apiProvider       (placeholder + foundation client)
        └── supabaseProvider  (placeholder + foundation client)

Dual-write bridges: CEFinance, CEPrograms, CEMedia, CEAccessControl, CEStaffHR, …
Demo login remains in dashboard.js (no real Auth yet)
```

GitHub Pages / local Vite serve **static assets only**. There is **no** browser → PostgreSQL connection.

---

## 2. Data layer & provider strategy

| `VITE_DATA_SOURCE` | Behaviour today | Future |
|--------------------|-----------------|--------|
| `mock` | In-memory seeds | Dev / CI |
| `local` | Isolated localStorage | Prototypes |
| `api` | Stub + `apiClient` | Node/Express → Postgres |
| `supabase` | Stub + public client | PostgREST + Auth + Storage |

Domain repositories (`*Repository.ts`) always go through `getDataProvider()`.  
They are **not** switched to Supabase/API until explicit pilots.

---

## 3. Why no direct PostgreSQL from the browser

- Exposes DB credentials and network surface
- No safe multi-tenant RLS boundary without an API layer
- Breaks GitHub Pages static hosting model
- Service role / connection strings must never ship as `VITE_*`

Correct paths:

1. **Supabase** — browser uses **anon key** + RLS + Auth JWT  
2. **API** — browser uses `VITE_API_BASE_URL`; server holds `DATABASE_URL`

---

## 4. Foundation packages (Phase 1)

| Area | Location |
|------|----------|
| Core SQL | `database/schema.sql`, `seed.sql`, `rls.sql`, `storage.sql` |
| Supabase CLI | `supabase/migrations/`, `seeds/`, `config.example.toml` |
| Supabase adapter | `src/data/adapters/supabase/*` |
| API adapter | `src/data/adapters/api/*` |
| Docs | `docs/backend/*` |

---

## 5. Security notes

- Only `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in frontend
- `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` = **backend-only**
- Feature flags default **false**: `VITE_ENABLE_SUPABASE`, `REAL_AUTH`, `STORAGE`, `RLS`
- Audit trail prepared via `audit_logs` table + existing soft `recordAuditLog`
- Sensitive modules (finance, counseling, salaries) require explicit permissions later

---

## 6. What Phase 1 does **not** do

- Migrate all modules to Supabase
- Replace mock/localStorage behaviour
- Enable full real auth across modules
- Deploy production DB
- Auto-wire domain repos to remote tables

---

## 7. Related docs

- [SUPABASE_SETUP_PLAN.md](./SUPABASE_SETUP_PLAN.md)
- [AUTH_RBAC_PLAN.md](./AUTH_RBAC_PLAN.md)
- [STORAGE_PLAN.md](./STORAGE_PLAN.md)
- [RLS_SECURITY_PLAN.md](./RLS_SECURITY_PLAN.md)
- [MIGRATION_ROADMAP.md](./MIGRATION_ROADMAP.md)
