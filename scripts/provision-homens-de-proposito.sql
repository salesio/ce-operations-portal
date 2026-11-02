-- ============================================================================
-- SCRIPT DE PROVISIONAMENTO: Grupo Homens de Propósito & Células Subordinadas
-- ============================================================================
-- Igreja: E.C. Maputo Central – Sede (a1111111-1111-4111-8111-111111111101)
--
-- 1. Líder de Grupo (PCF / Cell Group Leader):
--    - Grupo: Homens de Propósito
--    - Líder: Alves Mafuiana
--    - Email: homens.de.proposito@embaixadadecristo.org
--    - Senha: Jaffagate@Majesty
--    - Papel: Cell Group Leader (cell_group_leader)
--
-- 2. Líderes de Célula (Cell Leaders):
--    - Célula 1: Homens de Propósito Eco
--      Líder: Alves Mafuiana | Email: homens.de.proposito.eco@embaixadadecristo.org | Psw: Jaffagate@Victory
--    - Célula 2: Homens de Propósito Testemunhos de Fe
--      Líder: Luis escamado | Email: homens.de.proposito.testemunhos.de.fe@embaixadadecristo.org | Psw: Jaffagate@Eternal
--    - Célula 3: Homens de Propósito Testemunhos de Fe A
--      Líder: Djemisson Machava | Email: homens.de.proposito.testemunhos.de.fe.a@embaixadadecristo.org | Psw: Jaffagate@JaffaTower
--    - Célula 4: Homens de Propósito Dunamis
--      Líder: Edmilson Jacob | Email: homens.de.proposito.dunamis@embaixadadecristo.org | Psw: Damascusgate@144000
--    - Célula 5: Homens de Propósito Soldades de Cristo
--      Líder: Aristides Ferrao | Email: homens.de.proposito.soldades.de.cristo@embaixadadecristo.org | Psw: Damascusgate@Serraphin
--    - Célula 6: Homens de Propósito Verdade
--      Líder: Amandio Cumbe | Email: homens.de.proposito.verdade@embaixadadecristo.org | Psw: Damascusgate@Cherubim
--    - Célula 7: Homens de Propósito Discipulos de Cristo
--      Líder: Ailton Domingos | Email: homens.de.proposito.discipulos.de.cristo@embaixadadecristo.org | Psw: Damascusgate@eastern
-- ============================================================================

