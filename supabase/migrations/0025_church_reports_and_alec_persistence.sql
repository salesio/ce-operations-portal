-- ============================================================================
-- Migration 0025 — Church Reports, ALEC & Cell Reports Persistence & RLS
-- ============================================================================
-- Persists Church Reports, ALEC Registrations, ALEC Scores, and Cell Reports
-- directly to PostgreSQL / Supabase, with granular church-level RLS policies.
--
-- Idempotent, reproducible, and transactional.
-- ============================================================================

BEGIN;

-- Ensure standard roles exist in test/local environments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 1. TABLE: public.church_reports
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.church_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
  church_name text,
  semana text NOT NULL,
  data_do_culto date,
  culto text,
  ft integer NOT NULL DEFAULT 0,
  nc integer NOT NULL DEFAULT 0,
  rs integer NOT NULL DEFAULT 0,
  total_ft_reached integer NOT NULL DEFAULT 0,
  comentarios text,
  submetido_por text,
  submetido_por_id uuid,
  estado text NOT NULL DEFAULT 'Submetido',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_church_reports_church_id ON public.church_reports (church_id);
CREATE INDEX IF NOT EXISTS idx_church_reports_data_do_culto ON public.church_reports (data_do_culto);

-- ----------------------------------------------------------------------------
-- 2. TABLE: public.alec_registrations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alec_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
  church_name text,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  nome_completo text NOT NULL,
  contacto text,
  celula text,
  nome_do_lider_de_celula text,
  fez_escola_de_fundacao boolean NOT NULL DEFAULT false,
  e_lider boolean NOT NULL DEFAULT false,
  motivo_de_fazer_alec text,
  estado text NOT NULL DEFAULT 'Em Formação',
  observacoes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alec_registrations_church_id ON public.alec_registrations (church_id);
CREATE INDEX IF NOT EXISTS idx_alec_registrations_member_id ON public.alec_registrations (member_id);

-- ----------------------------------------------------------------------------
-- 3. TABLE: public.alec_scores
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alec_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
  church_name text,
  registration_id uuid REFERENCES public.alec_registrations(id) ON DELETE SET NULL,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  nome_completo text NOT NULL,
  contacto text,
  celula text,
  fase_1_aula_1 numeric,
  fase_1_aula_2 numeric,
  fase_1_aula_3 numeric,
  fase_1_aula_4 numeric,
  fase_2_aula_1 numeric,
  fase_2_aula_2 numeric,
  fase_2_aula_3 numeric,
  terminou boolean NOT NULL DEFAULT false,
  faixa_certificado_pago boolean NOT NULL DEFAULT false,
  certificado_emitido boolean NOT NULL DEFAULT false,
  estado text NOT NULL DEFAULT 'Em Curso',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alec_scores_church_id ON public.alec_scores (church_id);
CREATE INDEX IF NOT EXISTS idx_alec_scores_registration_id ON public.alec_scores (registration_id);

-- ----------------------------------------------------------------------------
-- 4. TABLE: public.cell_reports
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cell_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
  church_name text,
  cell_group_id text,
  cell_id text,
  celula text,
  semana text,
  meeting_date date,
  titulo_do_lider text,
  nome_do_lider text,
  leader_phone text,
  att integer NOT NULL DEFAULT 0,
  ft integer NOT NULL DEFAULT 0,
  nc integer NOT NULL DEFAULT 0,
  oferta numeric NOT NULL DEFAULT 0,
  rs integer NOT NULL DEFAULT 0,
  cell_health_status text,
  observacoes text,
  submetido_por text,
  submetido_por_id uuid,
  avaliado_por text,
  validado_por text,
  estado text NOT NULL DEFAULT 'Submetido',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cell_reports_church_id ON public.cell_reports (church_id);
CREATE INDEX IF NOT EXISTS idx_cell_reports_cell_id ON public.cell_reports (cell_id);

-- ----------------------------------------------------------------------------
-- 5. PERMISSIONS & GRANTS
-- ----------------------------------------------------------------------------
REVOKE ALL ON TABLE public.church_reports, public.alec_registrations, public.alec_scores, public.cell_reports FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.church_reports, public.alec_registrations, public.alec_scores, public.cell_reports TO authenticated;
GRANT ALL ON TABLE public.church_reports, public.alec_registrations, public.alec_scores, public.cell_reports TO service_role;

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.church_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alec_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alec_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_reports ENABLE ROW LEVEL SECURITY;

-- Church Reports Policies
DROP POLICY IF EXISTS church_reports_select_policy ON public.church_reports;
CREATE POLICY church_reports_select_policy ON public.church_reports
  FOR SELECT TO authenticated
  USING (
    public.is_admin_user()
    OR church_id = public.current_app_church_id()
    OR public.has_module_permission('cell', 'view')
    OR public.has_module_permission('church_reports', 'view')
    OR public.has_module_permission('churchReports', 'view')
  );

DROP POLICY IF EXISTS church_reports_insert_policy ON public.church_reports;
CREATE POLICY church_reports_insert_policy ON public.church_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_user()
    OR (
      church_id = public.current_app_church_id()
      AND (
        public.has_module_permission('cell', 'create')
        OR public.has_module_permission('church_reports', 'create')
        OR public.has_module_permission('churchReports', 'create')
      )
    )
  );

DROP POLICY IF EXISTS church_reports_update_policy ON public.church_reports;
CREATE POLICY church_reports_update_policy ON public.church_reports
  FOR UPDATE TO authenticated
  USING (
    public.is_admin_user()
    OR (
      church_id = public.current_app_church_id()
      AND (
        public.has_module_permission('cell', 'edit')
        OR public.has_module_permission('church_reports', 'edit')
        OR public.has_module_permission('churchReports', 'edit')
      )
    )
  );

