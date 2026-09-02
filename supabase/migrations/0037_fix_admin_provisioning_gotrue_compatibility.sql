-- ==============================================================================
-- 0037_fix_admin_provisioning_gotrue_compatibility.sql
-- Fix GoTrue Auth deserialization by setting non-null string defaults for auth.users token fields.
-- Ensure bcrypt cost 10, proper text[] array casting for assigned cells, and seed all ministry roles.
-- ==============================================================================

-- 1. Ensure all standard ministry roles exist in public.roles
INSERT INTO public.roles (id, name, display_name, level, default_scope, is_system_role, status)
VALUES
  ('11111111-1111-1111-1111-111111111106', 'national_admin', 'National Admin', 90, 'all', true, 'Active'),
  ('11111111-1111-1111-1111-111111111107', 'church_pastor', 'Church Pastor', 70, 'church', true, 'Active'),
  ('11111111-1111-1111-1111-111111111108', 'finance_officer', 'Finance Officer', 40, 'church', true, 'Active'),
  ('11111111-1111-1111-1111-111111111109', 'cell_ministry_reviewer', 'Cell Ministry Reviewer', 50, 'church', true, 'Active'),
  ('11111111-1111-1111-1111-111111111110', 'cell_ministry_head', 'Cell Ministry Head', 60, 'church', true, 'Active'),
  ('11111111-1111-1111-1111-111111111111', 'foundation_teacher', 'Foundation Teacher', 30, 'church', true, 'Active'),
  ('11111111-1111-1111-1111-111111111112', 'follow_up_coordinator', 'Follow-Up Coordinator', 40, 'church', true, 'Active'),
  ('11111111-1111-1111-1111-111111111113', 'venue_manager', 'Venue Manager', 40, 'church', true, 'Active'),
  ('11111111-1111-1111-1111-111111111114', 'media_director', 'Media Director', 40, 'church', true, 'Active'),
  ('11111111-1111-1111-1111-111111111115', 'counselor', 'Counselor', 40, 'church', true, 'Active'),
  ('11111111-1111-1111-1111-111111111116', 'coordinator', 'Coordinator', 40, 'department', true, 'Active'),
  ('11111111-1111-1111-1111-111111111117', 'member', 'Member', 10, 'own', true, 'Active')
ON CONFLICT (name) DO UPDATE
SET display_name = EXCLUDED.display_name,
    level = EXCLUDED.level,
    default_scope = EXCLUDED.default_scope,
    status = EXCLUDED.status;

