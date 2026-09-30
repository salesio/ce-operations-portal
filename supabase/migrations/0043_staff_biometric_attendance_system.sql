-- ============================================================================
-- Migration 0043: Staff Biometric Attendance & Punctuality System
-- Comprehensive time-tracking, daily biometric punch logs, delay calculations,
-- monthly consistency analytics, upload history, and configurable shift settings.
-- ============================================================================

BEGIN;

-- Helper function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 1. Table: staff_attendance_settings
CREATE TABLE IF NOT EXISTS public.staff_attendance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
  standard_start_time TEXT NOT NULL DEFAULT '08:00',
  grace_period_minutes INTEGER NOT NULL DEFAULT 15,
  minor_delay_threshold_minutes INTEGER NOT NULL DEFAULT 30,
  severe_delay_threshold_minutes INTEGER NOT NULL DEFAULT 60,
  standard_end_time TEXT DEFAULT '17:00',
  working_days JSONB NOT NULL DEFAULT '["mon","tue","wed","thu","fri"]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table: staff_attendance_uploads
CREATE TABLE IF NOT EXISTS public.staff_attendance_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  device_create_time TEXT,
  record_count INTEGER NOT NULL DEFAULT 0,
  present_count INTEGER NOT NULL DEFAULT 0,
  on_time_count INTEGER NOT NULL DEFAULT 0,
  late_count INTEGER NOT NULL DEFAULT 0,
  absent_count INTEGER NOT NULL DEFAULT 0,
  uploaded_by TEXT,
  file_size_bytes BIGINT DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table: staff_biometric_attendance
CREATE TABLE IF NOT EXISTS public.staff_biometric_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES public.staff_members(id) ON DELETE SET NULL,
  attendance_date DATE NOT NULL,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  card_no TEXT,
  department TEXT NOT NULL DEFAULT 'CESTAFF',
  check_in TEXT,
  check_out TEXT,
  all_punches TEXT,
  status TEXT NOT NULL DEFAULT 'on_time', -- 'on_time', 'grace_period', 'minor_delay', 'late', 'severe_delay', 'absent'
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  is_late BOOLEAN NOT NULL DEFAULT false,
  is_present BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  upload_id UUID REFERENCES public.staff_attendance_uploads(id) ON DELETE SET NULL,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_staff_biometric_date_emp UNIQUE (attendance_date, employee_id)
);

