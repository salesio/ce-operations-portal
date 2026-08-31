-- ============================================================================
-- SCRIPT DE PROVISIONAMENTO: Diplomatas Victory (Líder & Assistente)
-- ============================================================================
-- Célula Alvo:
--   - Nome: Diplomatas Victory
--   - Cell ID: 2b3a5652-b8be-4c76-8b64-b84200c8bcd4
--   - Group ID: a62f461e-e574-4052-8ef3-a4d0ee0c77c4 (Diplomatas)
--   - Igreja: E.C. Maputo Central – Sede (a1111111-1111-4111-8111-111111111101)
--
-- Utilizadores:
--   1. Líder de Célula:
--      - Email: d.v.lider@embaixadadecristo.org
--      - Auth UID: 47df0cce-9701-492c-90aa-b3cb205bbd4b
--      - Papel canónico: cell_leader
--
--   2. Assistente de Célula:
--      - Email: d.v.assistente@embaixadadecristo.org
--      - Auth UID: 9820f162-430c-4573-86db-b001097fa6dc
--      - Papel canónico: assistant_cell_leader
--
-- NOTA DE SEGURANÇA:
-- Este script é transaccional, idempotente e nunca manipula senhas ou segredos.
-- ============================================================================

DO $$
DECLARE
  v_church_id uuid := 'a1111111-1111-4111-8111-111111111101'::uuid; -- E.C. Maputo Central – Sede
  v_cell_id text := '2b3a5652-b8be-4c76-8b64-b84200c8bcd4';
  v_cell_group_id text := 'a62f461e-e574-4052-8ef3-a4d0ee0c77c4';

  -- Líder
  v_leader_auth_id uuid := '47df0cce-9701-492c-90aa-b3cb205bbd4b'::uuid;
  v_leader_email text := 'd.v.lider@embaixadadecristo.org';
  v_leader_name text := 'Líder Diplomatas Victory';
  v_leader_role_id uuid;
  v_leader_user_id uuid;

  -- Assistente
  v_asst_auth_id uuid := '9820f162-430c-4573-86db-b001097fa6dc'::uuid;
  v_asst_email text := 'd.v.assistente@embaixadadecristo.org';
  v_asst_name text := 'Assistente Diplomatas Victory';
  v_asst_role_id uuid;
  v_asst_user_id uuid;

  v_church_count int;
