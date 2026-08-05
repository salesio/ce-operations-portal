-- Backend Phase 8 - Foundation School Supabase/API pilot
-- Additive migration only. Browser access must use the anon key and RLS.

CREATE TABLE IF NOT EXISTS public.foundation_school_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff_members (id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  teacher_number text UNIQUE,
  full_name text NOT NULL,
  phone text,
  email text,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  church_name text,
  role text NOT NULL DEFAULT 'Professor',
  specialization text,
  can_teach_online boolean NOT NULL DEFAULT false,
  can_teach_prisons boolean NOT NULL DEFAULT false,
  can_teach_home boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Active',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.foundation_school_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_code text UNIQUE,
  name text NOT NULL,
  description text,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  church_name text,
  modality text NOT NULL DEFAULT 'Presencial',
  teacher_id uuid REFERENCES public.foundation_school_teachers (id) ON DELETE SET NULL,
  teacher_name text,
  assistant_teacher_id uuid REFERENCES public.foundation_school_teachers (id) ON DELETE SET NULL,
  assistant_teacher_name text,
  start_date date,
  end_date date,
  schedule_day text,
  schedule_time text,
  location text,
  capacity integer NOT NULL DEFAULT 30 CHECK (capacity >= 0),
  status text NOT NULL DEFAULT 'Planned',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.foundation_school_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_number text UNIQUE,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  church_name text,
  first_timer_id uuid REFERENCES public.first_timers (id) ON DELETE SET NULL,
  member_id uuid REFERENCES public.members (id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  whatsapp text,
  email text,
  source text,
  source_id uuid,
  modality text NOT NULL DEFAULT 'Presencial',
  status text NOT NULL DEFAULT 'Pending',
  preferred_class_id uuid REFERENCES public.foundation_school_classes (id) ON DELETE SET NULL,
  assigned_class_id uuid REFERENCES public.foundation_school_classes (id) ON DELETE SET NULL,
  enrollment_date date NOT NULL DEFAULT current_date,
  start_date date,
  expected_completion_date date,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.foundation_school_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_number text UNIQUE,
  enrollment_id uuid REFERENCES public.foundation_school_enrollments (id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.foundation_school_classes (id) ON DELETE SET NULL,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  church_name text,
  first_timer_id uuid REFERENCES public.first_timers (id) ON DELETE SET NULL,
  member_id uuid REFERENCES public.members (id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  whatsapp text,
  email text,
  modality text NOT NULL DEFAULT 'Presencial',
  status text NOT NULL DEFAULT 'Active',
  lessons_completed integer NOT NULL DEFAULT 0 CHECK (lessons_completed BETWEEN 0 AND 7),
  lesson_progress_percentage numeric(5,2) NOT NULL DEFAULT 0 CHECK (lesson_progress_percentage BETWEEN 0 AND 100),
  tests_average numeric(5,2) NOT NULL DEFAULT 0,
  final_exam_score numeric(6,2) NOT NULL DEFAULT 0,
  final_grade numeric(5,2) NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  graduated boolean NOT NULL DEFAULT false,
  graduation_id uuid,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.foundation_school_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_number integer NOT NULL UNIQUE CHECK (lesson_number BETWEEN 1 AND 7),
  title text NOT NULL,
  description text,
  default_duration_minutes integer NOT NULL DEFAULT 60,
  requires_attendance boolean NOT NULL DEFAULT true,
  requires_test boolean NOT NULL DEFAULT true,
  requires_practical boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.foundation_school_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.foundation_school_classes (id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.foundation_school_students (id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.foundation_school_lessons (id) ON DELETE SET NULL,
  lesson_number integer,
  attendance_date date NOT NULL,
  status text NOT NULL DEFAULT 'Present',
  teacher_id uuid REFERENCES public.foundation_school_teachers (id) ON DELETE SET NULL,
  teacher_name text,
  recorded_by uuid,
  recorded_by_name text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.foundation_school_online_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_number integer NOT NULL CHECK (lesson_number BETWEEN 1 AND 7),
  title text NOT NULL,
  form_url text,
  form_provider text NOT NULL DEFAULT 'Google Forms',
  is_active boolean NOT NULL DEFAULT true,
  passing_score numeric(6,2) NOT NULL DEFAULT 50,
  max_score numeric(6,2) NOT NULL DEFAULT 100,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.foundation_school_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.foundation_school_students (id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.foundation_school_classes (id) ON DELETE SET NULL,
  lesson_number integer NOT NULL CHECK (lesson_number BETWEEN 1 AND 7),
  online_test_id uuid REFERENCES public.foundation_school_online_tests (id) ON DELETE SET NULL,
  score numeric(6,2) NOT NULL DEFAULT 0,
  max_score numeric(6,2) NOT NULL DEFAULT 100 CHECK (max_score > 0),
  percentage numeric(5,2) NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  submitted_at timestamptz,
  external_submission_id text,
  external_email text,
  recorded_by uuid,
  recorded_by_name text,
  source text NOT NULL DEFAULT 'Manual Entry',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.foundation_school_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.foundation_school_students (id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.foundation_school_classes (id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES public.foundation_school_lessons (id) ON DELETE SET NULL,
  lesson_number integer NOT NULL CHECK (lesson_number BETWEEN 1 AND 7),
  lesson_title text,
  status text NOT NULL DEFAULT 'Pending',
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  teacher_id uuid REFERENCES public.foundation_school_teachers (id) ON DELETE SET NULL,
  teacher_name text,
  attendance_id uuid REFERENCES public.foundation_school_attendance (id) ON DELETE SET NULL,
  score numeric(6,2) NOT NULL DEFAULT 0,
  test_result_id uuid REFERENCES public.foundation_school_test_results (id) ON DELETE SET NULL,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, lesson_number)
);

CREATE TABLE IF NOT EXISTS public.foundation_school_soul_winning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.foundation_school_students (id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.foundation_school_classes (id) ON DELETE SET NULL,
  lesson_number integer NOT NULL DEFAULT 4 CHECK (lesson_number = 4),
  practical_date date,
  location text,
  souls_won_count integer NOT NULL DEFAULT 0 CHECK (souls_won_count >= 0),
  first_timers_invited_count integer NOT NULL DEFAULT 0 CHECK (first_timers_invited_count >= 0),
  first_timers_attended_count integer NOT NULL DEFAULT 0 CHECK (first_timers_attended_count >= 0),
  supervised_by_teacher_id uuid REFERENCES public.foundation_school_teachers (id) ON DELETE SET NULL,
  supervised_by_teacher_name text,
  approved boolean NOT NULL DEFAULT false,
  approved_by uuid,
  approved_by_name text,
  approved_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.foundation_school_final_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.foundation_school_students (id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.foundation_school_classes (id) ON DELETE SET NULL,
  exam_date date,
  exam_score numeric(6,2) NOT NULL DEFAULT 0,
  max_score numeric(6,2) NOT NULL DEFAULT 100 CHECK (max_score > 0),
  percentage numeric(5,2) NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  document_id uuid REFERENCES public.documents (id) ON DELETE SET NULL,
  scan_document_id uuid REFERENCES public.documents (id) ON DELETE SET NULL,
  graded_by uuid,
  graded_by_name text,
  graded_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.foundation_school_graduations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  graduation_number text UNIQUE,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  church_name text,
  class_id uuid REFERENCES public.foundation_school_classes (id) ON DELETE SET NULL,
  graduation_date date,
  graduation_title text,
  student_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  student_count integer NOT NULL DEFAULT 0 CHECK (student_count >= 0),
  certificate_document_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'Planned',
  approved_by uuid,
  approved_by_name text,
  approved_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{"certificates_generated": false}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_foundation_enrollments_church_id ON public.foundation_school_enrollments (church_id);
CREATE INDEX IF NOT EXISTS idx_foundation_enrollments_first_timer_id ON public.foundation_school_enrollments (first_timer_id);
CREATE INDEX IF NOT EXISTS idx_foundation_enrollments_member_id ON public.foundation_school_enrollments (member_id);
CREATE INDEX IF NOT EXISTS idx_foundation_enrollments_status ON public.foundation_school_enrollments (status);
CREATE INDEX IF NOT EXISTS idx_foundation_enrollments_modality ON public.foundation_school_enrollments (modality);
CREATE INDEX IF NOT EXISTS idx_foundation_enrollments_assigned_class_id ON public.foundation_school_enrollments (assigned_class_id);
CREATE INDEX IF NOT EXISTS idx_foundation_classes_church_id ON public.foundation_school_classes (church_id);
CREATE INDEX IF NOT EXISTS idx_foundation_classes_teacher_id ON public.foundation_school_classes (teacher_id);
CREATE INDEX IF NOT EXISTS idx_foundation_classes_status ON public.foundation_school_classes (status);
CREATE INDEX IF NOT EXISTS idx_foundation_classes_modality ON public.foundation_school_classes (modality);
CREATE INDEX IF NOT EXISTS idx_foundation_classes_start_date ON public.foundation_school_classes (start_date);
CREATE INDEX IF NOT EXISTS idx_foundation_students_church_id ON public.foundation_school_students (church_id);
CREATE INDEX IF NOT EXISTS idx_foundation_students_class_id ON public.foundation_school_students (class_id);
CREATE INDEX IF NOT EXISTS idx_foundation_students_member_id ON public.foundation_school_students (member_id);
CREATE INDEX IF NOT EXISTS idx_foundation_students_first_timer_id ON public.foundation_school_students (first_timer_id);
CREATE INDEX IF NOT EXISTS idx_foundation_students_status ON public.foundation_school_students (status);
CREATE INDEX IF NOT EXISTS idx_foundation_students_graduated ON public.foundation_school_students (graduated);
CREATE INDEX IF NOT EXISTS idx_foundation_teachers_staff_id ON public.foundation_school_teachers (staff_id);
CREATE INDEX IF NOT EXISTS idx_foundation_teachers_church_id ON public.foundation_school_teachers (church_id);
CREATE INDEX IF NOT EXISTS idx_foundation_teachers_status ON public.foundation_school_teachers (status);
CREATE INDEX IF NOT EXISTS idx_foundation_teachers_role ON public.foundation_school_teachers (role);
CREATE INDEX IF NOT EXISTS idx_foundation_lessons_lesson_number ON public.foundation_school_lessons (lesson_number);
CREATE INDEX IF NOT EXISTS idx_foundation_lessons_status ON public.foundation_school_lessons (status);
CREATE INDEX IF NOT EXISTS idx_foundation_progress_student_id ON public.foundation_school_lesson_progress (student_id);
CREATE INDEX IF NOT EXISTS idx_foundation_progress_class_id ON public.foundation_school_lesson_progress (class_id);
CREATE INDEX IF NOT EXISTS idx_foundation_progress_lesson_number ON public.foundation_school_lesson_progress (lesson_number);
CREATE INDEX IF NOT EXISTS idx_foundation_progress_completed ON public.foundation_school_lesson_progress (completed);
CREATE INDEX IF NOT EXISTS idx_foundation_attendance_class_id ON public.foundation_school_attendance (class_id);
CREATE INDEX IF NOT EXISTS idx_foundation_attendance_student_id ON public.foundation_school_attendance (student_id);
CREATE INDEX IF NOT EXISTS idx_foundation_attendance_date ON public.foundation_school_attendance (attendance_date);
CREATE INDEX IF NOT EXISTS idx_foundation_attendance_status ON public.foundation_school_attendance (status);
CREATE INDEX IF NOT EXISTS idx_foundation_attendance_lesson_number ON public.foundation_school_attendance (lesson_number);
CREATE INDEX IF NOT EXISTS idx_foundation_online_tests_lesson_number ON public.foundation_school_online_tests (lesson_number);
CREATE INDEX IF NOT EXISTS idx_foundation_online_tests_active ON public.foundation_school_online_tests (is_active);
CREATE INDEX IF NOT EXISTS idx_foundation_test_results_student_id ON public.foundation_school_test_results (student_id);
CREATE INDEX IF NOT EXISTS idx_foundation_test_results_class_id ON public.foundation_school_test_results (class_id);
CREATE INDEX IF NOT EXISTS idx_foundation_test_results_lesson_number ON public.foundation_school_test_results (lesson_number);
CREATE INDEX IF NOT EXISTS idx_foundation_test_results_passed ON public.foundation_school_test_results (passed);
CREATE INDEX IF NOT EXISTS idx_foundation_soul_winning_student_id ON public.foundation_school_soul_winning (student_id);
CREATE INDEX IF NOT EXISTS idx_foundation_soul_winning_class_id ON public.foundation_school_soul_winning (class_id);
CREATE INDEX IF NOT EXISTS idx_foundation_soul_winning_approved ON public.foundation_school_soul_winning (approved);
CREATE INDEX IF NOT EXISTS idx_foundation_final_exams_student_id ON public.foundation_school_final_exams (student_id);
CREATE INDEX IF NOT EXISTS idx_foundation_final_exams_class_id ON public.foundation_school_final_exams (class_id);
CREATE INDEX IF NOT EXISTS idx_foundation_final_exams_passed ON public.foundation_school_final_exams (passed);
CREATE INDEX IF NOT EXISTS idx_foundation_final_exams_exam_date ON public.foundation_school_final_exams (exam_date);
CREATE INDEX IF NOT EXISTS idx_foundation_graduations_church_id ON public.foundation_school_graduations (church_id);
CREATE INDEX IF NOT EXISTS idx_foundation_graduations_class_id ON public.foundation_school_graduations (class_id);
CREATE INDEX IF NOT EXISTS idx_foundation_graduations_date ON public.foundation_school_graduations (graduation_date);
CREATE INDEX IF NOT EXISTS idx_foundation_graduations_status ON public.foundation_school_graduations (status);

INSERT INTO public.foundation_school_lessons
  (lesson_number, title, requires_practical, metadata)
VALUES
  (1, 'Aula 1', false, '{"pilot_seed": true}'::jsonb),
  (2, 'Aula 2', false, '{"pilot_seed": true}'::jsonb),
  (3, 'Aula 3', false, '{"pilot_seed": true}'::jsonb),
  (4, 'Aula 4 — Ganhar Almas / Prática', true, '{"pilot_seed": true}'::jsonb),
  (5, 'Aula 5', false, '{"pilot_seed": true}'::jsonb),
  (6, 'Aula 6', false, '{"pilot_seed": true}'::jsonb),
  (7, 'Aula 7', false, '{"pilot_seed": true}'::jsonb)
ON CONFLICT (lesson_number) DO NOTHING;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'foundation_school_teachers', 'foundation_school_classes', 'foundation_school_enrollments',
    'foundation_school_students', 'foundation_school_lessons', 'foundation_school_lesson_progress',
    'foundation_school_attendance', 'foundation_school_online_tests', 'foundation_school_test_results',
    'foundation_school_soul_winning', 'foundation_school_final_exams', 'foundation_school_graduations'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'trg_' || table_name || '_updated_at', table_name);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', 'trg_' || table_name || '_updated_at', table_name);
  END LOOP;
END $$;

COMMENT ON TABLE public.foundation_school_online_tests IS 'External form metadata only; no Google Forms API integration.';
COMMENT ON TABLE public.foundation_school_graduations IS 'Graduation and certificate creation require explicit application actions.';
