# Supabase Staging Dry Run Guide

This runbook prepares a controlled first validation against a real Supabase staging project. It does not authorize automatic SQL application or production changes.

> Do not use production for the first dry run. Start in staging. Never apply demo seeds to production. Back up every environment that already contains data before migrations.

## Procedure

1. Create a dedicated Supabase **staging** project and record only its non-secret identifier in the test report.
2. Copy the Project URL from Supabase settings.
3. Copy the frontend anon key. The anon key may be used in the frontend only after correct RLS has been tested.
4. Keep the service-role key in a backend-only secret store. Never place it in source code or a `VITE_*` variable.
5. Copy `.env.staging.example` to a local, ignored `.env.staging` file and replace its placeholders. Never expose `DATABASE_URL` to the frontend.
6. With human confirmation, apply `database/schema.sql` to the empty staging database.
7. Apply migrations `0002` through `0012` one at a time, following `STAGING_MIGRATION_APPLY_CHECKLIST.md` and validating after each file.
8. Optionally apply synthetic seeds in staging/demo only, after `npm run test:validate-seeds-safety`.
9. Create and verify the private buckets in `STAGING_STORAGE_BUCKET_CHECKLIST.md`.
10. Build or run with `VITE_DATA_SOURCE=supabase`; keep storage and real auth disabled until their individual checks are approved.
11. Set `REQUIRE_SUPABASE_LIVE=true` only for the intentional live session, then run the connection and schema smoke tests.
12. Execute `docs/qa/STAGING_MANUAL_QA_CHECKLIST.md` by module and role.
13. Restore `VITE_DATA_SOURCE=local` and `VITE_ENABLE_SUPABASE=false`.
14. Rebuild and confirm the local fallback remains operational.
15. Record migrations, seeds, buckets, RLS state, results and blockers in `docs/qa/STAGING_TEST_REPORT_TEMPLATE.md`.

## Safe command sequence

```powershell
npm run test:validate-seeds-safety
npm run test:migrations-readiness
npm run test:supabase-staging-connection
npm run test:supabase-live-schema
npm run test:phase-14-staging-dry-run
```

With no real env, the two live commands deliberately skip with exit code 0. SQL and bucket creation remain manual Supabase dashboard/CLI actions requiring human confirmation.
