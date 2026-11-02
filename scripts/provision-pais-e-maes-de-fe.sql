-- ============================================================================
-- SCRIPT DE PROVISIONAMENTO: Grupo Pais e Mães de Fé & Células Subordinadas
-- ============================================================================
-- Igreja: E.C. Maputo Central – Sede (a1111111-1111-4111-8111-111111111101)
--
-- 1. Líder de Grupo (PCF / Cell Group Leader):
--    - Grupo: Pais da Fé / Pais de Fé
--    - Líder: Leopold Kusi
--    - Email: paisdefe@embaixadadecristo.org
--    - Senha: Lionsgate@northern
--    - Papel: Cell Group Leader (cell_group_leader)
--
-- 2. Líderes de Célula (Cell Leaders):
--    1. Pais de Fe Main: Leopold Kusi | paisdefe@embaixadadecristo.org | Lionsgate@northern
--    2. Pais de Fe A: Joao Tembe | pais.de.fe.a@embaixadadecristo.org | Lionsgate@South2
--    3. Pais de Fe B: Julio Mateus | pais.de.fe.b@embaixadadecristo.org | Lionsgate@southern
--    4. Pais de Fe C: Leopold Kusi | pais.de.fe.c@embaixadadecristo.org | Lionsgate@12000
--    5. Pais de Fe Ndlavela: Leopold Kusi | pais.de.fe.ndlavela@embaixadadecristo.org | Lionsgate@Gabriel
--    6. Maes de Fe: Leopold Kusi | maes.de.fe@embaixadadecristo.org | Lionsgate@SheepGate
--    7. Maes de Fe Dunamis: Tarcisa Muchave | maes.de.fe.dunamis@embaixadadecristo.org | Lionsgate@LionOfJudah
-- ============================================================================

