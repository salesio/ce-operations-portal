# Supabase Real Setup Guide

This guide prepares a controlled staging/production setup. It does not authorize automatic migration from this repository.

## Bootstrap

1. Create separate Supabase projects for staging and production.
2. Select the nearest compliant region and record ownership, region and project reference.
3. Store the project URL and anon credential in the frontend deployment secret store.
4. Store the elevated server credential only in a backend/admin secret store. Never expose it through Vite.
5. Generate a strong database password, store it in an approved password manager, and restrict access.
6. Enable Auth only after redirect URLs, session lifetime, email templates and account recovery are reviewed.
7. Configure Email Auth if required; use a verified sender and backend-only SMTP configuration.
8. Create the private buckets listed in `STORAGE_BUCKETS_READINESS_PLAN.md`.
9. Take an initial backup and record restore ownership.
10. For a new project, apply canonical `database/schema.sql`, then the Phase 1 marker and migrations `0002`–`0012` in `MIGRATION_EXECUTION_PLAN.md` order, first in staging.
11. Apply optional synthetic seeds only in staging/demo after review.
12. Enable and test production RLS from `RLS_PRODUCTION_READINESS_PLAN.md`.
13. Configure local `.env.local`, run the full test matrix, then test `VITE_DATA_SOURCE=supabase`.
14. Verify every role/church scope, private download and denied sensitive access.
15. Take a post-bootstrap backup and record the migration versions.
16. Approve the documented rollback and incident plan before production traffic.

## Values that may go to the frontend

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ENABLE_SUPABASE`
- `VITE_ENABLE_STORAGE`
- `VITE_DATA_SOURCE`
- `VITE_API_BASE_URL` for a future public API base URL

The anon credential is public by design but still depends on correct RLS. Do not print it in logs or documentation examples with real values.

## Values that must never go to the frontend

- Database connection strings/passwords
- Supabase elevated server credential
- JWT signing secrets
- SMTP credentials
- API/private keys or service credentials
- S3 secret access credentials

Never prefix backend-only values with `VITE_`. The browser must not connect directly to PostgreSQL.

## Acceptance

Run `npm run test:production-readiness`, `npm run test:data-source-readiness`, `npm run test:validate-seeds-safety`, the complete `TEST_MATRIX.md`, and the manual QA checklist before promotion.
