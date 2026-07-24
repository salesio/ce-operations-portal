-- ============================================================================
-- CE Mozambique — RLS plan (Backend Phase 1)
-- ============================================================================
-- Policies are prepared but NOT aggressively enabled for local Docker yet.
-- Real auth + JWT claims must exist before strict RLS goes live.
-- See docs/backend/RLS_SECURITY_PLAN.md
-- ============================================================================

-- Example enable (commented for foundation phase):
-- ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.finance_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

/*
PRINCIPLES (document + implement in Auth phase):

1. Super Admin / system roles: broad access via permissions table.
2. Main Pastor: national/all churches when role scope = all.
3. Church Pastor: church_id = app_user.church_id.
4. Department Head: department_id match + church scope.
5. Staff Member: own rows (created_by / staff_id / recipient_user_id).
6. Finance: only Finance Head / Finance Officer / Super Admin for verify/export.
7. Sensitive modules (counseling, salaries, documents): explicit can_view + is_sensitive.
8. Audit logs: insert allowed for authenticated app users; select restricted to admin roles.
9. Public forms (giving, cell report): use constrained insert policies or Edge Functions later.
10. Service role key ONLY on server — never in browser.

Example policy sketches (do not apply until auth_user_id is wired):

-- Authenticated users can read active churches
-- CREATE POLICY churches_select_authenticated ON public.churches
--   FOR SELECT TO authenticated
--   USING (status = 'Active' OR true);

-- Finance select by permission (pseudo — needs helper fn app_user_can)
-- CREATE POLICY finance_select ON public.finance_records
--   FOR SELECT TO authenticated
--   USING (public.app_user_can('finance', 'can_view'));

Helper functions to add in Auth phase:
- public.current_app_user() → users row from auth.uid()
- public.app_user_can(module text, action text) → boolean
- public.app_user_church_ids() → set of church uuids by scope
*/

-- Placeholder helper stubs (safe no-op until Auth phase)
CREATE OR REPLACE FUNCTION public.current_auth_uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

COMMENT ON FUNCTION public.current_auth_uid() IS
  'Returns JWT sub when using Supabase Auth; null in local Docker foundation phase.';
