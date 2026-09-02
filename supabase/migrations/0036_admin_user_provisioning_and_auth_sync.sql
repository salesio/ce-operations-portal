-- ============================================================================
-- Migration 0036: Admin Direct User Provisioning with Password & Role Sync
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_provision_user(
  p_email text,
  p_password text DEFAULT NULL,
  p_full_name text DEFAULT 'Utilizador',
  p_role_name text DEFAULT 'Cell Leader',
  p_church_id uuid DEFAULT NULL,
  p_cell_group_id uuid DEFAULT NULL,
  p_cell_id uuid DEFAULT NULL,
  p_assigned_cells text[] DEFAULT ARRAY[]::text[],
  p_assigned_cell_groups text[] DEFAULT ARRAY[]::text[],
  p_department_permissions text[] DEFAULT ARRAY[]::text[],
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
  v_caller_uid uuid;
  v_auth_uid uuid;
  v_role_id uuid;
  v_encrypted_pw text;
  v_metadata jsonb;
  v_result jsonb;
  v_norm_email text;
  v_cell_name text := NULL;
  v_group_name text := NULL;
  v_church_name text := NULL;
BEGIN
  -- Normalize email
  v_norm_email := lower(trim(p_email));
  IF v_norm_email IS NULL OR v_norm_email = '' THEN
    RAISE EXCEPTION 'E-mail é obrigatório para criar utilizador.';
  END IF;

  -- 1. Authorization check: caller must be admin or system bootstrap
  v_caller_uid := auth.uid();
  IF v_caller_uid IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON r.id = u.role_id
      WHERE (u.auth_user_id = v_caller_uid OR u.id = v_caller_uid)
        AND (r.name IN ('super_admin', 'main_pastor', 'national_admin', 'church_admin')
             OR r.display_name IN ('Super Admin', 'Main Pastor', 'National Admin', 'Church Admin', 'Administrador')
             OR u.metadata->>'role_name' IN ('Super Admin', 'Main Pastor', 'National Admin', 'Church Admin'))
    ) AND EXISTS (SELECT 1 FROM public.users LIMIT 1) THEN
      RAISE EXCEPTION 'Permissão negada: apenas administradores podem criar ou gerir contas.';
    END IF;
  END IF;

  -- 2. Resolve role_id from role name
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

  -- 3. Resolve names for metadata
  IF p_cell_id IS NOT NULL THEN
    SELECT cell_name INTO v_cell_name FROM public.cells WHERE id = p_cell_id LIMIT 1;
  END IF;
  IF p_cell_group_id IS NOT NULL THEN
    SELECT group_name INTO v_group_name FROM public.cell_groups WHERE id = p_cell_group_id LIMIT 1;
  END IF;
  IF p_church_id IS NOT NULL THEN
    SELECT public_name INTO v_church_name FROM public.churches WHERE id = p_church_id LIMIT 1;
  END IF;

  -- 4. Check if auth.users already exists
  SELECT id INTO v_auth_uid
  FROM auth.users
  WHERE email = v_norm_email
  LIMIT 1;

  IF v_auth_uid IS NULL THEN
    v_auth_uid := COALESCE(p_user_id, gen_random_uuid());
    
    IF p_password IS NULL OR length(trim(p_password)) < 6 THEN
      RAISE EXCEPTION 'A palavra-passe deve ter pelo menos 6 caracteres.';
    END IF;

    v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

    -- Create in auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_auth_uid,
      'authenticated',
      'authenticated',
      v_norm_email,
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', p_full_name, 'name', p_full_name, 'role', p_role_name, 'email_verified', true),
      now(),
      now()
    );

    -- Create identity (omitting generated email column)
    INSERT INTO auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_auth_uid::text,
      v_auth_uid,
      jsonb_build_object('sub', v_auth_uid::text, 'email', v_norm_email, 'email_verified', true, 'phone_verified', false),
      'email',
      now(),
      now(),
      now()
    )
    ON CONFLICT (provider, provider_id) DO UPDATE SET
      identity_data = jsonb_build_object('sub', v_auth_uid::text, 'email', v_norm_email, 'email_verified', true, 'phone_verified', false),
      updated_at = now();

  ELSE
    -- Update password if provided
    IF p_password IS NOT NULL AND length(trim(p_password)) >= 6 THEN
      v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));
      UPDATE auth.users
      SET encrypted_password = v_encrypted_pw,
          raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', p_full_name, 'name', p_full_name, 'role', p_role_name),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          updated_at = now()
      WHERE id = v_auth_uid;
    ELSE
      UPDATE auth.users
      SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', p_full_name, 'name', p_full_name, 'role', p_role_name),
          updated_at = now()
      WHERE id = v_auth_uid;
    END IF;
  END IF;

  -- 5. Build public.users metadata
  v_metadata := jsonb_build_object(
    'role_name', p_role_name,
    'display_name', p_full_name,
    'church_name', v_church_name,
    'cell_id', p_cell_id,
    'cell_name', v_cell_name,
    'cell_group_id', p_cell_group_id,
    'cell_group_name', v_group_name,
    'assigned_cells', COALESCE(p_assigned_cells, ARRAY[]::text[]),
    'assigned_cell_groups', COALESCE(p_assigned_cell_groups, ARRAY[]::text[]),
    'department_permissions', COALESCE(p_department_permissions, ARRAY[]::text[]),
    'cannot_create_classes', p_cannot_create_classes,
    'can_view_all_churches', p_can_view_all_churches,
    'has_dashboard_access', true
  );

  -- 6. Upsert public.users
  INSERT INTO public.users (
    id,
    auth_user_id,
    email,
    full_name,
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
    v_auth_uid,
    v_auth_uid,
    v_norm_email,
    p_full_name,
    v_role_id,
    p_church_id,
    p_cell_group_id,
    p_cell_id,
    COALESCE(p_assigned_cells, ARRAY[]::text[]),
    COALESCE(p_assigned_cell_groups, ARRAY[]::text[]),
    p_status,
    v_metadata,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    auth_user_id = v_auth_uid,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role_id = EXCLUDED.role_id,
    church_id = EXCLUDED.church_id,
    cell_group_id = EXCLUDED.cell_group_id,
    cell_id = EXCLUDED.cell_id,
    assigned_cells = EXCLUDED.assigned_cells,
    assigned_cell_groups = EXCLUDED.assigned_cell_groups,
    status = EXCLUDED.status,
    metadata = EXCLUDED.metadata,
    updated_at = now();

  -- Update any record that had same email with old id
  UPDATE public.users
  SET auth_user_id = v_auth_uid, updated_at = now()
  WHERE email = v_norm_email AND id <> v_auth_uid;

  -- 7. Return payload
  v_result := jsonb_build_object(
    'ok', true,
    'user_id', v_auth_uid,
    'auth_user_id', v_auth_uid,
    'email', v_norm_email,
    'full_name', p_full_name,
    'role_name', p_role_name,
    'role_id', v_role_id,
    'status', p_status
  );

  RETURN v_result;
END;
$$;

-- Helper to delete user both from public.users and auth.users
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_uid uuid;
  v_auth_uid uuid;
BEGIN
  v_caller_uid := auth.uid();
  IF v_caller_uid IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON r.id = u.role_id
      WHERE (u.auth_user_id = v_caller_uid OR u.id = v_caller_uid)
        AND (r.name IN ('super_admin', 'main_pastor', 'national_admin', 'church_admin')
             OR r.display_name IN ('Super Admin', 'Main Pastor', 'National Admin', 'Church Admin', 'Administrador'))
    ) THEN
      RAISE EXCEPTION 'Permissão negada: apenas administradores podem eliminar utilizadores.';
    END IF;
  END IF;

  SELECT auth_user_id INTO v_auth_uid FROM public.users WHERE id = p_user_id;
  IF v_auth_uid IS NULL THEN
    v_auth_uid := p_user_id;
  END IF;

  DELETE FROM public.users WHERE id = p_user_id OR auth_user_id = v_auth_uid;
  DELETE FROM auth.identities WHERE user_id = v_auth_uid;
  DELETE FROM auth.users WHERE id = v_auth_uid;

  RETURN jsonb_build_object('ok', true, 'deleted_user_id', p_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_provision_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_provision_user TO anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user TO anon;

GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.roles TO authenticated;
