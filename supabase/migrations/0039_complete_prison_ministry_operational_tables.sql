-- Complete the live Prison Ministry operational collections.
-- This migration is additive and safe to run after 0011.

CREATE TABLE IF NOT EXISTS public.prison_representatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prison_id uuid REFERENCES public.prison_locations(id) ON DELETE SET NULL,
  prison_name text,
  full_name text NOT NULL,
  phone text,
  whatsapp text,
  email text,
  role text,
  organization text,
  preferred_contact_method text,
  status text NOT NULL DEFAULT 'Active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prison_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_code text UNIQUE,
  prison_id uuid REFERENCES public.prison_locations(id) ON DELETE SET NULL,
  prison_name text,
  full_name text,
  preferred_name text,
  gender text,
  age_range text,
  contact_allowed boolean NOT NULL DEFAULT false,
  contact_reference text,
  first_contact_date date,
  source_service_id uuid REFERENCES public.prison_services(id) ON DELETE SET NULL,
  born_again boolean NOT NULL DEFAULT false,
  new_convert_date date,
  foundation_interest boolean NOT NULL DEFAULT false,
  foundation_status text,
  foundation_student_id uuid REFERENCES public.prison_foundation_students(id) ON DELETE SET NULL,
  follow_up_status text,
  last_follow_up_date date,
  next_follow_up_date date,
  confidentiality_level text NOT NULL DEFAULT 'Private',
  status text NOT NULL DEFAULT 'Active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prison_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid REFERENCES public.prison_participants(id) ON DELETE SET NULL,
  participant_name text,
  prison_id uuid REFERENCES public.prison_locations(id) ON DELETE SET NULL,
  prison_name text,
  representative_id uuid REFERENCES public.prison_representatives(id) ON DELETE SET NULL,
  representative_name text,
  follow_up_date date,
  method text,
  status text NOT NULL DEFAULT 'Pending',
  result text,
  next_action text,
  next_follow_up_date date,
  recorded_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  recorded_by_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prison_materials_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text UNIQUE,
  prison_id uuid REFERENCES public.prison_locations(id) ON DELETE SET NULL,
  prison_name text,
  requested_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  requested_by_name text,
  material_type text,
  material_name text,
  quantity_requested integer NOT NULL DEFAULT 0 CHECK (quantity_requested >= 0),
  quantity_fulfilled integer NOT NULL DEFAULT 0 CHECK (quantity_fulfilled >= 0),
  needed_by_date date,
  status text NOT NULL DEFAULT 'Pending',
  ministry_materials_request_id uuid REFERENCES public.ministry_materials_requests(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prison_representatives_prison_id ON public.prison_representatives(prison_id);
CREATE INDEX IF NOT EXISTS idx_prison_representatives_status ON public.prison_representatives(status);
CREATE INDEX IF NOT EXISTS idx_prison_participants_prison_id ON public.prison_participants(prison_id);
CREATE INDEX IF NOT EXISTS idx_prison_participants_status ON public.prison_participants(status);
CREATE INDEX IF NOT EXISTS idx_prison_follow_ups_participant_id ON public.prison_follow_ups(participant_id);
CREATE INDEX IF NOT EXISTS idx_prison_follow_ups_prison_id ON public.prison_follow_ups(prison_id);
CREATE INDEX IF NOT EXISTS idx_prison_follow_ups_status ON public.prison_follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_prison_material_requests_prison_id ON public.prison_materials_requests(prison_id);
CREATE INDEX IF NOT EXISTS idx_prison_material_requests_status ON public.prison_materials_requests(status);

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'prison_representatives', 'prison_participants', 'prison_follow_ups', 'prison_materials_requests'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'trg_' || table_name || '_updated_at', table_name);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', 'trg_' || table_name || '_updated_at', table_name);
  END LOOP;
END $$;

COMMENT ON TABLE public.prison_participants IS 'Pastoral participation data only. Criminal, judicial, sentence and inmate-identification data are prohibited.';
