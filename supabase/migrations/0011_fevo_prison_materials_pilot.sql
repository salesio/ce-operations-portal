-- Backend Phase 11 - F.E.V.O + Prison Ministry + Ministry Materials pilot
-- Additive only. No automatic people, Finance, Follow-Up, or Venue/Inventory records.

CREATE TABLE IF NOT EXISTS public.fevo_weekly_configs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), week_start_date date NOT NULL, week_end_date date NOT NULL,
 church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text, config_title text, description text,
 team_a_name text DEFAULT 'Team A', team_b_name text DEFAULT 'Team B', team_c_name text DEFAULT 'Team C', team_d_name text DEFAULT 'Team D',
 team_a_activity_type text, team_b_activity_type text, team_c_activity_type text, team_d_activity_type text,
 expected_report_day text, expected_report_time text, status text NOT NULL DEFAULT 'Draft',
 activated_by uuid, activated_by_name text, activated_at timestamptz, notes text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_by uuid, updated_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.fevo_activities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), weekly_config_id uuid REFERENCES public.fevo_weekly_configs(id) ON DELETE CASCADE,
 church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text, team_key text, team_name text,
 activity_type text NOT NULL, activity_date date, expected_report_date date, assigned_to_staff_id uuid, assigned_to_name text,
 status text NOT NULL DEFAULT 'Assigned', report_id uuid, notes text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_by uuid, updated_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(weekly_config_id, team_key)
);
CREATE TABLE IF NOT EXISTS public.fevo_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), activity_id uuid REFERENCES public.fevo_activities(id) ON DELETE SET NULL,
 weekly_config_id uuid REFERENCES public.fevo_weekly_configs(id) ON DELETE SET NULL,
 church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text, team_key text, team_name text, activity_type text,
 report_date date NOT NULL DEFAULT current_date, submitted_by uuid, submitted_by_name text, submitted_at timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL DEFAULT 'Submitted', validated_by uuid, validated_by_name text, validated_at timestamptz,
 rejected_by uuid, rejected_by_name text, rejected_at timestamptz, rejection_reason text, summary text,
 total_people_contacted integer NOT NULL DEFAULT 0, total_first_timers integer NOT NULL DEFAULT 0,
 total_new_converts integer NOT NULL DEFAULT 0, total_prayer_requests integer NOT NULL DEFAULT 0, total_testimonies integer NOT NULL DEFAULT 0,
 typed_record_id uuid, typed_record_type text, notes text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_by uuid, updated_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.fevo_evangelism_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), report_id uuid REFERENCES public.fevo_reports(id) ON DELETE CASCADE,
 church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text, location text, evangelism_date date, team_name text,
 people_reached integer NOT NULL DEFAULT 0, souls_won integer NOT NULL DEFAULT 0, first_timers_invited integer NOT NULL DEFAULT 0,
 first_timers_attended integer NOT NULL DEFAULT 0, created_first_timer_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
 testimonies text, challenges text, notes text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.fevo_visitation_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), report_id uuid REFERENCES public.fevo_reports(id) ON DELETE CASCADE,
 church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text, visitation_date date, location text,
 families_visited integer NOT NULL DEFAULT 0, people_visited integer NOT NULL DEFAULT 0, new_converts_visited integer NOT NULL DEFAULT 0,
 members_visited integer NOT NULL DEFAULT 0, prayer_requests_count integer NOT NULL DEFAULT 0, testimonies_count integer NOT NULL DEFAULT 0,
 referrals_count integer NOT NULL DEFAULT 0, referral_notes text, follow_up_required boolean NOT NULL DEFAULT false,
 follow_up_ids jsonb NOT NULL DEFAULT '[]'::jsonb, testimonies text, challenges text, notes text,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.fevo_prayer_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), report_id uuid REFERENCES public.fevo_reports(id) ON DELETE CASCADE,
 church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text, prayer_date date, location text,
 total_attendance integer NOT NULL DEFAULT 0, prayer_requests_count integer NOT NULL DEFAULT 0, testimonies_count integer NOT NULL DEFAULT 0,
 new_converts_prayed_for integer NOT NULL DEFAULT 0, main_prayer_points text, testimonies text, notes text,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.fevo_missing_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), activity_id uuid REFERENCES public.fevo_activities(id) ON DELETE SET NULL,
 weekly_config_id uuid REFERENCES public.fevo_weekly_configs(id) ON DELETE SET NULL,
 church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text, team_key text, team_name text, activity_type text,
 expected_report_date date, detected_at timestamptz NOT NULL DEFAULT now(), status text NOT NULL DEFAULT 'Missing',
 resolved boolean NOT NULL DEFAULT false, resolved_at timestamptz, resolved_by uuid, resolved_by_name text, resolution_notes text,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(activity_id)
);

