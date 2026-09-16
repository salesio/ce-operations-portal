-- ============================================================================
-- CE Mozambique — foundation seed (no real passwords / secrets)
-- ============================================================================
-- auth_user_id should be linked after Supabase Auth users are created.
-- Do not store passwords in this seed.
-- Demo app users live in the frontend data layer (USERS_SEED); SQL seed covers roles/settings.
-- ============================================================================

-- Roles
INSERT INTO public.roles (id, name, display_name, level, default_scope, is_system_role, status)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'super_admin', 'Super Admin', 100, 'all', true, 'Active'),
  ('11111111-1111-1111-1111-111111111102', 'main_pastor', 'Main Pastor', 90, 'all', true, 'Active'),
  ('11111111-1111-1111-1111-111111111103', 'finance_head', 'Finance Head', 70, 'all', true, 'Active'),
  ('11111111-1111-1111-1111-111111111104', 'hr_manager', 'HR Manager', 70, 'all', true, 'Active'),
  ('11111111-1111-1111-1111-111111111105', 'staff_member', 'Staff Member', 10, 'own', true, 'Active')
ON CONFLICT (name) DO NOTHING;

-- Sample HQ church (dev only) — full churches/members seed: supabase/seeds/churches_members_seed.sql
INSERT INTO public.churches (id, church_name, public_name, type, province, city, status)
VALUES (
  '22222222-2222-2222-2222-222222222201',
  'E.C. Maputo Central - Sede',
  'E.C. Maputo Central - Sede',
  'HQ',
  'Maputo',
  'Maputo',
  'Active'
)
ON CONFLICT (id) DO NOTHING;

-- System settings defaults
INSERT INTO public.system_settings (key, value, value_type, module, is_system)
VALUES
  ('default_language', '"pt"'::jsonb, 'string', 'global', true),
  ('default_currency', '"MZN"'::jsonb, 'string', 'finance', true),
  ('timezone', '"Africa/Maputo"'::jsonb, 'string', 'global', true),
  ('public_site_enabled', 'true'::jsonb, 'boolean', 'public_site', false),
  ('enable_notifications', 'true'::jsonb, 'boolean', 'notifications', false),
  ('enable_audit_log', 'true'::jsonb, 'boolean', 'access_control', true),
  ('enable_reports_export', 'true'::jsonb, 'boolean', 'reports', false)
ON CONFLICT (key) DO NOTHING;

-- Super Admin broad view permission sample (module: finance)
INSERT INTO public.permissions (
  role_id, module, can_view, can_create, can_edit, can_delete,
  can_approve, can_verify, can_release_resources, can_export, can_manage_settings, scope
)
SELECT r.id, m.module, true, true, true, true, true, true, true, true, true, 'all'
FROM public.roles r
CROSS JOIN (VALUES
  ('finance'), ('accessControl'), ('settings'), ('staffHr'), ('churches'), ('members')
) AS m(module)
WHERE r.name = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.permissions p
    WHERE p.role_id = r.id AND p.module = m.module
  );

-- Initial seeds for cell_evaluations and cell_action_plans
INSERT INTO public.cell_evaluations (id, church_id, report_id, cell_id, cell_name, avaliador, data_da_avaliacao, classificacao, pontos_fortes, pontos_a_melhorar, acao_recomendada, precisa_followup, estado)
VALUES
  ('e1111111-1111-4111-8111-111111111101', 'a1111111-1111-4111-8111-111111111101', 'CR-2026-09-01', '2b3a5652-b8be-4c76-8b64-b84200c8bcd4', 'Diplomatas Victory', 'Pastora Flavia', '2026-09-10', 'Excelente', 'Excelente pontualidade e retenção de primeiros visitantes.', 'Aumentar número de encontros de oração.', 'Preparar proposta para divisão da célula no próximo trimestre.', false, 'Aprovado'),
  ('e1111111-1111-4111-8111-111111111102', 'a1111111-1111-4111-8111-111111111101', 'CR-2026-09-02', '17de71f5-1926-4b34-8cc6-4c690c3c0262', 'Pioneiros Change', 'Pastora Flavia', '2026-09-12', 'Precisa de Atenção', 'Líder dedicado e membro fiel no ALEC.', 'Baixa frequência nos últimos 2 cultos celulares.', 'Agendar reunião com a supervisora e reforçar visitas pastorais.', true, 'Em Análise')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cell_action_plans (id, church_id, cell_id, cell_name, leader_id, leader_name, action, owner, due_date, status, notes)
VALUES
  ('f1111111-1111-4111-8111-111111111101', 'a1111111-1111-4111-8111-111111111101', '17de71f5-1926-4b34-8cc6-4c690c3c0262', 'Pioneiros Change', NULL, 'Aminata Chivinda', 'Acompanhamento semanal com supervisora e reforço de evangelismo.', 'Pastora Flavia', '2026-09-25', 'Em Curso', 'Prioridade para conclusão do curso ALEC e visitas domiciliares.'),
  ('f1111111-1111-4111-8111-111111111102', 'a1111111-1111-4111-8111-111111111101', '2b3a5652-b8be-4c76-8b64-b84200c8bcd4', 'Diplomatas Victory', NULL, 'Mateus Nhantumbo', 'Preparar divisão da célula e identificar líder auxiliar.', 'Pastora Flavia', '2026-10-05', 'Planeado', 'Célula atingiu mais de 16 membros regulares.')
ON CONFLICT (id) DO NOTHING;

