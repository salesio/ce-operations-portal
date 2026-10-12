-- ============================================================================
-- Migration: 0045_add_official_churches_registry.sql
-- Description: Standardize all official churches in public.churches according to
--              official registration ("E.C. <Name>" naming convention) and populate
--              physical addresses, phone numbers, and service schedules.
-- ============================================================================

DO $$
BEGIN

  -- 1. Helper upsert / update procedure for canonical churches
  CREATE OR REPLACE PROCEDURE pg_temp.upsert_official_church(
    p_id uuid,
    p_name text,
    p_public_name text,
    p_province text,
    p_city text,
    p_district text,
    p_address text,
    p_phone_primary text,
    p_phone_secondary text,
    p_service_times jsonb,
    p_type text DEFAULT 'Igreja Local'
  ) AS $proc$
  DECLARE
    v_target_id uuid;
  BEGIN
    -- Check if record exists by UUID or by close name match
    SELECT id INTO v_target_id
    FROM public.churches
    WHERE id = p_id
       OR church_name ILIKE '%' || replace(replace(p_name, 'E.C. ', ''), 'E.C. - ', '') || '%'
       OR public_name ILIKE '%' || replace(replace(p_name, 'E.C. ', ''), 'E.C. - ', '') || '%'
    ORDER BY (id = p_id) DESC, created_at ASC
    LIMIT 1;

    IF v_target_id IS NOT NULL THEN
      UPDATE public.churches
      SET
        church_name = p_name,
        public_name = p_public_name,
        province = COALESCE(NULLIF(p_province, ''), province),
        city = COALESCE(NULLIF(p_city, ''), city),
        district_or_area = COALESCE(NULLIF(p_district, ''), district_or_area),
        address = p_address,
        phone_primary = p_phone_primary,
        phone_secondary = COALESCE(p_phone_secondary, phone_secondary, ''),
        service_times = p_service_times,
        type = COALESCE(type, p_type),
        status = 'Activa',
        information_status = 'Confirmado',
        updated_at = now()
      WHERE id = v_target_id;
    ELSE
      INSERT INTO public.churches (
        id,
        church_name,
        public_name,
        type,
        province,
        city,
        district_or_area,
        address,
        pastor_in_charge,
        phone_primary,
        phone_secondary,
        email,
        service_times,
        parent_church_id,
        status,
        information_status,
        created_at,
        updated_at
      ) VALUES (
        p_id,
        p_name,
        p_public_name,
        p_type,
        p_province,
        p_city,
        p_district,
        p_address,
        NULL,
        p_phone_primary,
        COALESCE(p_phone_secondary, ''),
        NULL,
        p_service_times,
        NULL,
        'Activa',
        'Confirmado',
        now(),
        now()
      );
    END IF;
  END;
  $proc$ LANGUAGE plpgsql;

  -- 2. Consolidate duplicate Nampula record if present
  IF EXISTS (SELECT 1 FROM public.churches WHERE id = '1da7c8c8-3723-4259-9634-e19d35246d48'::uuid) THEN
    UPDATE public.members SET church_id = 'a1111111-1111-4111-8111-111111111105'::uuid WHERE church_id = '1da7c8c8-3723-4259-9634-e19d35246d48'::uuid;
    UPDATE public.cells SET church_id = 'a1111111-1111-4111-8111-111111111105'::uuid WHERE church_id = '1da7c8c8-3723-4259-9634-e19d35246d48'::uuid;
    DELETE FROM public.churches WHERE id = '1da7c8c8-3723-4259-9634-e19d35246d48'::uuid;
  END IF;

  -- 3. Update & register all 21 official churches

  -- 1. E.C. Maputo Central - Sede
  CALL pg_temp.upsert_official_church(
    'a1111111-1111-4111-8111-111111111101'::uuid,
    'E.C. Maputo Central - Sede',
    'E.C. Maputo Central - Sede',
    'Maputo Cidade',
    'KaMpfumo',
    'Urbanização',
    'Avenida de Angola No 1818',
    '+258 86 227 0000',
    '',
    '[{"day_of_week": "Domingo", "service_name": "1º Culto", "time": "07:45 - 09:15", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "2º Culto", "time": "09:30 - 11:15", "service_type": "Presencial"}, {"day_of_week": "Quarta-feira", "service_name": "Culto de Ensino", "time": "18:00 - 20:00", "service_type": "Presencial"}]'::jsonb,
    'Sede Nacional'
  );

  -- 2. E.C. Maxaquene
  CALL pg_temp.upsert_official_church(
    'a4b58c3d-5f45-4dfd-9fc3-eef0b28f4394'::uuid,
    'E.C. Maxaquene',
    'E.C. Maxaquene',
    'Maputo Cidade',
    'KaMaxakeni',
    'Maxaquene',
    'Av. Milagre Mabote, Perto do Comando distrital da Policia Municipal',
    '+258 85 071 5705',
    '',
    '[{"day_of_week": "Quarta-feira", "service_name": "Culto de Quarta-feira", "time": "18:00 - 20:00", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "09:00 - 11:00", "service_type": "Presencial"}]'::jsonb
  );

  -- 3. E.C. Soveste
  CALL pg_temp.upsert_official_church(
    '134ca1e9-1923-4751-a389-2e1f6fd08308'::uuid,
    'E.C. Soveste',
    'E.C. Soveste',
    'Maputo Cidade',
    'KaMaxakeni',
    'Maxaquene',
    'Rua da Soveste, Em frente ao Car Wash',
    '+258 87 907 6716',
    '',
    '[{"day_of_week": "Quarta-feira", "service_name": "Culto de Quarta-feira", "time": "18:00 - 20:00", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "08:00 - 10:00", "service_type": "Presencial"}]'::jsonb
  );

  -- 4. E.C. Malhazine
  CALL pg_temp.upsert_official_church(
    '5bec53aa-8d64-49d9-a065-9670e408fcca'::uuid,
    'E.C. Malhazine',
    'E.C. Malhazine',
    'Maputo Cidade',
    'KaMavota',
    'Magoanine A',
    'Bairro de Magoanine "A", Próximo à paragem Muswazi',
    '+258 86 570 5588',
    '',
    '[{"day_of_week": "Quarta-feira", "service_name": "Culto de Quarta-feira", "time": "18:00 - 20:00", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "08:00 - 10:00", "service_type": "Presencial"}]'::jsonb
  );

  -- 5. E.C. Matendene
  CALL pg_temp.upsert_official_church(
    'a89e625e-e1d6-4b68-a20e-a3897f4ba61e'::uuid,
    'E.C. Matendene',
    'E.C. Matendene',
    'Maputo Cidade',
    'KaMavota',
    'Matendene',
    'Cruzamento de Matendene Primeira lomba, Rua do projeto',
    '+258 84 017 3645',
    '+258 87 317 3645',
    '[{"day_of_week": "Quarta-feira", "service_name": "Culto de Quarta-feira", "time": "18:00 - 20:00", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "08:00 - 10:00", "service_type": "Presencial"}]'::jsonb
  );

  -- 6. E.C. Choupal
  CALL pg_temp.upsert_official_church(
    'a1111111-1111-4111-8111-111111111106'::uuid,
    'E.C. Choupal',
    'E.C. Choupal',
    'Maputo Cidade',
    'KaMubukwana',
    'Choupal',
    'Rua 9',
    '+258 84 698 5710',
    '+258 84 717 0785',
    '[{"day_of_week": "Quarta-feira", "service_name": "Culto de Quarta-feira", "time": "18:00 - 20:00", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "08:00 - 11:00", "service_type": "Presencial"}]'::jsonb
  );

  -- 7. E.C. Matola
  CALL pg_temp.upsert_official_church(
    'a1111111-1111-4111-8111-111111111102'::uuid,
    'E.C. Matola',
    'E.C. Matola',
    'Maputo Província',
    'Matola',
    'Machava Sede',
    'Machava Sede, Paragem Nazi Nazi em frente ao Banco BIM',
    '+258 84 780 9005',
    '+258 87 780 9009',
    '[{"day_of_week": "Quarta-feira", "service_name": "Culto de Quarta-feira", "time": "18:00 - 20:00", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "09:00 - 11:00", "service_type": "Presencial"}]'::jsonb
  );

  -- 8. E.C. Machava 1
  CALL pg_temp.upsert_official_church(
    'ff953bf1-7964-4023-be6e-13b5dc7fd5e3'::uuid,
    'E.C. Machava 1',
    'E.C. Machava 1',
    'Maputo Província',
    'Matola',
    'Machava 1',
    'Paragem Baião',
    '+258 84 634 8924',
    '+258 86 634 8924',
    '[{"day_of_week": "Quarta-feira", "service_name": "Culto de Quarta-feira", "time": "18:00 - 20:00", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "08:30 - 10:00", "service_type": "Presencial"}]'::jsonb
  );

  -- 9. E.C. Matola 700
  CALL pg_temp.upsert_official_church(
    '25933efb-20a3-43a4-a610-410360a1df94'::uuid,
    'E.C. Matola 700',
    'E.C. Matola 700',
    'Maputo Província',
    'Matola',
    'Matola F',
    'Atrás do Shoprite, Rua de Sofala, número 178, Matola F, ao pé da MOBISCO',
    '+258 87 737 9797',
    '',
    '[{"day_of_week": "Quarta-feira", "service_name": "Culto de Quarta-feira", "time": "18:00 - 20:00", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "09:00 - 11:00", "service_type": "Presencial"}]'::jsonb
  );

  -- 10. E.C. Khongolote
  CALL pg_temp.upsert_official_church(
    'a1111111-1111-4111-8111-111111111103'::uuid,
    'E.C. Khongolote',
    'E.C. Khongolote',
    'Maputo Província',
    'Matola',
    'Khongolote',
    '1 de Maio, atrás da nossa loja',
    '+258 84 366 8999',
    '+258 87 366 5744',
    '[{"day_of_week": "Quarta-feira", "service_name": "Culto de Quarta-feira", "time": "18:00 - 19:20", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "09:00 - 10:30", "service_type": "Presencial"}]'::jsonb
  );

  -- 11. E.C. Chamanculo
  CALL pg_temp.upsert_official_church(
    'e30f5af0-5011-4e9b-9257-95a3d5e375ea'::uuid,
    'E.C. Chamanculo',
    'E.C. Chamanculo',
    'Maputo Cidade',
    'Nlhamankulu',
    'Chamanculo',
    'Rua da UFA',
    '+258 84 752 8642',
    '',
    '[{"day_of_week": "Quarta-feira", "service_name": "Culto de Quarta-feira", "time": "18:00 - 20:00", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "08:00 - 10:00", "service_type": "Presencial"}]'::jsonb
  );

  -- 12. E.C. Zona Verde
  CALL pg_temp.upsert_official_church(
    '285a880a-2cca-4d13-8224-f831ccfeb141'::uuid,
    'E.C. Zona Verde',
    'E.C. Zona Verde',
    'Maputo Província',
    'Matola',
    'Zona Verde',
    'Paragem Distrito',
    '+258 84 640 8877',
    '',
    '[{"day_of_week": "Quarta-feira", "service_name": "Culto de Quarta-feira", "time": "18:00 - 19:30", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "08:30 - 10:00", "service_type": "Presencial"}]'::jsonb
  );

  -- 13. E.C. Manhiça
  CALL pg_temp.upsert_official_church(
    '132f3e3d-02e2-4dfe-9e42-c46fa59f3883'::uuid,
    'E.C. Manhiça',
    'E.C. Manhiça',
    'Maputo Província',
    'Manhiça',
    'Manhiça',
    'Estrada N1, ao lado do restaurante A Palhota (paragem mercado aeródromo)',
    '+258 87 506 2895',
    '',
    '[{"day_of_week": "Quarta-feira", "service_name": "Culto de Quarta-feira", "time": "17:30 - 19:00", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "09:00 - 11:00", "service_type": "Presencial"}]'::jsonb
  );

  -- 14. E.C. Inhambane
  CALL pg_temp.upsert_official_church(
    '586f3073-f5aa-49a6-b09a-51d5747e9991'::uuid,
    'E.C. Inhambane',
    'E.C. Inhambane',
    'Inhambane',
    'Inhambane',
    'Liberdade 1',
    'Bairro Liberdade 1, Marivas (antigo ginásio)',
    '+258 85 625 8985',
    '',
    '[{"day_of_week": "Quarta-feira", "service_name": "Culto de Quarta-feira", "time": "18:00 - 19:30", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "08:30 - 10:00", "service_type": "Presencial"}]'::jsonb
  );

  -- 15. E.C. Beira
  CALL pg_temp.upsert_official_church(
    'a1111111-1111-4111-8111-111111111104'::uuid,
    'E.C. Beira',
    'E.C. Beira',
    'Sofala',
    'Beira',
    'Centro',
    'Cinema Olímpia (atrás da AGL)',
    '+258 87 402 0035',
    '',
    '[{"day_of_week": "Quarta-feira", "service_name": "Culto de Quarta-feira", "time": "18:00 - 20:00", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "09:00 - 11:00", "service_type": "Presencial"}]'::jsonb
  );

  -- 16. E.C. Tete
  CALL pg_temp.upsert_official_church(
    '66803aaa-ba1d-461f-8ca3-a27311c04fa8'::uuid,
    'E.C. Tete',
    'E.C. Tete',
    'Tete',
    'Tete',
    'Francisco Manyanga',
    'Perto do hospital centro número 3, Bairro Francisco Manyanga',
    '+258 86 029 0962',
    '+258 84 129 6839',
    '[{"day_of_week": "Quarta-feira", "service_name": "Culto de Quarta-feira", "time": "18:00 - 19:30", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "08:30 - 11:00", "service_type": "Presencial"}]'::jsonb
  );

  -- 17. E.C. Chimoio
  CALL pg_temp.upsert_official_church(
    '01bd4fc6-7ac1-4f34-a370-89cc967727b1'::uuid,
    'E.C. Chimoio',
    'E.C. Chimoio',
    'Manica',
    'Chimoio',
    '7 de Setembro',
    'Bairro 7 de Setembro, Rua do Pimpão, ao lado da Farmácia 7 de Setembro',
    '+258 87 215 6741',
    '',
    '[{"day_of_week": "Quarta-feira", "service_name": "Culto de Quarta-feira", "time": "18:00 - 19:30", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "09:00 - 11:00", "service_type": "Presencial"}]'::jsonb
  );

  -- 18. E.C. Nampula
  CALL pg_temp.upsert_official_church(
    'a1111111-1111-4111-8111-111111111105'::uuid,
    'E.C. Nampula',
    'E.C. Nampula',
    'Nampula',
    'Nampula',
    'Amurane / Muhala',
    'Paragem Armazém, na rua do mercado Amurane',
    '+258 86 759 6384',
    '',
    '[{"day_of_week": "Quarta-feira", "service_name": "Culto de Quarta-feira", "time": "17:30 - 19:00", "service_type": "Presencial"}, {"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "08:00 - 11:00", "service_type": "Presencial"}]'::jsonb
  );

  -- 19. E.C. Lichinga
  CALL pg_temp.upsert_official_church(
    'ba7a28e9-ccd2-439e-9e78-bf9ab3259d1d'::uuid,
    'E.C. Lichinga',
    'E.C. Lichinga',
    'Niassa',
    'Lichinga',
    'Nângala',
    'Av. Eduardo Mondlane, perto da Universidade Rovuma Niassa, Bairro Nângala',
    '+258 84 900 1077',
    '',
    '[{"day_of_week": "Domingo", "service_name": "Culto de Domingo", "time": "09:00 - 11:00", "service_type": "Presencial"}]'::jsonb
  );

  -- 20. E.C. Dondo
  CALL pg_temp.upsert_official_church(
    'd18a9a72-c9c0-4b82-94bc-5e0aeaac3b7f'::uuid,
    'E.C. Dondo',
    'E.C. Dondo',
    'Sofala',
    'Dondo',
    'Vila de Dondo',
    'Complexo Maia & Dinis, EN6, Vila de Dondo',
    '+258 85 693 9348',
    '',
    '[]'::jsonb
  );

  -- 21. E.C. Manga
  CALL pg_temp.upsert_official_church(
    'c8bda7f4-be6a-49f8-8485-894e942cb693'::uuid,
    'E.C. Manga',
    'E.C. Manga',
    'Sofala',
    'Beira',
    'Manga',
    'Rua 2, próximo ao supermercado Mutarara',
    '+258 85 781 7483',
    '+258 86 321 7166',
    '[]'::jsonb
  );

  -- E.C. Xai-Xai
  CALL pg_temp.upsert_official_church(
    'ccf45f8f-8692-4556-a7a4-e98d6cc1d715'::uuid,
    'E.C. Xai-Xai',
    'E.C. Xai-Xai',
    'Gaza',
    'Xai-Xai',
    'Xai-Xai',
    '',
    '',
    '',
    '[]'::jsonb
  );

  -- E.C. Online
  CALL pg_temp.upsert_official_church(
    'a1111111-1111-4111-8111-111111111107'::uuid,
    'E.C. Online',
    'E.C. Online',
    'Online',
    'Online',
    'Virtual',
    'Transmissão online',
    '+258 86 877 389',
    '',
    '[{"day_of_week": "Domingo", "service_name": "Culto Online", "time": "09:00 - 11:00", "service_type": "Online"}]'::jsonb,
    'Igreja Online'
  );

  DROP PROCEDURE IF EXISTS pg_temp.upsert_official_church(uuid, text, text, text, text, text, text, text, text, jsonb, text);

END $$;
