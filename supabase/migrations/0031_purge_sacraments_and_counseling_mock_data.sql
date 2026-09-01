-- Migration 0031: Purge synthetic mock data from Sacraments & Counseling tables
-- Keeps only real user records entered into the system.

DELETE FROM public.marriages WHERE metadata->>'synthetic' = 'true' OR marriage_number LIKE 'MAR-DEMO-%';
DELETE FROM public.baptisms WHERE metadata->>'synthetic' = 'true' OR baptism_number LIKE 'BAP-DEMO-%';
DELETE FROM public.baby_dedications WHERE metadata->>'synthetic' = 'true' OR dedication_number LIKE 'DED-DEMO-%';
DELETE FROM public.sacrament_certificates WHERE metadata->>'synthetic' = 'true' OR certificate_number LIKE 'CERT-DEMO-%';
DELETE FROM public.sacrament_documents WHERE metadata->>'synthetic' = 'true';
DELETE FROM public.sacrament_appointments WHERE metadata->>'synthetic' = 'true';

DELETE FROM public.counseling_requests WHERE metadata->>'synthetic' = 'true' OR request_number LIKE 'REQ-DEMO-%';
DELETE FROM public.counseling_cases WHERE metadata->>'synthetic' = 'true' OR case_number LIKE 'CASE-DEMO-%';
DELETE FROM public.counseling_appointments WHERE metadata->>'synthetic' = 'true';
DELETE FROM public.counselors WHERE metadata->>'synthetic' = 'true';
DELETE FROM public.counseling_feedback WHERE metadata->>'synthetic' = 'true';
DELETE FROM public.counseling_referrals WHERE metadata->>'synthetic' = 'true';
