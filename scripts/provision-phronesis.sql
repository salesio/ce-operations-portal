-- ============================================================================
-- SCRIPT DE PROVISIONAMENTO: Grupo Phronesis & Células Subordinadas
-- ============================================================================
-- Igreja: E.C. Maputo Central – Sede (a1111111-1111-4111-8111-111111111101)
--
-- 1. Líder de Grupo (PCF / Cell Group Leader):
--    - Grupo: Phronesis
--    - Líder: Tuaira Macele
--    - Email: phronesis.business.main@embaixadadecristo.org
--    - Senha: Damascusgate@Shekinah
--    - Papel: Cell Group Leader (cell_group_leader)
--
-- 2. Líderes de Célula (Cell Leaders):
--    1. Phronesis Business Main: Tuaira Macele | phronesis.business.main@embaixadadecristo.org | Damascusgate@Shekinah
--    2. Phronesis Business A: Laisy Nhavene | phronesis.business.a@embaixadadecristo.org | Damascusgate@Hosanna
--    3. Phronesis Dynamic: Lucas Cuna | phronesis.dynamic@embaixadadecristo.org | Damascusgate@Ark7
--    4. Phronesis Light of Life: Ezequiel Fenias | phronesis.light.of.life@embaixadadecristo.org | Damascusgate@Mercy
--    5. Phronesis Conqurors: Henrique Mutemba | phronesis.conqurors@embaixadadecristo.org | Damascusgate@Grace
--    6. Phronesis Light: Sandra | phronesis.light@embaixadadecristo.org | Damascusgate@Righteous
--    7. Phronesis Exploits: Lina Brito | phronesis.exploits@embaixadadecristo.org | Damascusgate@Splendor
--    8. Phronesis Kairos: Olita Ndlaze | phronesis.kairos@embaixadadecristo.org | Damascusgate@Triumph
--    9. Phronesis Vision: Palmira Manhique | phronesis.vision@embaixadadecristo.org | Damascusgate@PillarOfFire
--    10. Phronesis Excellence: Junya Clementina | phronesis.excellence@embaixadadecristo.org | Lionsgate@1990
--    11. Phronesis Excellence A: Nomissa Nhantumbo | phronesis.excellence.a@embaixadadecristo.org | Lionsgate@Cherubim
--    12. Phronesis Prolifics: Stella Monjane | phronesis.prolifics@embaixadadecristo.org | Lionsgate@east7
--    13. Phronesis Multiplied: Carmina Fernando | phronesis.multiplied@embaixadadecristo.org | Lionsgate@west1
--    14. Phronesis Virtuous: Eliandra Figueiredo | phronesis.virtuous@embaixadadecristo.org | Lionsgate@western
-- ============================================================================

