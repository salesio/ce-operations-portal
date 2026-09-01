-- ============================================================================
-- SCRIPT DE PROVISIONAMENTO: Diamantes Main (Líder & Assistente)
-- ============================================================================
-- Célula Alvo:
--   - Nome: Diamantes Main / Blossom Diamante Main
--   - Cell ID: 3749602f-2f92-43a3-8db5-e96ee8a7a438
--   - Group ID: 334021eb-7658-4e26-8239-1a4f5c80409d (Diamantes / Blossom)
--   - Igreja: E.C. Maputo Central – Sede (a1111111-1111-4111-8111-111111111101)
--
-- Utilizadores:
--   1. Líder de Célula:
--      - Nome: Filipe Chamango
--      - Email: diamantes.main@embaixadadecristo.org
--      - Auth UID: 473e4df5-883c-499a-a42e-223495c266d1
--      - Papel canónico: cell_leader
--      - Módulos / Permissões: Célula (Grupo Diamantes), Acompanhamento (Follow-Up),
--        Professor de Escola de Fundação (Alunos, Presenças, Testes, Exame, sem criar turmas), Relatórios
--
--   2. Assistente de Célula:
--      - Nome: Michael Juma
--      - Email: assistant.diamantes.main@embaixadadecristo.org
--      - Auth UID: 1be83c02-cb16-4cf3-a246-58bd0ef1953f
--      - Papel canónico: assistant_cell_leader
--      - Módulos / Permissões: Célula (Grupo Diamantes, relatórios apenas como célula principal)
-- ============================================================================

DO $$
DECLARE
  v_church_id uuid := 'a1111111-1111-4111-8111-111111111101'::uuid;
  v_cell_id text := '3749602f-2f92-43a3-8db5-e96ee8a7a438';
  v_cell_group_id text := '334021eb-7658-4e26-8239-1a4f5c80409d';
  v_assigned_cells text[] := ARRAY[
    '3749602f-2f92-43a3-8db5-e96ee8a7a438',
    '1e50bb20-ec9d-4358-873a-83b96b2a093e',
    '752ead16-d25b-4c23-8f12-8e879089b29a',
    '959cd9dc-e99e-4ad9-88f5-3a7f81340863',
    'e8600e4b-b403-449f-88e6-da373589b511',
    'c01413e9-010b-496d-87aa-565056af2e81',
    '3787d0e9-1adf-4404-83fa-439882c1aaae'
  ];

  -- Líder
  v_leader_auth_id uuid := '473e4df5-883c-499a-a42e-223495c266d1'::uuid;
  v_leader_email text := 'diamantes.main@embaixadadecristo.org';
  v_leader_name text := 'Filipe Chamango';
  v_leader_role_id uuid;
  v_leader_user_id uuid;

  -- Assistente
  v_asst_auth_id uuid := '1be83c02-cb16-4cf3-a246-58bd0ef1953f'::uuid;
  v_asst_email text := 'assistant.diamantes.main@embaixadadecristo.org';
  v_asst_name text := 'Michael Juma';
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
    SELECT id INTO v_church_id FROM public.churches LIMIT 1;
  END IF;

  -- 3. PROVISIONAR LÍDER: Filipe Chamango
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
      assigned_cells = v_assigned_cells,
      department_permissions = ARRAY['cellReports', 'followUp', 'foundation', 'foundation_teacher', 'reports'],
      status = 'Active',
      updated_at = timezone('utc'::text, now())
    WHERE id = v_leader_user_id;
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
      department_permissions,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_leader_auth_id,
      v_leader_email,
      v_leader_name,
      v_leader_role_id,
      v_church_id,
      v_cell_id,
      v_cell_group_id,
      v_assigned_cells,
      ARRAY['cellReports', 'followUp', 'foundation', 'foundation_teacher', 'reports'],
      'Active',
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    )
    RETURNING id INTO v_leader_user_id;
  END IF;

  -- Atribuição de Célula para Líder
  INSERT INTO public.cell_user_assignments (
    user_id,
    cell_id,
    assignment_role,
    is_primary,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_leader_user_id,
    v_cell_id,
    'Leader',
    true,
    'Active',
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (user_id, cell_id, assignment_role)
  DO UPDATE SET is_primary = true, status = 'Active', updated_at = timezone('utc'::text, now());

  -- Professor de Escola de Fundação (Filipe Chamango)
  INSERT INTO public.foundation_school_teachers (
    id,
    church_id,
    full_name,
    email,
    phone,
    user_id,
    role,
    status,
    created_at,
    updated_at
  ) VALUES (
    'f7ee3dab-c172-4d78-97a9-aa76c554ce88'::uuid,
    v_church_id,
    v_leader_name,
    v_leader_email,
    '+258840000000',
    v_leader_user_id::text,
    'Teacher',
    'Active',
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id)
  DO UPDATE SET
    full_name = v_leader_name,
    email = v_leader_email,
    user_id = v_leader_user_id::text,
    role = 'Teacher',
    status = 'Active',
    updated_at = timezone('utc'::text, now());

  -- 4. PROVISIONAR ASSISTENTE: Michael Juma
  SELECT id INTO v_asst_user_id
  FROM public.users
  WHERE lower(email) = lower(v_asst_email) OR auth_user_id = v_asst_auth_id
  LIMIT 1;

  IF v_asst_user_id IS NOT NULL THEN
    UPDATE public.users
    SET
      auth_user_id = v_asst_auth_id,
      email = v_asst_email,
      full_name = v_asst_name,
      role_id = v_asst_role_id,
      church_id = v_church_id,
      cell_id = v_cell_id,
      cell_group_id = v_cell_group_id,
      assigned_cells = v_assigned_cells,
      department_permissions = ARRAY['cellReports'],
      status = 'Active',
      updated_at = timezone('utc'::text, now())
    WHERE id = v_asst_user_id;
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
      department_permissions,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_asst_auth_id,
      v_asst_email,
      v_asst_name,
      v_asst_role_id,
      v_church_id,
      v_cell_id,
      v_cell_group_id,
      v_assigned_cells,
      ARRAY['cellReports'],
      'Active',
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    )
    RETURNING id INTO v_asst_user_id;
  END IF;

  -- Atribuição de Célula para Assistente
  INSERT INTO public.cell_user_assignments (
    user_id,
    cell_id,
    assignment_role,
    is_primary,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_asst_user_id,
    v_cell_id,
    'Assistant',
    true,
    'Active',
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (user_id, cell_id, assignment_role)
  DO UPDATE SET is_primary = true, status = 'Active', updated_at = timezone('utc'::text, now());

  RAISE NOTICE 'Provisionamento dos utilizadores Diamantes Main (Filipe Chamango & Michael Juma) concluído com sucesso!';
END $$;
