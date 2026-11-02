-- ============================================================================
-- SCRIPT DE PROVISIONAMENTO: Grupo Agathos & Células Subordinadas
-- ============================================================================
-- Igreja: E.C. Maputo Central – Sede (a1111111-1111-4111-8111-111111111101)
--
-- 1. Líder de Grupo (PCF / Cell Group Leader):
--    - Grupo: Agathos
--    - Líder: Nélsia Fumo
--    - Email: agathos.main@embaixadadecristo.org
--    - Senha: Damascusgate@Salvation
--    - Papel: Cell Group Leader (cell_group_leader)
--
-- 2. Líderes de Célula (Cell Leaders):
--    1. Agathos Main: Nélsia Fumo | agathos.main@embaixadadecristo.org | Damascusgate@Salvation
--    2. Agathos Light: Ines de Costa | agathos.light@embaixadadecristo.org | Damascusgate@Fortress
--    3. Agathos Light A: Charmila Langane | agathos.light.a@embaixadadecristo.org | Damascusgate@Jerusalem
--    4. Agathos Purpose: Érica Fernandes Filipe | agathos.purpose@embaixadadecristo.org | Damascusgate@Solomon7
--    5. Agathos Purpose A: Elisa Simbine | agathos.purpose.a@embaixadadecristo.org | Damascusgate@HolyLight
--    6. Agathos Purpose B: Amina Macumbe | agathos.purpose.b@embaixadadecristo.org | Damascusgate@Cornerstone
--    7. Agathos Excellence: Leopoldina Luís | agathos.excellence@embaixadadecristo.org | Damascusgate@Crown9
-- ============================================================================

DO $$
DECLARE
  v_church_id uuid := 'a1111111-1111-4111-8111-111111111101'::uuid;
  v_group_id uuid := 'b739d946-c9ed-4a1a-89ea-56157a7b1176'::uuid;
  v_group_name text := 'Agathos';

  -- Célula IDs
  v_cell_main_id uuid;
  v_cell_light_id uuid;
  v_cell_light_a_id uuid;
  v_cell_purpose_id uuid;
  v_cell_purpose_a_id uuid;
  v_cell_purpose_b_id uuid;
  v_cell_excellence_id uuid;

  v_all_cell_ids text[];
  v_res jsonb;

  -- Papel IDs
  v_cell_group_leader_role_id uuid;
  v_cell_leader_role_id uuid;

  -- Utilizadores
  v_u_pcf_id uuid;
  v_u_light_id uuid;
  v_u_light_a_id uuid;
  v_u_purpose_id uuid;
  v_u_purpose_a_id uuid;
  v_u_purpose_b_id uuid;
  v_u_excellence_id uuid;
