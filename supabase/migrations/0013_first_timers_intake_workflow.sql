-- Phase 15: Pastoral Care — First Timers intake, review and explicit handoff.
-- Additive only. It does not alter migration 0004 and never creates members,
-- follow-ups, foundation enrolments or cell assignments automatically.

CREATE TABLE IF NOT EXISTS public.first_timer_intake_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code text NOT NULL UNIQUE,
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
  intake_date date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','READY_FOR_REVIEW','SUBMITTED_TO_RECTOR','NEEDS_CORRECTION','RECTOR_APPROVED','RECTOR_REJECTED','SENT_TO_FOLLOWUP','FOLLOWUP_RECEIVED','FOLLOWUP_IN_PROGRESS','COMPLETED','ARCHIVED')),
  entered_by_user_id uuid,
  submitted_at timestamptz,
  submitted_by_user_id uuid,
  rector_reviewed_at timestamptz,
  rector_reviewed_by_user_id uuid,
  review_notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS first_timer_number text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS neighborhood text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS profession text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS invited_by_name text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS invited_by_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS foundation_school_interest boolean NOT NULL DEFAULT false;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS next_service_interest boolean NOT NULL DEFAULT false;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS workflow_status text NOT NULL DEFAULT 'DRAFT';
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.first_timer_intake_batches(id) ON DELETE SET NULL;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS batch_code text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS submitted_by_user_id uuid;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS rector_reviewed_at timestamptz;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS rector_reviewed_by_user_id uuid;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS rector_review_notes text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS handoff_at timestamptz;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS handoff_to_user_id uuid;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS handoff_notes text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS follow_up_id uuid;

UPDATE public.first_timers
SET invited_by_name = COALESCE(invited_by_name, invited_by),
    foundation_school_interest = COALESCE(foundation_school_interest, foundation_interest, false),
    workflow_status = COALESCE(workflow_status, 'DRAFT')
WHERE invited_by_name IS NULL OR workflow_status IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_first_timers_number_unique
  ON public.first_timers(first_timer_number) WHERE first_timer_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_first_timers_workflow_church
  ON public.first_timers(church_id, workflow_status);
CREATE INDEX IF NOT EXISTS idx_first_timers_batch_id ON public.first_timers(batch_id);
CREATE INDEX IF NOT EXISTS idx_first_timer_batches_church_status
  ON public.first_timer_intake_batches(church_id, status);

DROP TRIGGER IF EXISTS trg_first_timer_intake_batches_updated_at ON public.first_timer_intake_batches;
CREATE TRIGGER trg_first_timer_intake_batches_updated_at
  BEFORE UPDATE ON public.first_timer_intake_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.first_timer_intake_batches IS
  'Lightweight pastoral intake batch. Review and handoff are explicit; no operational entity is auto-created.';