-- 2. Clean up any NULL token columns in existing auth.users
UPDATE auth.users
SET 
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change = coalesce(email_change, ''),
  reauthentication_token = coalesce(reauthentication_token, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  email_change_confirm_status = coalesce(email_change_confirm_status, 0)
WHERE confirmation_token IS NULL
   OR recovery_token IS NULL
   OR email_change_token_new IS NULL
   OR email_change IS NULL
   OR reauthentication_token IS NULL
   OR email_change_token_current IS NULL
   OR phone_change IS NULL
   OR phone_change_token IS NULL
   OR email_change_confirm_status IS NULL;

-- 3. Replace public.admin_provision_user with GoTrue-compliant non-null strings & bcrypt cost 10
DROP FUNCTION IF EXISTS public.admin_provision_user(text, text, text, text, uuid, uuid, uuid, text[], text[], text[], text, boolean, boolean, uuid);
DROP FUNCTION IF EXISTS public.admin_provision_user(text, text, text, text, uuid, uuid, uuid, jsonb, jsonb, jsonb, text, boolean, boolean, uuid);

CREATE OR REPLACE FUNCTION public.admin_provision_user(
  p_email text,
  p_password text DEFAULT NULL,
  p_full_name text DEFAULT '',
  p_role_name text DEFAULT 'Cell Leader',
  p_church_id uuid DEFAULT NULL,
  p_cell_group_id uuid DEFAULT NULL,
  p_cell_id uuid DEFAULT NULL,
  p_assigned_cells jsonb DEFAULT '[]'::jsonb,
  p_assigned_cell_groups jsonb DEFAULT '[]'::jsonb,
  p_department_permissions jsonb DEFAULT '["cellReports"]'::jsonb,
  p_status text DEFAULT 'Active',
  p_cannot_create_classes boolean DEFAULT false,
  p_can_view_all_churches boolean DEFAULT false,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_role_id uuid;
  v_church_name text := '';
  v_cell_group_name text := '';
  v_cell_name text := '';
  v_assigned_cells text[] := ARRAY[]::text[];
  v_assigned_cell_groups text[] := ARRAY[]::text[];
  v_meta jsonb;
  v_now timestamptz := now();
  v_identity_id uuid;
BEGIN
  v_email := lower(trim(p_email));
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Email is required for user provisioning';
  END IF;

  -- 1. Find or determine the user ID
  IF p_user_id IS NOT NULL THEN
    v_user_id := p_user_id;
  ELSE
    SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = v_email LIMIT 1;
    IF v_user_id IS NULL THEN
      SELECT id INTO v_user_id FROM public.users WHERE lower(email) = v_email LIMIT 1;
    END IF;
    IF v_user_id IS NULL THEN
      v_user_id := extensions.gen_random_uuid();
    END IF;
  END IF;

  -- 2. Resolve Role ID from public.roles
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE lower(name) = lower(replace(p_role_name, ' ', '_'))
     OR lower(display_name) = lower(p_role_name)
  ORDER BY level DESC
  LIMIT 1;

  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id
    FROM public.roles
    WHERE lower(display_name) LIKE '%' || lower(p_role_name) || '%'
       OR lower(name) LIKE '%' || lower(p_role_name) || '%'
    LIMIT 1;
  END IF;

  -- 3. Resolve church, cell group, and cell display names
  IF p_church_id IS NOT NULL THEN
    SELECT coalesce(church_name, public_name, '') INTO v_church_name FROM public.churches WHERE id = p_church_id LIMIT 1;
  END IF;
  IF p_cell_group_id IS NOT NULL THEN
    SELECT coalesce(group_name, name, '') INTO v_cell_group_name FROM public.cell_groups WHERE id = p_cell_group_id LIMIT 1;
  END IF;
  IF p_cell_id IS NOT NULL THEN
    SELECT coalesce(cell_name, name, '') INTO v_cell_name FROM public.cells WHERE id = p_cell_id LIMIT 1;
  END IF;

  -- 4. Cast jsonb arrays to text[] safely
  IF p_assigned_cells IS NOT NULL AND jsonb_typeof(p_assigned_cells) = 'array' THEN
    SELECT coalesce(array_agg(x), ARRAY[]::text[]) INTO v_assigned_cells
    FROM jsonb_array_elements_text(p_assigned_cells) AS x;
  END IF;
  IF p_assigned_cell_groups IS NOT NULL AND jsonb_typeof(p_assigned_cell_groups) = 'array' THEN
    SELECT coalesce(array_agg(x), ARRAY[]::text[]) INTO v_assigned_cell_groups
    FROM jsonb_array_elements_text(p_assigned_cell_groups) AS x;
  END IF;

  -- 5. Create or update auth.users with GoTrue-compliant string fields and bcrypt cost 10
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id OR lower(email) = v_email) THEN
    IF p_password IS NOT NULL AND length(trim(p_password)) >= 6 THEN
      UPDATE auth.users
      SET
        email = v_email,
        encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
        email_confirmed_at = coalesce(email_confirmed_at, v_now),
        confirmation_token = coalesce(confirmation_token, ''),
        recovery_token = coalesce(recovery_token, ''),
        email_change_token_new = coalesce(email_change_token_new, ''),
        email_change = coalesce(email_change, ''),
        reauthentication_token = coalesce(reauthentication_token, ''),
        email_change_token_current = coalesce(email_change_token_current, ''),
        phone_change = coalesce(phone_change, ''),
        phone_change_token = coalesce(phone_change_token, ''),
        email_change_confirm_status = coalesce(email_change_confirm_status, 0),
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
          'full_name', p_full_name,
          'name', p_full_name,
          'role', p_role_name,
          'email_verified', true
        ),
        updated_at = v_now
      WHERE id = v_user_id OR lower(email) = v_email;
    ELSE
      UPDATE auth.users
      SET
        email = v_email,
        confirmation_token = coalesce(confirmation_token, ''),
        recovery_token = coalesce(recovery_token, ''),
        email_change_token_new = coalesce(email_change_token_new, ''),
        email_change = coalesce(email_change, ''),
        reauthentication_token = coalesce(reauthentication_token, ''),
        email_change_token_current = coalesce(email_change_token_current, ''),
        phone_change = coalesce(phone_change, ''),
        phone_change_token = coalesce(phone_change_token, ''),
        email_change_confirm_status = coalesce(email_change_confirm_status, 0),
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
          'full_name', p_full_name,
          'name', p_full_name,
          'role', p_role_name,
          'email_verified', true
        ),
        updated_at = v_now
      WHERE id = v_user_id OR lower(email) = v_email;
    END IF;
  ELSE
    IF p_password IS NOT NULL AND length(trim(p_password)) >= 6 THEN
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at,
        is_anonymous
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        v_email,
        extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
        v_now,
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        NULL,
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
        jsonb_build_object('full_name', p_full_name, 'name', p_full_name, 'role', p_role_name, 'email_verified', true),
        NULL,
        v_now,
        v_now,
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL,
        false,
        NULL,
        false
      );
    ELSE
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at,
        is_anonymous
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        v_email,
        extensions.crypt('Welcome123!', extensions.gen_salt('bf', 10)),
        v_now,
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        NULL,
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
        jsonb_build_object('full_name', p_full_name, 'name', p_full_name, 'role', p_role_name, 'email_verified', true),
        NULL,
        v_now,
        v_now,
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL,
        false,
        NULL,
        false
      );
    END IF;
  END IF;

  -- 6. Upsert identity in auth.identities
  SELECT id INTO v_identity_id FROM auth.identities WHERE user_id = v_user_id AND provider = 'email' LIMIT 1;
  IF v_identity_id IS NOT NULL THEN
    UPDATE auth.identities
    SET
      identity_data = jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
      last_sign_in_at = v_now,
      updated_at = v_now
    WHERE id = v_identity_id;
  ELSE
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      extensions.gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
      'email',
      v_user_id::text,
      v_now,
      v_now,
      v_now
    );
  END IF;

  -- 7. Construct metadata for public.users
  v_meta := jsonb_build_object(
    'display_name', p_full_name,
    'role_name', p_role_name,
    'church_name', v_church_name,
    'cell_group_id', p_cell_group_id,
    'cell_group_name', v_cell_group_name,
    'cell_id', p_cell_id,
    'cell_name', v_cell_name,
    'assigned_cells', to_jsonb(v_assigned_cells),
    'assigned_cell_groups', to_jsonb(v_assigned_cell_groups),
    'department_permissions', p_department_permissions,
    'cannot_create_classes', p_cannot_create_classes,
    'can_view_all_churches', p_can_view_all_churches,
    'has_dashboard_access', true,
    'permissions', '[]'::jsonb,
    'demo_password_hint', 'demo',
    'avatar_url', '',
    'notes', '',
    'created_by_name', '',
    'department_name', ''
  );

  -- 8. Upsert public.users
  INSERT INTO public.users (
    id,
    auth_user_id,
    full_name,
    email,
    role_id,
    church_id,
    cell_group_id,
    cell_id,
    assigned_cells,
    assigned_cell_groups,
    status,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    p_full_name,
    v_email,
    v_role_id,
    p_church_id,
    p_cell_group_id,
    p_cell_id,
    v_assigned_cells,
    v_assigned_cell_groups,
    p_status,
    v_meta,
    v_now,
    v_now
  )
  ON CONFLICT (id) DO UPDATE
  SET
    auth_user_id = v_user_id,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role_id = EXCLUDED.role_id,
    church_id = EXCLUDED.church_id,
    cell_group_id = EXCLUDED.cell_group_id,
    cell_id = EXCLUDED.cell_id,
    assigned_cells = EXCLUDED.assigned_cells,
    assigned_cell_groups = EXCLUDED.assigned_cell_groups,
    status = EXCLUDED.status,
    metadata = public.users.metadata || EXCLUDED.metadata,
    updated_at = v_now;

  -- Also update role_id on user if previously null
  UPDATE public.users SET role_id = v_role_id WHERE id = v_user_id AND role_id IS NULL;

  RETURN jsonb_build_object(
    'ok', true,
    'user_id', v_user_id,
    'auth_user_id', v_user_id,
    'email', v_email,
    'role_id', v_role_id,
    'role_name', p_role_name,
    'status', p_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_provision_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_provision_user TO anon;
GRANT EXECUTE ON FUNCTION public.admin_provision_user TO service_role;
