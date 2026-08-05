-- Backend Phase 10 - Counseling + Sacraments Supabase/API pilot
-- Additive only. Sensitive records require future production RLS; never use service credentials in clients.

CREATE TABLE IF NOT EXISTS public.counseling_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_number text UNIQUE,
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text,
  person_type text, member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  first_timer_id uuid REFERENCES public.first_timers(id) ON DELETE SET NULL,
  full_name text NOT NULL, phone text, whatsapp text, email text,
  topic text, category text, priority text NOT NULL DEFAULT 'Normal',
  preferred_date date, preferred_time text, status text NOT NULL DEFAULT 'Pending',
  assigned_counselor_id uuid, assigned_counselor_name text, case_id uuid,
  source text NOT NULL DEFAULT 'Manual Entry', source_id uuid, public_submission boolean NOT NULL DEFAULT false,
  summary text, notes text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid, updated_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.counseling_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_number text UNIQUE,
  request_id uuid REFERENCES public.counseling_requests(id) ON DELETE SET NULL,
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text,
  person_type text, member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  first_timer_id uuid REFERENCES public.first_timers(id) ON DELETE SET NULL,
  full_name text NOT NULL, phone text, email text, category text, topic text,
  priority text NOT NULL DEFAULT 'Normal', status text NOT NULL DEFAULT 'Open',
  assigned_counselor_id uuid, assigned_counselor_name text,
  opened_at timestamptz NOT NULL DEFAULT now(), closed_at timestamptz,
  closed_by uuid, closed_by_name text, closure_reason text, summary text,
  confidential_notes text, private_assessment text, pastoral_guidance text,
  follow_up_required boolean NOT NULL DEFAULT false, follow_up_id uuid,
  escalated boolean NOT NULL DEFAULT false, escalated_to_user_id uuid, escalated_to_name text,
  escalated_at timestamptz, escalation_reason text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid, updated_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.counseling_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.counseling_cases(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.counseling_requests(id) ON DELETE SET NULL,
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text,
  appointment_date date NOT NULL, start_time text, end_time text, location text,
  modality text NOT NULL DEFAULT 'Presencial', counselor_id uuid, counselor_name text,
  person_name text, person_phone text, status text NOT NULL DEFAULT 'Scheduled',
  attendance_status text NOT NULL DEFAULT 'Pending', session_summary text,
  confidential_session_notes text, next_appointment_date date, next_steps text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.counselors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL, user_id uuid,
  full_name text NOT NULL, phone text, email text,
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text,
  specializations jsonb NOT NULL DEFAULT '[]'::jsonb,
  can_handle_marital boolean NOT NULL DEFAULT false, can_handle_family boolean NOT NULL DEFAULT false,
  can_handle_business boolean NOT NULL DEFAULT false, can_handle_spiritual_growth boolean NOT NULL DEFAULT true,
  can_handle_youth boolean NOT NULL DEFAULT false, max_cases integer NOT NULL DEFAULT 10,
  active_cases integer NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'Active', notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.counseling_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.counseling_cases(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.counseling_appointments(id) ON DELETE SET NULL,
  feedback_type text, submitted_by uuid, submitted_by_name text, summary text, outcome text,
  needs_follow_up boolean NOT NULL DEFAULT false, follow_up_recommendation text,
  satisfaction_score numeric NOT NULL DEFAULT 0, confidential_feedback text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.counseling_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.counseling_cases(id) ON DELETE CASCADE,
  referral_type text, referred_to_user_id uuid, referred_to_name text, referred_to_department text,
  reason text, summary text, status text NOT NULL DEFAULT 'Pending',
  referred_by uuid, referred_by_name text, referred_at timestamptz NOT NULL DEFAULT now(),
  accepted_by uuid, accepted_by_name text, accepted_at timestamptz,
  closed_at timestamptz, closure_notes text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.baptisms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), baptism_number text UNIQUE,
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  first_timer_id uuid REFERENCES public.first_timers(id) ON DELETE SET NULL,
  full_name text NOT NULL, phone text, email text, date_of_birth date,
  baptism_date date, baptism_location text, minister_id uuid, minister_name text,
  foundation_school_completed boolean NOT NULL DEFAULT false, status text NOT NULL DEFAULT 'Pending',
  certificate_id uuid, certificate_status text NOT NULL DEFAULT 'Not Issued',
  document_ids jsonb NOT NULL DEFAULT '[]'::jsonb, notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marriages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), marriage_number text UNIQUE,
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text,
  groom_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  bride_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  groom_name text NOT NULL, groom_phone text, groom_email text,
  bride_name text NOT NULL, bride_phone text, bride_email text,
  marriage_date date, marriage_time text, marriage_location text,
  officiating_minister_id uuid, officiating_minister_name text,
  counseling_case_id uuid REFERENCES public.counseling_cases(id) ON DELETE SET NULL,
  pre_marital_counseling_completed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Pending', certificate_id uuid,
  certificate_status text NOT NULL DEFAULT 'Not Issued', document_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  payment_status text NOT NULL DEFAULT 'Not Required', notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.baby_dedications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), dedication_number text UNIQUE,
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text,
  child_name text NOT NULL, child_date_of_birth date, child_gender text,
  parent_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  parent_name text NOT NULL, parent_phone text, parent_email text,
  second_parent_name text, second_parent_phone text, dedication_date date, dedication_location text,
  minister_id uuid, minister_name text, status text NOT NULL DEFAULT 'Pending', certificate_id uuid,
  certificate_status text NOT NULL DEFAULT 'Not Issued', document_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sacrament_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), certificate_number text UNIQUE,
  sacrament_type text NOT NULL, sacrament_record_id uuid NOT NULL,
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text,
  recipient_name text NOT NULL, issued_date date, issued_by uuid, issued_by_name text,
  status text NOT NULL DEFAULT 'Draft', document_id uuid, file_url text, storage_path text,
  payment_status text NOT NULL DEFAULT 'Not Required', notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sacrament_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sacrament_type text NOT NULL,
  sacrament_record_id uuid NOT NULL, document_id uuid, document_type text, document_title text,
  file_name text, file_url text, storage_bucket text, storage_path text,
  status text NOT NULL DEFAULT 'Pending Review', is_sensitive boolean NOT NULL DEFAULT true,
  uploaded_by uuid, uploaded_by_name text, verified_by uuid, verified_by_name text, verified_at timestamptz,
  rejected_by uuid, rejected_by_name text, rejected_at timestamptz, rejection_reason text,
  notes text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sacrament_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sacrament_type text NOT NULL,
  sacrament_record_id uuid NOT NULL,
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text,
  appointment_date date, start_time text, end_time text, location text,
  minister_id uuid, minister_name text, status text NOT NULL DEFAULT 'Scheduled', notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_counseling_requests_church_id ON public.counseling_requests(church_id);
