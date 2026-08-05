# Supabase Apply Commands

Always back up first, apply in staging, review every SQL file and keep an execution log. Demo seeds require separate approval and must not be applied to real production without review.

## Option A — Dashboard SQL Editor

Open the staging project's SQL Editor. For a new project, apply `database/schema.sql` before the historical Phase 1 marker, then paste one migration at a time in `MIGRATION_EXECUTION_PLAN.md` order. Inspect errors and verify expected tables/indexes. Apply an optional corresponding seed only after migration verification.

## Option B — Supabase CLI

Install the official CLI using its current official instructions, authenticate locally, link the correct staging project, inspect migration status and use the appropriate database push workflow. Confirm the linked project reference before every command. Production use requires backup, change approval and a tested restore path.

## Option C — Manual psql

Advanced operators may apply reviewed files with `psql` from a secured administration host. Read the connection string from a protected environment/secret manager and never paste, log, commit or expose it to the browser. Use transaction behavior appropriate to each migration and retain sanitized execution logs.

No automatic destructive rollback command is provided.
