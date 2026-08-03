-- Backend Phase 7 - Staff & RH + Documents Supabase/API pilot
-- Browser clients must use anon/RLS only. Salaries and staff documents are sensitive.

CREATE TABLE IF NOT EXISTS public.staff_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  department_type text,
  head_staff_id uuid,
  head_name text,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'Active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.staff_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text,
  slug text,
  department_id uuid REFERENCES public.staff_departments (id) ON DELETE SET NULL,
  default_access_role_id uuid REFERENCES public.roles (id) ON DELETE SET NULL,
  default_access_role_name text,
  employment_type text,
  role_level text,
  status text NOT NULL DEFAULT 'Active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS staff_number text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS country text DEFAULT 'Mozambique';
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS church_name text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS department_name text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.staff_roles (id) ON DELETE SET NULL;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS role_name text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS supervisor_staff_id uuid;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS employment_status text DEFAULT 'Active';
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS employment_type text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS hire_date date;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users (id) ON DELETE SET NULL;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS auth_user_id uuid;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS access_role_id uuid REFERENCES public.roles (id) ON DELETE SET NULL;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS access_role_name text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS has_dashboard_access boolean DEFAULT false;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS can_access_dashboard boolean DEFAULT false;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS profile_photo_document_id uuid;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS document_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS salary_enabled boolean DEFAULT false;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS salary_visibility text DEFAULT 'HR Only';
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS notes text;

CREATE TABLE IF NOT EXISTS public.staff_salaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff_members (id) ON DELETE CASCADE,
  staff_number text,
  staff_name text,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.staff_departments (id) ON DELETE SET NULL,
  salary_or_allowance text,
  base_amount numeric(12,2) DEFAULT 0,
  base_salary numeric(12,2) DEFAULT 0,
  allowances numeric(12,2) DEFAULT 0,
  deductions numeric(12,2) DEFAULT 0,
  net_amount numeric(12,2) DEFAULT 0,
  net_salary numeric(12,2) DEFAULT 0,
  currency text NOT NULL DEFAULT 'MTn',
  effective_from date,
  effective_to date,
  payment_method text,
  bank_or_mobile_details text,
  verification_status text DEFAULT 'Pending Verification',
  status text NOT NULL DEFAULT 'Active',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{"no_finance_record_created": true}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.staff_performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff_members (id) ON DELETE CASCADE,
  staff_number text,
  staff_name text,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.staff_departments (id) ON DELETE SET NULL,
  review_period text,
  review_date date,
  evaluated_by uuid,
  evaluator_name text,
  score numeric(5,2),
  spiritual_commitment_score numeric(5,2),
  punctuality_score numeric(5,2),
  teamwork_score numeric(5,2),
  excellence_score numeric(5,2),
  improvement_areas text,
  goals text,
  progress text,
  review_notes text,
  status text NOT NULL DEFAULT 'Pending Verification',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.staff_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff_members (id) ON DELETE CASCADE,
  staff_number text,
  staff_name text,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  document_id uuid REFERENCES public.documents (id) ON DELETE SET NULL,
  document_type text,
  document_title text,
  file_name text,
  file_url text,
  storage_bucket text DEFAULT 'staff-documents',
  storage_path text,
  is_sensitive boolean NOT NULL DEFAULT true,
  expiry_date date,
  uploaded_by uuid,
  uploaded_by_name text,
  verified_by uuid,
  verified_by_name text,
  verified_at timestamptz,
  rejected_by uuid,
  rejected_by_name text,
  rejected_at timestamptz,
  rejection_reason text,
  status text NOT NULL DEFAULT 'Pending Review',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff_members (id) ON DELETE CASCADE,
  staff_number text,
  staff_name text,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.staff_departments (id) ON DELETE SET NULL,
  attendance_date date NOT NULL,
  attendance_type text DEFAULT 'Work Day',
  check_in time,
  check_out time,
  hours_worked numeric(6,2),
  status text NOT NULL DEFAULT 'Present',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE INDEX IF NOT EXISTS idx_staff_departments_church_status ON public.staff_departments (church_id, status);
CREATE INDEX IF NOT EXISTS idx_staff_roles_department_status ON public.staff_roles (department_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_members_staff_number_unique ON public.staff_members (staff_number) WHERE staff_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_members_church_department ON public.staff_members (church_id, department_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_user_auth ON public.staff_members (user_id, auth_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_salaries_staff_effective ON public.staff_salaries (staff_id, effective_from DESC);
CREATE INDEX IF NOT EXISTS idx_staff_performance_staff_period ON public.staff_performance_reviews (staff_id, review_period);
CREATE INDEX IF NOT EXISTS idx_staff_documents_staff_status ON public.staff_documents (staff_id, status);
CREATE INDEX IF NOT EXISTS idx_staff_documents_expiry ON public.staff_documents (expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_date ON public.staff_attendance (staff_id, attendance_date DESC);

DROP TRIGGER IF EXISTS trg_staff_departments_updated_at ON public.staff_departments;
CREATE TRIGGER trg_staff_departments_updated_at BEFORE UPDATE ON public.staff_departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_staff_roles_updated_at ON public.staff_roles;
CREATE TRIGGER trg_staff_roles_updated_at BEFORE UPDATE ON public.staff_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_staff_salaries_updated_at ON public.staff_salaries;
CREATE TRIGGER trg_staff_salaries_updated_at BEFORE UPDATE ON public.staff_salaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_staff_performance_reviews_updated_at ON public.staff_performance_reviews;
CREATE TRIGGER trg_staff_performance_reviews_updated_at BEFORE UPDATE ON public.staff_performance_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_staff_documents_updated_at ON public.staff_documents;
CREATE TRIGGER trg_staff_documents_updated_at BEFORE UPDATE ON public.staff_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_staff_attendance_updated_at ON public.staff_attendance;
CREATE TRIGGER trg_staff_attendance_updated_at BEFORE UPDATE ON public.staff_attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