CREATE INDEX IF NOT EXISTS idx_counseling_requests_member_id ON public.counseling_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_counseling_requests_first_timer_id ON public.counseling_requests(first_timer_id);
CREATE INDEX IF NOT EXISTS idx_counseling_requests_status ON public.counseling_requests(status);
CREATE INDEX IF NOT EXISTS idx_counseling_requests_category ON public.counseling_requests(category);
CREATE INDEX IF NOT EXISTS idx_counseling_requests_assigned_counselor ON public.counseling_requests(assigned_counselor_id);
CREATE INDEX IF NOT EXISTS idx_counseling_requests_created_at ON public.counseling_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_counseling_cases_request_id ON public.counseling_cases(request_id);
CREATE INDEX IF NOT EXISTS idx_counseling_cases_church_id ON public.counseling_cases(church_id);
CREATE INDEX IF NOT EXISTS idx_counseling_cases_member_id ON public.counseling_cases(member_id);
CREATE INDEX IF NOT EXISTS idx_counseling_cases_first_timer_id ON public.counseling_cases(first_timer_id);
CREATE INDEX IF NOT EXISTS idx_counseling_cases_status ON public.counseling_cases(status);
CREATE INDEX IF NOT EXISTS idx_counseling_cases_category ON public.counseling_cases(category);
CREATE INDEX IF NOT EXISTS idx_counseling_cases_assigned_counselor ON public.counseling_cases(assigned_counselor_id);
CREATE INDEX IF NOT EXISTS idx_counseling_cases_escalated ON public.counseling_cases(escalated);
CREATE INDEX IF NOT EXISTS idx_counseling_appointments_case_id ON public.counseling_appointments(case_id);
CREATE INDEX IF NOT EXISTS idx_counseling_appointments_church_id ON public.counseling_appointments(church_id);
CREATE INDEX IF NOT EXISTS idx_counseling_appointments_date ON public.counseling_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_counseling_appointments_counselor ON public.counseling_appointments(counselor_id);
CREATE INDEX IF NOT EXISTS idx_counseling_appointments_status ON public.counseling_appointments(status);
CREATE INDEX IF NOT EXISTS idx_counselors_staff_id ON public.counselors(staff_id);
CREATE INDEX IF NOT EXISTS idx_counselors_church_id ON public.counselors(church_id);
CREATE INDEX IF NOT EXISTS idx_counselors_status ON public.counselors(status);
CREATE INDEX IF NOT EXISTS idx_counseling_feedback_case_id ON public.counseling_feedback(case_id);
CREATE INDEX IF NOT EXISTS idx_counseling_feedback_appointment_id ON public.counseling_feedback(appointment_id);
CREATE INDEX IF NOT EXISTS idx_counseling_feedback_type ON public.counseling_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_counseling_feedback_needs_follow_up ON public.counseling_feedback(needs_follow_up);
CREATE INDEX IF NOT EXISTS idx_counseling_referrals_case_id ON public.counseling_referrals(case_id);
CREATE INDEX IF NOT EXISTS idx_counseling_referrals_status ON public.counseling_referrals(status);
CREATE INDEX IF NOT EXISTS idx_counseling_referrals_type ON public.counseling_referrals(referral_type);
CREATE INDEX IF NOT EXISTS idx_baptisms_church_id ON public.baptisms(church_id);
CREATE INDEX IF NOT EXISTS idx_baptisms_member_id ON public.baptisms(member_id);
CREATE INDEX IF NOT EXISTS idx_baptisms_first_timer_id ON public.baptisms(first_timer_id);
CREATE INDEX IF NOT EXISTS idx_baptisms_status ON public.baptisms(status);
CREATE INDEX IF NOT EXISTS idx_baptisms_baptism_date ON public.baptisms(baptism_date);
CREATE INDEX IF NOT EXISTS idx_marriages_church_id ON public.marriages(church_id);
CREATE INDEX IF NOT EXISTS idx_marriages_groom_member_id ON public.marriages(groom_member_id);
CREATE INDEX IF NOT EXISTS idx_marriages_bride_member_id ON public.marriages(bride_member_id);
CREATE INDEX IF NOT EXISTS idx_marriages_status ON public.marriages(status);
CREATE INDEX IF NOT EXISTS idx_marriages_marriage_date ON public.marriages(marriage_date);
CREATE INDEX IF NOT EXISTS idx_marriages_counseling_case_id ON public.marriages(counseling_case_id);
CREATE INDEX IF NOT EXISTS idx_baby_dedications_church_id ON public.baby_dedications(church_id);
CREATE INDEX IF NOT EXISTS idx_baby_dedications_parent_member_id ON public.baby_dedications(parent_member_id);
CREATE INDEX IF NOT EXISTS idx_baby_dedications_status ON public.baby_dedications(status);
CREATE INDEX IF NOT EXISTS idx_baby_dedications_date ON public.baby_dedications(dedication_date);
CREATE INDEX IF NOT EXISTS idx_sacrament_certificates_type ON public.sacrament_certificates(sacrament_type);
CREATE INDEX IF NOT EXISTS idx_sacrament_certificates_record_id ON public.sacrament_certificates(sacrament_record_id);
CREATE INDEX IF NOT EXISTS idx_sacrament_certificates_church_id ON public.sacrament_certificates(church_id);
CREATE INDEX IF NOT EXISTS idx_sacrament_certificates_status ON public.sacrament_certificates(status);
CREATE INDEX IF NOT EXISTS idx_sacrament_documents_type ON public.sacrament_documents(sacrament_type);
CREATE INDEX IF NOT EXISTS idx_sacrament_documents_record_id ON public.sacrament_documents(sacrament_record_id);
CREATE INDEX IF NOT EXISTS idx_sacrament_documents_status ON public.sacrament_documents(status);
CREATE INDEX IF NOT EXISTS idx_sacrament_appointments_type ON public.sacrament_appointments(sacrament_type);
CREATE INDEX IF NOT EXISTS idx_sacrament_appointments_record_id ON public.sacrament_appointments(sacrament_record_id);
CREATE INDEX IF NOT EXISTS idx_sacrament_appointments_church_id ON public.sacrament_appointments(church_id);
CREATE INDEX IF NOT EXISTS idx_sacrament_appointments_date ON public.sacrament_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_sacrament_appointments_status ON public.sacrament_appointments(status);

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'counseling_requests','counseling_cases','counseling_appointments','counselors','counseling_feedback','counseling_referrals',
    'baptisms','marriages','baby_dedications','sacrament_certificates','sacrament_documents','sacrament_appointments'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'trg_' || table_name || '_updated_at', table_name);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', 'trg_' || table_name || '_updated_at', table_name);
  END LOOP;
END $$;

COMMENT ON COLUMN public.counseling_cases.confidential_notes IS 'Sensitive: exclude from normal lists and aggregate reports.';
COMMENT ON COLUMN public.counseling_cases.private_assessment IS 'Sensitive: requires explicit confidential permission.';
COMMENT ON COLUMN public.counseling_cases.pastoral_guidance IS 'Sensitive: requires explicit confidential permission.';
COMMENT ON TABLE public.sacrament_documents IS 'Sensitive document metadata. Use private storage and future signed URLs only.';
COMMENT ON COLUMN public.marriages.payment_status IS 'Internal metadata only; never creates a finance record automatically.';
COMMENT ON COLUMN public.sacrament_certificates.payment_status IS 'Internal metadata only; certificate creation and issuance are explicit actions.';
