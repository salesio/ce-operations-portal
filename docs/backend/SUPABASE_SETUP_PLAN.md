# Supabase Setup Plan — Backend Phase 1

## Goal

Prepare a Supabase project path without forcing the live dashboard onto cloud data.

## Prerequisites

- Supabase project (or local Supabase CLI — optional)
- Node.js for `npm run build` (unchanged)
- Docker Postgres optional for local SQL testing

## Environment

Copy `.env.example` → `.env`:

```env
VITE_DATA_SOURCE=local
VITE_ENABLE_SUPABASE=false
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

When ready for **client init only** (still no domain migration):

```env
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=https://YOUR_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Backend-only (never in browser)

```env
DATABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Schema apply order

1. `database/schema.sql` — core + pilot tables  
2. `database/seed.sql` — roles + default settings  
3. Review `database/rls.sql` (do not force complex policies yet)  
4. Review `database/storage.sql` (buckets when Storage phase starts)

Also see `supabase/migrations/20260724_backend_phase1_foundation.sql` and legacy `supabase/schema.sql` (older finance-oriented draft).

## Client code

| File | Role |
|------|------|
| `src/data/adapters/supabase/supabaseClient.ts` | Foundation public client |
| `src/data/adapters/supabaseProvider.ts` | Provider + `getInfo()` + generic CRUD helpers |
| `src/lib/supabaseClient.ts` | Legacy finance bridge client |

Rules:

- Init only if `VITE_ENABLE_SUPABASE=true` and URL/anon look valid
- Missing env → `null` client, **no build break**
- Never import service role

## Verify without cloud

```bash
npm run build
npm run test:backend-foundation
npm run test:data-layer-all
```

## Next / Phase 3–4 pilots

- Auth pilot (Phase 2) optional  
- **Churches + Members (Phase 3):** migration `0003` + seed `churches_members_seed.sql`  
- **First Timers + Follow-Up (Phase 4):** migration `0004` + seed `first_timers_followups_seed.sql`  
- **Finance + Public Giving + Storage (Phase 5):** migration `0005` + seed `finance_public_giving_seed.sql`  
- **Requisitions + Venue/Inventory (Phase 6):** migration `0006` + seed `requisitions_inventory_seed.sql`  
- **Staff & RH + Documents (Phase 7):** migration `0007` + seed `staff_hr_seed.sql`
- **Foundation School (Phase 8):** migration `0008` + optional seed `foundation_school_seed.sql`
- **Programs + Media (Phase 9):** migration `0009` + optional seed `programs_media_seed.sql`
- **Counseling + Sacraments (Phase 10):** migration `0010` + optional seed `counseling_sacraments_seed.sql`
- **F.E.V.O + Prison + Materials (Phase 11):** migration `0011` + optional seed `fevo_prison_materials_seed.sql`
- **Reports + Notifications + Audit (Phase 12):** migration `0012` + optional seed `reports_notifications_audit_seed.sql`
- Docs include `PROGRAMS_MEDIA_SUPABASE_PILOT.md`, `COUNSELING_SACRAMENTS_SUPABASE_PILOT.md`, and `FEVO_PRISON_MATERIALS_SUPABASE_PILOT.md` alongside earlier domain pilot guides.
