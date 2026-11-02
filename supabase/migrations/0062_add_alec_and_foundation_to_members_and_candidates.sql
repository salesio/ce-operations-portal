-- ============================================================================
-- Migration 0062: Add alec_status, foundation_status, baptized columns to
-- public.members and public.member_registration_candidates
-- ============================================================================
-- Ensures ALEC, Foundation School, and Baptism spiritual milestones are natively
-- stored on members and registration candidates.
-- Safe, additive, and idempotent.
-- ============================================================================

BEGIN;

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS foundation_status text,
  ADD COLUMN IF NOT EXISTS alec_status text,
  ADD COLUMN IF NOT EXISTS baptized boolean DEFAULT false;

ALTER TABLE public.member_registration_candidates
  ADD COLUMN IF NOT EXISTS foundation_status text,
  ADD COLUMN IF NOT EXISTS legacy_foundation_status text,
  ADD COLUMN IF NOT EXISTS alec_status text,
  ADD COLUMN IF NOT EXISTS legacy_alec_status text,
  ADD COLUMN IF NOT EXISTS baptized boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_baptized boolean DEFAULT false;

-- Create index for faster querying by spiritual milestones
CREATE INDEX IF NOT EXISTS idx_members_alec_status ON public.members (alec_status);
CREATE INDEX IF NOT EXISTS idx_members_foundation_status ON public.members (foundation_status);
CREATE INDEX IF NOT EXISTS idx_member_candidates_alec_status ON public.member_registration_candidates (alec_status);

COMMIT;
