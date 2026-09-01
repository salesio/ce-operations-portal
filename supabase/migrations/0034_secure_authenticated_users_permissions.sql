-- ============================================================================
-- Migration 0034: Secure Users Table Permissions & Provision Diamantes Main Users
-- Grants permissions EXCLUSIVELY to `authenticated` role (NEVER to `anon`)
-- ============================================================================

-- 1. Ensure anon has NO access to public.users
REVOKE ALL ON public.users FROM anon;

-- 2. Grant SELECT and activity UPDATE to authenticated users only
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE (last_login_at, last_active_at, updated_at) ON public.users TO authenticated;

-- 3. Enable Row Level Security on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing conflicting policies if any
DROP POLICY IF EXISTS "Authenticated users can read users profiles" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own activity" ON public.users;
DROP POLICY IF EXISTS "Admins have full access to users" ON public.users;

-- 5. Policy: Authenticated users can view user profiles
CREATE POLICY "Authenticated users can read users profiles"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- 6. Policy: Users can update their own last login and active timestamp
CREATE POLICY "Users can update own activity"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id OR auth.uid() = id)
  WITH CHECK (auth.uid() = auth_user_id OR auth.uid() = id);

-- 7. Provision Diamantes Main Users (Filipe Chamango & Michael Juma)
INSERT INTO public.users (
  id,
  auth_user_id,
  email,
  full_name,
  role_id,
  church_id,
  cell_id,
  cell_group_id,
  department_name,
  assigned_cells,
  assigned_cell_groups,
  status,
  metadata
) VALUES 
(
  '473e4df5-883c-499a-a42e-223495c266d1',
  '473e4df5-883c-499a-a42e-223495c266d1',
  'diamantes.main@embaixadadecristo.org',
  'Filipe Chamango',
  '51567d05-f107-4d38-a43a-757f22d603af',
  'a1111111-1111-4111-8111-111111111101',
  '3749602f-2f92-43a3-8db5-e96ee8a7a438',
  '334021eb-7658-4e26-8239-1a4f5c80409d',
  'Cell Ministry',
  ARRAY[
    '3749602f-2f92-43a3-8db5-e96ee8a7a438',
    '1e50bb20-ec9d-4358-873a-83b96b2a093e',
    '752ead16-d25b-4c23-8f12-8e879089b29a',
    '959cd9dc-e99e-4ad9-88f5-3a7f81340863',
    'e8600e4b-b403-449f-88e6-da373589b511',
    'c01413e9-010b-496d-87aa-565056af2e81',
    '3787d0e9-1adf-4404-83fa-439882c1aaae'
  ],
  ARRAY['334021eb-7658-4e26-8239-1a4f5c80409d'],
  'Active',
  '{"role_name":"Cell Leader","cell_id":"3749602f-2f92-43a3-8db5-e96ee8a7a438","cell_name":"Blossom Diamante Main: Cristina Malauene","cell_group_id":"334021eb-7658-4e26-8239-1a4f5c80409d","cell_group_name":"Diamantes","assigned_cells":["3749602f-2f92-43a3-8db5-e96ee8a7a438","1e50bb20-ec9d-4358-873a-83b96b2a093e","752ead16-d25b-4c23-8f12-8e879089b29a","959cd9dc-e99e-4ad9-88f5-3a7f81340863","e8600e4b-b403-449f-88e6-da373589b511","c01413e9-010b-496d-87aa-565056af2e81","3787d0e9-1adf-4404-83fa-439882c1aaae"],"department_permissions":["cellReports","followUp","foundation","foundation_teacher","reports"]}'::jsonb
),
(
  '1be83c02-cb16-4cf3-a246-58bd0ef1953f',
  '1be83c02-cb16-4cf3-a246-58bd0ef1953f',
  'assistant.diamantes.main@embaixadadecristo.org',
  'Michael Juma',
  'c1c8355d-33e4-4627-9396-5b8475abfb81',
  'a1111111-1111-4111-8111-111111111101',
  '3749602f-2f92-43a3-8db5-e96ee8a7a438',
  '334021eb-7658-4e26-8239-1a4f5c80409d',
  'Cell Ministry',
  ARRAY[
    '3749602f-2f92-43a3-8db5-e96ee8a7a438',
    '1e50bb20-ec9d-4358-873a-83b96b2a093e',
    '752ead16-d25b-4c23-8f12-8e879089b29a',
    '959cd9dc-e99e-4ad9-88f5-3a7f81340863',
    'e8600e4b-b403-449f-88e6-da373589b511',
    'c01413e9-010b-496d-87aa-565056af2e81',
    '3787d0e9-1adf-4404-83fa-439882c1aaae'
  ],
  ARRAY['334021eb-7658-4e26-8239-1a4f5c80409d'],
  'Active',
  '{"role_name":"Assistant Cell Leader","cell_id":"3749602f-2f92-43a3-8db5-e96ee8a7a438","cell_name":"Blossom Diamante Main: Cristina Malauene","cell_group_id":"334021eb-7658-4e26-8239-1a4f5c80409d","cell_group_name":"Diamantes","assigned_cells":["3749602f-2f92-43a3-8db5-e96ee8a7a438","1e50bb20-ec9d-4358-873a-83b96b2a093e","752ead16-d25b-4c23-8f12-8e879089b29a","959cd9dc-e99e-4ad9-88f5-3a7f81340863","e8600e4b-b403-449f-88e6-da373589b511","c01413e9-010b-496d-87aa-565056af2e81","3787d0e9-1adf-4404-83fa-439882c1aaae"],"department_permissions":["cellReports"]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  auth_user_id = EXCLUDED.auth_user_id,
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role_id = EXCLUDED.role_id,
  cell_id = EXCLUDED.cell_id,
  cell_group_id = EXCLUDED.cell_group_id,
  department_name = EXCLUDED.department_name,
  assigned_cells = EXCLUDED.assigned_cells,
  assigned_cell_groups = EXCLUDED.assigned_cell_groups,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();