CREATE TABLE IF NOT EXISTS public.prison_locations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), location_code text UNIQUE, name text NOT NULL, province text, city text, district text,
 location_type text NOT NULL DEFAULT 'Prison', responsible_staff_id uuid, responsible_name text,
 contact_person_name text, contact_phone text, service_days jsonb NOT NULL DEFAULT '[]'::jsonb, service_notes text,
 status text NOT NULL DEFAULT 'Active', notes text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_by uuid, updated_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.prison_services (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), prison_location_id uuid REFERENCES public.prison_locations(id) ON DELETE CASCADE,
 service_date date NOT NULL, service_type text, responsible_staff_id uuid, responsible_name text,
 team_member_ids jsonb NOT NULL DEFAULT '[]'::jsonb, team_member_names jsonb NOT NULL DEFAULT '[]'::jsonb,
 attendance_count integer NOT NULL DEFAULT 0, new_converts_count integer NOT NULL DEFAULT 0,
 testimonies_count integer NOT NULL DEFAULT 0, prayer_requests_count integer NOT NULL DEFAULT 0,
 materials_distributed jsonb NOT NULL DEFAULT '[]'::jsonb, status text NOT NULL DEFAULT 'Planned', summary text, notes text,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_by uuid, updated_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.prison_foundation_classes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), prison_location_id uuid REFERENCES public.prison_locations(id) ON DELETE CASCADE,
 class_code text UNIQUE, name text NOT NULL, teacher_staff_id uuid, teacher_name text, start_date date, end_date date,
 schedule_day text, schedule_time text, status text NOT NULL DEFAULT 'Active', student_count integer NOT NULL DEFAULT 0,
 graduated_count integer NOT NULL DEFAULT 0, notes text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_by uuid, updated_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.prison_foundation_students (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), prison_class_id uuid REFERENCES public.prison_foundation_classes(id) ON DELETE CASCADE,
 prison_location_id uuid REFERENCES public.prison_locations(id) ON DELETE CASCADE, student_code text UNIQUE, display_name text NOT NULL,
 lessons_completed integer NOT NULL DEFAULT 0, lesson_progress_percentage numeric NOT NULL DEFAULT 0,
 final_exam_score numeric NOT NULL DEFAULT 0, passed boolean NOT NULL DEFAULT false, graduated boolean NOT NULL DEFAULT false,
 status text NOT NULL DEFAULT 'Active', notes text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_by uuid, updated_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.prison_agenda_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), prison_location_id uuid REFERENCES public.prison_locations(id) ON DELETE SET NULL,
 title text NOT NULL, description text, agenda_date date, start_time text, end_time text, agenda_type text,
 responsible_staff_id uuid, responsible_name text, status text NOT NULL DEFAULT 'Planned', notes text,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_by uuid, updated_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.prison_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), prison_location_id uuid REFERENCES public.prison_locations(id) ON DELETE SET NULL,
 service_id uuid REFERENCES public.prison_services(id) ON DELETE SET NULL, report_title text, report_type text,
 report_date date NOT NULL DEFAULT current_date, attendance_count integer NOT NULL DEFAULT 0,
 new_converts_count integer NOT NULL DEFAULT 0, testimonies_count integer NOT NULL DEFAULT 0,
 foundation_students_count integer NOT NULL DEFAULT 0, materials_distributed_count integer NOT NULL DEFAULT 0,
 summary text, testimonies_summary text, needs_summary text, status text NOT NULL DEFAULT 'Draft',
 submitted_by uuid, submitted_by_name text, submitted_at timestamptz, approved_by uuid, approved_by_name text, approved_at timestamptz,
 notes text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ministry_materials_catalog (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), item_code text UNIQUE, title text NOT NULL, description text,
 material_type text, category text, language text NOT NULL DEFAULT 'Portuguese', unit text NOT NULL DEFAULT 'unit',
 default_price numeric NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'MZN', status text NOT NULL DEFAULT 'Active',
 is_free boolean NOT NULL DEFAULT false, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_by uuid, updated_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ministry_materials_stock (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), catalog_item_id uuid REFERENCES public.ministry_materials_catalog(id) ON DELETE CASCADE,
 church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text, location_name text,
 quantity_available numeric NOT NULL DEFAULT 0, quantity_reserved numeric NOT NULL DEFAULT 0,
 quantity_distributed numeric NOT NULL DEFAULT 0, quantity_sold numeric NOT NULL DEFAULT 0,
 reorder_level numeric NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'Available', notes text,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_by uuid, updated_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ministry_materials_sales (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sale_number text UNIQUE,
 catalog_item_id uuid REFERENCES public.ministry_materials_catalog(id) ON DELETE SET NULL, catalog_item_title text,
 church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text,
 buyer_type text, buyer_name text, buyer_phone text, quantity numeric NOT NULL DEFAULT 1,
 unit_price numeric NOT NULL DEFAULT 0, total_amount numeric NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'MZN',
 payment_method text, payment_reference text, sale_date date NOT NULL DEFAULT current_date,
 status text NOT NULL DEFAULT 'Recorded Internally', finance_record_id uuid, fund_id uuid, notes text,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_by uuid, updated_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ministry_materials_distributions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), distribution_number text UNIQUE,
 catalog_item_id uuid REFERENCES public.ministry_materials_catalog(id) ON DELETE SET NULL, catalog_item_title text,
 church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text, target_type text, target_name text,
 quantity numeric NOT NULL DEFAULT 1, distribution_date date NOT NULL DEFAULT current_date,
 distributed_by uuid, distributed_by_name text, source_module text, source_id uuid,
 status text NOT NULL DEFAULT 'Completed', notes text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_by uuid, updated_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ministry_materials_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_number text UNIQUE, requested_by uuid, requested_by_name text,
 church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text, source_module text, source_id uuid,
 catalog_item_id uuid REFERENCES public.ministry_materials_catalog(id) ON DELETE SET NULL, catalog_item_title text,
 quantity_requested numeric NOT NULL DEFAULT 1, quantity_approved numeric NOT NULL DEFAULT 0,
 quantity_fulfilled numeric NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'Pending',
 approved_by uuid, approved_by_name text, approved_at timestamptz, fulfilled_by uuid, fulfilled_by_name text, fulfilled_at timestamptz,
 notes text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_by uuid, updated_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ministry_materials_funds (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), fund_number text UNIQUE, source_type text, source_id uuid,
 church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text, amount numeric NOT NULL DEFAULT 0,
 currency text NOT NULL DEFAULT 'MZN', fund_date date NOT NULL DEFAULT current_date,
 status text NOT NULL DEFAULT 'Recorded Internally', finance_record_id uuid, notes text,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_by uuid, updated_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ministry_materials_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), report_title text, report_type text,
 church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL, church_name text, report_date date NOT NULL DEFAULT current_date,
 stock_summary jsonb NOT NULL DEFAULT '{}'::jsonb, sales_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
 distribution_summary jsonb NOT NULL DEFAULT '{}'::jsonb, requests_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
 funds_summary jsonb NOT NULL DEFAULT '{}'::jsonb, status text NOT NULL DEFAULT 'Draft',
 submitted_by uuid, submitted_by_name text, submitted_at timestamptz, approved_by uuid, approved_by_name text, approved_at timestamptz,
 notes text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fevo_weekly_configs_church_id ON public.fevo_weekly_configs(church_id); CREATE INDEX IF NOT EXISTS idx_fevo_weekly_configs_status ON public.fevo_weekly_configs(status); CREATE INDEX IF NOT EXISTS idx_fevo_weekly_configs_week_start ON public.fevo_weekly_configs(week_start_date);
