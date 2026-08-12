-- Members master data + HQ legacy import readiness. Additive only; no import runs here.
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS member_number text,
  ADD COLUMN IF NOT EXISTS primary_phone text,
  ADD COLUMN IF NOT EXISTS secondary_phone text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS kingschat_username text,
  ADD COLUMN IF NOT EXISTS membership_status text,
  ADD COLUMN IF NOT EXISTS cell_role text,
  ADD COLUMN IF NOT EXISTS cell_participation_status text,
  ADD COLUMN IF NOT EXISTS service_participation_status text,
  ADD COLUMN IF NOT EXISTS legacy_foundation_status text,
  ADD COLUMN IF NOT EXISTS legacy_foundation_raw_value text,
  ADD COLUMN IF NOT EXISTS legacy_alec_status text,
  ADD COLUMN IF NOT EXISTS legacy_alec_raw_value text,
  ADD COLUMN IF NOT EXISTS legacy_baptism_status text,
  ADD COLUMN IF NOT EXISTS legacy_baptism_raw_value text,
  ADD COLUMN IF NOT EXISTS legacy_partner_status text,
  ADD COLUMN IF NOT EXISTS legacy_partnership_arms jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS foundation_student_id uuid,
  ADD COLUMN IF NOT EXISTS baptism_id uuid,
  ADD COLUMN IF NOT EXISTS active_cell_assignment_id uuid,
  ADD COLUMN IF NOT EXISTS legacy_source text,
  ADD COLUMN IF NOT EXISTS legacy_source_sheet text,
  ADD COLUMN IF NOT EXISTS legacy_source_row integer,
  ADD COLUMN IF NOT EXISTS legacy_import_batch_id uuid,
  ADD COLUMN IF NOT EXISTS data_quality_status text,
  ADD COLUMN IF NOT EXISTS reconciliation_status text,
  ADD COLUMN IF NOT EXISTS member_since_year integer,
  ADD COLUMN IF NOT EXISTS member_since_raw text,
  ADD COLUMN IF NOT EXISTS member_since_precision text;

-- Approved import policy: a member may be created without a phone number.
-- Migration 0015 is unapplied staging readiness work; historical migrations stay unchanged.
ALTER TABLE public.members ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.members ALTER COLUMN primary_phone DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.member_legacy_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), batch_number text UNIQUE NOT NULL,
  source_file_name text NOT NULL, source_type text NOT NULL DEFAULT 'XLSX',
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text,
  total_sheets integer NOT NULL DEFAULT 0, total_rows_scanned integer NOT NULL DEFAULT 0,
  member_rows_detected integer NOT NULL DEFAULT 0, valid_members integer NOT NULL DEFAULT 0,
  invalid_rows integer NOT NULL DEFAULT 0, possible_duplicates integer NOT NULL DEFAULT 0,
  likely_duplicates integer NOT NULL DEFAULT 0, matched_groups integer NOT NULL DEFAULT 0,
  unmatched_groups integer NOT NULL DEFAULT 0, matched_cells integer NOT NULL DEFAULT 0,
  unmatched_cells integer NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'DryRunReady',
  dry_run_report jsonb NOT NULL DEFAULT '{}'::jsonb, mapping_version text NOT NULL,
  created_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.member_legacy_import_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), batch_id uuid NOT NULL REFERENCES public.member_legacy_import_batches(id) ON DELETE CASCADE,
  sheet_name text NOT NULL, source_row_number integer NOT NULL, raw_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  normalized_values jsonb NOT NULL DEFAULT '{}'::jsonb, proposed_member jsonb NOT NULL DEFAULT '{}'::jsonb,
  proposed_church_id uuid, proposed_cell_group_id text, proposed_cell_id text,
  duplicate_candidate_member_id uuid, duplicate_confidence text, group_match_status text, cell_match_status text,
  validation_status text NOT NULL, warnings jsonb NOT NULL DEFAULT '[]'::jsonb, errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  decision text NOT NULL DEFAULT 'Pending', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_members_legacy_import_batch ON public.members(legacy_import_batch_id);
CREATE INDEX IF NOT EXISTS idx_member_legacy_rows_batch ON public.member_legacy_import_rows(batch_id);
COMMENT ON TABLE public.member_legacy_import_batches IS 'Dry-run staging only. This migration never imports members.';

-- Candidate registration workflow. A row here is not a member record and never
-- creates finance, sacraments, Foundation School or cell-report records by itself.
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
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE RESTRICT,
  church_name text,
  cell_group_id text,
  cell_group_name text,
  cell_id text NOT NULL,
  cell_name text,
  registration_source text NOT NULL,
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
  CONSTRAINT member_candidate_approval_status_check CHECK (approval_status IN ('Draft', 'ReadyForSubmission', 'Submitted', 'UnderReview', 'NeedsCorrection', 'Approved', 'Rejected', 'Withdrawn'))
);
CREATE INDEX IF NOT EXISTS idx_member_candidates_church_status ON public.member_registration_candidates(church_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_member_candidates_cell_status ON public.member_registration_candidates(cell_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_member_candidates_phone ON public.member_registration_candidates(primary_phone) WHERE primary_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_member_candidates_email ON public.member_registration_candidates(email) WHERE email IS NOT NULL;
COMMENT ON TABLE public.member_registration_candidates IS 'Controlled membership requests. Only explicit review may create or link an official member.';