DO $$
DECLARE
  v_church_id uuid := 'a1111111-1111-4111-8111-111111111101'::uuid;
  v_group_id uuid := '0d7246a1-0afe-45a6-8489-e564668d0cd6'::uuid;
  v_group_name text := 'Pais da Fé';

  -- Célula IDs
  v_cell_main_id uuid;
  v_cell_a_id uuid;
  v_cell_b_id uuid;
  v_cell_c_id uuid;
  v_cell_ndlavela_id uuid;
  v_cell_maes_id uuid;
  v_cell_dunamis_id uuid;

  v_all_cell_ids text[];
  v_res jsonb;

  -- Papel IDs
  v_cell_group_leader_role_id uuid;
  v_cell_leader_role_id uuid;

  -- Utilizadores
  v_u_pcf_id uuid;
  v_u_a_id uuid;
  v_u_b_id uuid;
  v_u_c_id uuid;
  v_u_ndlavela_id uuid;
  v_u_maes_id uuid;
  v_u_dunamis_id uuid;
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

  -- 2. Atualizar Grupo de Células: "Pais da Fé"
  UPDATE public.cell_groups
  SET
    leader_name = 'Leopold Kusi',
    church_id = v_church_id,
    status = 'Active',
    updated_at = now()
  WHERE id = v_group_id;
  RAISE NOTICE 'Grupo de Célula "%" atualizado com ID: %', v_group_name, v_group_id;

  -- 3. Criar ou Obter as Células Subordinadas

  -- 1: Pais de Fe Main (Leopold Kusi)
  SELECT id INTO v_cell_main_id FROM public.cells WHERE cell_group_id = v_group_id AND (lower(trim(cell_name)) ILIKE '%pais%fe%main%' OR lower(trim(name)) ILIKE '%pais%fe%main%') LIMIT 1;
  IF v_cell_main_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Pais de Fé Main', 'Pais de Fé Main', 'Leopold Kusi', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_main_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Leopold Kusi', name = 'Pais de Fé Main', cell_name = 'Pais de Fé Main', status = 'Active', updated_at = now() WHERE id = v_cell_main_id;
  END IF;

  -- 2: Pais de Fe A (Joao Tembe)
  SELECT id INTO v_cell_a_id FROM public.cells WHERE cell_group_id = v_group_id AND (lower(trim(cell_name)) ILIKE '%pais de fe a%' OR lower(trim(name)) ILIKE '%pais de fe a%') LIMIT 1;
  IF v_cell_a_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Pais de Fe A', 'Pais de Fe A', 'Joao Tembe', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_a_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Joao Tembe', name = 'Pais de Fe A', cell_name = 'Pais de Fe A', status = 'Active', updated_at = now() WHERE id = v_cell_a_id;
  END IF;

  -- 3: Pais de Fe B (Julio Mateus)
  SELECT id INTO v_cell_b_id FROM public.cells WHERE cell_group_id = v_group_id AND (lower(trim(cell_name)) ILIKE '%pais de fe b%' OR lower(trim(name)) ILIKE '%pais de fe b%') LIMIT 1;
  IF v_cell_b_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Pais de Fe B', 'Pais de Fe B', 'Julio Mateus', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_b_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Julio Mateus', name = 'Pais de Fe B', cell_name = 'Pais de Fe B', status = 'Active', updated_at = now() WHERE id = v_cell_b_id;
  END IF;

  -- 4: Pais de Fe C (Leopold Kusi)
  SELECT id INTO v_cell_c_id FROM public.cells WHERE cell_group_id = v_group_id AND (lower(trim(cell_name)) ILIKE '%pais de fe c%' OR lower(trim(name)) ILIKE '%pais de fe c%') LIMIT 1;
  IF v_cell_c_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Pais de Fe C', 'Pais de Fe C', 'Leopold Kusi', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_c_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Leopold Kusi', name = 'Pais de Fe C', cell_name = 'Pais de Fe C', status = 'Active', updated_at = now() WHERE id = v_cell_c_id;
  END IF;

  -- 5: Pais de Fe Ndlavela (Leopold Kusi)
  SELECT id INTO v_cell_ndlavela_id FROM public.cells WHERE cell_group_id = v_group_id AND (lower(trim(cell_name)) ILIKE '%ndlavela%' OR lower(trim(name)) ILIKE '%ndlavela%') LIMIT 1;
  IF v_cell_ndlavela_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Pais de Fe Ndlavela', 'Pais de Fe Ndlavela', 'Leopold Kusi', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_ndlavela_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Leopold Kusi', name = 'Pais de Fe Ndlavela', cell_name = 'Pais de Fe Ndlavela', status = 'Active', updated_at = now() WHERE id = v_cell_ndlavela_id;
  END IF;

  -- 6: Maes de Fe (Leopold Kusi)
  SELECT id INTO v_cell_maes_id FROM public.cells WHERE cell_group_id = v_group_id AND (lower(trim(cell_name)) = lower('MAES DE FE') OR lower(trim(cell_name)) = lower('Maes de Fe')) LIMIT 1;
  IF v_cell_maes_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Maes de Fe', 'Maes de Fe', 'Leopold Kusi', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_maes_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Leopold Kusi', name = 'Maes de Fe', cell_name = 'Maes de Fe', status = 'Active', updated_at = now() WHERE id = v_cell_maes_id;
  END IF;

  -- 7: Maes de Fe Dunamis (Tarcisa Muchave)
  SELECT id INTO v_cell_dunamis_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) ILIKE '%maes%dunamis%' LIMIT 1;
  IF v_cell_dunamis_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Maes de Fe Dunamis', 'Maes de Fe Dunamis', 'Tarcisa Muchave', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_dunamis_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Tarcisa Muchave', name = 'Maes de Fe Dunamis', cell_name = 'Maes de Fe Dunamis', status = 'Active', updated_at = now() WHERE id = v_cell_dunamis_id;
  END IF;

  -- Obter todas as células do grupo para o PCF
  SELECT array_agg(id::text) INTO v_all_cell_ids FROM public.cells WHERE cell_group_id = v_group_id;

  -- Atualizar contagem de células no grupo
  UPDATE public.cell_groups
  SET total_cells = array_length(v_all_cell_ids, 1), updated_at = now()
  WHERE id = v_group_id;

  -- 4. PROVISIONAR UTILIZADORES VIA admin_provision_user

  -- 4.0 Líder de Grupo (PCF) & Líder de Pais de Fe Main: Leopold Kusi
  v_res := public.admin_provision_user(
    'paisdefe@embaixadadecristo.org',
    'Lionsgate@northern',
    'Leopold Kusi',
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

  -- 4.1 Célula 2: Joao Tembe (Pais de Fe A)
  v_res := public.admin_provision_user(
    'pais.de.fe.a@embaixadadecristo.org',
    'Lionsgate@South2',
    'Joao Tembe',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_a_id,
    to_jsonb(ARRAY[v_cell_a_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_a_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_a_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_a_id, v_church_id, v_group_id::text, v_cell_a_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.2 Célula 3: Julio Mateus (Pais de Fe B)
  v_res := public.admin_provision_user(
    'pais.de.fe.b@embaixadadecristo.org',
    'Lionsgate@southern',
    'Julio Mateus',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_b_id,
    to_jsonb(ARRAY[v_cell_b_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_b_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_b_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_b_id, v_church_id, v_group_id::text, v_cell_b_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.3 Célula 4: Leopold Kusi (Pais de Fe C)
  v_res := public.admin_provision_user(
    'pais.de.fe.c@embaixadadecristo.org',
    'Lionsgate@12000',
    'Leopold Kusi',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_c_id,
    to_jsonb(ARRAY[v_cell_c_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_c_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_c_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_c_id, v_church_id, v_group_id::text, v_cell_c_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.4 Célula 5: Leopold Kusi (Pais de Fe Ndlavela)
  v_res := public.admin_provision_user(
    'pais.de.fe.ndlavela@embaixadadecristo.org',
    'Lionsgate@Gabriel',
    'Leopold Kusi',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_ndlavela_id,
    to_jsonb(ARRAY[v_cell_ndlavela_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_ndlavela_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_ndlavela_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_ndlavela_id, v_church_id, v_group_id::text, v_cell_ndlavela_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.5 Célula 6: Leopold Kusi (Maes de Fe)
  v_res := public.admin_provision_user(
    'maes.de.fe@embaixadadecristo.org',
    'Lionsgate@SheepGate',
    'Leopold Kusi',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_maes_id,
    to_jsonb(ARRAY[v_cell_maes_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_maes_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_maes_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_maes_id, v_church_id, v_group_id::text, v_cell_maes_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.6 Célula 7: Tarcisa Muchave (Maes de Fe Dunamis)
  v_res := public.admin_provision_user(
    'maes.de.fe.dunamis@embaixadadecristo.org',
    'Lionsgate@LionOfJudah',
    'Tarcisa Muchave',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_dunamis_id,
    to_jsonb(ARRAY[v_cell_dunamis_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_dunamis_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_dunamis_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_dunamis_id, v_church_id, v_group_id::text, v_cell_dunamis_id::text, 'cell_leader', 'Active', now(), now(), now());

  RAISE NOTICE 'Provisionamento do Grupo Pais e Mães de Fé e suas Células concluído com sucesso!';
END $$;