DROP POLICY IF EXISTS church_reports_delete_policy ON public.church_reports;
CREATE POLICY church_reports_delete_policy ON public.church_reports
  FOR DELETE TO authenticated
  USING (
    public.is_admin_user()
    OR (
      church_id = public.current_app_church_id()
      AND public.has_module_permission('church_reports', 'delete')
    )
  );

-- ALEC Registrations Policies
DROP POLICY IF EXISTS alec_registrations_select_policy ON public.alec_registrations;
CREATE POLICY alec_registrations_select_policy ON public.alec_registrations
  FOR SELECT TO authenticated
  USING (
    public.is_admin_user()
    OR church_id = public.current_app_church_id()
    OR public.has_module_permission('alec', 'view')
    OR public.has_module_permission('alec_registration', 'view')
    OR public.has_module_permission('alecRegistration', 'view')
  );

DROP POLICY IF EXISTS alec_registrations_insert_policy ON public.alec_registrations;
CREATE POLICY alec_registrations_insert_policy ON public.alec_registrations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_user()
    OR (
      church_id = public.current_app_church_id()
      AND (
        public.has_module_permission('alec', 'create')
        OR public.has_module_permission('alec_registration', 'create')
        OR public.has_module_permission('alecRegistration', 'create')
      )
    )
  );

DROP POLICY IF EXISTS alec_registrations_update_policy ON public.alec_registrations;
CREATE POLICY alec_registrations_update_policy ON public.alec_registrations
  FOR UPDATE TO authenticated
  USING (
    public.is_admin_user()
    OR (
      church_id = public.current_app_church_id()
      AND (
        public.has_module_permission('alec', 'edit')
        OR public.has_module_permission('alec_registration', 'edit')
        OR public.has_module_permission('alecRegistration', 'edit')
      )
    )
  );

DROP POLICY IF EXISTS alec_registrations_delete_policy ON public.alec_registrations;
CREATE POLICY alec_registrations_delete_policy ON public.alec_registrations
  FOR DELETE TO authenticated
  USING (
    public.is_admin_user()
    OR (
      church_id = public.current_app_church_id()
      AND public.has_module_permission('alec_registration', 'delete')
    )
  );

-- ALEC Scores Policies
DROP POLICY IF EXISTS alec_scores_select_policy ON public.alec_scores;
CREATE POLICY alec_scores_select_policy ON public.alec_scores
  FOR SELECT TO authenticated
  USING (
    public.is_admin_user()
    OR church_id = public.current_app_church_id()
    OR public.has_module_permission('alec', 'view')
    OR public.has_module_permission('alec_scores', 'view')
    OR public.has_module_permission('alecScores', 'view')
  );

DROP POLICY IF EXISTS alec_scores_insert_policy ON public.alec_scores;
CREATE POLICY alec_scores_insert_policy ON public.alec_scores
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_user()
    OR (
      church_id = public.current_app_church_id()
      AND (
        public.has_module_permission('alec', 'create')
        OR public.has_module_permission('alec_scores', 'create')
        OR public.has_module_permission('alecScores', 'create')
      )
    )
  );

DROP POLICY IF EXISTS alec_scores_update_policy ON public.alec_scores;
CREATE POLICY alec_scores_update_policy ON public.alec_scores
  FOR UPDATE TO authenticated
  USING (
    public.is_admin_user()
    OR (
      church_id = public.current_app_church_id()
      AND (
        public.has_module_permission('alec', 'edit')
        OR public.has_module_permission('alec_scores', 'edit')
        OR public.has_module_permission('alecScores', 'edit')
      )
    )
  );

DROP POLICY IF EXISTS alec_scores_delete_policy ON public.alec_scores;
CREATE POLICY alec_scores_delete_policy ON public.alec_scores
  FOR DELETE TO authenticated
  USING (
    public.is_admin_user()
    OR (
      church_id = public.current_app_church_id()
      AND public.has_module_permission('alec_scores', 'delete')
    )
  );

-- Cell Reports Policies
DROP POLICY IF EXISTS cell_reports_select_policy ON public.cell_reports;
CREATE POLICY cell_reports_select_policy ON public.cell_reports
  FOR SELECT TO authenticated
  USING (
    public.is_admin_user()
    OR church_id = public.current_app_church_id()
    OR submetido_por_id = auth.uid()
    OR public.has_module_permission('cell', 'view')
    OR public.has_module_permission('cell_portal', 'view')
  );

DROP POLICY IF EXISTS cell_reports_insert_policy ON public.cell_reports;
CREATE POLICY cell_reports_insert_policy ON public.cell_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_user()
    OR (
      church_id = public.current_app_church_id()
      AND (
        public.has_module_permission('cell', 'create')
        OR public.has_module_permission('cell_reports', 'create')
      )
    )
    OR submetido_por_id = auth.uid()
  );

DROP POLICY IF EXISTS cell_reports_update_policy ON public.cell_reports;
CREATE POLICY cell_reports_update_policy ON public.cell_reports
  FOR UPDATE TO authenticated
  USING (
    public.is_admin_user()
    OR (
      church_id = public.current_app_church_id()
      AND (
        public.has_module_permission('cell', 'edit')
        OR public.has_module_permission('cell_reports', 'edit')
      )
    )
    OR submetido_por_id = auth.uid()
  );

DROP POLICY IF EXISTS cell_reports_delete_policy ON public.cell_reports;
CREATE POLICY cell_reports_delete_policy ON public.cell_reports
  FOR DELETE TO authenticated
  USING (
    public.is_admin_user()
  );

COMMIT;
