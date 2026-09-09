-- ============================================================================
-- Migration 0040: Fix User Deletion, Cascade References & Admin Deletion Policy
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_caller_uid uuid;
  v_auth_uid uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_id is required');
  END IF;

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
      RAISE EXCEPTION 'Permissão negada: apenas administradores podem eliminar utilizadores.';
    END IF;
  END IF;

  -- Find associated auth_user_id
  SELECT auth_user_id INTO v_auth_uid FROM public.users WHERE id = p_user_id LIMIT 1;
  IF v_auth_uid IS NULL THEN
    v_auth_uid := p_user_id;
  END IF;

  -- 1. Clean up cell assignments
  BEGIN
    DELETE FROM public.cell_user_assignments WHERE user_id = p_user_id OR user_id = v_auth_uid;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 2. Clean up foreign key references in prison ministry if present
  BEGIN
    UPDATE public.prison_materials_requests
    SET recorded_by_user_id = NULL
    WHERE recorded_by_user_id = p_user_id OR recorded_by_user_id = v_auth_uid;

    UPDATE public.prison_materials_requests
    SET requested_by_user_id = NULL
    WHERE requested_by_user_id = p_user_id OR requested_by_user_id = v_auth_uid;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 3. Delete from public.users
  DELETE FROM public.users WHERE id = p_user_id OR auth_user_id = v_auth_uid;

  -- 4. Delete from auth tables
  IF v_auth_uid IS NOT NULL THEN
    DELETE FROM auth.identities WHERE user_id = v_auth_uid;
    DELETE FROM auth.users WHERE id = v_auth_uid;
  END IF;

  RETURN jsonb_build_object('ok', true, 'deleted_user_id', p_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user TO anon;

-- Grant DELETE permissions on public.users to authenticated
GRANT DELETE ON public.users TO authenticated;

-- Ensure RLS policy allows admins and self-delete
DROP POLICY IF EXISTS users_delete_policy ON public.users;
CREATE POLICY users_delete_policy ON public.users
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = id
    OR auth.uid() = auth_user_id
    OR EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON r.id = u.role_id
      WHERE (u.auth_user_id = auth.uid() OR u.id = auth.uid())
        AND (r.name IN ('super_admin', 'main_pastor', 'national_admin', 'church_admin')
             OR r.display_name IN ('Super Admin', 'Main Pastor', 'National Admin', 'Church Admin', 'Administrador')
             OR u.metadata->>'role_name' IN ('Super Admin', 'Main Pastor', 'National Admin', 'Church Admin'))
    )
  );
