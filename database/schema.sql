-- ============================================================================
-- CE Mozambique Operations Dashboard — Backend Phase 1 schema (foundation)
-- ============================================================================
-- Applied on first Docker Postgres boot via docker-entrypoint-initdb.d.
-- Supabase cloud: see supabase/migrations/ and SUPABASE_SETUP.md.
--
-- Browser NEVER connects here directly.
-- Frontend uses VITE_DATA_SOURCE=mock|local until pilots migrate to supabase/api.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.schema_meta (
  key   text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.schema_meta (key, value)
VALUES
  ('app', 'ce_dashboard'),
  ('env', 'docker_dev'),
  ('backend_phase', '1_foundation')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ---------------------------------------------------------------------------
-- CORE: roles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL UNIQUE,
  display_name    text,
  level           integer DEFAULT 0,
  default_scope   text DEFAULT 'church',
  is_system_role  boolean NOT NULL DEFAULT false,
  status          text NOT NULL DEFAULT 'Active',
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid,
  updated_by      uuid
);

DROP TRIGGER IF EXISTS trg_roles_updated_at ON public.roles;
CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- CORE: churches
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.churches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_name         text NOT NULL,
  public_name         text,
  type                text,
  province            text,
  city                text,
  district_or_area    text,
  address             text,
  pastor_in_charge    text,
  phone_primary       text,
  phone_secondary     text,
  email               text,
  service_times       jsonb NOT NULL DEFAULT '[]'::jsonb,
  parent_church_id    uuid,
  status              text NOT NULL DEFAULT 'Active',
  information_status  text,
  notes               text,
  metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid,
  updated_by          uuid
);

-- Compatibility for older local schema that used "name"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'churches' AND column_name = 'name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'churches' AND column_name = 'church_name'
  ) THEN
    ALTER TABLE public.churches RENAME COLUMN name TO church_name;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Phase 3 additive columns (safe on existing volumes)
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS district_or_area text;
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS phone_secondary text;
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS parent_church_id uuid;
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS information_status text;
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS idx_churches_status ON public.churches (status);
CREATE INDEX IF NOT EXISTS idx_churches_province ON public.churches (province);
CREATE INDEX IF NOT EXISTS idx_churches_city ON public.churches (city);

DROP TRIGGER IF EXISTS trg_churches_updated_at ON public.churches;
CREATE TRIGGER trg_churches_updated_at
  BEFORE UPDATE ON public.churches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- CORE: staff_members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_code      text,
  full_name       text NOT NULL,
  phone           text,
  email           text,
  church_id       uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  department_id   uuid,
  role_title      text,
  supervisor_id   uuid,
  status          text NOT NULL DEFAULT 'Active',
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid,
  updated_by      uuid
);

DROP TRIGGER IF EXISTS trg_staff_members_updated_at ON public.staff_members;
CREATE TRIGGER trg_staff_members_updated_at
  BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- CORE: users (app profile; auth_user_id maps to Supabase auth.users later)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Maps to Supabase auth.users.id after Auth pilot link (nullable until provisioned)
  auth_user_id            uuid UNIQUE,
  staff_id                uuid REFERENCES public.staff_members (id) ON DELETE SET NULL,
  full_name               text,
  email                   text UNIQUE,
  phone                   text,
  role_id                 uuid REFERENCES public.roles (id) ON DELETE SET NULL,
  church_id               uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  department_id           uuid,
  status                  text NOT NULL DEFAULT 'Active',
  preferred_language      text DEFAULT 'pt',
  last_login_at           timestamptz,
  last_active_at          timestamptz,
  failed_login_attempts   integer NOT NULL DEFAULT 0,
  locked_until            timestamptz,
  metadata                jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  created_by              uuid,
  updated_by              uuid
);

