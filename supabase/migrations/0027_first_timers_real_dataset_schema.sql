-- ============================================================================
-- Migration 0027 — First Timers Real Dataset Schema & Downstream Enrolment Flow
-- ============================================================================
-- Ensures all real-world fields from service intake sheets and Google Forms
-- are represented in public.first_timers and public.follow_ups.
--
-- Columns supported:
--   - first_name, last_name, full_name
--   - phone, whatsapp
--   - date_of_birth
--   - neighborhood, profession
--   - invited_by_name, invited_by_member_id
--   - born_again
--   - foundation_school_interest (quer fazer parte da escola de fundação)
--   - cell_interest (quer fazer parte de uma célula)
--   - next_service_interest (vai participar do próximo culto)
--   - church_id
--   - workflow_status, follow_up_status
--   - assigned_to_user_id, notes
-- ============================================================================

BEGIN;

-- 1. Ensure columns on public.first_timers
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS neighborhood text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS profession text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS invited_by_name text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS invited_by_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS born_again boolean DEFAULT true;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS foundation_school_interest boolean DEFAULT false;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS cell_interest boolean DEFAULT false;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS next_service_interest boolean DEFAULT true;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS counseling_interest boolean DEFAULT false;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS workflow_status text DEFAULT 'DRAFT';
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS follow_up_status text DEFAULT 'Pending';
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS first_timer_number text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL;

-- 2. Indexes for high performance querying
CREATE INDEX IF NOT EXISTS idx_first_timers_church_id ON public.first_timers(church_id);
CREATE INDEX IF NOT EXISTS idx_first_timers_phone ON public.first_timers(phone);
CREATE INDEX IF NOT EXISTS idx_first_timers_workflow ON public.first_timers(workflow_status);
CREATE INDEX IF NOT EXISTS idx_first_timers_followup_status ON public.first_timers(follow_up_status);
CREATE INDEX IF NOT EXISTS idx_first_timers_fs_interest ON public.first_timers(foundation_school_interest);
CREATE INDEX IF NOT EXISTS idx_first_timers_cell_interest ON public.first_timers(cell_interest);

-- 3. Ensure columns on public.follow_ups
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS first_timer_id uuid REFERENCES public.first_timers(id) ON DELETE SET NULL;
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL;
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS cell_id uuid REFERENCES public.cells(id) ON DELETE SET NULL;
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS cell_name text;
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS wants_foundation_school boolean DEFAULT false;
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS interested_in_cell boolean DEFAULT false;
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS wants_counseling boolean DEFAULT false;
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS became_member boolean DEFAULT false;
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending';

-- 4. Record migration in schema_meta
INSERT INTO public.schema_meta (key, value)
VALUES ('backend_phase', '27_first_timers_real_dataset_schema')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

COMMIT;