CREATE INDEX IF NOT EXISTS idx_fevo_activities_config_id ON public.fevo_activities(weekly_config_id); CREATE INDEX IF NOT EXISTS idx_fevo_activities_church_id ON public.fevo_activities(church_id); CREATE INDEX IF NOT EXISTS idx_fevo_activities_team_key ON public.fevo_activities(team_key); CREATE INDEX IF NOT EXISTS idx_fevo_activities_type ON public.fevo_activities(activity_type); CREATE INDEX IF NOT EXISTS idx_fevo_activities_status ON public.fevo_activities(status); CREATE INDEX IF NOT EXISTS idx_fevo_activities_expected_report_date ON public.fevo_activities(expected_report_date);
CREATE INDEX IF NOT EXISTS idx_fevo_reports_activity_id ON public.fevo_reports(activity_id); CREATE INDEX IF NOT EXISTS idx_fevo_reports_config_id ON public.fevo_reports(weekly_config_id); CREATE INDEX IF NOT EXISTS idx_fevo_reports_church_id ON public.fevo_reports(church_id); CREATE INDEX IF NOT EXISTS idx_fevo_reports_status ON public.fevo_reports(status); CREATE INDEX IF NOT EXISTS idx_fevo_reports_activity_type ON public.fevo_reports(activity_type); CREATE INDEX IF NOT EXISTS idx_fevo_reports_report_date ON public.fevo_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_fevo_evangelism_report_id ON public.fevo_evangelism_records(report_id); CREATE INDEX IF NOT EXISTS idx_fevo_evangelism_church_id ON public.fevo_evangelism_records(church_id); CREATE INDEX IF NOT EXISTS idx_fevo_evangelism_date ON public.fevo_evangelism_records(evangelism_date);
CREATE INDEX IF NOT EXISTS idx_fevo_visitation_report_id ON public.fevo_visitation_records(report_id); CREATE INDEX IF NOT EXISTS idx_fevo_visitation_church_id ON public.fevo_visitation_records(church_id); CREATE INDEX IF NOT EXISTS idx_fevo_visitation_date ON public.fevo_visitation_records(visitation_date);
CREATE INDEX IF NOT EXISTS idx_fevo_prayer_report_id ON public.fevo_prayer_records(report_id); CREATE INDEX IF NOT EXISTS idx_fevo_prayer_church_id ON public.fevo_prayer_records(church_id); CREATE INDEX IF NOT EXISTS idx_fevo_prayer_date ON public.fevo_prayer_records(prayer_date);
CREATE INDEX IF NOT EXISTS idx_fevo_missing_activity_id ON public.fevo_missing_reports(activity_id); CREATE INDEX IF NOT EXISTS idx_fevo_missing_config_id ON public.fevo_missing_reports(weekly_config_id); CREATE INDEX IF NOT EXISTS idx_fevo_missing_church_id ON public.fevo_missing_reports(church_id); CREATE INDEX IF NOT EXISTS idx_fevo_missing_status ON public.fevo_missing_reports(status); CREATE INDEX IF NOT EXISTS idx_fevo_missing_expected_date ON public.fevo_missing_reports(expected_report_date);
CREATE INDEX IF NOT EXISTS idx_prison_locations_province ON public.prison_locations(province); CREATE INDEX IF NOT EXISTS idx_prison_locations_city ON public.prison_locations(city); CREATE INDEX IF NOT EXISTS idx_prison_locations_status ON public.prison_locations(status); CREATE INDEX IF NOT EXISTS idx_prison_locations_responsible_staff ON public.prison_locations(responsible_staff_id);
CREATE INDEX IF NOT EXISTS idx_prison_services_location_id ON public.prison_services(prison_location_id); CREATE INDEX IF NOT EXISTS idx_prison_services_date ON public.prison_services(service_date); CREATE INDEX IF NOT EXISTS idx_prison_services_type ON public.prison_services(service_type); CREATE INDEX IF NOT EXISTS idx_prison_services_status ON public.prison_services(status);
CREATE INDEX IF NOT EXISTS idx_prison_foundation_classes_location_id ON public.prison_foundation_classes(prison_location_id); CREATE INDEX IF NOT EXISTS idx_prison_foundation_classes_teacher ON public.prison_foundation_classes(teacher_staff_id); CREATE INDEX IF NOT EXISTS idx_prison_foundation_classes_status ON public.prison_foundation_classes(status);
CREATE INDEX IF NOT EXISTS idx_prison_foundation_students_class_id ON public.prison_foundation_students(prison_class_id); CREATE INDEX IF NOT EXISTS idx_prison_foundation_students_location_id ON public.prison_foundation_students(prison_location_id); CREATE INDEX IF NOT EXISTS idx_prison_foundation_students_status ON public.prison_foundation_students(status); CREATE INDEX IF NOT EXISTS idx_prison_foundation_students_graduated ON public.prison_foundation_students(graduated);
CREATE INDEX IF NOT EXISTS idx_prison_agenda_location_id ON public.prison_agenda_items(prison_location_id); CREATE INDEX IF NOT EXISTS idx_prison_agenda_date ON public.prison_agenda_items(agenda_date); CREATE INDEX IF NOT EXISTS idx_prison_agenda_status ON public.prison_agenda_items(status); CREATE INDEX IF NOT EXISTS idx_prison_agenda_type ON public.prison_agenda_items(agenda_type);
CREATE INDEX IF NOT EXISTS idx_prison_reports_location_id ON public.prison_reports(prison_location_id); CREATE INDEX IF NOT EXISTS idx_prison_reports_service_id ON public.prison_reports(service_id); CREATE INDEX IF NOT EXISTS idx_prison_reports_date ON public.prison_reports(report_date); CREATE INDEX IF NOT EXISTS idx_prison_reports_status ON public.prison_reports(status);
CREATE INDEX IF NOT EXISTS idx_materials_catalog_code ON public.ministry_materials_catalog(item_code); CREATE INDEX IF NOT EXISTS idx_materials_catalog_type ON public.ministry_materials_catalog(material_type); CREATE INDEX IF NOT EXISTS idx_materials_catalog_status ON public.ministry_materials_catalog(status); CREATE INDEX IF NOT EXISTS idx_materials_catalog_language ON public.ministry_materials_catalog(language);
CREATE INDEX IF NOT EXISTS idx_materials_stock_catalog_item_id ON public.ministry_materials_stock(catalog_item_id); CREATE INDEX IF NOT EXISTS idx_materials_stock_church_id ON public.ministry_materials_stock(church_id); CREATE INDEX IF NOT EXISTS idx_materials_stock_status ON public.ministry_materials_stock(status);
CREATE INDEX IF NOT EXISTS idx_materials_sales_catalog_item_id ON public.ministry_materials_sales(catalog_item_id); CREATE INDEX IF NOT EXISTS idx_materials_sales_church_id ON public.ministry_materials_sales(church_id); CREATE INDEX IF NOT EXISTS idx_materials_sales_date ON public.ministry_materials_sales(sale_date); CREATE INDEX IF NOT EXISTS idx_materials_sales_status ON public.ministry_materials_sales(status); CREATE INDEX IF NOT EXISTS idx_materials_sales_fund_id ON public.ministry_materials_sales(fund_id);
CREATE INDEX IF NOT EXISTS idx_materials_distributions_catalog_item_id ON public.ministry_materials_distributions(catalog_item_id); CREATE INDEX IF NOT EXISTS idx_materials_distributions_church_id ON public.ministry_materials_distributions(church_id); CREATE INDEX IF NOT EXISTS idx_materials_distributions_date ON public.ministry_materials_distributions(distribution_date); CREATE INDEX IF NOT EXISTS idx_materials_distributions_target_type ON public.ministry_materials_distributions(target_type); CREATE INDEX IF NOT EXISTS idx_materials_distributions_source ON public.ministry_materials_distributions(source_module, source_id);
CREATE INDEX IF NOT EXISTS idx_materials_requests_church_id ON public.ministry_materials_requests(church_id); CREATE INDEX IF NOT EXISTS idx_materials_requests_status ON public.ministry_materials_requests(status); CREATE INDEX IF NOT EXISTS idx_materials_requests_source ON public.ministry_materials_requests(source_module, source_id); CREATE INDEX IF NOT EXISTS idx_materials_requests_catalog_item_id ON public.ministry_materials_requests(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_materials_funds_church_id ON public.ministry_materials_funds(church_id); CREATE INDEX IF NOT EXISTS idx_materials_funds_date ON public.ministry_materials_funds(fund_date); CREATE INDEX IF NOT EXISTS idx_materials_funds_status ON public.ministry_materials_funds(status); CREATE INDEX IF NOT EXISTS idx_materials_funds_source ON public.ministry_materials_funds(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_materials_reports_church_id ON public.ministry_materials_reports(church_id); CREATE INDEX IF NOT EXISTS idx_materials_reports_date ON public.ministry_materials_reports(report_date); CREATE INDEX IF NOT EXISTS idx_materials_reports_status ON public.ministry_materials_reports(status); CREATE INDEX IF NOT EXISTS idx_materials_reports_type ON public.ministry_materials_reports(report_type);

DO $$ DECLARE table_name text; BEGIN FOREACH table_name IN ARRAY ARRAY[
 'fevo_weekly_configs','fevo_activities','fevo_reports','fevo_evangelism_records','fevo_visitation_records','fevo_prayer_records','fevo_missing_reports',
 'prison_locations','prison_services','prison_foundation_classes','prison_foundation_students','prison_agenda_items','prison_reports',
 'ministry_materials_catalog','ministry_materials_stock','ministry_materials_sales','ministry_materials_distributions','ministry_materials_requests','ministry_materials_funds','ministry_materials_reports'
] LOOP EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I','trg_'||table_name||'_updated_at',table_name); EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()','trg_'||table_name||'_updated_at',table_name); END LOOP; END $$;

COMMENT ON TABLE public.prison_foundation_students IS 'Non-sensitive pastoral display codes only. Criminal, judicial, sentence, crime and cell data are prohibited.';
COMMENT ON TABLE public.ministry_materials_sales IS 'Internal module records only; not verified Finance revenue.';
COMMENT ON TABLE public.ministry_materials_funds IS 'Internal module funds only; never included automatically in Finance totals.';
