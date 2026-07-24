-- Optional seed snippet for Supabase SQL Editor.
-- Prefer database/seed.sql as the canonical seed.
-- No passwords / real PII.

INSERT INTO public.roles (id, name, display_name, level, default_scope, is_system_role, status)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'super_admin', 'Super Admin', 100, 'all', true, 'Active'),
  ('11111111-1111-1111-1111-111111111102', 'main_pastor', 'Main Pastor', 90, 'all', true, 'Active'),
  ('11111111-1111-1111-1111-111111111103', 'finance_head', 'Finance Head', 70, 'all', true, 'Active'),
  ('11111111-1111-1111-1111-111111111104', 'hr_manager', 'HR Manager', 70, 'all', true, 'Active'),
  ('11111111-1111-1111-1111-111111111105', 'staff_member', 'Staff Member', 10, 'own', true, 'Active')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.system_settings (key, value, value_type, module, is_system)
VALUES
  ('default_language', '"pt"'::jsonb, 'string', 'global', true),
  ('default_currency', '"MZN"'::jsonb, 'string', 'finance', true),
  ('timezone', '"Africa/Maputo"'::jsonb, 'string', 'global', true),
  ('public_site_enabled', 'true'::jsonb, 'boolean', 'public_site', false)
ON CONFLICT (key) DO NOTHING;
