-- ============================================================================
-- SCRIPT DE PROVISIONAMENTO: Sister Angélica (ALEC Manager)
-- ============================================================================
-- INSTRUÇÕES DE EXECUÇÃO:
-- 1. Envie o convite através do Supabase Dashboard:
--    Supabase Dashboard -> Authentication -> Users -> Add user -> Send invitation
--    Email: angelicaamilcar27@gmail.com
-- 2. Copie o UUID do utilizador criado em auth.users.
-- 3. Substitua o placeholder 'ANGELICA_AUTH_USER_ID' abaixo pelo UUID real.
-- 4. Execute este script no SQL Editor do Supabase para vincular a conta em public.users.
--
-- NOTA DE SEGURANÇA:
-- Este script é transaccional, idempotente e nunca manipula senhas ou segredos.
-- ============================================================================

DO $$
DECLARE
  v_auth_user_id uuid := 'ANGELICA_AUTH_USER_ID'::uuid; -- Substituir pelo UUID de auth.users
  v_target_email text := 'angelicaamilcar27@gmail.com';
  v_church_id uuid := 'a1111111-1111-4111-8111-111111111101'::uuid; -- E.C. Maputo Central – Sede
  v_role_id uuid;
  v_auth_count int;
  v_church_count int;
  v_user_count int;
BEGIN
  -- 1. Validar que existe exactamente uma conta Auth para o email
  SELECT count(*) INTO v_auth_count
  FROM auth.users
  WHERE id = v_auth_user_id AND lower(email) = lower(v_target_email);

  IF v_auth_count <> 1 THEN
    RAISE EXCEPTION 'Erro de validação: Utilizador Auth não encontrado ou ambíguo para ID % e email %',
      v_auth_user_id, v_target_email;
  END IF;

  -- 2. Validar que o papel canónico 'alec_manager' existe e está activo
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE name = 'alec_manager' AND status IN ('Active', 'Activo', 'active')
  LIMIT 1;

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Erro de validação: Papel alec_manager activo não encontrado em public.roles';
  END IF;

  -- 3. Validar que a igreja canónica existe
  SELECT count(*) INTO v_church_count
  FROM public.churches
  WHERE id = v_church_id;

  IF v_church_count <> 1 THEN
    RAISE EXCEPTION 'Erro de validação: Igreja Sede % não encontrada em public.churches', v_church_id;
  END IF;

  -- 4. Upsert em public.users (garante 1 única linha vinculada)
  INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    role_id,
    church_id,
    status,
    has_dashboard_access,
    created_at,
    updated_at
  )
  VALUES (
    v_auth_user_id,
    v_target_email,
    'Sister Angélica',
    v_role_id,
    v_church_id,
    'Active',
    true,
    now(),
    now()
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role_id = EXCLUDED.role_id,
    church_id = EXCLUDED.church_id,
    status = 'Active',
    has_dashboard_access = true,
    updated_at = now();

  -- Se existia registo antigo por email sem auth_user_id, sincronizar
  UPDATE public.users
  SET
    auth_user_id = v_auth_user_id,
    name = 'Sister Angélica',
    role_id = v_role_id,
    church_id = v_church_id,
    status = 'Active',
    has_dashboard_access = true,
    updated_at = now()
  WHERE lower(email) = lower(v_target_email)
    AND (auth_user_id IS NULL OR auth_user_id = v_auth_user_id);

  RAISE NOTICE 'Provisionamento concluído com sucesso para Sister Angélica (alec_manager) na igreja %', v_church_id;
END $$;
