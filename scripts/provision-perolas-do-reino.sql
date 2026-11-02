-- ============================================================================
-- SCRIPT DE PROVISIONAMENTO: Grupo Perolas do Reino & Células Subordinadas
-- ============================================================================
-- Igreja: E.C. Maputo Central – Sede (a1111111-1111-4111-8111-111111111101)
--
-- 1. Líder de Grupo (PCF / Cell Group Leader):
--    - Grupo: Perolas do Reino
--    - Líder: Eunice Nhavene
--    - Email: perola.do.reino.main@embaixadadecristo.org
--    - Senha: Damascusgate@west7
--    - Papel: Cell Group Leader (cell_group_leader)
--
-- 2. Líderes de Célula (Cell Leaders):
--    1. Perola do Reino Main: Eunice Nhavene | perola.do.reino.main@embaixadadecristo.org | Damascusgate@west7
--    2. Perola do Reino Overcomers: Dulce Mavale | perola.do.reino.overcomers@embaixadadecristo.org | Damascusgate@north1
--    3. Perolas do Reino Perfeitas Main: Merci Ubisse | perolas.do.reino.perfeitas.main@embaixadadecristo.org | Damascusgate@north9
--    4. Perolas do Reino Paz: Veronica Macuacua | perolas.do.reino.paz@embaixadadecristo.org | Damascusgate@South1
--    5. Perolas do Reino Divinas: Antonia Jorge | perolas.do.reino.divinas@embaixadadecristo.org | Damascusgate@SouthBeauty
--    6. Perolas do Reino Divinas A: Pascoa Malipa | perolas.do.reino.divinas.a@embaixadadecristo.org | Damascusgate@777
--    7. Perolas do Reino Divinas B: Marilia Machava | perolas.do.reino.divinas.b@embaixadadecristo.org | Damascusgate@Michael
--    8. Perolas do Reino Divinas C: Assuscena Selande | perolas.do.reino.divinas.c@embaixadadecristo.org | Damascusgate@ShechemGate
--    9. Perolas do Reino Divinas D: Ernestina da Graca | perolas.do.reino.divinas.d@embaixadadecristo.org | Damascusgate@NorthGate
--    10. Perolas do Reino Divinas E: Antonieta Boane | perolas.do.reino.divinas.e@embaixadadecristo.org | Damascusgate@NorthTower
-- ============================================================================

