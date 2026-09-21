-- ============================================================================
-- Migration 0038: Complete Cell Ministry Tables (Evaluations, Action Plans, Leaders, Validations)
-- ============================================================================

BEGIN;

-- Helper function for updated_at if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. cell_evaluations
CREATE TABLE IF NOT EXISTS public.cell_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID,
  report_id TEXT,
  cell_id UUID,
  cell_name TEXT,
  avaliador TEXT NOT NULL,
  data_da_avaliacao DATE NOT NULL DEFAULT CURRENT_DATE,
  classificacao TEXT NOT NULL DEFAULT 'Bom',
  pontos_fortes TEXT,
  pontos_a_melhorar TEXT,
  acao_recomendada TEXT,
  precisa_followup BOOLEAN NOT NULL DEFAULT false,
  estado TEXT NOT NULL DEFAULT 'Pendente',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_cell_evaluations_church_id ON public.cell_evaluations(church_id);
CREATE INDEX IF NOT EXISTS idx_cell_evaluations_cell_id ON public.cell_evaluations(cell_id);
CREATE INDEX IF NOT EXISTS idx_cell_evaluations_classificacao ON public.cell_evaluations(classificacao);
CREATE INDEX IF NOT EXISTS idx_cell_evaluations_estado ON public.cell_evaluations(estado);

DROP TRIGGER IF EXISTS trg_cell_evaluations_updated_at ON public.cell_evaluations;
CREATE TRIGGER trg_cell_evaluations_updated_at
  BEFORE UPDATE ON public.cell_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cell_evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read cell_evaluations" ON public.cell_evaluations;
CREATE POLICY "Allow read cell_evaluations" ON public.cell_evaluations FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow all cell_evaluations admin" ON public.cell_evaluations;
CREATE POLICY "Allow all cell_evaluations admin" ON public.cell_evaluations FOR ALL TO public USING (true) WITH CHECK (true);

GRANT ALL ON public.cell_evaluations TO anon, authenticated, service_role, public;

-- 2. cell_action_plans
CREATE TABLE IF NOT EXISTS public.cell_action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID,
  cell_id UUID,
  cell_name TEXT,
  leader_id UUID,
  leader_name TEXT NOT NULL,
  action TEXT NOT NULL,
  owner TEXT NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'Planeado',
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_cell_action_plans_church_id ON public.cell_action_plans(church_id);
CREATE INDEX IF NOT EXISTS idx_cell_action_plans_cell_id ON public.cell_action_plans(cell_id);
CREATE INDEX IF NOT EXISTS idx_cell_action_plans_status ON public.cell_action_plans(status);
CREATE INDEX IF NOT EXISTS idx_cell_action_plans_due_date ON public.cell_action_plans(due_date);

DROP TRIGGER IF EXISTS trg_cell_action_plans_updated_at ON public.cell_action_plans;
CREATE TRIGGER trg_cell_action_plans_updated_at
  BEFORE UPDATE ON public.cell_action_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cell_action_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read cell_action_plans" ON public.cell_action_plans;
CREATE POLICY "Allow read cell_action_plans" ON public.cell_action_plans FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow all cell_action_plans admin" ON public.cell_action_plans;
CREATE POLICY "Allow all cell_action_plans admin" ON public.cell_action_plans FOR ALL TO public USING (true) WITH CHECK (true);

GRANT ALL ON public.cell_action_plans TO anon, authenticated, service_role, public;

-- 3. cell_leaders
CREATE TABLE IF NOT EXISTS public.cell_leaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID,
  church_name TEXT,
  cell_group_id UUID,
  cell_id UUID,
  celula TEXT,
  cell_name TEXT,
  nome_completo TEXT NOT NULL,
  full_name TEXT,
  contacto TEXT,
  phone TEXT,
  titulo TEXT,
  treatment TEXT,
  e_lider_actual BOOLEAN DEFAULT true,
  veio_do_alec BOOLEAN DEFAULT false,
  alec_concluido BOOLEAN DEFAULT false,
  faixa_certificado_pago BOOLEAN DEFAULT false,
  estado TEXT DEFAULT 'Activo',
  status TEXT DEFAULT 'Activo',
  supervisor TEXT,
  observacoes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_cell_leaders_church_id ON public.cell_leaders(church_id);
CREATE INDEX IF NOT EXISTS idx_cell_leaders_cell_id ON public.cell_leaders(cell_id);
CREATE INDEX IF NOT EXISTS idx_cell_leaders_estado ON public.cell_leaders(estado);

DROP TRIGGER IF EXISTS trg_cell_leaders_updated_at ON public.cell_leaders;
CREATE TRIGGER trg_cell_leaders_updated_at
  BEFORE UPDATE ON public.cell_leaders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cell_leaders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read cell_leaders" ON public.cell_leaders;
CREATE POLICY "Allow read cell_leaders" ON public.cell_leaders FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow all cell_leaders admin" ON public.cell_leaders;
CREATE POLICY "Allow all cell_leaders admin" ON public.cell_leaders FOR ALL TO public USING (true) WITH CHECK (true);

