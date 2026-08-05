-- Synthetic Phase 10 demo data only. No real people, confidential notes, or documents.

INSERT INTO public.counselors (id, full_name, phone, email, specializations, can_handle_marital, can_handle_family, status, metadata)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'Demo Counselor One', '+258 840 000 101', 'counselor.one@example.invalid', '["Marital","Family"]', true, true, 'Active', '{"synthetic":true}'),
  ('10000000-0000-4000-8000-000000000002', 'Demo Counselor Two', '+258 840 000 102', 'counselor.two@example.invalid', '["Spiritual Growth","Youth"]', false, false, 'Active', '{"synthetic":true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.counseling_requests (id, request_number, person_type, full_name, phone, topic, category, priority, preferred_date, status, assigned_counselor_id, assigned_counselor_name, summary, metadata)
VALUES
  ('11000000-0000-4000-8000-000000000001', 'CON-DEMO-001', 'Member', 'Demo Person Alpha', '+258 840 001 001', 'Family support', 'Family', 'Normal', current_date + 3, 'Pending', null, null, 'Synthetic request without sensitive detail.', '{"synthetic":true}'),
  ('11000000-0000-4000-8000-000000000002', 'CON-DEMO-002', 'First Timer', 'Demo Person Beta', '+258 840 001 002', 'Spiritual growth', 'Spiritual Growth', 'High', current_date + 1, 'Assigned', '10000000-0000-4000-8000-000000000002', 'Demo Counselor Two', 'Synthetic assigned request.', '{"synthetic":true}'),
  ('11000000-0000-4000-8000-000000000003', 'CON-DEMO-003', 'Other', 'Demo Person Gamma', '+258 840 001 003', 'Marriage preparation', 'Marital', 'Normal', current_date + 7, 'Scheduled', '10000000-0000-4000-8000-000000000001', 'Demo Counselor One', 'Synthetic scheduled request.', '{"synthetic":true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.counseling_cases (id, case_number, request_id, person_type, full_name, category, topic, priority, status, assigned_counselor_id, assigned_counselor_name, summary, confidential_notes, private_assessment, pastoral_guidance, escalated, escalation_reason, closed_at, closure_reason, metadata)
VALUES
  ('12000000-0000-4000-8000-000000000001', 'CASE-DEMO-001', '11000000-0000-4000-8000-000000000002', 'First Timer', 'Demo Person Beta', 'Spiritual Growth', 'Spiritual growth', 'High', 'In Progress', '10000000-0000-4000-8000-000000000002', 'Demo Counselor Two', 'Synthetic case summary.', null, null, null, false, null, null, null, '{"synthetic":true}'),
  ('12000000-0000-4000-8000-000000000002', 'CASE-DEMO-002', '11000000-0000-4000-8000-000000000003', 'Other', 'Demo Person Gamma', 'Marital', 'Marriage preparation', 'Normal', 'Escalated', '10000000-0000-4000-8000-000000000001', 'Demo Counselor One', 'Synthetic escalated case summary.', null, null, null, true, 'Synthetic pastoral review scenario.', null, null, '{"synthetic":true}'),
  ('12000000-0000-4000-8000-000000000003', 'CASE-DEMO-003', null, 'Member', 'Demo Person Delta', 'Family', 'Family support', 'Normal', 'Closed', '10000000-0000-4000-8000-000000000001', 'Demo Counselor One', 'Synthetic closed case.', null, null, null, false, null, now() - interval '5 days', 'Synthetic completion.', '{"synthetic":true}')
ON CONFLICT (id) DO NOTHING;

UPDATE public.counseling_requests SET case_id = '12000000-0000-4000-8000-000000000001' WHERE id = '11000000-0000-4000-8000-000000000002';
UPDATE public.counseling_requests SET case_id = '12000000-0000-4000-8000-000000000002' WHERE id = '11000000-0000-4000-8000-000000000003';

INSERT INTO public.counseling_appointments (id, case_id, request_id, appointment_date, start_time, end_time, modality, counselor_id, counselor_name, person_name, status, attendance_status, session_summary, confidential_session_notes, metadata)
VALUES
  ('13000000-0000-4000-8000-000000000001', '12000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000002', current_date + 2, '10:00', '10:45', 'Presencial', '10000000-0000-4000-8000-000000000002', 'Demo Counselor Two', 'Demo Person Beta', 'Scheduled', 'Pending', null, null, '{"synthetic":true}'),
  ('13000000-0000-4000-8000-000000000002', '12000000-0000-4000-8000-000000000003', null, current_date - 5, '14:00', '14:45', 'Online', '10000000-0000-4000-8000-000000000001', 'Demo Counselor One', 'Demo Person Delta', 'Completed', 'Attended', 'Synthetic non-confidential session summary.', null, '{"synthetic":true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.counseling_feedback (id, case_id, appointment_id, feedback_type, submitted_by_name, summary, outcome, needs_follow_up, follow_up_recommendation, satisfaction_score, confidential_feedback, metadata)
VALUES ('14000000-0000-4000-8000-000000000001', '12000000-0000-4000-8000-000000000001', '13000000-0000-4000-8000-000000000001', 'Counselor Note', 'Demo Counselor Two', 'Synthetic feedback summary.', 'Continue counseling', true, 'Explicit follow-up action may be considered.', 4, null, '{"synthetic":true,"follow_up_created":false}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.counseling_referrals (id, case_id, referral_type, referred_to_name, referred_to_department, reason, summary, status, referred_by_name, accepted_by_name, accepted_at, closed_at, closure_notes, metadata)
VALUES
  ('15000000-0000-4000-8000-000000000001', '12000000-0000-4000-8000-000000000002', 'Church Pastor', 'Demo Pastor', 'Pastoral', 'Synthetic review scenario.', 'No confidential detail.', 'Pending', 'Demo Counselor One', null, null, null, null, '{"synthetic":true}'),
  ('15000000-0000-4000-8000-000000000002', '12000000-0000-4000-8000-000000000001', 'Follow-Up', 'Demo Follow-Up Lead', 'Follow-Up', 'Synthetic support scenario.', 'No confidential detail.', 'Accepted', 'Demo Counselor Two', 'Demo Follow-Up Lead', now(), null, null, '{"synthetic":true,"follow_up_created":false}'),
  ('15000000-0000-4000-8000-000000000003', '12000000-0000-4000-8000-000000000003', 'Other', 'Demo Support', 'External Support', 'Synthetic closed referral.', 'No confidential detail.', 'Closed', 'Demo Counselor One', 'Demo Support', now() - interval '7 days', now() - interval '2 days', 'Synthetic closure.', '{"synthetic":true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.baptisms (id, baptism_number, full_name, phone, baptism_date, baptism_location, minister_name, foundation_school_completed, status, certificate_status, metadata)
VALUES
  ('21000000-0000-4000-8000-000000000001', 'BAP-DEMO-001', 'Demo Baptism Pending', '+258 840 002 001', null, null, null, false, 'Pending', 'Not Issued', '{"synthetic":true,"finance_record_created":false,"certificate_created":false}'),
  ('21000000-0000-4000-8000-000000000002', 'BAP-DEMO-002', 'Demo Baptism Scheduled', '+258 840 002 002', current_date + 14, 'Demo Main Hall', 'Demo Minister', true, 'Scheduled', 'Not Issued', '{"synthetic":true,"finance_record_created":false,"certificate_created":false}'),
  ('21000000-0000-4000-8000-000000000003', 'BAP-DEMO-003', 'Demo Baptism Completed', '+258 840 002 003', current_date - 30, 'Demo Main Hall', 'Demo Minister', true, 'Completed', 'Certificate Pending', '{"synthetic":true,"finance_record_created":false,"certificate_created":false}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.marriages (id, marriage_number, groom_name, bride_name, marriage_date, marriage_time, marriage_location, officiating_minister_name, counseling_case_id, pre_marital_counseling_completed, status, certificate_status, payment_status, metadata)
VALUES
  ('22000000-0000-4000-8000-000000000001', 'MAR-DEMO-001', 'Demo Groom One', 'Demo Bride One', null, null, null, null, '12000000-0000-4000-8000-000000000002', false, 'Counseling Required', 'Not Issued', 'Not Required', '{"synthetic":true,"finance_record_created":false,"certificate_created":false}'),
  ('22000000-0000-4000-8000-000000000002', 'MAR-DEMO-002', 'Demo Groom Two', 'Demo Bride Two', current_date + 45, '11:00', 'Demo Main Hall', 'Demo Minister', '12000000-0000-4000-8000-000000000003', true, 'Scheduled', 'Not Issued', 'Pending', '{"synthetic":true,"finance_record_created":false,"certificate_created":false}'),
  ('22000000-0000-4000-8000-000000000003', 'MAR-DEMO-003', 'Demo Groom Three', 'Demo Bride Three', current_date - 90, '10:00', 'Demo Main Hall', 'Demo Minister', null, true, 'Completed', 'Certificate Issued', 'Recorded', '{"synthetic":true,"finance_record_created":false,"certificate_created_explicitly":true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.baby_dedications (id, dedication_number, child_name, child_date_of_birth, parent_name, parent_phone, dedication_date, dedication_location, minister_name, status, certificate_status, metadata)
VALUES
  ('23000000-0000-4000-8000-000000000001', 'DED-DEMO-001', 'Demo Child One', current_date - 180, 'Demo Parent One', '+258 840 003 001', null, null, null, 'Pending', 'Not Issued', '{"synthetic":true,"certificate_created":false}'),
  ('23000000-0000-4000-8000-000000000002', 'DED-DEMO-002', 'Demo Child Two', current_date - 240, 'Demo Parent Two', '+258 840 003 002', current_date + 21, 'Demo Main Hall', 'Demo Minister', 'Scheduled', 'Not Issued', '{"synthetic":true,"certificate_created":false}'),
  ('23000000-0000-4000-8000-000000000003', 'DED-DEMO-003', 'Demo Child Three', current_date - 365, 'Demo Parent Three', '+258 840 003 003', current_date - 60, 'Demo Main Hall', 'Demo Minister', 'Completed', 'Certificate Pending', '{"synthetic":true,"certificate_created":false}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sacrament_certificates (id, certificate_number, sacrament_type, sacrament_record_id, recipient_name, issued_date, issued_by_name, status, payment_status, metadata)
VALUES
  ('24000000-0000-4000-8000-000000000001', 'CERT-DEMO-001', 'Baptism', '21000000-0000-4000-8000-000000000003', 'Demo Baptism Completed', null, null, 'Draft', 'Not Required', '{"synthetic":true,"created_explicitly":true,"finance_record_created":false}'),
  ('24000000-0000-4000-8000-000000000002', 'CERT-DEMO-002', 'Marriage', '22000000-0000-4000-8000-000000000003', 'Demo Groom Three & Demo Bride Three', current_date - 80, 'Demo Minister', 'Issued', 'Recorded', '{"synthetic":true,"created_explicitly":true,"issued_explicitly":true,"finance_record_created":false}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sacrament_documents (id, sacrament_type, sacrament_record_id, document_type, document_title, file_name, storage_bucket, storage_path, status, is_sensitive, uploaded_by_name, metadata)
VALUES ('25000000-0000-4000-8000-000000000001', 'Marriage', '22000000-0000-4000-8000-000000000002', 'identity_metadata', 'Synthetic private document metadata', 'demo-private-metadata.txt', 'private-documents', 'sacraments/demo/marriage/document-metadata', 'Pending Review', true, 'Demo Staff', '{"synthetic":true,"no_real_document":true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sacrament_appointments (id, sacrament_type, sacrament_record_id, appointment_date, start_time, end_time, location, minister_name, status, metadata)
VALUES
  ('26000000-0000-4000-8000-000000000001', 'Baptism', '21000000-0000-4000-8000-000000000002', current_date + 7, '09:00', '09:30', 'Demo Office', 'Demo Minister', 'Scheduled', '{"synthetic":true}'),
  ('26000000-0000-4000-8000-000000000002', 'Marriage', '22000000-0000-4000-8000-000000000003', current_date - 100, '15:00', '15:30', 'Demo Office', 'Demo Minister', 'Completed', '{"synthetic":true}')
ON CONFLICT (id) DO NOTHING;