DO $$
DECLARE
  v_church_id uuid := 'a1111111-1111-4111-8111-111111111101'::uuid;
  v_group_id uuid;
  v_group_name text := 'Perolas do Reino';

  -- Célula IDs
  v_cell_main_id uuid;
  v_cell_overcomers_id uuid;
  v_cell_perfeitas_id uuid;
  v_cell_paz_id uuid;
  v_cell_divinas_id uuid;
  v_cell_divinas_a_id uuid;
  v_cell_divinas_b_id uuid;
  v_cell_divinas_c_id uuid;
  v_cell_divinas_d_id uuid;
  v_cell_divinas_e_id uuid;

  v_all_cell_ids text[];
  v_res jsonb;

  -- Papel IDs
  v_cell_group_leader_role_id uuid;
  v_cell_leader_role_id uuid;

  -- Utilizadores
  v_u_pcf_id uuid;
  v_u_overcomers_id uuid;
  v_u_perfeitas_id uuid;
  v_u_paz_id uuid;
  v_u_divinas_id uuid;
  v_u_divinas_a_id uuid;
  v_u_divinas_b_id uuid;
  v_u_divinas_c_id uuid;
  v_u_divinas_d_id uuid;
  v_u_divinas_e_id uuid;
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

  -- 2. Criar ou Obter Grupo de Células: "Perolas do Reino"
  SELECT id INTO v_group_id
  FROM public.cell_groups
  WHERE lower(trim(group_name)) ILIKE '%perola%reino%' OR lower(trim(name)) ILIKE '%perola%reino%'
  LIMIT 1;

  IF v_group_id IS NULL THEN
    INSERT INTO public.cell_groups (
      church_id,
      name,
      group_name,
      leader_name,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_church_id,
      v_group_name,
      v_group_name,
      'Eunice Nhavene',
      'Active',
      now(),
      now()
    )
    RETURNING id INTO v_group_id;
    RAISE NOTICE 'Grupo de Célula "%" criado com ID: %', v_group_name, v_group_id;
  ELSE
    UPDATE public.cell_groups
    SET
      leader_name = 'Eunice Nhavene',
      church_id = v_church_id,
      name = v_group_name,
      group_name = v_group_name,
      status = 'Active',
      updated_at = now()
    WHERE id = v_group_id;
    RAISE NOTICE 'Grupo de Célula "%" atualizado com ID: %', v_group_name, v_group_id;
  END IF;

  -- 3. Criar ou Obter as 10 Células Subordinadas

  -- Célula 1: Perola do Reino Main (Eunice Nhavene)
  SELECT id INTO v_cell_main_id FROM public.cells 
  WHERE cell_group_id = v_group_id AND (lower(trim(cell_name)) ILIKE '%perola%main%' OR lower(trim(cell_name)) ILIKE '%eunice%') LIMIT 1;
  IF v_cell_main_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Perola do Reino Main', 'Perola do Reino Main', 'Eunice Nhavene', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_main_id;
  ELSE
    UPDATE public.cells SET cell_group_id = v_group_id, cell_group_name = v_group_name, name = 'Perola do Reino Main', cell_name = 'Perola do Reino Main', leader_name = 'Eunice Nhavene', status = 'Active', updated_at = now() WHERE id = v_cell_main_id;
  END IF;

  -- Célula 2: Perola do Reino Overcomers (Dulce Mavale)
  SELECT id INTO v_cell_overcomers_id FROM public.cells 
  WHERE lower(trim(cell_name)) ILIKE '%overcomer%' OR lower(trim(name)) ILIKE '%overcomer%' LIMIT 1;
  IF v_cell_overcomers_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Perola do Reino Overcomers', 'Perola do Reino Overcomers', 'Dulce Mavale', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_overcomers_id;
  ELSE
    UPDATE public.cells SET cell_group_id = v_group_id, cell_group_name = v_group_name, name = 'Perola do Reino Overcomers', cell_name = 'Perola do Reino Overcomers', leader_name = 'Dulce Mavale', status = 'Active', updated_at = now() WHERE id = v_cell_overcomers_id;
  END IF;

  -- Célula 3: Perolas do Reino Perfeitas Main (Merci Ubisse)
  SELECT id INTO v_cell_perfeitas_id FROM public.cells 
  WHERE cell_group_id = v_group_id AND (lower(trim(cell_name)) ILIKE '%perfeitas%' OR lower(trim(name)) ILIKE '%perfeitas%') LIMIT 1;
  IF v_cell_perfeitas_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Perolas do Reino Perfeitas Main', 'Perolas do Reino Perfeitas Main', 'Merci Ubisse', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_perfeitas_id;
  ELSE
    UPDATE public.cells SET cell_group_id = v_group_id, cell_group_name = v_group_name, name = 'Perolas do Reino Perfeitas Main', cell_name = 'Perolas do Reino Perfeitas Main', leader_name = 'Merci Ubisse', status = 'Active', updated_at = now() WHERE id = v_cell_perfeitas_id;
  END IF;

  -- Célula 4: Perolas do Reino Paz (Veronica Macuacua)
  SELECT id INTO v_cell_paz_id FROM public.cells 
  WHERE cell_group_id = v_group_id AND (lower(trim(cell_name)) ILIKE '%paz%' OR lower(trim(name)) ILIKE '%paz%') LIMIT 1;
  IF v_cell_paz_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Perolas do Reino Paz', 'Perolas do Reino Paz', 'Veronica Macuacua', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_paz_id;
  ELSE
    UPDATE public.cells SET cell_group_id = v_group_id, cell_group_name = v_group_name, name = 'Perolas do Reino Paz', cell_name = 'Perolas do Reino Paz', leader_name = 'Veronica Macuacua', status = 'Active', updated_at = now() WHERE id = v_cell_paz_id;
  END IF;

  -- Célula 5: Perolas do Reino Divinas (Antonia Jorge)
  SELECT id INTO v_cell_divinas_id FROM public.cells 
  WHERE cell_group_id = v_group_id AND (lower(trim(cell_name)) = lower('Perolas do Reino Divinas') OR lower(trim(cell_name)) ILIKE '%divinas main%') LIMIT 1;
  IF v_cell_divinas_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Perolas do Reino Divinas', 'Perolas do Reino Divinas', 'Antonia Jorge', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_divinas_id;
  ELSE
    UPDATE public.cells SET cell_group_id = v_group_id, cell_group_name = v_group_name, name = 'Perolas do Reino Divinas', cell_name = 'Perolas do Reino Divinas', leader_name = 'Antonia Jorge', status = 'Active', updated_at = now() WHERE id = v_cell_divinas_id;
  END IF;

  -- Célula 6: Perolas do Reino Divinas A (Pascoa Malipa)
  SELECT id INTO v_cell_divinas_a_id FROM public.cells 
  WHERE cell_group_id = v_group_id AND (lower(trim(cell_name)) = lower('Perolas do Reino Divinas A') OR lower(trim(cell_name)) ILIKE '%divinas%pascoa%') LIMIT 1;
  IF v_cell_divinas_a_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Perolas do Reino Divinas A', 'Perolas do Reino Divinas A', 'Pascoa Malipa', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_divinas_a_id;
  ELSE
    UPDATE public.cells SET cell_group_id = v_group_id, cell_group_name = v_group_name, name = 'Perolas do Reino Divinas A', cell_name = 'Perolas do Reino Divinas A', leader_name = 'Pascoa Malipa', status = 'Active', updated_at = now() WHERE id = v_cell_divinas_a_id;
  END IF;

  -- Célula 7: Perolas do Reino Divinas B (Marilia Machava)
  SELECT id INTO v_cell_divinas_b_id FROM public.cells 
  WHERE cell_group_id = v_group_id AND (lower(trim(cell_name)) = lower('Perolas do Reino Divinas B') OR lower(trim(cell_name)) ILIKE '%faith and hope%') LIMIT 1;
  IF v_cell_divinas_b_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Perolas do Reino Divinas B', 'Perolas do Reino Divinas B', 'Marilia Machava', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_divinas_b_id;
  ELSE
    UPDATE public.cells SET cell_group_id = v_group_id, cell_group_name = v_group_name, name = 'Perolas do Reino Divinas B', cell_name = 'Perolas do Reino Divinas B', leader_name = 'Marilia Machava', status = 'Active', updated_at = now() WHERE id = v_cell_divinas_b_id;
  END IF;

  -- Célula 8: Perolas do Reino Divinas C (Assuscena Selande)
  SELECT id INTO v_cell_divinas_c_id FROM public.cells 
  WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) = lower('Perolas do Reino Divinas C') LIMIT 1;
  IF v_cell_divinas_c_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Perolas do Reino Divinas C', 'Perolas do Reino Divinas C', 'Assuscena Selande', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_divinas_c_id;
  ELSE
    UPDATE public.cells SET cell_group_id = v_group_id, cell_group_name = v_group_name, name = 'Perolas do Reino Divinas C', cell_name = 'Perolas do Reino Divinas C', leader_name = 'Assuscena Selande', status = 'Active', updated_at = now() WHERE id = v_cell_divinas_c_id;
  END IF;

  -- Célula 9: Perolas do Reino Divinas D (Ernestina da Graca)
  SELECT id INTO v_cell_divinas_d_id FROM public.cells 
  WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) = lower('Perolas do Reino Divinas D') LIMIT 1;
  IF v_cell_divinas_d_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Perolas do Reino Divinas D', 'Perolas do Reino Divinas D', 'Ernestina da Graca', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_divinas_d_id;
  ELSE
    UPDATE public.cells SET cell_group_id = v_group_id, cell_group_name = v_group_name, name = 'Perolas do Reino Divinas D', cell_name = 'Perolas do Reino Divinas D', leader_name = 'Ernestina da Graca', status = 'Active', updated_at = now() WHERE id = v_cell_divinas_d_id;
  END IF;

  -- Célula 10: Perolas do Reino Divinas E (Antonieta Boane)
  SELECT id INTO v_cell_divinas_e_id FROM public.cells 
  WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) = lower('Perolas do Reino Divinas E') LIMIT 1;
  IF v_cell_divinas_e_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Perolas do Reino Divinas E', 'Perolas do Reino Divinas E', 'Antonieta Boane', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_divinas_e_id;
  ELSE
    UPDATE public.cells SET cell_group_id = v_group_id, cell_group_name = v_group_name, name = 'Perolas do Reino Divinas E', cell_name = 'Perolas do Reino Divinas E', leader_name = 'Antonieta Boane', status = 'Active', updated_at = now() WHERE id = v_cell_divinas_e_id;
  END IF;

  -- Atualizar contagem de células no grupo
  UPDATE public.cell_groups
  SET total_cells = 10, updated_at = now()
  WHERE id = v_group_id;

  v_all_cell_ids := ARRAY[
    v_cell_main_id::text,
    v_cell_overcomers_id::text,
    v_cell_perfeitas_id::text,
    v_cell_paz_id::text,
    v_cell_divinas_id::text,
    v_cell_divinas_a_id::text,
    v_cell_divinas_b_id::text,
    v_cell_divinas_c_id::text,
    v_cell_divinas_d_id::text,
    v_cell_divinas_e_id::text
  ];

  -- 4. PROVISIONAR UTILIZADORES VIA admin_provision_user

  -- 4.0 Líder de Grupo (PCF) & Líder de Célula Main: Eunice Nhavene
  v_res := public.admin_provision_user(
    'perola.do.reino.main@embaixadadecristo.org',
    'Damascusgate@west7',
    'Eunice Nhavene',
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

  -- 4.1 Célula 2 Líder: Dulce Mavale (Perola do Reino Overcomers)
  v_res := public.admin_provision_user(
    'perola.do.reino.overcomers@embaixadadecristo.org',
    'Damascusgate@north1',
    'Dulce Mavale',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_overcomers_id,
    to_jsonb(ARRAY[v_cell_overcomers_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_overcomers_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_overcomers_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_overcomers_id, v_church_id, v_group_id::text, v_cell_overcomers_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.2 Célula 3 Líder: Merci Ubisse (Perolas do Reino Perfeitas Main)
  v_res := public.admin_provision_user(
    'perolas.do.reino.perfeitas.main@embaixadadecristo.org',
    'Damascusgate@north9',
    'Merci Ubisse',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_perfeitas_id,
    to_jsonb(ARRAY[v_cell_perfeitas_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_perfeitas_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_perfeitas_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_perfeitas_id, v_church_id, v_group_id::text, v_cell_perfeitas_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.3 Célula 4 Líder: Veronica Macuacua (Perolas do Reino Paz)
  v_res := public.admin_provision_user(
    'perolas.do.reino.paz@embaixadadecristo.org',
    'Damascusgate@South1',
    'Veronica Macuacua',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_paz_id,
    to_jsonb(ARRAY[v_cell_paz_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_paz_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_paz_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_paz_id, v_church_id, v_group_id::text, v_cell_paz_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.4 Célula 5 Líder: Antonia Jorge (Perolas do Reino Divinas)
  v_res := public.admin_provision_user(
    'perolas.do.reino.divinas@embaixadadecristo.org',
    'Damascusgate@SouthBeauty',
    'Antonia Jorge',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_divinas_id,
    to_jsonb(ARRAY[v_cell_divinas_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_divinas_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_divinas_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_divinas_id, v_church_id, v_group_id::text, v_cell_divinas_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.5 Célula 6 Líder: Pascoa Malipa (Perolas do Reino Divinas A)
  v_res := public.admin_provision_user(
    'perolas.do.reino.divinas.a@embaixadadecristo.org',
    'Damascusgate@777',
    'Pascoa Malipa',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_divinas_a_id,
    to_jsonb(ARRAY[v_cell_divinas_a_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_divinas_a_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_divinas_a_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_divinas_a_id, v_church_id, v_group_id::text, v_cell_divinas_a_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.6 Célula 7 Líder: Marilia Machava (Perolas do Reino Divinas B)
  v_res := public.admin_provision_user(
    'perolas.do.reino.divinas.b@embaixadadecristo.org',
    'Damascusgate@Michael',
    'Marilia Machava',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_divinas_b_id,
    to_jsonb(ARRAY[v_cell_divinas_b_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_divinas_b_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_divinas_b_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_divinas_b_id, v_church_id, v_group_id::text, v_cell_divinas_b_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.7 Célula 8 Líder: Assuscena Selande (Perolas do Reino Divinas C)
  v_res := public.admin_provision_user(
    'perolas.do.reino.divinas.c@embaixadadecristo.org',
    'Damascusgate@ShechemGate',
    'Assuscena Selande',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_divinas_c_id,
    to_jsonb(ARRAY[v_cell_divinas_c_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_divinas_c_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_divinas_c_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_divinas_c_id, v_church_id, v_group_id::text, v_cell_divinas_c_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.8 Célula 9 Líder: Ernestina da Graca (Perolas do Reino Divinas D)
  v_res := public.admin_provision_user(
    'perolas.do.reino.divinas.d@embaixadadecristo.org',
    'Damascusgate@NorthGate',
    'Ernestina da Graca',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_divinas_d_id,
    to_jsonb(ARRAY[v_cell_divinas_d_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_divinas_d_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_divinas_d_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_divinas_d_id, v_church_id, v_group_id::text, v_cell_divinas_d_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.9 Célula 10 Líder: Antonieta Boane (Perolas do Reino Divinas E)
  v_res := public.admin_provision_user(
    'perolas.do.reino.divinas.e@embaixadadecristo.org',
    'Damascusgate@NorthTower',
    'Antonieta Boane',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_divinas_e_id,
    to_jsonb(ARRAY[v_cell_divinas_e_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_divinas_e_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_divinas_e_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_divinas_e_id, v_church_id, v_group_id::text, v_cell_divinas_e_id::text, 'cell_leader', 'Active', now(), now(), now());

  RAISE NOTICE 'Provisionamento do Grupo Perolas do Reino e suas 10 Células concluído com sucesso!';
END $$;