DO $$
DECLARE
  v_church_id uuid := 'a1111111-1111-4111-8111-111111111101'::uuid;
  v_group_id uuid := 'a5c43304-7278-4dcd-8081-87bb2c11fbfd'::uuid;
  v_group_name text := 'Phronesis';

  -- Célula IDs
  v_cell_main_id uuid;
  v_cell_bus_a_id uuid;
  v_cell_dyn_id uuid;
  v_cell_lol_id uuid;
  v_cell_conq_id uuid;
  v_cell_light_id uuid;
  v_cell_exp_id uuid;
  v_cell_kairos_id uuid;
  v_cell_vision_id uuid;
  v_cell_exc_id uuid;
  v_cell_exc_a_id uuid;
  v_cell_prol_id uuid;
  v_cell_mult_id uuid;
  v_cell_virt_id uuid;

  v_all_cell_ids text[];
  v_res jsonb;

  -- Papel IDs
  v_cell_group_leader_role_id uuid;
  v_cell_leader_role_id uuid;

  -- Utilizadores
  v_u_pcf_id uuid;
  v_u_bus_a_id uuid;
  v_u_dyn_id uuid;
  v_u_lol_id uuid;
  v_u_conq_id uuid;
  v_u_light_id uuid;
  v_u_exp_id uuid;
  v_u_kairos_id uuid;
  v_u_vision_id uuid;
  v_u_exc_id uuid;
  v_u_exc_a_id uuid;
  v_u_prol_id uuid;
  v_u_mult_id uuid;
  v_u_virt_id uuid;
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

  -- 2. Atualizar Grupo de Células: "Phronesis"
  UPDATE public.cell_groups
  SET
    leader_name = 'Tuaira Macele',
    church_id = v_church_id,
    name = v_group_name,
    group_name = v_group_name,
    status = 'Active',
    updated_at = now()
  WHERE id = v_group_id;
  RAISE NOTICE 'Grupo de Célula "%" atualizado com ID: %', v_group_name, v_group_id;

  -- 3. Criar ou Obter as 14 Células Subordinadas

  -- 1: Phronesis Business Main (Tuaira Macele)
  SELECT id INTO v_cell_main_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) ILIKE '%business main%' LIMIT 1;
  IF v_cell_main_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Phronesis Business Main', 'Phronesis Business Main', 'Tuaira Macele', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_main_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Tuaira Macele', name = 'Phronesis Business Main', cell_name = 'Phronesis Business Main', status = 'Active', updated_at = now() WHERE id = v_cell_main_id;
  END IF;

  -- 2: Phronesis Business A (Laisy Nhavene)
  SELECT id INTO v_cell_bus_a_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) ILIKE '%business a%' LIMIT 1;
  IF v_cell_bus_a_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Phronesis Business A', 'Phronesis Business A', 'Laisy Nhavene', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_bus_a_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Laisy Nhavene', name = 'Phronesis Business A', cell_name = 'Phronesis Business A', status = 'Active', updated_at = now() WHERE id = v_cell_bus_a_id;
  END IF;

  -- 3: Phronesis Dynamic (Lucas Cuna)
  SELECT id INTO v_cell_dyn_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) ILIKE '%dynamic%' LIMIT 1;
  IF v_cell_dyn_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Phronesis Dynamic', 'Phronesis Dynamic', 'Lucas Cuna', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_dyn_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Lucas Cuna', name = 'Phronesis Dynamic', cell_name = 'Phronesis Dynamic', status = 'Active', updated_at = now() WHERE id = v_cell_dyn_id;
  END IF;

  -- 4: Phronesis Light of Life (Ezequiel Fenias)
  SELECT id INTO v_cell_lol_id FROM public.cells WHERE cell_group_id = v_group_id AND (lower(trim(cell_name)) ILIKE '%light%life%' OR lower(trim(cell_name)) ILIKE '%light if life%') LIMIT 1;
  IF v_cell_lol_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Phronesis Light of Life', 'Phronesis Light of Life', 'Ezequiel Fenias', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_lol_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Ezequiel Fenias', name = 'Phronesis Light of Life', cell_name = 'Phronesis Light of Life', status = 'Active', updated_at = now() WHERE id = v_cell_lol_id;
  END IF;

  -- 5: Phronesis Conqurors (Henrique Mutemba)
  SELECT id INTO v_cell_conq_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) ILIKE '%conqueror%' LIMIT 1;
  IF v_cell_conq_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Phronesis Conqurors', 'Phronesis Conqurors', 'Henrique Mutemba', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_conq_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Henrique Mutemba', name = 'Phronesis Conqurors', cell_name = 'Phronesis Conqurors', status = 'Active', updated_at = now() WHERE id = v_cell_conq_id;
  END IF;

  -- 6: Phronesis Light (Sandra)
  SELECT id INTO v_cell_light_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) = lower('PHRONESIS BUSINESS LIGHT') OR lower(trim(cell_name)) = lower('Phronesis Light') LIMIT 1;
  IF v_cell_light_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Phronesis Light', 'Phronesis Light', 'Sandra', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_light_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Sandra', name = 'Phronesis Light', cell_name = 'Phronesis Light', status = 'Active', updated_at = now() WHERE id = v_cell_light_id;
  END IF;

  -- 7: Phronesis Exploits (Lina Brito)
  SELECT id INTO v_cell_exp_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) ILIKE '%exploit%' LIMIT 1;
  IF v_cell_exp_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Phronesis Exploits', 'Phronesis Exploits', 'Lina Brito', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_exp_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Lina Brito', name = 'Phronesis Exploits', cell_name = 'Phronesis Exploits', status = 'Active', updated_at = now() WHERE id = v_cell_exp_id;
  END IF;

  -- 8: Phronesis Kairos (Olita Ndlaze)
  SELECT id INTO v_cell_kairos_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) ILIKE '%kairos%' LIMIT 1;
  IF v_cell_kairos_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Phronesis Kairos', 'Phronesis Kairos', 'Olita Ndlaze', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_kairos_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Olita Ndlaze', name = 'Phronesis Kairos', cell_name = 'Phronesis Kairos', status = 'Active', updated_at = now() WHERE id = v_cell_kairos_id;
  END IF;

  -- 9: Phronesis Vision (Palmira Manhique)
  SELECT id INTO v_cell_vision_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) ILIKE '%vision%' LIMIT 1;
  IF v_cell_vision_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Phronesis Vision', 'Phronesis Vision', 'Palmira Manhique', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_vision_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Palmira Manhique', name = 'Phronesis Vision', cell_name = 'Phronesis Vision', status = 'Active', updated_at = now() WHERE id = v_cell_vision_id;
  END IF;

  -- 10: Phronesis Excellence (Junya Clementina)
  SELECT id INTO v_cell_exc_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) = lower('Phronesis Excellence') LIMIT 1;
  IF v_cell_exc_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Phronesis Excellence', 'Phronesis Excellence', 'Junya Clementina', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_exc_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Junya Clementina', name = 'Phronesis Excellence', cell_name = 'Phronesis Excellence', status = 'Active', updated_at = now() WHERE id = v_cell_exc_id;
  END IF;

  -- 11: Phronesis Excellence A (Nomissa Nhantumbo)
  SELECT id INTO v_cell_exc_a_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) ILIKE '%excellence a%' LIMIT 1;
  IF v_cell_exc_a_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Phronesis Excellence A', 'Phronesis Excellence A', 'Nomissa Nhantumbo', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_exc_a_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Nomissa Nhantumbo', name = 'Phronesis Excellence A', cell_name = 'Phronesis Excellence A', status = 'Active', updated_at = now() WHERE id = v_cell_exc_a_id;
  END IF;

  -- 12: Phronesis Prolifics (Stella Monjane)
  SELECT id INTO v_cell_prol_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) ILIKE '%prolific%' LIMIT 1;
  IF v_cell_prol_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Phronesis Prolifics', 'Phronesis Prolifics', 'Stella Monjane', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_prol_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Stella Monjane', name = 'Phronesis Prolifics', cell_name = 'Phronesis Prolifics', status = 'Active', updated_at = now() WHERE id = v_cell_prol_id;
  END IF;

  -- 13: Phronesis Multiplied (Carmina Fernando)
  SELECT id INTO v_cell_mult_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) ILIKE '%multiplied%' LIMIT 1;
  IF v_cell_mult_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Phronesis Multiplied', 'Phronesis Multiplied', 'Carmina Fernando', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_mult_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Carmina Fernando', name = 'Phronesis Multiplied', cell_name = 'Phronesis Multiplied', status = 'Active', updated_at = now() WHERE id = v_cell_mult_id;
  END IF;

  -- 14: Phronesis Virtuous (Eliandra Figueiredo)
  SELECT id INTO v_cell_virt_id FROM public.cells WHERE cell_group_id = v_group_id AND lower(trim(cell_name)) ILIKE '%virtuous%' LIMIT 1;
  IF v_cell_virt_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Phronesis Virtuous', 'Phronesis Virtuous', 'Eliandra Figueiredo', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_virt_id;
  ELSE
    UPDATE public.cells SET leader_name = 'Eliandra Figueiredo', name = 'Phronesis Virtuous', cell_name = 'Phronesis Virtuous', status = 'Active', updated_at = now() WHERE id = v_cell_virt_id;
  END IF;

  -- Obter todas as células do grupo para o PCF
  SELECT array_agg(id::text) INTO v_all_cell_ids FROM public.cells WHERE cell_group_id = v_group_id;

  -- Atualizar contagem de células no grupo
  UPDATE public.cell_groups
  SET total_cells = array_length(v_all_cell_ids, 1), updated_at = now()
  WHERE id = v_group_id;

  -- 4. PROVISIONAR UTILIZADORES VIA admin_provision_user

  -- 4.0 Líder de Grupo (PCF) & Líder de Business Main: Tuaira Macele
  v_res := public.admin_provision_user(
    'phronesis.business.main@embaixadadecristo.org',
    'Damascusgate@Shekinah',
    'Tuaira Macele',
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

  -- 4.1 Célula 2: Laisy Nhavene (Phronesis Business A)
  v_res := public.admin_provision_user(
    'phronesis.business.a@embaixadadecristo.org',
    'Damascusgate@Hosanna',
    'Laisy Nhavene',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_bus_a_id,
    to_jsonb(ARRAY[v_cell_bus_a_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_bus_a_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_bus_a_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_bus_a_id, v_church_id, v_group_id::text, v_cell_bus_a_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.2 Célula 3: Lucas Cuna (Phronesis Dynamic)
  v_res := public.admin_provision_user(
    'phronesis.dynamic@embaixadadecristo.org',
    'Damascusgate@Ark7',
    'Lucas Cuna',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_dyn_id,
    to_jsonb(ARRAY[v_cell_dyn_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_dyn_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_dyn_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_dyn_id, v_church_id, v_group_id::text, v_cell_dyn_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.3 Célula 4: Ezequiel Fenias (Phronesis Light of Life)
  v_res := public.admin_provision_user(
    'phronesis.light.of.life@embaixadadecristo.org',
    'Damascusgate@Mercy',
    'Ezequiel Fenias',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_lol_id,
    to_jsonb(ARRAY[v_cell_lol_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_lol_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_lol_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_lol_id, v_church_id, v_group_id::text, v_cell_lol_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.4 Célula 5: Henrique Mutemba (Phronesis Conqurors)
  v_res := public.admin_provision_user(
    'phronesis.conqurors@embaixadadecristo.org',
    'Damascusgate@Grace',
    'Henrique Mutemba',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_conq_id,
    to_jsonb(ARRAY[v_cell_conq_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_conq_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_conq_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_conq_id, v_church_id, v_group_id::text, v_cell_conq_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.5 Célula 6: Sandra (Phronesis Light)
  v_res := public.admin_provision_user(
    'phronesis.light@embaixadadecristo.org',
    'Damascusgate@Righteous',
    'Sandra',
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

  -- 4.6 Célula 7: Lina Brito (Phronesis Exploits)
  v_res := public.admin_provision_user(
    'phronesis.exploits@embaixadadecristo.org',
    'Damascusgate@Splendor',
    'Lina Brito',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_exp_id,
    to_jsonb(ARRAY[v_cell_exp_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_exp_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_exp_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_exp_id, v_church_id, v_group_id::text, v_cell_exp_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.7 Célula 8: Olita Ndlaze (Phronesis Kairos)
  v_res := public.admin_provision_user(
    'phronesis.kairos@embaixadadecristo.org',
    'Damascusgate@Triumph',
    'Olita Ndlaze',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_kairos_id,
    to_jsonb(ARRAY[v_cell_kairos_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_kairos_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_kairos_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_kairos_id, v_church_id, v_group_id::text, v_cell_kairos_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.8 Célula 9: Palmira Manhique (Phronesis Vision)
  v_res := public.admin_provision_user(
    'phronesis.vision@embaixadadecristo.org',
    'Damascusgate@PillarOfFire',
    'Palmira Manhique',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_vision_id,
    to_jsonb(ARRAY[v_cell_vision_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_vision_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_vision_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_vision_id, v_church_id, v_group_id::text, v_cell_vision_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.9 Célula 10: Junya Clementina (Phronesis Excellence)
  v_res := public.admin_provision_user(
    'phronesis.excellence@embaixadadecristo.org',
    'Lionsgate@1990',
    'Junya Clementina',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_exc_id,
    to_jsonb(ARRAY[v_cell_exc_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_exc_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_exc_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_exc_id, v_church_id, v_group_id::text, v_cell_exc_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.10 Célula 11: Nomissa Nhantumbo (Phronesis Excellence A)
  v_res := public.admin_provision_user(
    'phronesis.excellence.a@embaixadadecristo.org',
    'Lionsgate@Cherubim',
    'Nomissa Nhantumbo',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_exc_a_id,
    to_jsonb(ARRAY[v_cell_exc_a_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_exc_a_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_exc_a_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_exc_a_id, v_church_id, v_group_id::text, v_cell_exc_a_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.11 Célula 12: Stella Monjane (Phronesis Prolifics)
  v_res := public.admin_provision_user(
    'phronesis.prolifics@embaixadadecristo.org',
    'Lionsgate@east7',
    'Stella Monjane',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_prol_id,
    to_jsonb(ARRAY[v_cell_prol_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_prol_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_prol_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_prol_id, v_church_id, v_group_id::text, v_cell_prol_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.12 Célula 13: Carmina Fernando (Phronesis Multiplied)
  v_res := public.admin_provision_user(
    'phronesis.multiplied@embaixadadecristo.org',
    'Lionsgate@west1',
    'Carmina Fernando',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_mult_id,
    to_jsonb(ARRAY[v_cell_mult_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_mult_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_mult_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_mult_id, v_church_id, v_group_id::text, v_cell_mult_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.13 Célula 14: Eliandra Figueiredo (Phronesis Virtuous)
  v_res := public.admin_provision_user(
    'phronesis.virtuous@embaixadadecristo.org',
    'Lionsgate@western',
    'Eliandra Figueiredo',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_virt_id,
    to_jsonb(ARRAY[v_cell_virt_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_virt_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_virt_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_virt_id, v_church_id, v_group_id::text, v_cell_virt_id::text, 'cell_leader', 'Active', now(), now(), now());

  RAISE NOTICE 'Provisionamento do Grupo Phronesis e suas 14 Células concluído com sucesso!';
END $$;