-- Indexes for lightning fast queries & analytics
CREATE INDEX IF NOT EXISTS idx_biometric_att_date ON public.staff_biometric_attendance(attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_biometric_att_emp_id ON public.staff_biometric_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_biometric_att_emp_name ON public.staff_biometric_attendance(employee_name);
CREATE INDEX IF NOT EXISTS idx_biometric_att_status ON public.staff_biometric_attendance(status);
CREATE INDEX IF NOT EXISTS idx_biometric_att_is_late ON public.staff_biometric_attendance(is_late);
CREATE INDEX IF NOT EXISTS idx_biometric_att_dept ON public.staff_biometric_attendance(department);
CREATE INDEX IF NOT EXISTS idx_biometric_att_upload ON public.staff_biometric_attendance(upload_id);

CREATE INDEX IF NOT EXISTS idx_att_uploads_date ON public.staff_attendance_uploads(upload_date DESC);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trg_staff_attendance_settings_updated_at ON public.staff_attendance_settings;
CREATE TRIGGER trg_staff_attendance_settings_updated_at
  BEFORE UPDATE ON public.staff_attendance_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_staff_attendance_uploads_updated_at ON public.staff_attendance_uploads;
CREATE TRIGGER trg_staff_attendance_uploads_updated_at
  BEFORE UPDATE ON public.staff_attendance_uploads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_staff_biometric_attendance_updated_at ON public.staff_biometric_attendance;
CREATE TRIGGER trg_staff_biometric_attendance_updated_at
  BEFORE UPDATE ON public.staff_biometric_attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS & Grants
ALTER TABLE public.staff_attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_biometric_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read staff_attendance_settings" ON public.staff_attendance_settings;
CREATE POLICY "Allow read staff_attendance_settings" ON public.staff_attendance_settings FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow all staff_attendance_settings" ON public.staff_attendance_settings;
CREATE POLICY "Allow all staff_attendance_settings" ON public.staff_attendance_settings FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read staff_attendance_uploads" ON public.staff_attendance_uploads;
CREATE POLICY "Allow read staff_attendance_uploads" ON public.staff_attendance_uploads FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow all staff_attendance_uploads" ON public.staff_attendance_uploads;
CREATE POLICY "Allow all staff_attendance_uploads" ON public.staff_attendance_uploads FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read staff_biometric_attendance" ON public.staff_biometric_attendance;
CREATE POLICY "Allow read staff_biometric_attendance" ON public.staff_biometric_attendance FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow all staff_biometric_attendance" ON public.staff_biometric_attendance FOR ALL TO public USING (true) WITH CHECK (true);

GRANT ALL ON public.staff_attendance_settings TO anon, authenticated, service_role, public;
GRANT ALL ON public.staff_attendance_uploads TO anon, authenticated, service_role, public;
GRANT ALL ON public.staff_biometric_attendance TO anon, authenticated, service_role, public;

-- Default Settings Seed
INSERT INTO public.staff_attendance_settings (
  id, standard_start_time, grace_period_minutes, minor_delay_threshold_minutes, severe_delay_threshold_minutes, working_days
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '08:00',
  15,
  30,
  60,
  '["mon","tue","wed","thu","fri"]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Seed Initial Biometric Dataset for 2026-07-09 (From Church Biometric Fingerprint Device)
INSERT INTO public.staff_attendance_uploads (
  id, filename, upload_date, device_create_time, record_count, present_count, on_time_count, late_count, absent_count, uploaded_by
) VALUES (
  'e1111111-1111-4111-8111-111111111101',
  'Attendance_Record_20260709.xlsx',
  '2026-07-09',
  '2026-07-09 09:39:33',
  22,
  14,
  1,
  13,
  8,
  'Admin'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.staff_biometric_attendance (
  attendance_date, employee_id, employee_name, card_no, department, check_in, check_out, all_punches, status, delay_minutes, is_late, is_present, upload_id
) VALUES
  ('2026-07-09', '1', 'Leo', '', 'CESTAFF', '08:18', null, '08:18 --:--', 'minor_delay', 18, true, true, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '2', 'Marcelo', '', 'CESTAFF', '08:15', null, '08:15 --:--', 'grace_period', 15, false, true, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '3', 'Deacon', '', 'CESTAFF', '08:29', null, '08:29 --:--', 'minor_delay', 29, true, true, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '4', 'Flavia', '', 'CESTAFF', '08:31', null, '08:31 --:--', 'late', 31, true, true, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '5', 'Gil', '', 'CESTAFF', '08:40', null, '08:40 --:--', 'late', 40, true, true, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '7', 'Pk', '0169895558', 'CESTAFF', null, null, '--:-- --:--', 'absent', 0, false, false, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '8', 'Service', '0169672262', 'CESTAFF', null, null, '--:-- --:--', 'absent', 0, false, false, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '9', 'Staff', '0170207286', 'CESTAFF', null, null, '--:-- --:--', 'absent', 0, false, false, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '10', 'Valdemiro', '', 'CESTAFF', '08:16', null, '08:16 --:--', 'minor_delay', 16, true, true, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '11', 'Janet', '', 'CESTAFF', '09:03', null, '09:03 --:--', 'severe_delay', 63, true, true, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '13', 'Pstreina', '', 'CESTAFF', null, null, '--:-- --:--', 'absent', 0, false, false, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '15', 'Laiza', '', 'CESTAFF', null, null, '--:-- --:--', 'absent', 0, false, false, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '2025', 'Claudina', '', 'CESTAFF', '08:57', null, '08:57 --:--', 'late', 57, true, true, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '10000013', 'Eduarda', '', 'CESTAFF', '08:07', null, '08:07 --:--', 'grace_period', 7, false, true, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '10000014', 'Angelica', '', 'CESTAFF', '08:15', null, '08:15 --:--', 'grace_period', 15, false, true, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '10000017', 'Junia', '', 'CESTAFF', '08:28', null, '08:28 --:--', 'minor_delay', 28, true, true, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '10000019', 'Kassandra', '', 'CESTAFF', '08:29', null, '08:29 --:--', 'minor_delay', 29, true, true, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '10000020', 'Filipe', '', 'CESTAFF', '07:56', null, '07:56 --:--', 'on_time', 0, false, true, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '10000021', 'Virginia', '', 'CESTAFF', '09:20', null, '09:20 --:--', 'severe_delay', 80, true, true, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '10000022', 'Kenneth', '', 'CESTAFF', '08:15', null, '08:15 --:--', 'grace_period', 15, false, true, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '10000023', 'Salesio', '', 'CESTAFF', null, null, '--:-- --:--', 'absent', 0, false, false, 'e1111111-1111-4111-8111-111111111101'),
  ('2026-07-09', '10000024', 'Protocols', '1512235212', 'CESTAFF', null, null, '--:-- --:--', 'absent', 0, false, false, 'e1111111-1111-4111-8111-111111111101')
ON CONFLICT (attendance_date, employee_id) DO UPDATE SET
  check_in = EXCLUDED.check_in,
  status = EXCLUDED.status,
  delay_minutes = EXCLUDED.delay_minutes,
  is_late = EXCLUDED.is_late,
  is_present = EXCLUDED.is_present,
  all_punches = EXCLUDED.all_punches,
  updated_at = now();

COMMIT;