BEGIN
  -- 1. Obter papéis canónicos
  SELECT id INTO v_cell_group_leader_role_id
  FROM public.roles
  WHERE name IN ('cell_group_leader', 'Cell Group Leader')
  ORDER BY level DESC LIMIT 1;

  SELECT id INTO v_cell_leader_role_id
  FROM public.roles
  WHERE name IN ('cell_leader', 'Cell Leader')
  ORDER BY level DESC LIMIT 1;

  IF v_cell_group_leader_role_id IS NULL THEN
    RAISE EXCEPTION 'Papel cell_group_leader não encontrado em public.roles';
  END IF;
  IF v_cell_leader_role_id IS NULL THEN
    RAISE EXCEPTION 'Papel cell_leader não encontrado em public.roles';
  END IF;

  -- 2. Atualizar Grupo de Células: "Agathos"
  UPDATE public.cell_groups
  SET
    leader_name = 'Nélsia Fumo',
    church_id = v_church_id,
    status = 'Active',
    updated_at = now()
  WHERE id = v_group_id;
  RAISE NOTICE 'Grupo de Célula "%" atualizado com ID: %', v_group_name, v_group_id;

  -- 3. Criar ou Obter as Células Subordinadas

  -- Célula 1: Agathos Main (Nélsia Fumo)
  SELECT id INTO v_cell_main_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) = lower('Agathos Main') LIMIT 1;
  IF v_cell_main_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Agathos Main', 'Agathos Main', 'Nélsia Fumo', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_main_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Nélsia Fumo', status = 'Active', updated_at = now() WHERE id = v_cell_main_id;
  END IF;

  -- Célula 2: Agathos Light (Ines de Costa)
  SELECT id INTO v_cell_light_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) = lower('Agathos Light') LIMIT 1;
  IF v_cell_light_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Agathos Light', 'Agathos Light', 'Ines de Costa', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_light_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Ines de Costa', status = 'Active', updated_at = now() WHERE id = v_cell_light_id;
  END IF;

  -- Célula 3: Agathos Light A (Charmila Langane)
  SELECT id INTO v_cell_light_a_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) = lower('Agathos Light A') LIMIT 1;
  IF v_cell_light_a_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Agathos Light A', 'Agathos Light A', 'Charmila Langane', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_light_a_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Charmila Langane', status = 'Active', updated_at = now() WHERE id = v_cell_light_a_id;
  END IF;

  -- Célula 4: Agathos Purpose (Érica Fernandes Filipe)
  SELECT id INTO v_cell_purpose_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) = lower('Agathos Purpose') LIMIT 1;
  IF v_cell_purpose_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Agathos Purpose', 'Agathos Purpose', 'Érica Fernandes Filipe', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_purpose_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Érica Fernandes Filipe', status = 'Active', updated_at = now() WHERE id = v_cell_purpose_id;
  END IF;

  -- Célula 5: Agathos Purpose A (Elisa Simbine)
  SELECT id INTO v_cell_purpose_a_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) = lower('Agathos Purpose A') LIMIT 1;
  IF v_cell_purpose_a_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Agathos Purpose A', 'Agathos Purpose A', 'Elisa Simbine', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_purpose_a_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Elisa Simbine', status = 'Active', updated_at = now() WHERE id = v_cell_purpose_a_id;
  END IF;

  -- Célula 6: Agathos Purpose B (Amina Macumbe - Nova Célula)
  SELECT id INTO v_cell_purpose_b_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) = lower('Agathos Purpose B') LIMIT 1;
  IF v_cell_purpose_b_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Agathos Purpose B', 'Agathos Purpose B', 'Amina Macumbe', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_purpose_b_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Amina Macumbe', status = 'Active', updated_at = now() WHERE id = v_cell_purpose_b_id;
  END IF;

  -- Célula 7: Agathos Excellence (Leopoldina Luís)
  SELECT id INTO v_cell_excellence_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) = lower('Agathos Excellence') LIMIT 1;
  IF v_cell_excellence_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Agathos Excellence', 'Agathos Excellence', 'Leopoldina Luís', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_excellence_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Leopoldina Luís', status = 'Active', updated_at = now() WHERE id = v_cell_excellence_id;
  END IF;

  -- Obter todas as células do grupo para o PCF
  SELECT array_agg(id::text) INTO v_all_cell_ids FROM public.cells WHERE cell_group_id = v_group_id;

  -- Atualizar contagem de células no grupo
  UPDATE public.cell_groups
  SET total_cells = array_length(v_all_cell_ids, 1), updated_at = now()
  WHERE id = v_group_id;

  -- 4. PROVISIONAR UTILIZADORES VIA admin_provision_user

  -- 4.0 Líder de Grupo (PCF) & Líder de Célula Main: Nélsia Fumo
  v_res := public.admin_provision_user(
    'agathos.main@embaixadadecristo.org',
    'Damascusgate@Salvation',
    'Nélsia Fumo',
    'Cell Group Leader',
    v_church_id,
    v_group_id,
    v_cell_main_id,
    to_jsonb(v_all_cell_ids),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_pcf_id := (v_res->>'user_id')::uuid;

  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_pcf_id;
  FOR i IN 1..array_length(v_all_cell_ids, 1) LOOP
    INSERT INTO public.cell_user_assignments (
      user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at
    ) VALUES (
      v_u_pcf_id, v_church_id, v_group_id::text, v_all_cell_ids[i], 'cell_leader', 'Active', now(), now(), now()
    );
  END LOOP;

  -- 4.1 Célula 2 Líder: Ines de Costa (Agathos Light)
  v_res := public.admin_provision_user(
    'agathos.light@embaixadadecristo.org',
    'Damascusgate@Fortress',
    'Ines de Costa',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_light_id,
    to_jsonb(ARRAY[v_cell_light_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_light_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_light_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_light_id, v_church_id, v_group_id::text, v_cell_light_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.2 Célula 3 Líder: Charmila Langane (Agathos Light A)
  v_res := public.admin_provision_user(
    'agathos.light.a@embaixadadecristo.org',
    'Damascusgate@Jerusalem',
    'Charmila Langane',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_light_a_id,
    to_jsonb(ARRAY[v_cell_light_a_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_light_a_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_light_a_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_light_a_id, v_church_id, v_group_id::text, v_cell_light_a_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.3 Célula 4 Líder: Érica Fernandes Filipe (Agathos Purpose)
  v_res := public.admin_provision_user(
    'agathos.purpose@embaixadadecristo.org',
    'Damascusgate@Solomon7',
    'Érica Fernandes Filipe',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_purpose_id,
    to_jsonb(ARRAY[v_cell_purpose_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_purpose_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_purpose_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_purpose_id, v_church_id, v_group_id::text, v_cell_purpose_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.4 Célula 5 Líder: Elisa Simbine (Agathos Purpose A)
  v_res := public.admin_provision_user(
    'agathos.purpose.a@embaixadadecristo.org',
    'Damascusgate@HolyLight',
    'Elisa Simbine',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_purpose_a_id,
    to_jsonb(ARRAY[v_cell_purpose_a_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_purpose_a_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_purpose_a_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_purpose_a_id, v_church_id, v_group_id::text, v_cell_purpose_a_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.5 Célula 6 Líder: Amina Macumbe (Agathos Purpose B)
  v_res := public.admin_provision_user(
    'agathos.purpose.b@embaixadadecristo.org',
    'Damascusgate@Cornerstone',
    'Amina Macumbe',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_purpose_b_id,
    to_jsonb(ARRAY[v_cell_purpose_b_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_purpose_b_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_purpose_b_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_purpose_b_id, v_church_id, v_group_id::text, v_cell_purpose_b_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.6 Célula 7 Líder: Leopoldina Luís (Agathos Excellence)
  v_res := public.admin_provision_user(
    'agathos.excellence@embaixadadecristo.org',
    'Damascusgate@Crown9',
    'Leopoldina Luís',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_excellence_id,
    to_jsonb(ARRAY[v_cell_excellence_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_excellence_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_excellence_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_excellence_id, v_church_id, v_group_id::text, v_cell_excellence_id::text, 'cell_leader', 'Active', now(), now(), now());

  RAISE NOTICE 'Provisionamento do Grupo Agathos e suas Células concluído com sucesso!';
END $$;