-- Phase 2: additive columns for older Docker volumes that already created users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS failed_login_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS locked_until timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users (role_id);

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- CORE: permissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permissions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id                 uuid REFERENCES public.roles (id) ON DELETE CASCADE,
  module                  text NOT NULL,
  can_view                boolean NOT NULL DEFAULT false,
  can_create              boolean NOT NULL DEFAULT false,
  can_edit                boolean NOT NULL DEFAULT false,
  can_delete              boolean NOT NULL DEFAULT false,
  can_approve             boolean NOT NULL DEFAULT false,
  can_verify              boolean NOT NULL DEFAULT false,
  can_release_resources   boolean NOT NULL DEFAULT false,
  can_export              boolean NOT NULL DEFAULT false,
  can_manage_settings     boolean NOT NULL DEFAULT false,
  scope                   text DEFAULT 'church',
  conditions              jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_sensitive            boolean NOT NULL DEFAULT false,
  metadata                jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_permissions_role_module ON public.permissions (role_id, module);
CREATE INDEX IF NOT EXISTS idx_permissions_role_id ON public.permissions (role_id);

DROP TRIGGER IF EXISTS trg_permissions_updated_at ON public.permissions;
CREATE TRIGGER trg_permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- CORE: members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.members (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_code       text,
  full_name         text NOT NULL,
  first_name        text,
  last_name         text,
  title             text,
  gender            text,
  date_of_birth     date,
  phone             text,
  whatsapp          text,
  email             text,
  address           text,
  church_id         uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  church_name       text,
  cell_group_id     text,
  cell_group_name   text,
  cell_id           text,
  cell_name         text,
  department_id     text,
  department_name   text,
  status            text NOT NULL DEFAULT 'Active',
  entry_date        date,
  source            text,
  notes             text,
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid,
  updated_by        uuid
);

-- Phase 3 additive columns for older volumes
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS church_name text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS cell_group_name text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS cell_name text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS department_id text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS department_name text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS entry_date date;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS notes text;

