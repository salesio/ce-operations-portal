-- ============================================================================
-- Migration marker: Backend Phase 1 foundation (2026-07-24)
-- ============================================================================
-- Canonical SQL lives in:
--   database/schema.sql
--   database/seed.sql
--   database/rls.sql
--   database/storage.sql
--
-- Supabase SQL Editor: paste database/schema.sql then database/seed.sql.
-- Docker: database/*.sql is applied via docker-entrypoint-initdb.d (see compose).
--
-- This migration file documents the phase for CLI users and foundation checks.
-- It intentionally does not duplicate the full schema (single source of truth).
-- ============================================================================

-- Optional lightweight marker when applied after schema:
INSERT INTO public.schema_meta (key, value)
VALUES ('backend_phase', '1_foundation')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
