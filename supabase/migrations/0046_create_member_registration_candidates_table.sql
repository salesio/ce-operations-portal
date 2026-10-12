-- ============================================================================
-- Migration 0046: Create member_registration_candidates table & RLS policies
-- ============================================================================
-- Creates the member_registration_candidates table for intake & membership
-- requests initiated from the Cell Leader Portal or Church Administration.
-- Safe, additive, and idempotent.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.member_registration_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_number text UNIQUE NOT NULL,
  full_name text NOT NULL,
  first_name text,
  last_name text,
  date_of_birth date,
  primary_phone text,
  secondary_phone text,
  email text,
  neighborhood text,
  address text,
  marital_status text,
  occupation text,
  kingschat_username text,
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
  church_name text,
  cell_group_id text,
  cell_group_name text,
  cell_id text NOT NULL,
  cell_name text,
  registration_source text NOT NULL DEFAULT 'CellLeader',
  registered_by_user_id uuid,
  registered_by_name text,
  registered_by_cell_role text,
  registered_at timestamptz NOT NULL DEFAULT now(),
  membership_status text NOT NULL DEFAULT 'Candidate',
  approval_status text NOT NULL DEFAULT 'Draft',
  submitted_for_approval_by uuid,
  submitted_for_approval_at timestamptz,
  reviewed_by_user_id uuid,
  reviewed_by_name text,
  reviewed_at timestamptz,
  approval_decision text,
  correction_reason text,
  rejection_reason text,
  approved_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  approved_at timestamptz,
  possible_existing_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  duplicate_confidence text,
  data_quality_status text NOT NULL DEFAULT 'Valid',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT member_candidate_approval_status_check CHECK (
    approval_status IN ('Draft', 'ReadyForSubmission', 'Submitted', 'UnderReview', 'NeedsCorrection', 'Approved', 'Rejected', 'Withdrawn')
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_member_candidates_church_status ON public.member_registration_candidates(church_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_member_candidates_cell_status ON public.member_registration_candidates(cell_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_member_candidates_phone ON public.member_registration_candidates(primary_phone) WHERE primary_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_member_candidates_email ON public.member_registration_candidates(email) WHERE email IS NOT NULL;

-- Role permissions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT ALL ON TABLE public.member_registration_candidates TO authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    GRANT ALL ON TABLE public.member_registration_candidates TO anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE public.member_registration_candidates TO service_role;
  END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.member_registration_candidates ENABLE ROW LEVEL SECURITY;

-- Unrestricted RLS policies for authenticated & anon clients
DROP POLICY IF EXISTS member_candidates_select_all ON public.member_registration_candidates;
CREATE POLICY member_candidates_select_all ON public.member_registration_candidates 
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS member_candidates_insert_all ON public.member_registration_candidates;
CREATE POLICY member_candidates_insert_all ON public.member_registration_candidates 
  FOR INSERT TO authenticated, anon WITH CHECK (true);

DROP POLICY IF EXISTS member_candidates_update_all ON public.member_registration_candidates;
CREATE POLICY member_candidates_update_all ON public.member_registration_candidates 
  FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS member_candidates_delete_all ON public.member_registration_candidates;
CREATE POLICY member_candidates_delete_all ON public.member_registration_candidates 
  FOR DELETE TO authenticated, anon USING (true);

COMMIT;
