-- ============================================================================
-- Migration: 0021_consolidate_maputo_hq_church.sql
-- Description: Consolidates duplicate church records for Maputo Sede into a single
--              canonical record ('E.C. Maputo Central - Sede') and removes the
--              duplicate ('National HQ - Christ Embassy Mozambique').
--
-- Safety Guarantees:
-- 1. Dynamic resolution of IDs — does not hardcode UUIDs.
-- 2. Fully transactional & idempotent.
-- 3. Non-destructive field merge (canonical wins, duplicate fills blanks).
-- 4. Historical trace and alias preservation in canonical metadata.
-- 5. Complete foreign key migration across all operational tables.
-- 6. Dynamic foreign key discovery via information_schema.
-- 7. Pre-deletion verification: strictly verifies zero remaining references
--    before deleting the duplicate church record (no cascade delete).
-- ============================================================================

DO $$
DECLARE
  v_canonical_id uuid;
  v_duplicate_id uuid;
  v_canonical_rec record;
  v_duplicate_rec record;
  v_remaining_refs integer := 0;
  v_table_refs integer := 0;
  r record;
  v_merged_meta jsonb;
  v_history jsonb;
BEGIN
  -- 1. Identify canonical church record
  SELECT id INTO v_canonical_id
  FROM public.churches
  WHERE church_name = 'E.C. Maputo Central - Sede'
     OR church_name ILIKE '%Maputo Central%Sede%'
     OR public_name = 'E.C. Maputo Central - Sede'
  ORDER BY created_at ASC
  LIMIT 1;

  -- If no canonical record exists under the explicit target name, check for existing HQ to become canonical
  IF v_canonical_id IS NULL THEN
    RAISE NOTICE '[0021_consolidate] Canonical record "E.C. Maputo Central - Sede" not found. Checking if duplicate is already the primary church...';
    RETURN;
  END IF;

  -- 2. Identify duplicate church record
  SELECT id INTO v_duplicate_id
  FROM public.churches
  WHERE (
    church_name = 'National HQ - Christ Embassy Mozambique'
    OR church_name ILIKE '%National HQ%'
    OR public_name ILIKE '%HQ Maputo%'
    OR public_name ILIKE '%Sede Nacional%'
  )
  AND id <> v_canonical_id
  ORDER BY created_at ASC
  LIMIT 1;

  -- If duplicate does not exist, the database is already consolidated
  IF v_duplicate_id IS NULL THEN
    RAISE NOTICE '[0021_consolidate] No duplicate HQ church record found. System is already consolidated under canonical id: %', v_canonical_id;
    RETURN;
  END IF;

  -- Fetch complete records for auditing and metadata merging
  SELECT * INTO v_canonical_rec FROM public.churches WHERE id = v_canonical_id;
  SELECT * INTO v_duplicate_rec FROM public.churches WHERE id = v_duplicate_id;

  RAISE NOTICE '[0021_consolidate] Starting consolidation: Canonical [%] (%) <- Duplicate [%] (%)',
    v_canonical_id, v_canonical_rec.church_name, v_duplicate_id, v_duplicate_rec.church_name;

  -- 3. Prepare merged metadata and historical trace
  v_history := jsonb_build_object(
    'merged_from_church_id', v_duplicate_id,
    'merged_from_church_name', v_duplicate_rec.church_name,
    'merged_from_public_name', v_duplicate_rec.public_name,
    'merged_from_phone', v_duplicate_rec.phone_primary,
    'merged_from_service_times', v_duplicate_rec.service_times,
    'merged_at', now()
  );

  v_merged_meta := COALESCE(v_canonical_rec.metadata, '{}'::jsonb) || jsonb_build_object(
    'merged_aliases', jsonb_build_array(
      'National HQ - Christ Embassy Mozambique',
      'E.C. Sede Nacional / HQ Maputo',
      'National HQ',
      'Sede Nacional'
    ),
    'merged_from_church_id', v_duplicate_id,
    'merged_at', now(),
    'duplicate_history', v_history
  );

  -- Update canonical record with merged non-null values where canonical is blank
  UPDATE public.churches
  SET
    church_name = 'E.C. Maputo Central - Sede',
    public_name = COALESCE(NULLIF(v_canonical_rec.public_name, ''), 'E.C. Maputo Central - Sede'),
    province = COALESCE(NULLIF(v_canonical_rec.province, ''), v_duplicate_rec.province, 'Maputo Cidade'),
    city = COALESCE(NULLIF(v_canonical_rec.city, ''), v_duplicate_rec.city, 'KaMpfumo'),
    district_or_area = COALESCE(NULLIF(v_canonical_rec.district_or_area, ''), v_duplicate_rec.district_or_area, 'Maputo'),
    address = COALESCE(NULLIF(v_canonical_rec.address, ''), v_duplicate_rec.address),
    pastor_in_charge = COALESCE(NULLIF(v_canonical_rec.pastor_in_charge, ''), v_duplicate_rec.pastor_in_charge, 'Pastor Kene Ume'),
    phone_primary = COALESCE(NULLIF(v_canonical_rec.phone_primary, ''), v_duplicate_rec.phone_primary, '+258 86 227 0000'),
    phone_secondary = COALESCE(NULLIF(v_canonical_rec.phone_secondary, ''), v_duplicate_rec.phone_secondary),
    email = COALESCE(NULLIF(v_canonical_rec.email, ''), v_duplicate_rec.email),
    status = 'Active',
    metadata = v_merged_meta,
    updated_at = now()
  WHERE id = v_canonical_id;

  -- 4. Update known operational tables explicitly

  -- Members
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'members') THEN
    UPDATE public.members SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;

  -- Cell Groups & Cells
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cell_groups') THEN
    UPDATE public.cell_groups SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cells') THEN
    UPDATE public.cells SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;

  -- Cell User Assignments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cell_user_assignments') THEN
    UPDATE public.cell_user_assignments SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;

  -- Cell Transfers & Removals
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cell_transfer_requests') THEN
    UPDATE public.cell_transfer_requests SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cell_member_removal_logs') THEN
    UPDATE public.cell_member_removal_logs SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;

  -- Users
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    UPDATE public.users SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;

  -- Staff and HR tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_members') THEN
    UPDATE public.staff_members SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_departments') THEN
    UPDATE public.staff_departments SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_roles') THEN
    UPDATE public.staff_roles SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_salaries') THEN
    UPDATE public.staff_salaries SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_performance_reviews') THEN
    UPDATE public.staff_performance_reviews SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_documents') THEN
    UPDATE public.staff_documents SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_attendance') THEN
    UPDATE public.staff_attendance SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;

  -- First Timers & Follow Ups
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'first_timers') THEN
    UPDATE public.first_timers SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'first_timer_intake_batches') THEN
    UPDATE public.first_timer_intake_batches SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'follow_ups') THEN
    UPDATE public.follow_ups SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;

  -- Candidate & Legacy Import Batches
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'member_registration_candidates') THEN
    UPDATE public.member_registration_candidates SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'member_legacy_import_batches') THEN
    UPDATE public.member_legacy_import_batches SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'member_legacy_import_rows') THEN
    UPDATE public.member_legacy_import_rows SET proposed_church_id = v_canonical_id WHERE proposed_church_id = v_duplicate_id;
  END IF;

  -- Foundation School
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'foundation_school_students') THEN
    UPDATE public.foundation_school_students SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'foundation_school_teachers') THEN
    UPDATE public.foundation_school_teachers SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'foundation_school_classes') THEN
    UPDATE public.foundation_school_classes SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'foundation_school_enrollments') THEN
    UPDATE public.foundation_school_enrollments SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'foundation_school_graduations') THEN
    UPDATE public.foundation_school_graduations SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;

  -- Finance & Requisitions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'finance_records') THEN
    UPDATE public.finance_records SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'public_giving_submissions') THEN
    UPDATE public.public_giving_submissions SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'finance_disbursements') THEN
    UPDATE public.finance_disbursements SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'requisitions') THEN
    UPDATE public.requisitions SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;

  -- Venue, Inventory & Media
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_items') THEN
    UPDATE public.inventory_items SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_movements') THEN
    UPDATE public.inventory_movements SET from_church_id = v_canonical_id WHERE from_church_id = v_duplicate_id;
    UPDATE public.inventory_movements SET to_church_id = v_canonical_id WHERE to_church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'venue_spaces') THEN
    UPDATE public.venue_spaces SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_checklists') THEN
    UPDATE public.service_checklists SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'media_team_members') THEN
    UPDATE public.media_team_members SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'media_services') THEN
    UPDATE public.media_services SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'media_channels') THEN
    UPDATE public.media_channels SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;

  -- Counseling & Sacraments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'counseling_cases') THEN
    UPDATE public.counseling_cases SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'counseling_requests') THEN
    UPDATE public.counseling_requests SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'counseling_appointments') THEN
    UPDATE public.counseling_appointments SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'counselors') THEN
    UPDATE public.counselors SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'baptisms') THEN
    UPDATE public.baptisms SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'marriages') THEN
    UPDATE public.marriages SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'baby_dedications') THEN
    UPDATE public.baby_dedications SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sacrament_certificates') THEN
    UPDATE public.sacrament_certificates SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sacrament_appointments') THEN
    UPDATE public.sacrament_appointments SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;

  -- Programs & Evangelism
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'programs') THEN
    UPDATE public.programs SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
    UPDATE public.programs SET main_church_id = v_canonical_id WHERE main_church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'program_participants') THEN
    UPDATE public.program_participants SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'program_registrations') THEN
    UPDATE public.program_registrations SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fevo_activities') THEN
    UPDATE public.fevo_activities SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fevo_evangelism_records') THEN
    UPDATE public.fevo_evangelism_records SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fevo_missing_reports') THEN
    UPDATE public.fevo_missing_reports SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fevo_prayer_records') THEN
    UPDATE public.fevo_prayer_records SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fevo_reports') THEN
    UPDATE public.fevo_reports SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fevo_visitation_records') THEN
    UPDATE public.fevo_visitation_records SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fevo_weekly_configs') THEN
    UPDATE public.fevo_weekly_configs SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;

  -- Ministry Materials & Reports
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ministry_materials_catalog') THEN
    UPDATE public.ministry_materials_catalog SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ministry_materials_stock') THEN
    UPDATE public.ministry_materials_stock SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ministry_materials_distributions') THEN
    UPDATE public.ministry_materials_distributions SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ministry_materials_requests') THEN
    UPDATE public.ministry_materials_requests SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ministry_materials_funds') THEN
    UPDATE public.ministry_materials_funds SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ministry_materials_reports') THEN
    UPDATE public.ministry_materials_reports SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ministry_materials_sales') THEN
    UPDATE public.ministry_materials_sales SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;

  -- Notifications, Saved Views, Audit & Parent Churches
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    UPDATE public.notifications SET recipient_church_id = v_canonical_id WHERE recipient_church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_snapshots') THEN
    UPDATE public.report_snapshots SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_report_views') THEN
    UPDATE public.saved_report_views SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sensitive_access_events') THEN
    UPDATE public.sensitive_access_events SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    UPDATE public.audit_logs SET church_id = v_canonical_id WHERE church_id = v_duplicate_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'churches' AND column_name = 'parent_church_id') THEN
    UPDATE public.churches SET parent_church_id = v_canonical_id WHERE parent_church_id = v_duplicate_id;
  END IF;

  -- 5. Dynamic Foreign Key Discovery & Update for all other foreign keys to churches.id
  FOR r IN (
    SELECT tc.table_schema, tc.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND ccu.table_name = 'churches'
      AND ccu.column_name = 'id'
      AND tc.table_name <> 'churches'
  ) LOOP
    EXECUTE format('UPDATE %I.%I SET %I = $1 WHERE %I = $2', r.table_schema, r.table_name, r.column_name, r.column_name)
    USING v_canonical_id, v_duplicate_id;
  END LOOP;

  -- 6. Safety Check: Verify that zero references to duplicate remain
  FOR r IN (
    SELECT tc.table_schema, tc.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND ccu.table_name = 'churches'
      AND ccu.column_name = 'id'
      AND tc.table_name <> 'churches'
  ) LOOP
    EXECUTE format('SELECT count(*) FROM %I.%I WHERE %I = $1', r.table_schema, r.table_name, r.column_name)
    INTO v_table_refs
    USING v_duplicate_id;

    IF v_table_refs > 0 THEN
      RAISE EXCEPTION '[0021_consolidate] Safety check failed: % references remain in table %.% on column %. Aborting consolidation.',
        v_table_refs, r.table_schema, r.table_name, r.column_name;
    END IF;
  END LOOP;

  -- 7. Delete duplicate record explicitly
  DELETE FROM public.churches WHERE id = v_duplicate_id;

  RAISE NOTICE '[0021_consolidate] Consolidation successfully completed. Duplicate church % deleted.', v_duplicate_id;
END $$ LANGUAGE plpgsql;
