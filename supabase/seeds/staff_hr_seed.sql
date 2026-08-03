-- Demo seed for Backend Phase 7 - Staff & RH + Documents.
-- Mock data only. Salaries are operational demo records and not finance expenses.

INSERT INTO public.staff_departments (id, name, slug, department_type, head_name, church_id, status, metadata)
VALUES
  ('b7000000-0000-4000-8000-000000000001', 'Staff & Recursos Humanos', 'staff-recursos-humanos', 'Admin', 'Admin Principal', 'a1111111-1111-4111-8111-111111111101', 'Active', '{"demo": true}'::jsonb),
  ('b7000000-0000-4000-8000-000000000002', 'Midia', 'midia', 'Departments', 'Marcelo Panguene', 'a1111111-1111-4111-8111-111111111101', 'Active', '{"demo": true}'::jsonb),
  ('b7000000-0000-4000-8000-000000000003', 'Cuidados Pastorais', 'cuidados-pastorais', 'Pastoral Care', 'Coordenador Pastoral', 'a1111111-1111-4111-8111-111111111101', 'Active', '{"demo": true}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  updated_at = now();

INSERT INTO public.staff_roles (id, name, title, slug, department_id, employment_type, role_level, status, metadata)
VALUES
  ('b7000000-0000-4000-8000-000000000011', 'Gestor de RH', 'Gestor de RH', 'gestor-rh', 'b7000000-0000-4000-8000-000000000001', 'Full Time', 'Manager', 'Active', '{"default_permissions":["staff.hr"]}'::jsonb),
  ('b7000000-0000-4000-8000-000000000012', 'Tecnico de Midia', 'Tecnico de Midia', 'tecnico-midia', 'b7000000-0000-4000-8000-000000000002', 'Volunteer', 'Operator', 'Active', '{"default_permissions":["media.schedules"]}'::jsonb),
  ('b7000000-0000-4000-8000-000000000013', 'Conselheiro', 'Conselheiro', 'conselheiro', 'b7000000-0000-4000-8000-000000000003', 'Volunteer', 'Worker', 'Active', '{"default_permissions":["pastoral.care"]}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  updated_at = now();

INSERT INTO public.staff_members (
  id, staff_code, staff_number, first_name, last_name, full_name, phone, email,
  church_id, church_name, department_id, department_name, role_id, role_name,
  employment_status, employment_type, hire_date, has_dashboard_access,
  can_access_dashboard, salary_enabled, salary_visibility, status, metadata
)
VALUES
  ('b7000000-0000-4000-8000-000000000021', 'STF-001', 'STF-001', 'Admin', 'Principal', 'Admin Principal', '+258862270000', 'admin.demo@ce.local', 'a1111111-1111-4111-8111-111111111101', 'E.C. Maputo Central - Sede', 'b7000000-0000-4000-8000-000000000001', 'Staff & Recursos Humanos', 'b7000000-0000-4000-8000-000000000011', 'Gestor de RH', 'Active', 'Full Time', '2026-01-01', true, true, true, 'HR Only', 'Active', '{"demo": true}'::jsonb),
  ('b7000000-0000-4000-8000-000000000022', 'STF-002', 'STF-002', 'Marcelo', 'Panguene', 'Marcelo Panguene', '+258861110001', 'marcelo.demo@ce.local', 'a1111111-1111-4111-8111-111111111101', 'E.C. Maputo Central - Sede', 'b7000000-0000-4000-8000-000000000002', 'Midia', 'b7000000-0000-4000-8000-000000000012', 'Tecnico de Midia', 'Active', 'Volunteer', '2026-02-01', true, true, false, 'HR Only', 'Active', '{"demo": true}'::jsonb),
  ('b7000000-0000-4000-8000-000000000023', 'STF-003', 'STF-003', 'Aminata', 'Chivinda', 'Aminata Chivinda', '+258861110002', 'aminata.demo@ce.local', 'a1111111-1111-4111-8111-111111111101', 'E.C. Maputo Central - Sede', 'b7000000-0000-4000-8000-000000000003', 'Cuidados Pastorais', 'b7000000-0000-4000-8000-000000000013', 'Conselheiro', 'Active', 'Volunteer', '2026-03-01', false, false, false, 'HR Only', 'Active', '{"demo": true}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  staff_number = EXCLUDED.staff_number,
  updated_at = now();

INSERT INTO public.staff_salaries (
  id, staff_id, staff_number, staff_name, church_id, department_id, salary_or_allowance,
  base_amount, base_salary, allowances, deductions, net_amount, net_salary,
  currency, effective_from, payment_method, verification_status, status, metadata
)
VALUES
  ('b7000000-0000-4000-8000-000000000031', 'b7000000-0000-4000-8000-000000000021', 'STF-001', 'Admin Principal', 'a1111111-1111-4111-8111-111111111101', 'b7000000-0000-4000-8000-000000000001', 'Salary', 0, 0, 0, 0, 0, 0, 'MTn', '2026-07-01', 'Banco', 'Pending Verification', 'Active', '{"demo": true, "no_finance_record_created": true}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  metadata = EXCLUDED.metadata,
  updated_at = now();

INSERT INTO public.staff_performance_reviews (
  id, staff_id, staff_number, staff_name, church_id, department_id, review_period,
  review_date, evaluator_name, score, spiritual_commitment_score, punctuality_score,
  teamwork_score, excellence_score, improvement_areas, goals, progress, review_notes, status, metadata
)
VALUES
  ('b7000000-0000-4000-8000-000000000041', 'b7000000-0000-4000-8000-000000000022', 'STF-002', 'Marcelo Panguene', 'a1111111-1111-4111-8111-111111111101', 'b7000000-0000-4000-8000-000000000002', '2026-H1', '2026-07-15', 'Admin Principal', 88, 90, 85, 90, 87, 'Documentar processos tecnicos.', 'Treinar dois novos operadores.', 'On Track', 'Bom desempenho demo.', 'Pending Verification', '{"demo": true}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  score = EXCLUDED.score,
  updated_at = now();

INSERT INTO public.staff_documents (
  id, staff_id, staff_number, staff_name, church_id, document_type, document_title,
  file_name, storage_bucket, storage_path, is_sensitive, expiry_date,
  uploaded_by_name, status, notes, metadata
)
VALUES
  ('b7000000-0000-4000-8000-000000000051', 'b7000000-0000-4000-8000-000000000021', 'STF-001', 'Admin Principal', 'a1111111-1111-4111-8111-111111111101', 'ID', 'Documento de Identificacao', 'demo-id.pdf', 'staff-documents', 'mock://staff-documents/demo-id.pdf', true, '2027-07-01', 'Admin Principal', 'Pending Review', 'Metadata only. Private storage bucket later.', '{"demo": true}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = now();

INSERT INTO public.staff_attendance (
  id, staff_id, staff_number, staff_name, church_id, department_id,
  attendance_date, attendance_type, check_in, check_out, hours_worked, status, metadata
)
VALUES
  ('b7000000-0000-4000-8000-000000000061', 'b7000000-0000-4000-8000-000000000022', 'STF-002', 'Marcelo Panguene', 'a1111111-1111-4111-8111-111111111101', 'b7000000-0000-4000-8000-000000000002', '2026-07-19', 'Service', '07:00', '12:30', 5.5, 'Present', '{"demo": true}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = now();
