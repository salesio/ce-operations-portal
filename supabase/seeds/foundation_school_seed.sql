-- Optional demo data for Backend Phase 8. No real personal data.
-- Apply only after 0008_foundation_school_pilot.sql.

INSERT INTO public.foundation_school_lessons (lesson_number, title, requires_practical, metadata)
VALUES
  (1, 'Aula 1', false, '{"demo":true}'), (2, 'Aula 2', false, '{"demo":true}'),
  (3, 'Aula 3', false, '{"demo":true}'), (4, 'Aula 4 — Ganhar Almas / Prática', true, '{"demo":true}'),
  (5, 'Aula 5', false, '{"demo":true}'), (6, 'Aula 6', false, '{"demo":true}'),
  (7, 'Aula 7', false, '{"demo":true}')
ON CONFLICT (lesson_number) DO NOTHING;

INSERT INTO public.foundation_school_teachers
  (id, teacher_number, staff_id, full_name, church_id, church_name, role, can_teach_online, can_teach_prisons, can_teach_home, metadata)
VALUES
  ('81000000-0000-4000-8000-000000000001', 'FST-DEMO-001', (SELECT id FROM public.staff_members ORDER BY created_at LIMIT 1), 'Professor Demo A', (SELECT id FROM public.churches ORDER BY created_at LIMIT 1), 'Igreja Demo', 'Reitor', true, false, false, '{"demo":true}'),
  ('81000000-0000-4000-8000-000000000002', 'FST-DEMO-002', (SELECT id FROM public.staff_members ORDER BY created_at OFFSET 1 LIMIT 1), 'Professor Demo B', (SELECT id FROM public.churches ORDER BY created_at LIMIT 1), 'Igreja Demo', 'Professor', false, true, false, '{"demo":true}'),
  ('81000000-0000-4000-8000-000000000003', 'FST-DEMO-003', (SELECT id FROM public.staff_members ORDER BY created_at OFFSET 2 LIMIT 1), 'Professor Demo C', (SELECT id FROM public.churches ORDER BY created_at LIMIT 1), 'Igreja Demo', 'Assistente', true, false, true, '{"demo":true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.foundation_school_classes
  (id, class_code, name, church_id, church_name, modality, teacher_id, teacher_name, start_date, schedule_day, schedule_time, location, status, metadata)
VALUES
  ('82000000-0000-4000-8000-000000000001', 'FSC-DEMO-001', 'Turma Presencial Demo', (SELECT id FROM public.churches ORDER BY created_at LIMIT 1), 'Igreja Demo', 'Presencial', '81000000-0000-4000-8000-000000000001', 'Professor Demo A', current_date - 45, 'Sábado', '09:00', 'Sala Demo 1', 'Active', '{"demo":true}'),
  ('82000000-0000-4000-8000-000000000002', 'FSC-DEMO-002', 'Turma Online Demo', (SELECT id FROM public.churches ORDER BY created_at LIMIT 1), 'Igreja Demo', 'Online', '81000000-0000-4000-8000-000000000002', 'Professor Demo B', current_date - 30, 'Quarta-feira', '18:00', 'Online', 'Active', '{"demo":true}'),
  ('82000000-0000-4000-8000-000000000003', 'FSC-DEMO-003', 'Turma Domicílio Demo', (SELECT id FROM public.churches ORDER BY created_at LIMIT 1), 'Igreja Demo', 'Domicílio', '81000000-0000-4000-8000-000000000003', 'Professor Demo C', current_date + 7, 'Domingo', '15:00', 'Zona Demo', 'Planned', '{"demo":true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.foundation_school_enrollments
  (id, enrollment_number, church_id, church_name, first_timer_id, member_id, full_name, phone, source, source_id, modality, status, assigned_class_id, enrollment_date, metadata)
SELECT
  ('83000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  'FSE-DEMO-' || lpad(n::text, 3, '0'),
  (SELECT id FROM public.churches ORDER BY created_at LIMIT 1), 'Igreja Demo',
  CASE WHEN n <= 3 THEN (SELECT id FROM public.first_timers ORDER BY created_at OFFSET (n - 1) LIMIT 1) END,
  CASE WHEN n BETWEEN 4 AND 6 THEN (SELECT id FROM public.members ORDER BY created_at OFFSET (n - 4) LIMIT 1) END,
  'Aluno Demo ' || n, '+25884000' || lpad(n::text, 3, '0'),
  CASE WHEN n <= 3 THEN 'First Timer' WHEN n <= 6 THEN 'Member' ELSE 'Manual' END,
  CASE WHEN n <= 3 THEN (SELECT id FROM public.first_timers ORDER BY created_at OFFSET (n - 1) LIMIT 1)
       WHEN n <= 6 THEN (SELECT id FROM public.members ORDER BY created_at OFFSET (n - 4) LIMIT 1) END,
  CASE WHEN n > 8 THEN 'Online' ELSE 'Presencial' END, 'Enrolled',
  CASE WHEN n <= 6 THEN '82000000-0000-4000-8000-000000000001'::uuid ELSE '82000000-0000-4000-8000-000000000002'::uuid END,
  current_date - (20 - n), jsonb_build_object('demo', true, 'automatic_member_creation', false)
FROM generate_series(1, 12) AS n
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.foundation_school_students
  (id, student_number, enrollment_id, class_id, church_id, church_name, first_timer_id, member_id, full_name, phone, modality, status, lessons_completed, lesson_progress_percentage, metadata)
SELECT
  ('84000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  'FSS-DEMO-' || lpad(n::text, 3, '0'),
  ('83000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  CASE WHEN n <= 6 THEN '82000000-0000-4000-8000-000000000001'::uuid ELSE '82000000-0000-4000-8000-000000000002'::uuid END,
  (SELECT id FROM public.churches ORDER BY created_at LIMIT 1), 'Igreja Demo',
  CASE WHEN n <= 3 THEN (SELECT id FROM public.first_timers ORDER BY created_at OFFSET (n - 1) LIMIT 1) END,
  CASE WHEN n BETWEEN 4 AND 6 THEN (SELECT id FROM public.members ORDER BY created_at OFFSET (n - 4) LIMIT 1) END,
  'Aluno Demo ' || n, '+25884000' || lpad(n::text, 3, '0'),
  CASE WHEN n > 8 THEN 'Online' ELSE 'Presencial' END,
  CASE WHEN n <= 4 THEN 'Awaiting Final Exam' ELSE 'Active' END,
  CASE WHEN n <= 4 THEN 7 ELSE n % 7 END,
  CASE WHEN n <= 4 THEN 100 ELSE round(((n % 7)::numeric / 7) * 100, 2) END,
  '{"demo":true,"certificate_generated":false}'::jsonb
FROM generate_series(1, 12) AS n
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.foundation_school_online_tests (id, lesson_number, title, form_url, metadata)
SELECT ('85000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, n, 'Teste Demo — Aula ' || n,
       'https://forms.example.invalid/foundation/lesson-' || n, '{"demo":true,"external_api":false}'::jsonb
FROM generate_series(1, 7) AS n
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.foundation_school_lesson_progress
  (student_id, class_id, lesson_id, lesson_number, lesson_title, status, completed, completed_at, teacher_id, teacher_name, metadata)
SELECT s.id, s.class_id, l.id, l.lesson_number, l.title, 'Completed', true, now() - (8 - l.lesson_number) * interval '1 day',
       '81000000-0000-4000-8000-000000000001', 'Professor Demo A', '{"demo":true}'::jsonb
FROM public.foundation_school_students s
JOIN public.foundation_school_lessons l ON l.lesson_number <= CASE WHEN s.lessons_completed = 0 THEN 1 ELSE s.lessons_completed END
WHERE s.metadata->>'demo' = 'true'
ON CONFLICT (student_id, lesson_number) DO NOTHING;

INSERT INTO public.foundation_school_attendance
  (class_id, student_id, lesson_id, lesson_number, attendance_date, status, teacher_id, teacher_name, recorded_by_name, metadata)
SELECT p.class_id, p.student_id, p.lesson_id, p.lesson_number, current_date - (8 - p.lesson_number), 'Present', p.teacher_id, p.teacher_name, 'Utilizador Demo', '{"demo":true}'::jsonb
FROM public.foundation_school_lesson_progress p
JOIN public.foundation_school_students s ON s.id = p.student_id
WHERE s.metadata->>'demo' = 'true';

INSERT INTO public.foundation_school_test_results
  (student_id, class_id, lesson_number, online_test_id, score, max_score, percentage, passed, submitted_at, recorded_by_name, source, metadata)
SELECT p.student_id, p.class_id, p.lesson_number, t.id, 70 + (p.lesson_number % 4) * 5, 100, 70 + (p.lesson_number % 4) * 5, true, now(), 'Utilizador Demo', 'Manual Entry', '{"demo":true}'::jsonb
FROM public.foundation_school_lesson_progress p
JOIN public.foundation_school_online_tests t ON t.lesson_number = p.lesson_number
JOIN public.foundation_school_students s ON s.id = p.student_id
WHERE s.metadata->>'demo' = 'true';

INSERT INTO public.foundation_school_soul_winning
  (student_id, class_id, practical_date, location, souls_won_count, first_timers_invited_count, first_timers_attended_count, supervised_by_teacher_id, supervised_by_teacher_name, approved, approved_by_name, approved_at, metadata)
SELECT id, class_id, current_date - 5, 'Local Demo', (right(student_number, 1)::integer % 4), 2, 1,
       '81000000-0000-4000-8000-000000000001', 'Professor Demo A', true, 'Reitor Demo', now(), '{"demo":true,"first_timers_created":false}'::jsonb
FROM public.foundation_school_students WHERE lessons_completed >= 4 AND metadata->>'demo' = 'true';

INSERT INTO public.foundation_school_final_exams
  (id, student_id, class_id, exam_date, exam_score, max_score, percentage, passed, graded_by_name, graded_at, metadata)
SELECT ('86000000-0000-4000-8000-' || lpad(row_number() OVER (ORDER BY id)::text, 12, '0'))::uuid,
       id, class_id, current_date - 2, 75, 100, 75, true, 'Avaliador Demo', now(), '{"demo":true,"scan_uploaded":false}'::jsonb
FROM public.foundation_school_students WHERE lessons_completed = 7 AND metadata->>'demo' = 'true'
ON CONFLICT (id) DO NOTHING;

UPDATE public.foundation_school_students s SET
  tests_average = x.average_score,
  final_exam_score = e.percentage,
  final_grade = round((x.average_score * 0.4 + e.percentage * 0.6)::numeric, 2),
  passed = (x.average_score * 0.4 + e.percentage * 0.6) >= 50,
  status = CASE WHEN (x.average_score * 0.4 + e.percentage * 0.6) >= 50 THEN 'Passed' ELSE 'Failed' END
FROM (SELECT student_id, avg(percentage) average_score FROM public.foundation_school_test_results GROUP BY student_id) x,
     public.foundation_school_final_exams e
WHERE s.id = x.student_id AND e.student_id = s.id AND s.metadata->>'demo' = 'true';

INSERT INTO public.foundation_school_graduations
  (id, graduation_number, church_id, church_name, class_id, graduation_date, graduation_title, student_ids, student_count, status, approved_by_name, approved_at, metadata)
SELECT '87000000-0000-4000-8000-000000000001', 'FSG-DEMO-001', (SELECT id FROM public.churches ORDER BY created_at LIMIT 1),
       'Igreja Demo', '82000000-0000-4000-8000-000000000001', current_date + 14, 'Graduação Demo',
       coalesce(jsonb_agg(id), '[]'::jsonb), count(*), 'Planned', null, null,
       '{"demo":true,"certificates_generated":false,"members_created":false}'::jsonb
FROM public.foundation_school_students WHERE passed = true AND metadata->>'demo' = 'true'
ON CONFLICT (id) DO NOTHING;
