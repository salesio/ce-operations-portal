# Production Readiness Plan

Phase 12 exposes a sanitized readiness summary in Settings. It deliberately does not expose environment values.

## Current checks

- Data source and enabled provider flags
- Pilot-ready modules and modules remaining local/mock
- Auth configuration state and RLS status
- Private Storage planning
- Hardened audit and in-app notification availability
- Last data-source health check
- Browser has no elevated server credential and no direct PostgreSQL connection
- Explicit warning while backups are not configured

## Gates before production

1. Apply and review migrations in staging.
2. Enable least-privilege RLS and test every role/church scope.
3. Use a trusted API/Edge Function for exports and privileged aggregation.
4. Configure private buckets, signed URLs, file scanning and retention.
5. Configure encrypted backups and perform restore drills.
6. Add monitoring, alerting, audit retention and incident ownership.
7. Validate Auth lifecycle, disabled users, permission changes and session expiry.
8. Run the full regression matrix and manual provider-switching tests.

Health records may contain status, latency, boolean flags and sanitized messages only. Sensitive configuration values are hidden for security.

Phase 13 expands this plan through `SUPABASE_REAL_SETUP_GUIDE.md`, `MIGRATION_EXECUTION_PLAN.md`, `RLS_PRODUCTION_READINESS_PLAN.md`, `STORAGE_BUCKETS_READINESS_PLAN.md`, `BACKUP_ROLLBACK_PLAN.md`, `DEPLOYMENT_PLAN.md`, and the executable readiness scripts in `scripts/`.

## Phase 14 — staging dry-run gate

Before production readiness can advance, complete `SUPABASE_STAGING_DRY_RUN_GUIDE.md`, the migration/seed/storage/RLS checklists, and `docs/qa/STAGING_MANUAL_QA_CHECKLIST.md` in a dedicated staging project. Record the outcome using the staging report template. Live scripts use only the anon client, skip when unconfigured, and must never receive backend secrets. A passed staging dry run is evidence for more testing, not an automatic production approval.
