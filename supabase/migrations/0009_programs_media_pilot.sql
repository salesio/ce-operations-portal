-- Backend Phase 9 - Programs + Media Supabase/API pilot
-- Additive only. Browser clients use anon key + future RLS; never service credentials.

CREATE TABLE IF NOT EXISTS public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_code text UNIQUE,
  name text NOT NULL,
  description text,
  program_type text,
  category text,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  church_name text,
  main_church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  main_church_name text,
  start_date date,
  end_date date,
  start_time text,
  end_time text,
  venue_space_id uuid REFERENCES public.venue_spaces (id) ON DELETE SET NULL,
  venue_space_name text,
  location text,
  status text NOT NULL DEFAULT 'Planned',
  responsible_staff_id uuid REFERENCES public.staff_members (id) ON DELETE SET NULL,
  responsible_name text,
  department_id text,
  department_name text,
  expected_attendance integer NOT NULL DEFAULT 0 CHECK (expected_attendance >= 0),
  actual_attendance integer NOT NULL DEFAULT 0 CHECK (actual_attendance >= 0),
  requires_registration boolean NOT NULL DEFAULT false,
  requires_media boolean NOT NULL DEFAULT false,
  requires_budget boolean NOT NULL DEFAULT false,
  requires_resources boolean NOT NULL DEFAULT false,
  requires_checklist boolean NOT NULL DEFAULT true,
  budget_status text NOT NULL DEFAULT 'Not Required',
  media_status text NOT NULL DEFAULT 'Not Required',
  requisition_status text NOT NULL DEFAULT 'Not Required',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{"automatic_finance_record":false}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.programs (id) ON DELETE CASCADE,
  session_title text NOT NULL,
  description text,
  session_date date,
  start_time text,
  end_time text,
  speaker_name text,
  speaker_staff_id uuid REFERENCES public.staff_members (id) ON DELETE SET NULL,
  venue_space_id uuid REFERENCES public.venue_spaces (id) ON DELETE SET NULL,
  venue_space_name text,
  location text,
  expected_attendance integer NOT NULL DEFAULT 0,
  actual_attendance integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Planned',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.programs (id) ON DELETE CASCADE,
  team_name text NOT NULL,
  team_type text,
  leader_staff_id uuid REFERENCES public.staff_members (id) ON DELETE SET NULL,
  leader_name text,
  member_staff_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  member_names jsonb NOT NULL DEFAULT '[]'::jsonb,
  responsibilities text,
  status text NOT NULL DEFAULT 'Active',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.programs (id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.program_sessions (id) ON DELETE SET NULL,
  participant_type text,
  member_id uuid REFERENCES public.members (id) ON DELETE SET NULL,
  first_timer_id uuid REFERENCES public.first_timers (id) ON DELETE SET NULL,
  staff_id uuid REFERENCES public.staff_members (id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  email text,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  church_name text,
  attendance_status text NOT NULL DEFAULT 'Registered',
  checked_in_at timestamptz,
  checked_in_by uuid,
  checked_in_by_name text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.programs (id) ON DELETE CASCADE,
  registration_number text UNIQUE,
  full_name text NOT NULL,
  phone text,
  email text,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  church_name text,
  member_id uuid REFERENCES public.members (id) ON DELETE SET NULL,
  first_timer_id uuid REFERENCES public.first_timers (id) ON DELETE SET NULL,
  registration_source text NOT NULL DEFAULT 'Manual Entry',
  status text NOT NULL DEFAULT 'Pending',
  payment_required boolean NOT NULL DEFAULT false,
  payment_status text NOT NULL DEFAULT 'Not Required',
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MZN',
  finance_record_id uuid REFERENCES public.finance_records (id) ON DELETE SET NULL,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{"finance_record_created":false}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.programs (id) ON DELETE CASCADE,
  resource_type text,
  resource_name text NOT NULL,
  description text,
  quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'unit',
  inventory_item_id uuid REFERENCES public.inventory_items (id) ON DELETE SET NULL,
  venue_space_id uuid REFERENCES public.venue_spaces (id) ON DELETE SET NULL,
  requisition_id uuid REFERENCES public.requisitions (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'Requested',
  assigned_to_staff_id uuid REFERENCES public.staff_members (id) ON DELETE SET NULL,
  assigned_to_name text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{"inventory_movement_created":false}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.programs (id) ON DELETE CASCADE,
  budget_item text NOT NULL,
  category text,
  description text,
  estimated_amount numeric(12,2) NOT NULL DEFAULT 0,
  approved_amount numeric(12,2) NOT NULL DEFAULT 0,
  spent_amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MZN',
  finance_record_id uuid REFERENCES public.finance_records (id) ON DELETE SET NULL,
  finance_disbursement_id uuid REFERENCES public.finance_disbursements (id) ON DELETE SET NULL,
  requisition_id uuid REFERENCES public.requisitions (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'Planned',
  approved_by uuid,
  approved_by_name text,
  approved_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{"planning_only":true,"expense_created":false}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.programs (id) ON DELETE CASCADE,
  checklist_type text,
  title text NOT NULL,
  description text,
  assigned_to_staff_id uuid REFERENCES public.staff_members (id) ON DELETE SET NULL,
  assigned_to_name text,
  due_date date,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  completed_by uuid,
  completed_by_name text,
  status text NOT NULL DEFAULT 'Open',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.programs (id) ON DELETE CASCADE,
  report_title text,
  report_type text,
  summary text,
  attendance_total integer NOT NULL DEFAULT 0,
  first_timers_total integer NOT NULL DEFAULT 0,
  new_converts_total integer NOT NULL DEFAULT 0,
  testimonies_count integer NOT NULL DEFAULT 0,
  financial_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  media_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  follow_up_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  document_id uuid REFERENCES public.documents (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'Draft',
  submitted_by uuid,
  submitted_by_name text,
  submitted_at timestamptz,
  approved_by uuid,
  approved_by_name text,
  approved_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{"finance_records_modified":false}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  category text,
  requires_equipment boolean NOT NULL DEFAULT false,
  requires_training boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff_members (id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  email text,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  church_name text,
  media_role_id uuid REFERENCES public.media_roles (id) ON DELETE SET NULL,
  media_role_name text,
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  can_operate_camera boolean NOT NULL DEFAULT false,
  can_operate_sound boolean NOT NULL DEFAULT false,
  can_operate_streaming boolean NOT NULL DEFAULT false,
  can_edit_video boolean NOT NULL DEFAULT false,
  can_design_graphics boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Active',
  assigned_equipment_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{"inventory_movement_created":false}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code text UNIQUE,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  church_name text,
  program_id uuid REFERENCES public.programs (id) ON DELETE SET NULL,
  service_name text NOT NULL,
  service_type text,
  service_date date,
  start_time text,
  end_time text,
  venue_space_id uuid REFERENCES public.venue_spaces (id) ON DELETE SET NULL,
  venue_space_name text,
  requires_streaming boolean NOT NULL DEFAULT false,
  requires_recording boolean NOT NULL DEFAULT false,
  requires_photography boolean NOT NULL DEFAULT false,
  requires_projection boolean NOT NULL DEFAULT false,
  requires_sound boolean NOT NULL DEFAULT true,
  requires_graphics boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Planned',
  media_lead_id uuid REFERENCES public.media_team_members (id) ON DELETE SET NULL,
  media_lead_name text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{"heavy_livestream_managed":false,"finance_record_created":false}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_service_id uuid REFERENCES public.media_services (id) ON DELETE CASCADE,
  team_member_id uuid REFERENCES public.media_team_members (id) ON DELETE SET NULL,
  staff_id uuid REFERENCES public.staff_members (id) ON DELETE SET NULL,
  role_name text,
  assignment_title text,
  start_time text,
  end_time text,
  status text NOT NULL DEFAULT 'Assigned',
  confirmed boolean NOT NULL DEFAULT false,
  confirmed_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_name text NOT NULL,
  platform text,
  url text,
  public_handle text,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  church_name text,
  is_active boolean NOT NULL DEFAULT true,
  streaming_enabled boolean NOT NULL DEFAULT false,
  last_used_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{"public_metadata_only":true}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_performance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_service_id uuid REFERENCES public.media_services (id) ON DELETE SET NULL,
  team_member_id uuid REFERENCES public.media_team_members (id) ON DELETE SET NULL,
  staff_id uuid REFERENCES public.staff_members (id) ON DELETE SET NULL,
  service_date date,
  role_name text,
  punctuality_score numeric(5,2) NOT NULL DEFAULT 0,
  technical_score numeric(5,2) NOT NULL DEFAULT 0,
  teamwork_score numeric(5,2) NOT NULL DEFAULT 0,
  communication_score numeric(5,2) NOT NULL DEFAULT 0,
  overall_score numeric(5,2) NOT NULL DEFAULT 0,
  reviewed_by uuid,
  reviewed_by_name text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid REFERENCES public.media_team_members (id) ON DELETE SET NULL,
  staff_id uuid REFERENCES public.staff_members (id) ON DELETE SET NULL,
  award_title text NOT NULL,
  award_description text,
  award_date date,
  awarded_by uuid,
  awarded_by_name text,
  status text NOT NULL DEFAULT 'Awarded',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_programs_church_id ON public.programs (church_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON public.programs (status);
CREATE INDEX IF NOT EXISTS idx_programs_type ON public.programs (program_type);
CREATE INDEX IF NOT EXISTS idx_programs_start_date ON public.programs (start_date);
CREATE INDEX IF NOT EXISTS idx_programs_responsible_staff_id ON public.programs (responsible_staff_id);
CREATE INDEX IF NOT EXISTS idx_programs_requires_media ON public.programs (requires_media);
CREATE INDEX IF NOT EXISTS idx_program_sessions_program_id ON public.program_sessions (program_id);
CREATE INDEX IF NOT EXISTS idx_program_sessions_date ON public.program_sessions (session_date);
CREATE INDEX IF NOT EXISTS idx_program_sessions_status ON public.program_sessions (status);
CREATE INDEX IF NOT EXISTS idx_program_teams_program_id ON public.program_teams (program_id);
CREATE INDEX IF NOT EXISTS idx_program_teams_leader_staff_id ON public.program_teams (leader_staff_id);
CREATE INDEX IF NOT EXISTS idx_program_teams_type ON public.program_teams (team_type);
CREATE INDEX IF NOT EXISTS idx_program_teams_status ON public.program_teams (status);
CREATE INDEX IF NOT EXISTS idx_program_participants_program_id ON public.program_participants (program_id);
CREATE INDEX IF NOT EXISTS idx_program_participants_session_id ON public.program_participants (session_id);
CREATE INDEX IF NOT EXISTS idx_program_participants_member_id ON public.program_participants (member_id);
CREATE INDEX IF NOT EXISTS idx_program_participants_first_timer_id ON public.program_participants (first_timer_id);
CREATE INDEX IF NOT EXISTS idx_program_participants_staff_id ON public.program_participants (staff_id);
CREATE INDEX IF NOT EXISTS idx_program_participants_attendance_status ON public.program_participants (attendance_status);
CREATE INDEX IF NOT EXISTS idx_program_registrations_program_id ON public.program_registrations (program_id);
CREATE INDEX IF NOT EXISTS idx_program_registrations_status ON public.program_registrations (status);
CREATE INDEX IF NOT EXISTS idx_program_registrations_member_id ON public.program_registrations (member_id);
CREATE INDEX IF NOT EXISTS idx_program_registrations_first_timer_id ON public.program_registrations (first_timer_id);
CREATE INDEX IF NOT EXISTS idx_program_registrations_payment_status ON public.program_registrations (payment_status);
CREATE INDEX IF NOT EXISTS idx_program_resources_program_id ON public.program_resources (program_id);
CREATE INDEX IF NOT EXISTS idx_program_resources_inventory_item_id ON public.program_resources (inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_program_resources_requisition_id ON public.program_resources (requisition_id);
CREATE INDEX IF NOT EXISTS idx_program_resources_status ON public.program_resources (status);
CREATE INDEX IF NOT EXISTS idx_program_budgets_program_id ON public.program_budgets (program_id);
CREATE INDEX IF NOT EXISTS idx_program_budgets_status ON public.program_budgets (status);
CREATE INDEX IF NOT EXISTS idx_program_budgets_requisition_id ON public.program_budgets (requisition_id);
CREATE INDEX IF NOT EXISTS idx_program_budgets_finance_disbursement_id ON public.program_budgets (finance_disbursement_id);
CREATE INDEX IF NOT EXISTS idx_program_checklists_program_id ON public.program_checklists (program_id);
CREATE INDEX IF NOT EXISTS idx_program_checklists_status ON public.program_checklists (status);
CREATE INDEX IF NOT EXISTS idx_program_checklists_assigned_to ON public.program_checklists (assigned_to_staff_id);
CREATE INDEX IF NOT EXISTS idx_program_checklists_due_date ON public.program_checklists (due_date);
CREATE INDEX IF NOT EXISTS idx_program_reports_program_id ON public.program_reports (program_id);
CREATE INDEX IF NOT EXISTS idx_program_reports_status ON public.program_reports (status);
CREATE INDEX IF NOT EXISTS idx_program_reports_type ON public.program_reports (report_type);
CREATE INDEX IF NOT EXISTS idx_media_roles_slug ON public.media_roles (slug);
CREATE INDEX IF NOT EXISTS idx_media_roles_category ON public.media_roles (category);
CREATE INDEX IF NOT EXISTS idx_media_roles_status ON public.media_roles (status);
CREATE INDEX IF NOT EXISTS idx_media_team_staff_id ON public.media_team_members (staff_id);
CREATE INDEX IF NOT EXISTS idx_media_team_church_id ON public.media_team_members (church_id);
CREATE INDEX IF NOT EXISTS idx_media_team_role_id ON public.media_team_members (media_role_id);
CREATE INDEX IF NOT EXISTS idx_media_team_status ON public.media_team_members (status);
CREATE INDEX IF NOT EXISTS idx_media_services_church_id ON public.media_services (church_id);
CREATE INDEX IF NOT EXISTS idx_media_services_program_id ON public.media_services (program_id);
CREATE INDEX IF NOT EXISTS idx_media_services_date ON public.media_services (service_date);
CREATE INDEX IF NOT EXISTS idx_media_services_status ON public.media_services (status);
CREATE INDEX IF NOT EXISTS idx_media_services_lead ON public.media_services (media_lead_id);
CREATE INDEX IF NOT EXISTS idx_media_schedules_service_id ON public.media_schedules (media_service_id);
CREATE INDEX IF NOT EXISTS idx_media_schedules_team_member_id ON public.media_schedules (team_member_id);
CREATE INDEX IF NOT EXISTS idx_media_schedules_staff_id ON public.media_schedules (staff_id);
CREATE INDEX IF NOT EXISTS idx_media_schedules_status ON public.media_schedules (status);
CREATE INDEX IF NOT EXISTS idx_media_channels_church_id ON public.media_channels (church_id);
CREATE INDEX IF NOT EXISTS idx_media_channels_platform ON public.media_channels (platform);
CREATE INDEX IF NOT EXISTS idx_media_channels_active ON public.media_channels (is_active);
CREATE INDEX IF NOT EXISTS idx_media_performance_service_id ON public.media_performance_records (media_service_id);
CREATE INDEX IF NOT EXISTS idx_media_performance_team_member_id ON public.media_performance_records (team_member_id);
CREATE INDEX IF NOT EXISTS idx_media_performance_staff_id ON public.media_performance_records (staff_id);
CREATE INDEX IF NOT EXISTS idx_media_performance_date ON public.media_performance_records (service_date);
CREATE INDEX IF NOT EXISTS idx_media_awards_team_member_id ON public.media_awards (team_member_id);
CREATE INDEX IF NOT EXISTS idx_media_awards_staff_id ON public.media_awards (staff_id);
CREATE INDEX IF NOT EXISTS idx_media_awards_date ON public.media_awards (award_date);
CREATE INDEX IF NOT EXISTS idx_media_awards_status ON public.media_awards (status);

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'programs','program_sessions','program_teams','program_participants','program_registrations','program_resources','program_budgets','program_checklists','program_reports',
    'media_roles','media_team_members','media_services','media_schedules','media_channels','media_performance_records','media_awards'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'trg_' || table_name || '_updated_at', table_name);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', 'trg_' || table_name || '_updated_at', table_name);
  END LOOP;
END $$;

COMMENT ON TABLE public.program_budgets IS 'Planning metadata only. Verified expense remains a Finance responsibility.';
COMMENT ON TABLE public.media_channels IS 'Public channel links and non-sensitive metadata only. Never store stream keys, passwords, or tokens.';
