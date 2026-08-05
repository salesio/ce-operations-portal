-- Optional synthetic demo data for Backend Phase 9. Apply after migration 0009.

INSERT INTO public.programs
  (id, program_code, name, description, program_type, church_id, church_name, start_date, end_date, location, status, responsible_staff_id, responsible_name, expected_attendance, actual_attendance, requires_registration, requires_media, requires_budget, requires_resources, budget_status, media_status, metadata)
VALUES
  ('91000000-0000-4000-8000-000000000001','PRG-DEMO-001','Healing Streams','Programa demonstrativo','Healing Streams',(SELECT id FROM public.churches ORDER BY created_at LIMIT 1),'Igreja Demo',current_date + 14,current_date + 16,'Auditório Demo','Approved',(SELECT id FROM public.staff_members ORDER BY created_at LIMIT 1),'Coordenador Demo',500,0,true,true,true,true,'Approved','Requested','{"demo":true,"automatic_finance_record":false}'),
  ('91000000-0000-4000-8000-000000000002','PRG-DEMO-002','Graduation Foundation School','Graduação demonstrativa','Graduation',(SELECT id FROM public.churches ORDER BY created_at LIMIT 1),'Igreja Demo',current_date + 30,current_date + 30,'Salão Principal','Planned',(SELECT id FROM public.staff_members ORDER BY created_at OFFSET 1 LIMIT 1),'Responsável Demo',120,0,true,true,true,true,'Planned','Requested','{"demo":true,"automatic_finance_record":false}'),
  ('91000000-0000-4000-8000-000000000003','PRG-DEMO-003','Pray-a-thon','Oração demonstrativa','Pray-a-thon',(SELECT id FROM public.churches ORDER BY created_at LIMIT 1),'Igreja Demo',current_date + 5,current_date + 5,'Sala de Oração','Active',(SELECT id FROM public.staff_members ORDER BY created_at OFFSET 2 LIMIT 1),'Responsável Demo',80,45,false,true,false,true,'Not Required','Scheduled','{"demo":true,"automatic_finance_record":false}'),
  ('91000000-0000-4000-8000-000000000004','PRG-DEMO-004','Evangelism Program','Evangelismo demonstrativo','Evangelism',(SELECT id FROM public.churches ORDER BY created_at LIMIT 1),'Igreja Demo',current_date - 10,current_date - 10,'Zona Demo','Completed',(SELECT id FROM public.staff_members ORDER BY created_at LIMIT 1),'Coordenador Demo',100,92,false,true,true,true,'Closed','Completed','{"demo":true,"automatic_finance_record":false}'),
  ('91000000-0000-4000-8000-000000000005','PRG-DEMO-005','Leadership Training','Treino demonstrativo','Training',(SELECT id FROM public.churches ORDER BY created_at LIMIT 1),'Igreja Demo',current_date + 45,current_date + 46,'Sala de Formação','Planned',(SELECT id FROM public.staff_members ORDER BY created_at OFFSET 1 LIMIT 1),'Formador Demo',60,0,true,false,true,true,'Submitted','Not Required','{"demo":true,"automatic_finance_record":false}'),
  ('91000000-0000-4000-8000-000000000006','PRG-DEMO-006','Special Sunday Service','Culto especial demonstrativo','Church Service',(SELECT id FROM public.churches ORDER BY created_at LIMIT 1),'Igreja Demo',current_date + 7,current_date + 7,'Auditório Principal','Planned',(SELECT id FROM public.staff_members ORDER BY created_at LIMIT 1),'Pastor Demo',350,0,false,true,false,true,'Not Required','Requested','{"demo":true,"automatic_finance_record":false}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.program_sessions
  (id, program_id, session_title, session_date, start_time, end_time, speaker_name, speaker_staff_id, location, expected_attendance, status, metadata)
SELECT ('91100000-0000-4000-8000-' || lpad(row_number() OVER ()::text,12,'0'))::uuid, p.id,
       p.name || ' — Sessão ' || s.n, p.start_date + (s.n - 1), '09:00', '11:00', 'Orador Demo',
       (SELECT id FROM public.staff_members ORDER BY created_at LIMIT 1), p.location, p.expected_attendance,
       CASE WHEN p.status = 'Completed' THEN 'Completed' ELSE 'Planned' END, '{"demo":true}'::jsonb
FROM public.programs p CROSS JOIN (VALUES (1),(2)) AS s(n)
WHERE p.metadata->>'demo'='true'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.program_teams
  (id, program_id, team_name, team_type, leader_staff_id, leader_name, member_staff_ids, member_names, responsibilities, status, metadata)
SELECT ('91200000-0000-4000-8000-' || lpad(row_number() OVER ()::text,12,'0'))::uuid, p.id,
       t.team_type || ' — ' || p.name, t.team_type, (SELECT id FROM public.staff_members ORDER BY created_at LIMIT 1),
       'Líder Demo', '[]'::jsonb, '["Membro Demo A","Membro Demo B"]'::jsonb,
       'Responsabilidades demonstrativas', 'Active', '{"demo":true}'::jsonb
FROM public.programs p CROSS JOIN (VALUES ('Coordination'),('Media'),('Protocol'),('Finance'),('Logistics')) AS t(team_type)
WHERE p.id IN ('91000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.program_participants
  (id, program_id, participant_type, member_id, first_timer_id, staff_id, full_name, phone, church_id, church_name, attendance_status, metadata)
SELECT ('91300000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
       ('91000000-0000-4000-8000-' || lpad((((n - 1) % 6) + 1)::text,12,'0'))::uuid,
       CASE WHEN n % 4 = 0 THEN 'Guest' WHEN n % 3 = 0 THEN 'First Timer' WHEN n % 2 = 0 THEN 'Member' ELSE 'Staff' END,
       CASE WHEN n % 2 = 0 THEN (SELECT id FROM public.members ORDER BY created_at OFFSET ((n - 1) % 3) LIMIT 1) END,
       CASE WHEN n % 3 = 0 THEN (SELECT id FROM public.first_timers ORDER BY created_at OFFSET ((n - 1) % 3) LIMIT 1) END,
       CASE WHEN n % 2 = 1 THEN (SELECT id FROM public.staff_members ORDER BY created_at OFFSET ((n - 1) % 3) LIMIT 1) END,
       'Participante Demo ' || n, '+25885000' || lpad(n::text,3,'0'),
       (SELECT id FROM public.churches ORDER BY created_at LIMIT 1), 'Igreja Demo',
       CASE WHEN n <= 6 THEN 'Attended' ELSE 'Registered' END, '{"demo":true}'::jsonb
FROM generate_series(1,18) n ON CONFLICT (id) DO NOTHING;

INSERT INTO public.program_registrations
  (id, program_id, registration_number, full_name, phone, church_id, church_name, member_id, first_timer_id, registration_source, status, payment_required, payment_status, amount, currency, metadata)
SELECT ('91400000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
       CASE WHEN n <= 6 THEN '91000000-0000-4000-8000-000000000001'::uuid ELSE '91000000-0000-4000-8000-000000000005'::uuid END,
       'REG-DEMO-' || lpad(n::text,3,'0'), 'Registo Demo ' || n, '+25886000' || lpad(n::text,3,'0'),
       (SELECT id FROM public.churches ORDER BY created_at LIMIT 1), 'Igreja Demo',
       CASE WHEN n % 2=0 THEN (SELECT id FROM public.members ORDER BY created_at OFFSET ((n-1)%3) LIMIT 1) END,
       CASE WHEN n % 3=0 THEN (SELECT id FROM public.first_timers ORDER BY created_at OFFSET ((n-1)%3) LIMIT 1) END,
       'Manual Entry', CASE WHEN n <= 8 THEN 'Confirmed' ELSE 'Pending' END,
       n % 4=0, CASE WHEN n % 4=0 THEN 'Pending' ELSE 'Not Required' END,
       CASE WHEN n % 4=0 THEN 500 ELSE 0 END, 'MZN', '{"demo":true,"finance_record_created":false}'::jsonb
FROM generate_series(1,12) n ON CONFLICT (id) DO NOTHING;

INSERT INTO public.program_resources
  (id, program_id, resource_type, resource_name, quantity, unit, inventory_item_id, venue_space_id, requisition_id, status, assigned_to_name, metadata)
VALUES
 ('91500000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','Equipment','Microphones',4,'unit',(SELECT id FROM public.inventory_items ORDER BY created_at LIMIT 1),null,null,'Reserved','Logística Demo','{"demo":true,"inventory_movement_created":false}'),
 ('91500000-0000-4000-8000-000000000002','91000000-0000-4000-8000-000000000001','Equipment','Projector',1,'unit',(SELECT id FROM public.inventory_items ORDER BY created_at OFFSET 1 LIMIT 1),null,null,'Available','Media Demo','{"demo":true,"inventory_movement_created":false}'),
 ('91500000-0000-4000-8000-000000000003','91000000-0000-4000-8000-000000000002','Furniture','Chairs',120,'unit',null,(SELECT id FROM public.venue_spaces ORDER BY created_at LIMIT 1),null,'Requested','Protocolo Demo','{"demo":true,"inventory_movement_created":false}'),
 ('91500000-0000-4000-8000-000000000004','91000000-0000-4000-8000-000000000006','Equipment','Camera',2,'unit',(SELECT id FROM public.inventory_items ORDER BY created_at OFFSET 2 LIMIT 1),null,(SELECT id FROM public.requisitions ORDER BY created_at LIMIT 1),'Approved','Media Demo','{"demo":true,"inventory_movement_created":false}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.program_budgets
  (id, program_id, budget_item, category, estimated_amount, approved_amount, spent_amount, currency, requisition_id, finance_disbursement_id, status, approved_by_name, approved_at, metadata)
VALUES
 ('91600000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','Venue preparation','Logistics',25000,20000,0,'MZN',null,null,'Approved','Aprovador Demo',now(),'{"demo":true,"planning_only":true,"expense_created":false}'),
 ('91600000-0000-4000-8000-000000000002','91000000-0000-4000-8000-000000000002','Graduation materials','Materials',15000,0,0,'MZN',(SELECT id FROM public.requisitions ORDER BY created_at LIMIT 1),null,'Submitted',null,null,'{"demo":true,"planning_only":true,"expense_created":false}'),
 ('91600000-0000-4000-8000-000000000003','91000000-0000-4000-8000-000000000004','Transport','Logistics',8000,8000,7600,'MZN',null,(SELECT id FROM public.finance_disbursements ORDER BY created_at LIMIT 1),'Released','Aprovador Demo',now(),'{"demo":true,"planning_only":true,"expense_created":false}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.program_checklists
  (id, program_id, checklist_type, title, assigned_to_name, due_date, completed, completed_at, completed_by_name, status, metadata)
VALUES
 ('91700000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','General','Confirm venue','Coordenador Demo',current_date+7,false,null,null,'Open','{"demo":true}'),
 ('91700000-0000-4000-8000-000000000002','91000000-0000-4000-8000-000000000004','Media','Deliver media coverage','Media Demo',current_date-10,true,now(),'Media Lead Demo','Completed','{"demo":true}'),
 ('91700000-0000-4000-8000-000000000003','91000000-0000-4000-8000-000000000002','Protocol','Confirm graduates','Protocolo Demo',current_date-1,false,null,null,'Overdue','{"demo":true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.program_reports
  (id, program_id, report_title, report_type, summary, attendance_total, first_timers_total, new_converts_total, testimonies_count, financial_summary, media_summary, status, submitted_by_name, submitted_at, approved_by_name, approved_at, metadata)
VALUES
 ('91800000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000004','Evangelism report','Impact','Relatório demonstrativo',92,18,11,4,'{"planning_only":true}','{"coverage":"completed"}','Approved','Coordenador Demo',now(),'Pastor Demo',now(),'{"demo":true,"finance_records_modified":false}'),
 ('91800000-0000-4000-8000-000000000002','91000000-0000-4000-8000-000000000003','Pray-a-thon draft','Execution','Rascunho demonstrativo',45,2,0,1,'{}','{"coverage":"scheduled"}','Draft',null,null,null,null,'{"demo":true,"finance_records_modified":false}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.media_roles (id,name,slug,category,requires_equipment,requires_training,status,metadata)
VALUES
 ('92000000-0000-4000-8000-000000000001','Camera Operator','camera-operator','Camera',true,true,'Active','{"demo":true}'),
 ('92000000-0000-4000-8000-000000000002','Sound Technician','sound-technician','Sound',true,true,'Active','{"demo":true}'),
 ('92000000-0000-4000-8000-000000000003','Streaming Operator','streaming-operator','Streaming',true,true,'Active','{"demo":true}'),
 ('92000000-0000-4000-8000-000000000004','Photographer','photographer','Photography',true,false,'Active','{"demo":true}'),
 ('92000000-0000-4000-8000-000000000005','Graphics Designer','graphics-designer','Graphics',true,true,'Active','{"demo":true}'),
 ('92000000-0000-4000-8000-000000000006','Projection Operator','projection-operator','Projection',true,true,'Active','{"demo":true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.media_team_members
  (id,staff_id,full_name,phone,church_id,church_name,media_role_id,media_role_name,skills,can_operate_camera,can_operate_sound,can_operate_streaming,can_edit_video,can_design_graphics,status,assigned_equipment_ids,metadata)
SELECT ('92100000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
       (SELECT id FROM public.staff_members ORDER BY created_at OFFSET ((n-1)%3) LIMIT 1),
       'Media Team Demo '||n,'+25887000'||lpad(n::text,3,'0'),(SELECT id FROM public.churches ORDER BY created_at LIMIT 1),'Igreja Demo',
       ('92000000-0000-4000-8000-'||lpad((((n-1)%6)+1)::text,12,'0'))::uuid,
       (ARRAY['Camera Operator','Sound Technician','Streaming Operator','Photographer','Graphics Designer','Projection Operator'])[((n-1)%6)+1],
       jsonb_build_array('Skill Demo'),n%6=1,n%6=2,n%6=3,n%6=5,n%6=5,'Active','[]'::jsonb,
       '{"demo":true,"inventory_movement_created":false}'::jsonb
FROM generate_series(1,6)n ON CONFLICT (id) DO NOTHING;

INSERT INTO public.media_services
  (id,service_code,church_id,church_name,program_id,service_name,service_type,service_date,start_time,end_time,requires_streaming,requires_recording,requires_photography,requires_projection,requires_sound,requires_graphics,status,media_lead_id,media_lead_name,metadata)
SELECT ('92200000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'MDS-DEMO-'||lpad(n::text,3,'0'),
       (SELECT id FROM public.churches ORDER BY created_at LIMIT 1),'Igreja Demo',p.id,
       'Media — '||p.name,p.program_type,p.start_date,'08:00','18:00',true,true,n%2=0,true,true,n%3=0,
       CASE WHEN p.status='Completed' THEN 'Completed' ELSE 'Scheduled' END,
       '92100000-0000-4000-8000-000000000001','Media Lead Demo','{"demo":true,"heavy_livestream_managed":false,"finance_record_created":false}'::jsonb
FROM (SELECT row_number() OVER (ORDER BY id) n,* FROM public.programs WHERE requires_media=true AND metadata->>'demo'='true') p
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.media_schedules
  (id,media_service_id,team_member_id,staff_id,role_name,assignment_title,start_time,end_time,status,confirmed,confirmed_at,metadata)
SELECT ('92300000-0000-4000-8000-'||lpad(row_number() OVER ()::text,12,'0'))::uuid,s.id,t.id,t.staff_id,t.media_role_name,
       'Cobertura Demo',s.start_time,s.end_time,CASE WHEN s.status='Completed' THEN 'Completed' ELSE 'Confirmed' END,true,now(),'{"demo":true}'::jsonb
FROM public.media_services s CROSS JOIN LATERAL (SELECT * FROM public.media_team_members ORDER BY id LIMIT 3) t
WHERE s.metadata->>'demo'='true' ON CONFLICT (id) DO NOTHING;

INSERT INTO public.media_channels
  (id,channel_name,platform,url,public_handle,church_id,church_name,is_active,streaming_enabled,metadata)
VALUES
 ('92400000-0000-4000-8000-000000000001','CE Demo YouTube','YouTube','https://youtube.com/@ce-demo','@ce-demo',(SELECT id FROM public.churches ORDER BY created_at LIMIT 1),'Igreja Demo',true,true,'{"demo":true,"public_metadata_only":true}'),
 ('92400000-0000-4000-8000-000000000002','CE Demo Facebook','Facebook','https://facebook.com/ce-demo','ce-demo',(SELECT id FROM public.churches ORDER BY created_at LIMIT 1),'Igreja Demo',true,true,'{"demo":true,"public_metadata_only":true}'),
 ('92400000-0000-4000-8000-000000000003','CE Demo Instagram','Instagram','https://instagram.com/ce-demo','@ce-demo',(SELECT id FROM public.churches ORDER BY created_at LIMIT 1),'Igreja Demo',true,false,'{"demo":true,"public_metadata_only":true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.media_performance_records
  (id,media_service_id,team_member_id,staff_id,service_date,role_name,punctuality_score,technical_score,teamwork_score,communication_score,overall_score,reviewed_by_name,metadata)
SELECT ('92500000-0000-4000-8000-'||lpad(row_number() OVER ()::text,12,'0'))::uuid,s.id,t.id,t.staff_id,s.service_date,t.media_role_name,
       85,88,90,87,87.5,'Media Lead Demo','{"demo":true}'::jsonb
FROM public.media_services s CROSS JOIN LATERAL (SELECT * FROM public.media_team_members ORDER BY id LIMIT 2) t
WHERE s.metadata->>'demo'='true' ON CONFLICT (id) DO NOTHING;

INSERT INTO public.media_awards
  (id,team_member_id,staff_id,award_title,award_description,award_date,awarded_by_name,status,metadata)
SELECT '92600000-0000-4000-8000-000000000001',id,staff_id,'Media Excellence Demo','Reconhecimento demonstrativo',current_date,'Media Lead Demo','Awarded','{"demo":true}'::jsonb
FROM public.media_team_members WHERE metadata->>'demo'='true' ORDER BY id LIMIT 1
ON CONFLICT (id) DO NOTHING;