DO $$
DECLARE
  v_church_id uuid := 'a1111111-1111-4111-8111-111111111101'::uuid;
  v_group_id uuid;
  v_group_name text := 'Homens de Propósito';

  -- Célula IDs
  v_cell_eco_id uuid;
  v_cell_fe_id uuid;
  v_cell_fe_a_id uuid;
  v_cell_dunamis_id uuid;
  v_cell_soldados_id uuid;
  v_cell_verdade_id uuid;
  v_cell_discipulos_id uuid;

  v_all_cell_ids text[];
  v_res jsonb;

  -- Papel IDs
  v_cell_group_leader_role_id uuid;
  v_cell_leader_role_id uuid;

  -- Utilizadores
  v_u_pcf_id uuid;
  v_u_eco_id uuid;
  v_u_fe_id uuid;
  v_u_fe_a_id uuid;
  v_u_dunamis_id uuid;
  v_u_soldados_id uuid;
  v_u_verdade_id uuid;
  v_u_discipulos_id uuid;
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

  -- 2. Criar ou Obter Grupo de Células: "Homens de Propósito"
  SELECT id INTO v_group_id
  FROM public.cell_groups
  WHERE lower(trim(group_name)) = lower(v_group_name) OR lower(trim(name)) = lower(v_group_name)
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
      'Alves Mafuiana',
      'Active',
      now(),
      now()
    )
    RETURNING id INTO v_group_id;
    RAISE NOTICE 'Grupo de Célula "%" criado com ID: %', v_group_name, v_group_id;
  ELSE
    UPDATE public.cell_groups
    SET
      leader_name = 'Alves Mafuiana',
      church_id = v_church_id,
      status = 'Active',
      updated_at = now()
    WHERE id = v_group_id;
    RAISE NOTICE 'Grupo de Célula "%" atualizado com ID: %', v_group_name, v_group_id;
  END IF;

  -- 3. Criar ou Obter as 7 Células Subordinadas

  -- Célula 1: Homens de Propósito Eco
  SELECT id INTO v_cell_eco_id FROM public.cells WHERE lower(trim(cell_name)) = lower('Homens de Propósito Eco') OR lower(trim(name)) = lower('Homens de Propósito Eco') LIMIT 1;
  IF v_cell_eco_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Homens de Propósito Eco', 'Homens de Propósito Eco', 'Alves Mafuiana', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_eco_id;
  ELSE
    UPDATE public.cells SET cell_group_id = v_group_id, cell_group_name = v_group_name, leader_name = 'Alves Mafuiana', status = 'Active', updated_at = now() WHERE id = v_cell_eco_id;
  END IF;

  -- Célula 2: Homens de Propósito Testemunhos de Fe
  SELECT id INTO v_cell_fe_id FROM public.cells WHERE lower(trim(cell_name)) = lower('Homens de Propósito Testemunhos de Fe') OR lower(trim(name)) = lower('Homens de Propósito Testemunhos de Fe') LIMIT 1;
  IF v_cell_fe_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Homens de Propósito Testemunhos de Fe', 'Homens de Propósito Testemunhos de Fe', 'Luis escamado', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_fe_id;
  ELSE
    UPDATE public.cells SET cell_group_id = v_group_id, cell_group_name = v_group_name, leader_name = 'Luis escamado', status = 'Active', updated_at = now() WHERE id = v_cell_fe_id;
  END IF;

  -- Célula 3: Homens de Propósito Testemunhos de Fe A
  SELECT id INTO v_cell_fe_a_id FROM public.cells WHERE lower(trim(cell_name)) = lower('Homens de Propósito Testemunhos de Fe A') OR lower(trim(name)) = lower('Homens de Propósito Testemunhos de Fe A') LIMIT 1;
  IF v_cell_fe_a_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Homens de Propósito Testemunhos de Fe A', 'Homens de Propósito Testemunhos de Fe A', 'Djemisson Machava', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_fe_a_id;
  ELSE
    UPDATE public.cells SET cell_group_id = v_group_id, cell_group_name = v_group_name, leader_name = 'Djemisson Machava', status = 'Active', updated_at = now() WHERE id = v_cell_fe_a_id;
  END IF;

  -- Célula 4: Homens de Propósito Dunamis
  SELECT id INTO v_cell_dunamis_id FROM public.cells WHERE lower(trim(cell_name)) = lower('Homens de Propósito Dunamis') OR lower(trim(name)) = lower('Homens de Propósito Dunamis') LIMIT 1;
  IF v_cell_dunamis_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Homens de Propósito Dunamis', 'Homens de Propósito Dunamis', 'Edmilson Jacob', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_dunamis_id;
  ELSE
    UPDATE public.cells SET cell_group_id = v_group_id, cell_group_name = v_group_name, leader_name = 'Edmilson Jacob', status = 'Active', updated_at = now() WHERE id = v_cell_dunamis_id;
  END IF;

  -- Célula 5: Homens de Propósito Soldades de Cristo
  SELECT id INTO v_cell_soldados_id FROM public.cells WHERE lower(trim(cell_name)) = lower('Homens de Propósito Soldades de Cristo') OR lower(trim(name)) = lower('Homens de Propósito Soldades de Cristo') LIMIT 1;
  IF v_cell_soldados_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Homens de Propósito Soldades de Cristo', 'Homens de Propósito Soldades de Cristo', 'Aristides Ferrao', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_soldados_id;
  ELSE
    UPDATE public.cells SET cell_group_id = v_group_id, cell_group_name = v_group_name, leader_name = 'Aristides Ferrao', status = 'Active', updated_at = now() WHERE id = v_cell_soldados_id;
  END IF;

  -- Célula 6: Homens de Propósito Verdade
  SELECT id INTO v_cell_verdade_id FROM public.cells WHERE lower(trim(cell_name)) = lower('Homens de Propósito Verdade') OR lower(trim(name)) = lower('Homens de Propósito Verdade') LIMIT 1;
  IF v_cell_verdade_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Homens de Propósito Verdade', 'Homens de Propósito Verdade', 'Amandio Cumbe', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_verdade_id;
  ELSE
    UPDATE public.cells SET cell_group_id = v_group_id, cell_group_name = v_group_name, leader_name = 'Amandio Cumbe', status = 'Active', updated_at = now() WHERE id = v_cell_verdade_id;
  END IF;

  -- Célula 7: Homens de Propósito Discipulos de Cristo
  SELECT id INTO v_cell_discipulos_id FROM public.cells WHERE lower(trim(cell_name)) = lower('Homens de Propósito Discipulos de Cristo') OR lower(trim(name)) = lower('Homens de Propósito Discipulos de Cristo') LIMIT 1;
  IF v_cell_discipulos_id IS NULL THEN
    INSERT INTO public.cells (church_id, cell_group_id, cell_group_name, name, cell_name, leader_name, status, meeting_day, meeting_time, meeting_location, meeting_type)
    VALUES (v_church_id, v_group_id, v_group_name, 'Homens de Propósito Discipulos de Cristo', 'Homens de Propósito Discipulos de Cristo', 'Ailton Domingos', 'Active', 'Wednesday', '18:00', 'Maputo Central', 'Presencial')
    RETURNING id INTO v_cell_discipulos_id;
  ELSE
    UPDATE public.cells SET cell_group_id = v_group_id, cell_group_name = v_group_name, leader_name = 'Ailton Domingos', status = 'Active', updated_at = now() WHERE id = v_cell_discipulos_id;
  END IF;

  -- Atualizar contagem de células no grupo
  UPDATE public.cell_groups
  SET total_cells = 7, updated_at = now()
  WHERE id = v_group_id;

  v_all_cell_ids := ARRAY[
    v_cell_eco_id::text,
    v_cell_fe_id::text,
    v_cell_fe_a_id::text,
    v_cell_dunamis_id::text,
    v_cell_soldados_id::text,
    v_cell_verdade_id::text,
    v_cell_discipulos_id::text
  ];

  -- 4. PROVISIONAR UTILIZADORES VIA admin_provision_user

  -- 4.0 Líder de Grupo (PCF): Alves Mafuiana
  v_res := public.admin_provision_user(
    'homens.de.proposito@embaixadadecristo.org',
    'Jaffagate@Majesty',
    'Alves Mafuiana',
    'Cell Group Leader',
    v_church_id,
    v_group_id,
    v_cell_eco_id,
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

  -- 4.1 Célula 1 Líder: Alves Mafuiana (Conta de Célula Eco)
  v_res := public.admin_provision_user(
    'homens.de.proposito.eco@embaixadadecristo.org',
    'Jaffagate@Victory',
    'Alves Mafuiana',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_eco_id,
    to_jsonb(ARRAY[v_cell_eco_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_eco_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_eco_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_eco_id, v_church_id, v_group_id::text, v_cell_eco_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.2 Célula 2 Líder: Luis escamado
  v_res := public.admin_provision_user(
    'homens.de.proposito.testemunhos.de.fe@embaixadadecristo.org',
    'Jaffagate@Eternal',
    'Luis escamado',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_fe_id,
    to_jsonb(ARRAY[v_cell_fe_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_fe_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_fe_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_fe_id, v_church_id, v_group_id::text, v_cell_fe_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.3 Célula 3 Líder: Djemisson Machava
  v_res := public.admin_provision_user(
    'homens.de.proposito.testemunhos.de.fe.a@embaixadadecristo.org',
    'Jaffagate@JaffaTower',
    'Djemisson Machava',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_fe_a_id,
    to_jsonb(ARRAY[v_cell_fe_a_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_fe_a_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_fe_a_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_fe_a_id, v_church_id, v_group_id::text, v_cell_fe_a_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.4 Célula 4 Líder: Edmilson Jacob
  v_res := public.admin_provision_user(
    'homens.de.proposito.dunamis@embaixadadecristo.org',
    'Damascusgate@144000',
    'Edmilson Jacob',
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

  -- 4.5 Célula 5 Líder: Aristides Ferrao
  v_res := public.admin_provision_user(
    'homens.de.proposito.soldades.de.cristo@embaixadadecristo.org',
    'Damascusgate@Serraphin',
    'Aristides Ferrao',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_soldados_id,
    to_jsonb(ARRAY[v_cell_soldados_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_soldados_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_soldados_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_soldados_id, v_church_id, v_group_id::text, v_cell_soldados_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.6 Célula 6 Líder: Amandio Cumbe
  v_res := public.admin_provision_user(
    'homens.de.proposito.verdade@embaixadadecristo.org',
    'Damascusgate@Cherubim',
    'Amandio Cumbe',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_verdade_id,
    to_jsonb(ARRAY[v_cell_verdade_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_verdade_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_verdade_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_verdade_id, v_church_id, v_group_id::text, v_cell_verdade_id::text, 'cell_leader', 'Active', now(), now(), now());

  -- 4.7 Célula 7 Líder: Ailton Domingos
  v_res := public.admin_provision_user(
    'homens.de.proposito.discipulos.de.cristo@embaixadadecristo.org',
    'Damascusgate@eastern',
    'Ailton Domingos',
    'Cell Leader',
    v_church_id,
    v_group_id,
    v_cell_discipulos_id,
    to_jsonb(ARRAY[v_cell_discipulos_id::text]),
    to_jsonb(ARRAY[v_group_id::text]),
    '["cellReports"]'::jsonb,
    'Active',
    false,
    false,
    NULL
  );
  v_u_discipulos_id := (v_res->>'user_id')::uuid;
  DELETE FROM public.cell_user_assignments WHERE user_id = v_u_discipulos_id;
  INSERT INTO public.cell_user_assignments (user_id, church_id, cell_group_id, cell_id, assignment_role, status, starts_at, created_at, updated_at)
  VALUES (v_u_discipulos_id, v_church_id, v_group_id::text, v_cell_discipulos_id::text, 'cell_leader', 'Active', now(), now(), now());

  RAISE NOTICE 'Provisionamento do Grupo Homens de Propósito e suas 7 Células concluído com sucesso!';
END $$;