-- cell_group_id / cell_id may have been uuid; widen to text for pilot flexibility
DO $$
BEGIN
  ALTER TABLE public.members ALTER COLUMN cell_group_id TYPE text USING cell_group_id::text;
  ALTER TABLE public.members ALTER COLUMN cell_id TYPE text USING cell_id::text;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_members_church_id ON public.members (church_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members (status);
CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members (phone);
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members (email);
CREATE INDEX IF NOT EXISTS idx_members_full_name ON public.members (full_name);

DROP TRIGGER IF EXISTS trg_members_updated_at ON public.members;
CREATE TRIGGER trg_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- CORE: first_timers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.first_timers (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name               text NOT NULL,
  first_name              text,
  last_name               text,
  title                   text,
  gender                  text,
  date_of_birth           date,
  phone                   text,
  whatsapp                text,
  email                   text,
  address                 text,
  church_id               uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  church_name             text,
  cell_group_id           text,
  cell_group_name         text,
  cell_id                 text,
  cell_name               text,
  visit_date              date,
  service_name            text,
  invited_by              text,
  born_again              boolean DEFAULT false,
  foundation_interest     boolean DEFAULT false,
  counseling_interest     boolean DEFAULT false,
  cell_interest           boolean DEFAULT false,
  follow_up_status        text,
  assigned_to_user_id     uuid,
  assigned_to_name        text,
  converted_to_member     boolean DEFAULT false,
  member_id               uuid REFERENCES public.members (id) ON DELETE SET NULL,
  status                  text NOT NULL DEFAULT 'Active',
  notes                   text,
  metadata                jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  created_by              uuid,
  updated_by              uuid
);

-- Phase 4 additive columns
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS church_name text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS cell_group_id text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS cell_group_name text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS cell_id text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS cell_name text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS service_name text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS invited_by text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS counseling_interest boolean DEFAULT false;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS cell_interest boolean DEFAULT false;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS assigned_to_user_id uuid;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS assigned_to_name text;
ALTER TABLE public.first_timers ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS idx_first_timers_church_id ON public.first_timers (church_id);
CREATE INDEX IF NOT EXISTS idx_first_timers_phone ON public.first_timers (phone);
CREATE INDEX IF NOT EXISTS idx_first_timers_visit_date ON public.first_timers (visit_date);
CREATE INDEX IF NOT EXISTS idx_first_timers_follow_up_status ON public.first_timers (follow_up_status);
CREATE INDEX IF NOT EXISTS idx_first_timers_foundation_interest ON public.first_timers (foundation_interest);
CREATE INDEX IF NOT EXISTS idx_first_timers_born_again ON public.first_timers (born_again);
CREATE INDEX IF NOT EXISTS idx_first_timers_member_id ON public.first_timers (member_id);

DROP TRIGGER IF EXISTS trg_first_timers_updated_at ON public.first_timers;
CREATE TRIGGER trg_first_timers_updated_at
  BEFORE UPDATE ON public.first_timers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Phase 4: follow_ups + timeline
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_timer_id          uuid REFERENCES public.first_timers (id) ON DELETE SET NULL,
  member_id               uuid REFERENCES public.members (id) ON DELETE SET NULL,
  person_type             text,
  person_id               uuid,
  person_name             text NOT NULL,
  phone                   text,
  whatsapp                text,
  email                   text,
  church_id               uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  church_name             text,
  cell_group_id           text,
  cell_group_name         text,
  cell_id                 text,
  cell_name               text,
  source                  text,
  category                text,
  status                  text NOT NULL DEFAULT 'Pending',
  priority                text DEFAULT 'Normal',
  responsible_user_id     uuid,
  responsible_name        text,
  next_contact_date       date,
  last_contact_date       date,
  last_contact_method     text,
  last_contact_result     text,
  notes                   text,
  metadata                jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  created_by              uuid,
  updated_by              uuid
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_church_id ON public.follow_ups (church_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_first_timer_id ON public.follow_ups (first_timer_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_member_id ON public.follow_ups (member_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON public.follow_ups (status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_responsible_user_id ON public.follow_ups (responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_next_contact_date ON public.follow_ups (next_contact_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_source ON public.follow_ups (source);

DROP TRIGGER IF EXISTS trg_follow_ups_updated_at ON public.follow_ups;
CREATE TRIGGER trg_follow_ups_updated_at
  BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.follow_up_timeline_events (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follow_up_id            uuid NOT NULL REFERENCES public.follow_ups (id) ON DELETE CASCADE,
  first_timer_id          uuid REFERENCES public.first_timers (id) ON DELETE SET NULL,
  member_id               uuid REFERENCES public.members (id) ON DELETE SET NULL,
  event_type              text,
  title                   text,
  description             text,
  contact_method          text,
  contact_result          text,
  old_status              text,
  new_status              text,
  performed_by_user_id    uuid,
  performed_by_name       text,
  event_date              timestamptz NOT NULL DEFAULT now(),
  metadata                jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_follow_up_timeline_follow_up_id ON public.follow_up_timeline_events (follow_up_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_timeline_first_timer_id ON public.follow_up_timeline_events (first_timer_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_timeline_event_date ON public.follow_up_timeline_events (event_date);

-- ---------------------------------------------------------------------------
-- PILOT: finance_records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance_records (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type          text NOT NULL DEFAULT 'income',
  contribution_group        text,
  contribution_category     text,
  partnership_arm_id        text,
  partnership_arm_name      text,
  contributor_type          text,
  contributor_id            uuid,
  contributor_name          text,
  contributor_phone         text,
  contributor_email         text,
  member_id                 uuid REFERENCES public.members (id) ON DELETE SET NULL,
  first_timer_id            uuid REFERENCES public.first_timers (id) ON DELETE SET NULL,
  church_id                 uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  church_name               text,
  cell_group_id             text,
  cell_group_name           text,
  cell_id                   text,
  cell_name                 text,
  amount                    numeric(14, 2) NOT NULL DEFAULT 0,
  currency                  text DEFAULT 'MZN',
  payment_method            text,
  payment_reference         text,
  payment_date              date,
  source                    text,
  source_module             text,
  source_id                 uuid,
  submission_group_id       text,
  status                    text NOT NULL DEFAULT 'Pending Verification',
  received_by               uuid,
  received_by_name          text,
  verified_by               uuid,
  verified_by_name          text,
  verified_at               timestamptz,
  rejected_by               uuid,
  rejected_by_name          text,
  rejected_at               timestamptz,
  rejection_reason          text,
  proof_document_id         uuid,
  proof_file_url            text,
  notes                     text,
  metadata                  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  created_by                uuid,
  updated_by                uuid
);

-- Phase 5 additive columns
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS contributor_type text;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS contributor_id uuid;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS contributor_email text;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS first_timer_id uuid;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS church_name text;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS cell_group_name text;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS cell_name text;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS source_module text;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS source_id uuid;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS submission_group_id text;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS received_by uuid;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS received_by_name text;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS verified_by_name text;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS rejected_by uuid;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS rejected_by_name text;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS proof_document_id uuid;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS proof_file_url text;
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS notes text;
DO $$ BEGIN
  ALTER TABLE public.finance_records ALTER COLUMN partnership_arm_id TYPE text USING partnership_arm_id::text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.finance_records ALTER COLUMN cell_group_id TYPE text USING cell_group_id::text;
  ALTER TABLE public.finance_records ALTER COLUMN cell_id TYPE text USING cell_id::text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_finance_records_church ON public.finance_records (church_id);
CREATE INDEX IF NOT EXISTS idx_finance_records_church_id ON public.finance_records (church_id);
CREATE INDEX IF NOT EXISTS idx_finance_records_status ON public.finance_records (status);
CREATE INDEX IF NOT EXISTS idx_finance_records_transaction_type ON public.finance_records (transaction_type);
CREATE INDEX IF NOT EXISTS idx_finance_records_contribution_group ON public.finance_records (contribution_group);
CREATE INDEX IF NOT EXISTS idx_finance_records_partnership_arm_name ON public.finance_records (partnership_arm_name);
CREATE INDEX IF NOT EXISTS idx_finance_records_payment_date ON public.finance_records (payment_date);
CREATE INDEX IF NOT EXISTS idx_finance_records_source ON public.finance_records (source);
CREATE INDEX IF NOT EXISTS idx_finance_records_submission_group_id ON public.finance_records (submission_group_id);

DROP TRIGGER IF EXISTS trg_finance_records_updated_at ON public.finance_records;
CREATE TRIGGER trg_finance_records_updated_at
  BEFORE UPDATE ON public.finance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- PILOT: public_giving_submissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.public_giving_submissions (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_group_id         text,
  full_name                   text NOT NULL,
  phone                       text,
  email                       text,
  church_id                   uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  church_name                 text,
  cell_group_id               text,
  cell_group_name             text,
  cell_id                     text,
  cell_name                   text,
  contributions               jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount                numeric(14, 2) DEFAULT 0,
  currency                    text DEFAULT 'MZN',
  payment_method              text,
  payment_reference           text,
  payment_date                date,
  proof_document_id           uuid,
  proof_file_url              text,
  proof_file_name             text,
  status                      text NOT NULL DEFAULT 'Pending Verification',
  reviewed_by                 uuid,
  reviewed_by_name            text,
  reviewed_at                 timestamptz,
  verified_by                 uuid,
  verified_by_name            text,
  verified_at                 timestamptz,
  rejected_by                 uuid,
  rejected_by_name            text,
  rejected_at                 timestamptz,
  rejection_reason            text,
  created_finance_record_ids  jsonb NOT NULL DEFAULT '[]'::jsonb,
  source                      text DEFAULT 'public_website',
  notes                       text,
  metadata                    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  created_by                  uuid,
  updated_by                  uuid
);

ALTER TABLE public.public_giving_submissions ADD COLUMN IF NOT EXISTS church_name text;
ALTER TABLE public.public_giving_submissions ADD COLUMN IF NOT EXISTS cell_group_name text;
ALTER TABLE public.public_giving_submissions ADD COLUMN IF NOT EXISTS cell_name text;
ALTER TABLE public.public_giving_submissions ADD COLUMN IF NOT EXISTS proof_document_id uuid;
ALTER TABLE public.public_giving_submissions ADD COLUMN IF NOT EXISTS proof_file_name text;
ALTER TABLE public.public_giving_submissions ADD COLUMN IF NOT EXISTS reviewed_by uuid;
ALTER TABLE public.public_giving_submissions ADD COLUMN IF NOT EXISTS reviewed_by_name text;
ALTER TABLE public.public_giving_submissions ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.public_giving_submissions ADD COLUMN IF NOT EXISTS verified_by uuid;
ALTER TABLE public.public_giving_submissions ADD COLUMN IF NOT EXISTS verified_by_name text;
ALTER TABLE public.public_giving_submissions ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE public.public_giving_submissions ADD COLUMN IF NOT EXISTS rejected_by uuid;
ALTER TABLE public.public_giving_submissions ADD COLUMN IF NOT EXISTS rejected_by_name text;
ALTER TABLE public.public_giving_submissions ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
ALTER TABLE public.public_giving_submissions ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.public_giving_submissions ADD COLUMN IF NOT EXISTS source text DEFAULT 'public_website';
ALTER TABLE public.public_giving_submissions ADD COLUMN IF NOT EXISTS notes text;
DO $$ BEGIN
  ALTER TABLE public.public_giving_submissions ALTER COLUMN cell_group_id TYPE text USING cell_group_id::text;
  ALTER TABLE public.public_giving_submissions ALTER COLUMN cell_id TYPE text USING cell_id::text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_public_giving_status ON public.public_giving_submissions (status);
CREATE INDEX IF NOT EXISTS idx_public_giving_church_id ON public.public_giving_submissions (church_id);
CREATE INDEX IF NOT EXISTS idx_public_giving_submission_group_id ON public.public_giving_submissions (submission_group_id);
CREATE INDEX IF NOT EXISTS idx_public_giving_payment_date ON public.public_giving_submissions (payment_date);

DROP TRIGGER IF EXISTS trg_public_giving_updated_at ON public.public_giving_submissions;
CREATE TRIGGER trg_public_giving_updated_at
  BEFORE UPDATE ON public.public_giving_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- PILOT: finance_disbursements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance_disbursements (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id        uuid,
  request_number        text,
  title                 text,
  description           text,
  department_id         text,
  department_name       text,
  church_id             uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  church_name           text,
  requested_by          uuid,
  requested_by_name     text,
  approved_by           uuid,
  approved_by_name      text,
  approved_at           timestamptz,
  approved_amount       numeric(14, 2) DEFAULT 0,
  released_amount       numeric(14, 2) DEFAULT 0,
  pending_amount        numeric(14, 2) DEFAULT 0,
  currency              text DEFAULT 'MZN',
  payment_method        text,
  payment_reference     text,
  release_date          date,
  status                text NOT NULL DEFAULT 'Awaiting Release',
  finance_record_id     uuid REFERENCES public.finance_records (id) ON DELETE SET NULL,
  notes                 text,
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_disbursements_status ON public.finance_disbursements (status);
CREATE INDEX IF NOT EXISTS idx_finance_disbursements_church_id ON public.finance_disbursements (church_id);
CREATE INDEX IF NOT EXISTS idx_finance_disbursements_requisition_id ON public.finance_disbursements (requisition_id);

DROP TRIGGER IF EXISTS trg_finance_disbursements_updated_at ON public.finance_disbursements;
CREATE TRIGGER trg_finance_disbursements_updated_at
  BEFORE UPDATE ON public.finance_disbursements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- PILOT: documents (storage metadata)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module              text NOT NULL,
  entity_type         text,
  entity_id           uuid,
  document_type       text,
  document_title      text,
  file_url            text,
  file_name           text,
  file_size           bigint,
  mime_type           text,
  storage_bucket      text,
  storage_path        text,
  status              text NOT NULL DEFAULT 'Pending Review',
  uploaded_by         uuid,
  uploaded_by_name    text,
  verified_by         uuid,
  verified_by_name    text,
  verified_at         timestamptz,
  rejected_by         uuid,
  rejected_by_name    text,
  rejected_at         timestamptz,
  rejection_reason    text,
  is_sensitive        boolean DEFAULT false,
  metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS document_title text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS mime_type text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS uploaded_by_name text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS verified_by_name text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS rejected_by uuid;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS rejected_by_name text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS is_sensitive boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_documents_module ON public.documents (module);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON public.documents (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents (status);
CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON public.documents (storage_path);

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- CORE: notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                     text,
  message                   text,
  type                      text DEFAULT 'info',
  module                    text,
  entity_type               text,
  entity_id                 uuid,
  priority                  text DEFAULT 'normal',
  recipient_user_id         uuid,
  recipient_role_id         uuid,
  recipient_department_id   uuid,
  recipient_church_id       uuid,
  scope                     text DEFAULT 'national',
  action_url                text,
  is_read                   boolean NOT NULL DEFAULT false,
  read_at                   timestamptz,
  metadata                  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user ON public.notifications (recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (is_read) WHERE is_read = false;

DROP TRIGGER IF EXISTS trg_notifications_updated_at ON public.notifications;
CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- CORE: audit_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid,
  user_name       text,
  user_role       text,
  module          text,
  action          text,
  entity_type     text,
  entity_id       text,
  entity_label    text,
  old_value       jsonb,
  new_value       jsonb,
  description     text,
  severity        text DEFAULT 'info',
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs (module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at DESC);

-- ---------------------------------------------------------------------------
-- CORE: system_settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key           text NOT NULL UNIQUE,
  value         jsonb NOT NULL DEFAULT 'null'::jsonb,
  value_type    text DEFAULT 'string',
  module        text DEFAULT 'global',
  is_sensitive  boolean NOT NULL DEFAULT false,
  is_system     boolean NOT NULL DEFAULT false,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER trg_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- PHASE 6: Requisitions + Venue/Inventory pilot
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text UNIQUE,
  title text NOT NULL,
  description text,
  justification text,
  request_type text,
  urgency text,
  church_id uuid REFERENCES public.churches(id),
  church_name text,
  department_id text,
  department_name text,
  requested_by uuid,
  requested_by_name text,
  estimated_amount numeric DEFAULT 0,
  approved_amount numeric DEFAULT 0,
  currency text DEFAULT 'MZN',
  needed_by date,
  status text DEFAULT 'Draft',
  reviewed_by uuid,
  reviewed_by_name text,
  reviewed_at timestamptz,
  review_notes text,
  forwarded_to_main_pastor_by uuid,
  forwarded_to_main_pastor_by_name text,
  forwarded_at timestamptz,
  approved_by uuid,
  approved_by_name text,
  approved_at timestamptz,
  approval_notes text,
  rejected_by uuid,
  rejected_by_name text,
  rejected_at timestamptz,
  rejection_reason text,
  returned_by uuid,
  returned_by_name text,
  returned_at timestamptz,
  return_reason text,
  finance_status text DEFAULT 'Not Required',
  finance_disbursement_id uuid REFERENCES public.finance_disbursements(id),
  inventory_required boolean DEFAULT false,
  inventory_status text DEFAULT 'Not Required',
  inventory_item_ids jsonb DEFAULT '[]'::jsonb,
  supplier_name text,
  quotation_document_id uuid,
  attachment_document_ids jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.requisition_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id uuid REFERENCES public.requisitions(id) ON DELETE CASCADE,
  event_type text,
  title text,
  description text,
  old_status text,
  new_status text,
  performed_by uuid,
  performed_by_name text,
  event_date timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.venue_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id),
  church_name text,
  name text NOT NULL,
  description text,
  space_type text,
  capacity integer,
  responsible_user_id uuid,
  responsible_name text,
  status text DEFAULT 'Available',
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code text UNIQUE,
  name text NOT NULL,
  description text,
  category text,
  subcategory text,
  brand text,
  model text,
  serial_number text,
  quantity numeric DEFAULT 1,
  unit text DEFAULT 'unit',
  church_id uuid REFERENCES public.churches(id),
  church_name text,
  department_id text,
  department_name text,
  space_id uuid,
  space_name text,
  assigned_to_user_id uuid,
  assigned_to_name text,
  assigned_to_role text,
  acquisition_source text DEFAULT 'Manual Entry',
  acquisition_date date,
  acquisition_cost numeric DEFAULT 0,
  currency text DEFAULT 'MZN',
  requisition_id uuid REFERENCES public.requisitions(id),
  request_number text,
  finance_disbursement_id uuid REFERENCES public.finance_disbursements(id),
  supplier_name text,
  warranty_start date,
  warranty_end date,
  status text DEFAULT 'Available',
  condition text DEFAULT 'Good',
  location_notes text,
  usage_notes text,
  photo_document_id uuid,
  attachment_document_ids jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  item_code text,
  item_name text,
  movement_type text,
  from_church_id uuid,
  from_church_name text,
  from_space_id uuid,
  from_space_name text,
  from_user_id uuid,
  from_user_name text,
  to_church_id uuid,
  to_church_name text,
  to_space_id uuid,
  to_space_name text,
  to_user_id uuid,
  to_user_name text,
  quantity numeric DEFAULT 1,
  reason text,
  notes text,
  movement_date timestamptz DEFAULT now(),
  performed_by uuid,
  performed_by_name text,
  approved_by uuid,
  approved_by_name text,
  approved_at timestamptz,
  status text DEFAULT 'Completed',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  item_code text,
  item_name text,
  issue_title text,
  issue_description text,
  reported_by uuid,
  reported_by_name text,
  reported_at timestamptz DEFAULT now(),
  assigned_to_user_id uuid,
  assigned_to_name text,
  repair_vendor text,
  estimated_cost numeric DEFAULT 0,
  actual_cost numeric DEFAULT 0,
  currency text DEFAULT 'MZN',
  status text DEFAULT 'Reported',
  priority text DEFAULT 'Normal',
  started_at timestamptz,
  completed_at timestamptz,
  resolution_notes text,
  attachment_document_ids jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id),
  church_name text,
  service_name text,
  service_date date,
  service_time text,
  checklist_type text,
  responsible_user_id uuid,
  responsible_name text,
  sound_ready boolean DEFAULT false,
  microphones_ready boolean DEFAULT false,
  cameras_ready boolean DEFAULT false,
  streaming_ready boolean DEFAULT false,
  projector_ready boolean DEFAULT false,
  lights_ready boolean DEFAULT false,
  ac_ready boolean DEFAULT false,
  chairs_ready boolean DEFAULT false,
  pulpit_ready boolean DEFAULT false,
  cleaning_ready boolean DEFAULT false,
  instruments_ready boolean DEFAULT false,
  power_backup_ready boolean DEFAULT false,
  issues_found text,
  actions_taken text,
  status text DEFAULT 'Open',
  completed_by uuid,
  completed_by_name text,
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requisitions_status ON public.requisitions(status);
CREATE INDEX IF NOT EXISTS idx_requisitions_church_id ON public.requisitions(church_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_department_id ON public.requisitions(department_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_requested_by ON public.requisitions(requested_by);
CREATE INDEX IF NOT EXISTS idx_requisitions_finance_status ON public.requisitions(finance_status);
CREATE INDEX IF NOT EXISTS idx_requisitions_inventory_status ON public.requisitions(inventory_status);
CREATE INDEX IF NOT EXISTS idx_requisitions_request_number ON public.requisitions(request_number);
CREATE INDEX IF NOT EXISTS idx_requisition_timeline_requisition_id ON public.requisition_timeline_events(requisition_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_church_id ON public.inventory_items(church_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON public.inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_condition ON public.inventory_items(condition);
CREATE INDEX IF NOT EXISTS idx_inventory_items_assigned_to ON public.inventory_items(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_requisition_id ON public.inventory_items(requisition_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_id ON public.inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_maintenance_item_id ON public.inventory_maintenance_records(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_maintenance_status ON public.inventory_maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_venue_spaces_church_id ON public.venue_spaces(church_id);
CREATE INDEX IF NOT EXISTS idx_service_checklists_church_id ON public.service_checklists(church_id);
CREATE INDEX IF NOT EXISTS idx_service_checklists_date ON public.service_checklists(service_date);
CREATE INDEX IF NOT EXISTS idx_service_checklists_status ON public.service_checklists(status);

-- ---------------------------------------------------------------------------
-- PHASE 7: Staff & RH + staff document metadata pilot
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  department_type text,
  head_staff_id uuid,
  head_name text,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'Active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.staff_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text,
  slug text,
  department_id uuid REFERENCES public.staff_departments (id) ON DELETE SET NULL,
  default_access_role_id uuid REFERENCES public.roles (id) ON DELETE SET NULL,
  default_access_role_name text,
  employment_type text,
  role_level text,
  status text NOT NULL DEFAULT 'Active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS staff_number text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS country text DEFAULT 'Mozambique';
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS church_name text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS department_name text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.staff_roles (id) ON DELETE SET NULL;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS role_name text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS supervisor_staff_id uuid;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS employment_status text DEFAULT 'Active';
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS employment_type text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS hire_date date;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users (id) ON DELETE SET NULL;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS auth_user_id uuid;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS access_role_id uuid REFERENCES public.roles (id) ON DELETE SET NULL;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS access_role_name text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS has_dashboard_access boolean DEFAULT false;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS can_access_dashboard boolean DEFAULT false;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS profile_photo_document_id uuid;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS document_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS salary_enabled boolean DEFAULT false;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS salary_visibility text DEFAULT 'HR Only';
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS notes text;

CREATE TABLE IF NOT EXISTS public.staff_salaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff_members (id) ON DELETE CASCADE,
  staff_number text,
  staff_name text,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.staff_departments (id) ON DELETE SET NULL,
  salary_or_allowance text,
  base_amount numeric(12,2) DEFAULT 0,
  base_salary numeric(12,2) DEFAULT 0,
  allowances numeric(12,2) DEFAULT 0,
  deductions numeric(12,2) DEFAULT 0,
  net_amount numeric(12,2) DEFAULT 0,
  net_salary numeric(12,2) DEFAULT 0,
  currency text NOT NULL DEFAULT 'MTn',
  effective_from date,
  effective_to date,
  payment_method text,
  bank_or_mobile_details text,
  verification_status text DEFAULT 'Pending Verification',
  status text NOT NULL DEFAULT 'Active',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{"no_finance_record_created": true}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.staff_performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff_members (id) ON DELETE CASCADE,
  staff_number text,
  staff_name text,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.staff_departments (id) ON DELETE SET NULL,
  review_period text,
  review_date date,
  evaluated_by uuid,
  evaluator_name text,
  score numeric(5,2),
  spiritual_commitment_score numeric(5,2),
  punctuality_score numeric(5,2),
  teamwork_score numeric(5,2),
  excellence_score numeric(5,2),
  improvement_areas text,
  goals text,
  progress text,
  review_notes text,
  status text NOT NULL DEFAULT 'Pending Verification',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.staff_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff_members (id) ON DELETE CASCADE,
  staff_number text,
  staff_name text,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  document_id uuid REFERENCES public.documents (id) ON DELETE SET NULL,
  document_type text,
  document_title text,
  file_name text,
  file_url text,
  storage_bucket text DEFAULT 'staff-documents',
  storage_path text,
  is_sensitive boolean NOT NULL DEFAULT true,
  expiry_date date,
  uploaded_by uuid,
  uploaded_by_name text,
  verified_by uuid,
  verified_by_name text,
  verified_at timestamptz,
  rejected_by uuid,
  rejected_by_name text,
  rejected_at timestamptz,
  rejection_reason text,
  status text NOT NULL DEFAULT 'Pending Review',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff_members (id) ON DELETE CASCADE,
  staff_number text,
  staff_name text,
  church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.staff_departments (id) ON DELETE SET NULL,
  attendance_date date NOT NULL,
  attendance_type text DEFAULT 'Work Day',
  check_in time,
  check_out time,
  hours_worked numeric(6,2),
  status text NOT NULL DEFAULT 'Present',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE INDEX IF NOT EXISTS idx_staff_departments_church_status ON public.staff_departments (church_id, status);
CREATE INDEX IF NOT EXISTS idx_staff_roles_department_status ON public.staff_roles (department_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_members_staff_number_unique ON public.staff_members (staff_number) WHERE staff_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_members_church_department ON public.staff_members (church_id, department_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_user_auth ON public.staff_members (user_id, auth_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_salaries_staff_effective ON public.staff_salaries (staff_id, effective_from DESC);
CREATE INDEX IF NOT EXISTS idx_staff_performance_staff_period ON public.staff_performance_reviews (staff_id, review_period);
CREATE INDEX IF NOT EXISTS idx_staff_documents_staff_status ON public.staff_documents (staff_id, status);
CREATE INDEX IF NOT EXISTS idx_staff_documents_expiry ON public.staff_documents (expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_date ON public.staff_attendance (staff_id, attendance_date DESC);
