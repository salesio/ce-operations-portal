-- ============================================================================
-- SCRIPT DE PROVISIONAMENTO: Sister Angélica (ALEC Manager)
-- ============================================================================
-- INSTRUÇÕES DE EXECUÇÃO:
-- 1. Envie o convite através do Supabase Dashboard:
--    Supabase Dashboard -> Authentication -> Users -> Add user -> Send invitation
--    Email: angelicaamilcar27@gmail.com
-- 2. Copie o UUID do utilizador criado em auth.users.
-- 3. Substitua o placeholder 'ANGELICA_AUTH_USER_ID' abaixo pelo UUID real copiado.
-- 4. Execute este script no SQL Editor do Supabase para vincular a conta em public.users.
--
-- NOTA DE SEGURANÇA:
-- Este script é transaccional, idempotente e nunca manipula senhas ou segredos.
-- ============================================================================

DO $$
DECLARE
  -- Substitua o placeholder abaixo pelo UUID do utilizador criado em auth.users
  v_auth_user_id uuid := 'ANGELICA_AUTH_USER_ID'::uuid;
  v_target_email text := 'angelicaamilcar27@gmail.com';
  v_church_id uuid := 'a1111111-1111-4111-8111-111111111101'::uuid; -- E.C. Maputo Central – Sede
  v_role_id uuid;
  v_auth_count int;
  v_church_count int;
  v_conflict_email_count int;
  v_conflict_auth_count int;
  v_matching_users_count int;
  v_existing_user_id uuid;
BEGIN
  -- 1. Validar que existe exactamente uma conta em auth.users para o email e ID fornecidos
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

  -- 3. Validar que a igreja canónica da Sede existe
  SELECT count(*) INTO v_church_count
  FROM public.churches
  WHERE id = v_church_id;

  IF v_church_count <> 1 THEN
    RAISE EXCEPTION 'Erro de validação: Igreja Sede % não encontrada em public.churches', v_church_id;
  END IF;

  -- 4. Validar protecção contra conflitos de dados em public.users
  -- a) Outro registo com o mesmo email mas auth_user_id diferente
  SELECT count(*) INTO v_conflict_email_count
  FROM public.users
  WHERE lower(email) = lower(v_target_email)
    AND auth_user_id IS NOT NULL
    AND auth_user_id <> v_auth_user_id;

  IF v_conflict_email_count > 0 THEN
    RAISE EXCEPTION 'Erro de integridade: Já existe outro registo em public.users com o email % associado a outro auth_user_id',
      v_target_email;
  END IF;

  -- b) Outro registo com o mesmo auth_user_id mas email diferente
  SELECT count(*) INTO v_conflict_auth_count
  FROM public.users
  WHERE auth_user_id = v_auth_user_id
    AND lower(email) <> lower(v_target_email);

  IF v_conflict_auth_count > 0 THEN
    RAISE EXCEPTION 'Erro de integridade: Já existe outro registo em public.users com o auth_user_id % associado a outro email',
      v_auth_user_id;
  END IF;

  -- 5. Pesquisa por correspondência existente (por auth_user_id ou por email)
  SELECT count(*) INTO v_matching_users_count
  FROM public.users
  WHERE auth_user_id = v_auth_user_id OR lower(email) = lower(v_target_email);

  IF v_matching_users_count > 1 THEN
    RAISE EXCEPTION 'Erro de integridade: Múltiplos registos ambíguos encontrados em public.users para % / %',
      v_auth_user_id, v_target_email;
  END IF;

  SELECT id INTO v_existing_user_id
  FROM public.users
  WHERE auth_user_id = v_auth_user_id OR lower(email) = lower(v_target_email)
  LIMIT 1;

  -- 6. Execução Idempotente: UPDATE se já existir, INSERT se for novo registo
  IF v_existing_user_id IS NOT NULL THEN
    UPDATE public.users
    SET
      auth_user_id = v_auth_user_id,
      email = v_target_email,
      full_name = 'Sister Angélica',
      role_id = v_role_id,
      church_id = v_church_id,
      status = 'Active',
      updated_at = now()
    WHERE id = v_existing_user_id;

    RAISE NOTICE 'Registo existente (ID: %) actualizado com sucesso para Sister Angélica (alec_manager).', v_existing_user_id;
  ELSE
    INSERT INTO public.users (
      auth_user_id,
      email,
      full_name,
      role_id,
      church_id,
      status,
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
      now(),
      now()
    );

    RAISE NOTICE 'Novo registo criado com sucesso em public.users para Sister Angélica (alec_manager).';
  END IF;
END $$;