BEGIN
  -- 1. Validar / Obter papéis canónicos
  SELECT id INTO v_leader_role_id
  FROM public.roles
  WHERE name IN ('cell_leader', 'Cell Leader') AND status IN ('Active', 'Activo', 'active')
  LIMIT 1;

  IF v_leader_role_id IS NULL THEN
    -- Fallback: criar ou activar papel
    INSERT INTO public.roles (name, display_name, level, default_scope, is_system_role, status)
    VALUES ('cell_leader', 'Cell Leader', 1, 'cell', true, 'Active')
    ON CONFLICT (name) DO UPDATE SET status = 'Active'
    RETURNING id INTO v_leader_role_id;
  END IF;

  SELECT id INTO v_asst_role_id
  FROM public.roles
  WHERE name IN ('assistant_cell_leader', 'cell_assistant', 'Cell Assistant') AND status IN ('Active', 'Activo', 'active')
  LIMIT 1;

  IF v_asst_role_id IS NULL THEN
    INSERT INTO public.roles (name, display_name, level, default_scope, is_system_role, status)
    VALUES ('assistant_cell_leader', 'Assistant Cell Leader', 1, 'cell', true, 'Active')
    ON CONFLICT (name) DO UPDATE SET status = 'Active'
    RETURNING id INTO v_asst_role_id;
  END IF;

  -- 2. Validar Igreja
  SELECT count(*) INTO v_church_count
  FROM public.churches
  WHERE id = v_church_id;

  IF v_church_count <> 1 THEN
    -- Se não existir com esse ID específico, buscar a primeira igreja disponível
    SELECT id INTO v_church_id FROM public.churches LIMIT 1;
  END IF;

  -- 3. PROVISIONAR LÍDER (d.v.lider@embaixadadecristo.org)
  SELECT id INTO v_leader_user_id
  FROM public.users
  WHERE lower(email) = lower(v_leader_email) OR auth_user_id = v_leader_auth_id
  LIMIT 1;

  IF v_leader_user_id IS NOT NULL THEN
    UPDATE public.users
    SET
      auth_user_id = v_leader_auth_id,
      email = v_leader_email,
      full_name = v_leader_name,
      role_id = v_leader_role_id,
      church_id = v_church_id,
      cell_id = v_cell_id,
      cell_group_id = v_cell_group_id,
      assigned_cells = ARRAY[v_cell_id],
      status = 'Active',
      updated_at = now()
    WHERE id = v_leader_user_id;

    RAISE NOTICE 'Utilizador Líder (ID: %) actualizado para % (Diplomatas Victory).', v_leader_user_id, v_leader_email;
  ELSE
    INSERT INTO public.users (
      auth_user_id,
      email,
      full_name,
      role_id,
      church_id,
      cell_id,
      cell_group_id,
      assigned_cells,
      status,
      created_at,
      updated_at
    )
    VALUES (
      v_leader_auth_id,
      v_leader_email,
      v_leader_name,
      v_leader_role_id,
      v_church_id,
      v_cell_id,
      v_cell_group_id,
      ARRAY[v_cell_id],
      'Active',
      now(),
      now()
    )
    RETURNING id INTO v_leader_user_id;

    RAISE NOTICE 'Novo utilizador Líder criado (ID: %) para %.', v_leader_user_id, v_leader_email;
  END IF;

  -- Mapear atribuição explícita de liderança de célula
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cell_user_assignments') THEN
    INSERT INTO public.cell_user_assignments (
      user_id, church_id, cell_group_id, cell_id, assignment_role, status, created_at, updated_at
    )
    VALUES (
      v_leader_user_id, v_church_id, v_cell_group_id, v_cell_id, 'cell_leader', 'Active', now(), now()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- 4. PROVISIONAR ASSISTENTE (d.v.assistente@embaixadadecristo.org)
  SELECT id INTO v_asst_user_id
  FROM public.users
  WHERE lower(email) = lower(v_asst_email) OR auth_user_id = v_asst_auth_id
  LIMIT 1;

  IF v_asst_user_id IS NOT NULL THEN
    UPDATE public.users
    SET
      auth_user_id = COALESCE(auth_user_id, v_asst_auth_id),
      email = v_asst_email,
      full_name = v_asst_name,
      role_id = v_asst_role_id,
      church_id = v_church_id,
      cell_id = v_cell_id,
      cell_group_id = v_cell_group_id,
      assigned_cells = ARRAY[v_cell_id],
      status = 'Active',
      updated_at = now()
    WHERE id = v_asst_user_id;

    RAISE NOTICE 'Utilizador Assistente (ID: %) actualizado para % (Diplomatas Victory).', v_asst_user_id, v_asst_email;
  ELSE
    INSERT INTO public.users (
      auth_user_id,
      email,
      full_name,
      role_id,
      church_id,
      cell_id,
      cell_group_id,
      assigned_cells,
      status,
      created_at,
      updated_at
    )
    VALUES (
      v_asst_auth_id,
      v_asst_email,
      v_asst_name,
      v_asst_role_id,
      v_church_id,
      v_cell_id,
      v_cell_group_id,
      ARRAY[v_cell_id],
      'Active',
      now(),
      now()
    )
    RETURNING id INTO v_asst_user_id;

    RAISE NOTICE 'Novo utilizador Assistente criado (ID: %) para %.', v_asst_user_id, v_asst_email;
  END IF;

  -- Mapear atribuição explícita de assistente de célula
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cell_user_assignments') THEN
    INSERT INTO public.cell_user_assignments (
      user_id, church_id, cell_group_id, cell_id, assignment_role, status, created_at, updated_at
    )
    VALUES (
      v_asst_user_id, v_church_id, v_cell_group_id, v_cell_id, 'assistant_cell_leader', 'Active', now(), now()
    )
    ON CONFLICT DO NOTHING;
  END IF;

END $$;
