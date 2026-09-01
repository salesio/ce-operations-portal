-- Migration 0032: Update Pastoral Care Rector and Admin auth user credentials
-- 1. Pastor Valdemiro Machava: p.care@embaixadadecristo.org (uid: ac47e5fa-f9f5-4d58-ab91-eebcb01f1b01)
-- 2. Salésio Machava (Admin): admin@embaixadadecristo.org (uid: f8d9954c-a17b-4870-98f6-a7d6f2576391)

DO $$
DECLARE
  v_pcare_role_id uuid := 'ecee2fb5-8950-412b-b867-dab7a1b14d36';
  v_admin_role_id uuid := '11111111-1111-1111-1111-111111111101';
  v_church_id uuid := 'a1111111-1111-4111-8111-111111111101';
BEGIN
  -- 1. Upsert / Update Pastor Valdemiro Machava (p.care@embaixadadecristo.org)
  IF EXISTS (SELECT 1 FROM public.users WHERE email = 'valdomacha@gmail.com' OR auth_user_id = 'b80a3e2d-615e-4f8b-a1a8-4f0d5f458cef' OR email = 'p.care@embaixadadecristo.org' OR auth_user_id = 'ac47e5fa-f9f5-4d58-ab91-eebcb01f1b01') THEN
    UPDATE public.users
    SET 
      auth_user_id = 'ac47e5fa-f9f5-4d58-ab91-eebcb01f1b01',
      email = 'p.care@embaixadadecristo.org',
      full_name = 'Pastor Valdemiro Machava',
      role_id = v_pcare_role_id,
      church_id = v_church_id,
      status = 'Active',
      updated_at = now(),
      metadata = jsonb_build_object(
        'role_name', 'pastoral_care_rector',
        'display_name', 'Pastor Valdemiro Machava',
        'has_dashboard_access', true,
        'department_permissions', jsonb_build_array('firstTimers', 'followUp', 'foundation', 'sacraments', 'counseling')
      )
    WHERE email IN ('valdomacha@gmail.com', 'p.care@embaixadadecristo.org')
       OR auth_user_id IN ('b80a3e2d-615e-4f8b-a1a8-4f0d5f458cef', 'ac47e5fa-f9f5-4d58-ab91-eebcb01f1b01');
  ELSE
    INSERT INTO public.users (
      id,
      auth_user_id,
      email,
      full_name,
      role_id,
      church_id,
      status,
      created_at,
      updated_at,
      metadata
    ) VALUES (
      gen_random_uuid(),
      'ac47e5fa-f9f5-4d58-ab91-eebcb01f1b01',
      'p.care@embaixadadecristo.org',
      'Pastor Valdemiro Machava',
      v_pcare_role_id,
      v_church_id,
      'Active',
      now(),
      now(),
      jsonb_build_object(
        'role_name', 'pastoral_care_rector',
        'display_name', 'Pastor Valdemiro Machava',
        'has_dashboard_access', true,
        'department_permissions', jsonb_build_array('firstTimers', 'followUp', 'foundation', 'sacraments', 'counseling')
      )
    );
  END IF;

  -- 2. Upsert / Update Salésio Machava (admin@embaixadadecristo.org)
  IF EXISTS (SELECT 1 FROM public.users WHERE email = 'salesiomachava@gmail.com' OR auth_user_id = '76e8a5ae-b716-4737-83da-ac004359bd07' OR email = 'admin@embaixadadecristo.org' OR auth_user_id = 'f8d9954c-a17b-4870-98f6-a7d6f2576391') THEN
    UPDATE public.users
    SET 
      auth_user_id = 'f8d9954c-a17b-4870-98f6-a7d6f2576391',
      email = 'admin@embaixadadecristo.org',
      full_name = 'Salésio Machava',
      role_id = v_admin_role_id,
      church_id = v_church_id,
      status = 'Active',
      updated_at = now(),
      metadata = jsonb_build_object(
        'role_name', 'super_admin',
        'display_name', 'Salésio Machava',
        'has_dashboard_access', true
      )
    WHERE email IN ('salesiomachava@gmail.com', 'admin@embaixadadecristo.org')
       OR auth_user_id IN ('76e8a5ae-b716-4737-83da-ac004359bd07', 'f8d9954c-a17b-4870-98f6-a7d6f2576391');
  ELSE
    INSERT INTO public.users (
      id,
      auth_user_id,
      email,
      full_name,
      role_id,
      church_id,
      status,
      created_at,
      updated_at,
      metadata
    ) VALUES (
      gen_random_uuid(),
      'f8d9954c-a17b-4870-98f6-a7d6f2576391',
      'admin@embaixadadecristo.org',
      'Salésio Machava',
      v_admin_role_id,
      v_church_id,
      'Active',
      now(),
      now(),
      jsonb_build_object(
        'role_name', 'super_admin',
        'display_name', 'Salésio Machava',
        'has_dashboard_access', true
      )
    );
  END IF;
END $$;