GRANT ALL ON public.cell_leaders TO anon, authenticated, service_role, public;

-- 4. cell_validations
CREATE TABLE IF NOT EXISTS public.cell_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID,
  church_name TEXT,
  report_id TEXT,
  validado_por TEXT NOT NULL,
  data_validacao DATE NOT NULL DEFAULT CURRENT_DATE,
  decisao TEXT NOT NULL DEFAULT 'Validado',
  comentario_final TEXT,
  estado_final TEXT NOT NULL DEFAULT 'Validado',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_cell_validations_church_id ON public.cell_validations(church_id);
CREATE INDEX IF NOT EXISTS idx_cell_validations_estado ON public.cell_validations(estado_final);

DROP TRIGGER IF EXISTS trg_cell_validations_updated_at ON public.cell_validations;
CREATE TRIGGER trg_cell_validations_updated_at
  BEFORE UPDATE ON public.cell_validations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cell_validations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read cell_validations" ON public.cell_validations;
CREATE POLICY "Allow read cell_validations" ON public.cell_validations FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow all cell_validations admin" ON public.cell_validations;
CREATE POLICY "Allow all cell_validations admin" ON public.cell_validations FOR ALL TO public USING (true) WITH CHECK (true);

GRANT ALL ON public.cell_validations TO anon, authenticated, service_role, public;

-- 5. Seed initial data
INSERT INTO public.cell_evaluations (id, church_id, report_id, cell_id, cell_name, avaliador, data_da_avaliacao, classificacao, pontos_fortes, pontos_a_melhorar, acao_recomendada, precisa_followup, estado)
VALUES
  ('e1111111-1111-4111-8111-111111111101', 'a1111111-1111-4111-8111-111111111101', 'CR-2026-09-01', '2b3a5652-b8be-4c76-8b64-b84200c8bcd4', 'Diplomatas Victory', 'Pastora Flavia', '2026-09-10', 'Excelente', 'Excelente pontualidade e retenção de primeiros visitantes.', 'Aumentar número de encontros de oração.', 'Preparar proposta para divisão da célula no próximo trimestre.', false, 'Aprovado'),
  ('e1111111-1111-4111-8111-111111111102', 'a1111111-1111-4111-8111-111111111101', 'CR-2026-09-02', '17de71f5-1926-4b34-8cc6-4c690c3c0262', 'Pioneiros Change', 'Pastora Flavia', '2026-09-12', 'Precisa de Atenção', 'Líder dedicado e membro fiel no ALEC.', 'Baixa frequência nos últimos 2 cultos celulares.', 'Agendar reunião com a supervisora e reforçar visitas pastorais.', true, 'Em Avaliação')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cell_action_plans (id, church_id, cell_id, cell_name, leader_id, leader_name, action, owner, due_date, status, notes)
VALUES
  ('f1111111-1111-4111-8111-111111111101', 'a1111111-1111-4111-8111-111111111101', '17de71f5-1926-4b34-8cc6-4c690c3c0262', 'Pioneiros Change', NULL, 'Aminata Chivinda', 'Acompanhamento semanal com supervisora e reforço de evangelismo.', 'Pastora Flavia', '2026-09-25', 'Em Curso', 'Prioridade para conclusão do curso ALEC e visitas domiciliares.'),
  ('f1111111-1111-4111-8111-111111111102', 'a1111111-1111-4111-8111-111111111101', '2b3a5652-b8be-4c76-8b64-b84200c8bcd4', 'Diplomatas Victory', NULL, 'Mateus Nhantumbo', 'Preparar divisão da célula e identificar líder auxiliar.', 'Pastora Flavia', '2026-10-05', 'Planeado', 'Célula atingiu mais de 16 membros regulares.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cell_leaders (id, church_id, church_name, cell_id, celula, cell_name, nome_completo, full_name, contacto, phone, titulo, e_lider_actual, veio_do_alec, alec_concluido, faixa_certificado_pago, estado, supervisor, observacoes)
VALUES
  ('d1111111-1111-4111-8111-111111111101', 'a1111111-1111-4111-8111-111111111101', 'CE Maputo (Sede Nacional)', '2b3a5652-b8be-4c76-8b64-b84200c8bcd4', 'Diplomatas Victory', 'Diplomatas Victory', 'Mateus Nhantumbo', 'Mateus Nhantumbo', '+258 84 123 4567', '+258 84 123 4567', 'Irmão', true, true, true, true, 'Activo', 'Pastora Flavia', 'Líder exemplar com célula ativa.'),
  ('d1111111-1111-4111-8111-111111111102', 'a1111111-1111-4111-8111-111111111101', 'CE Maputo (Sede Nacional)', '17de71f5-1926-4b34-8cc6-4c690c3c0262', 'Pioneiros Change', 'Pioneiros Change', 'Aminata Chivinda', 'Aminata Chivinda', '+258 82 987 6543', '+258 82 987 6543', 'Irmã', true, true, false, false, 'Em Treinamento', 'Pastora Flavia', 'Em fase de conclusão do ALEC.')
ON CONFLICT (id) DO NOTHING;

COMMIT;
