-- ============================================================================
-- CE Mozambique — RLS plan (Backend Phase 1 + Phase 2 Auth pilot)
-- ============================================================================
-- Policies are prepared but NOT aggressively enabled for local Docker yet.
-- Real auth + JWT claims must exist before strict RLS goes live.
-- See docs/backend/RLS_SECURITY_PLAN.md and docs/backend/SUPABASE_AUTH_PILOT_PLAN.md
--
-- Resolution chain:
--   auth.uid() / current_auth_uid()
--   → public.users.auth_user_id
--   → role_id
--   → permissions
--   → has_module_permission(module, action)
-- ============================================================================

-- Example enable (commented until Auth pilot is tested):
-- ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.finance_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

/*
PRINCIPLES:

1. Super Admin / system roles: broad access via permissions table.
2. Main Pastor: national/all churches when role scope = all.
3. Church Pastor: church_id = app_user.church_id.
4. Department Head: department_id match + church scope.
5. Staff Member: own rows (created_by / staff_id / recipient_user_id).
6. Finance: only Finance Head / Finance Officer / Super Admin for verify/export.
7. Sensitive modules (counseling, salaries, documents): explicit can_view + is_sensitive.
8. Audit logs: insert allowed for authenticated app users; select restricted to admin roles.
9. Public forms (giving, cell report): constrained insert policies or Edge Functions later.
10. Service role key ONLY on server — never in browser.

Example policy sketches (do not apply until auth_user_id is wired in production):

-- Users can read own profile
-- CREATE POLICY users_select_self ON public.users
--   FOR SELECT TO authenticated
--   USING (auth_user_id = auth.uid() OR public.has_module_permission('accessControl', 'view'));

-- Finance select by permission
-- CREATE POLICY finance_select ON public.finance_records
--   FOR SELECT TO authenticated
--   USING (public.has_module_permission('finance', 'view'));
*/

-- ---------------------------------------------------------------------------
-- Phase 12: Reports / Notifications / Audit dev-safe policy plan (NOT enabled)
-- ---------------------------------------------------------------------------
/*
Future intent:
- report_definitions: authenticated read filtered by module permission.
- saved_report_views: owner private views; department/church/national scopes require permission.
- snapshots/exports: sensitivity permission gates; private bucket for generated files.
- notifications: recipient user or matching role; templates managed by authorized admins.
- audit_logs: Super Admin and explicitly authorized compliance/pastoral leadership only.
- sensitive_access_events: narrow compliance access; common staff cannot select.
- system_events/health: sanitized operational metadata only.

-- ALTER TABLE public.report_definitions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.saved_report_views ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.report_snapshots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.report_export_jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sensitive_access_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.data_source_health_checks ENABLE ROW LEVEL SECURITY;
*/

-- ---------------------------------------------------------------------------
-- Phase 9: Programs + Media policy plan (documented, NOT enabled)
-- ---------------------------------------------------------------------------
/*
Programs future intent:
- Super Admin/Main Pastor: global view.
- Church Pastor: own church programs.
- Department Head and assigned Program Coordinator: department/assigned programs.
- Finance: budget planning and verified finance links according to permission.
- Media: programs explicitly marked requires_media.

Media future intent:
- Super Admin and Media Lead: team, services, schedules and public channel metadata.
- Media Team: own schedules and permitted service information.
- Church Pastor: coverage for own church.
- Unauthorised staff: no internal team/performance details.

Complex policies remain disabled for this dev-safe pilot. Production rollout must
test church scope, assigned staff, role permissions, budget visibility and media
performance privacy before enabling RLS on every Programs/Media table.

-- ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.program_budgets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.program_reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.media_team_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.media_services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.media_schedules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.media_channels ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.media_performance_records ENABLE ROW LEVEL SECURITY;
*/

-- ---------------------------------------------------------------------------
-- Phase 10: Counseling + Sacraments policy plan (documented, NOT enabled)
-- ---------------------------------------------------------------------------
/*
Counseling future intent:
- Super Admin and Main Pastor: global records according to explicit permission.
- Church Pastor: records for the user's church only.
- Counselor: assigned cases and appointments only.
- Other staff: no Counseling access by default.
- confidential_notes, private_assessment, pastoral_guidance,
  confidential_session_notes and confidential_feedback require a separate
  confidential permission. Normal lists and aggregate reports must omit them.
- Sensitive reads/edits and confidential reports create soft audit events.

Sacraments future intent:
- Super Admin and Sacraments department: permitted global management.
- Church Pastor: own-church records; Minister: assigned appointments.
- sacrament_documents require explicit permission, private storage and future
  signed URLs. Public buckets are forbidden for sensitive document content.

Complex policies remain disabled for this dev-safe pilot so migration 0010
does not lock out existing workflows. Production rollout must test church,
assignment and field-level confidentiality boundaries before enabling RLS.

-- ALTER TABLE public.counseling_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.counseling_cases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.counseling_appointments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.counselors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.counseling_feedback ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.counseling_referrals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.baptisms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.marriages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.baby_dedications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sacrament_certificates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sacrament_documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sacrament_appointments ENABLE ROW LEVEL SECURITY;
*/

-- ---------------------------------------------------------------------------
-- Phase 11: F.E.V.O + Prison Ministry + Ministry Materials (NOT enabled)
-- ---------------------------------------------------------------------------
/*
F.E.V.O future intent: Super Admin/Main Pastor global view; F.E.V.O Lead
validates; Team Lead submits own-team reports; Staff sees own assignments.

Prison Ministry future intent: Super Admin/Ministry Lead manage operational
locations, services, separated prison classes and aggregate reports. Church
Pastors see permitted aggregates and assigned Staff see their agenda. Personal,
criminal, judicial, sentence, offence, court, cell and inmate identity data are
prohibited at every role and must not be stored.

Ministry Materials future intent: Lead manages catalog, separate module stock,
requests and distributions. Finance may view internal summaries when permitted,
but sales/funds never enter verified Finance totals automatically.

Migration 0011 remains dev-safe: production RLS must be tested before enabling.
-- ALTER TABLE public.fevo_weekly_configs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.fevo_activities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.fevo_reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.prison_locations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.prison_services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.prison_foundation_students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.prison_reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.ministry_materials_catalog ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.ministry_materials_stock ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.ministry_materials_sales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.ministry_materials_funds ENABLE ROW LEVEL SECURITY;
*/

-- ---------------------------------------------------------------------------
-- Phase 8: Foundation School pilot policy plan (documented, NOT enabled)
-- ---------------------------------------------------------------------------
/*
Future intent:
- Super Admin and Main Pastor: global Foundation School visibility.
- Church Pastor: records belonging to the user's church_id.
- Reitor/Coordinator: classes, students and teachers in their allowed scope.
- Professor: assigned classes/students; created_by/teacher_id retains attribution.
- Unauthorised staff: no test scores, final exams or sensitive student notes.
- Student portal is outside Phase 8.

RLS remains deliberately disabled for the dev-safe pilot so applying migration
0008 cannot lock out existing mock/local workflows. Before production, enable
and test policies for every foundation_school_* table with authenticated users.

-- ALTER TABLE public.foundation_school_students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.foundation_school_classes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.foundation_school_teachers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.foundation_school_lesson_progress ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.foundation_school_attendance ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.foundation_school_test_results ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.foundation_school_final_exams ENABLE ROW LEVEL SECURITY;

-- Example SELECT shape (do not enable until role helpers are production-ready):
-- CREATE POLICY foundation_students_select_pilot ON public.foundation_school_students
-- FOR SELECT TO authenticated USING (
--   public.current_app_user_scope() = 'all'
--   OR church_id = (SELECT church_id FROM public.users WHERE id = public.current_app_user_id())
-- );
*/

-- ---------------------------------------------------------------------------
-- Helper functions (Phase 2 — safe stubs; used by future policies)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_auth_uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

COMMENT ON FUNCTION public.current_auth_uid() IS
  'JWT sub when using Supabase Auth; null without request JWT.';

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM public.users u
  WHERE u.auth_user_id = public.current_auth_uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_app_role_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.role_id
  FROM public.users u
  WHERE u.id = public.current_app_user_id()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_app_user_scope()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(r.default_scope, 'own')
  FROM public.users u
  LEFT JOIN public.roles r ON r.id = u.role_id
  WHERE u.id = public.current_app_user_id()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_module_permission(module_name text, action_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rid uuid;
  allowed boolean := false;
BEGIN
  rid := public.current_app_role_id();
  IF rid IS NULL THEN
    RETURN false;
  END IF;
  SELECT CASE lower(coalesce(action_name, 'view'))
    WHEN 'view' THEN p.can_view
    WHEN 'create' THEN p.can_create
    WHEN 'edit' THEN p.can_edit
    WHEN 'delete' THEN p.can_delete
    WHEN 'approve' THEN p.can_approve
    WHEN 'verify' THEN p.can_verify
    WHEN 'release' THEN p.can_release_resources
    WHEN 'export' THEN p.can_export
    WHEN 'manage_settings' THEN p.can_manage_settings
    ELSE false
  END
  INTO allowed
  FROM public.permissions p
  WHERE p.role_id = rid
    AND lower(p.module) = lower(module_name)
  LIMIT 1;
  RETURN coalesce(allowed, false);
END;
$$;

COMMENT ON FUNCTION public.has_module_permission(text, text) IS
  'Phase 2 helper: permissions for current JWT-linked app user. Not enforced until RLS enabled.';

-- ---------------------------------------------------------------------------
-- Phase 3: Churches / Members pilot — policy sketches (NOT enabled by default)
-- ---------------------------------------------------------------------------
/*
Dev pilot note:
- Without Auth, prefer testing with service role in SQL editor only (never in browser).
- Temporary open policies for authenticated role may be used in a private project
  during pilot; document and remove before production.

Future policy intent:
- Super Admin / Main Pastor (scope all): SELECT/INSERT/UPDATE churches + members
- Church Pastor: church_id = users.church_id
- Department Head: department_id match when set on members
- Staff: limited own-linked records

-- ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY churches_select_pilot ON public.churches
--   FOR SELECT TO authenticated
--   USING (
--     public.current_app_user_scope() = 'all'
--     OR public.has_module_permission('churches', 'view')
--     OR id = (SELECT church_id FROM public.users WHERE id = public.current_app_user_id())
--   );

-- CREATE POLICY members_select_pilot ON public.members
--   FOR SELECT TO authenticated
--   USING (
--     public.current_app_user_scope() = 'all'
--     OR public.has_module_permission('members', 'view')
--     OR church_id = (SELECT church_id FROM public.users WHERE id = public.current_app_user_id())
--   );
*/

-- ---------------------------------------------------------------------------
-- Phase 7: Staff & RH + staff documents pilot - policy sketches (NOT enabled)
-- ---------------------------------------------------------------------------
/*
Future intent:
- Staff profiles: church scope + HR/Admin permissions; staff may view own profile.
- Staff salaries: HR Manager, Super Admin, explicitly permitted salary roles only.
- Staff documents: metadata visible only to HR/Admin or own staff record; storage
  must use a private bucket with signed URLs later.
- Staff documents must never use a public bucket.
- Salaries must not create finance_records or expenses automatically.

-- ALTER TABLE public.staff_departments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.staff_salaries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.staff_performance_reviews ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY staff_members_select_pilot ON public.staff_members
--   FOR SELECT TO authenticated
--   USING (
--     public.current_app_user_scope() = 'all'
--     OR public.has_module_permission('staffHr', 'view')
--     OR church_id = (SELECT church_id FROM public.users WHERE id = public.current_app_user_id())
--     OR user_id = public.current_app_user_id()
--   );

-- CREATE POLICY staff_salaries_select_pilot ON public.staff_salaries
--   FOR SELECT TO authenticated
--   USING (
--     public.has_module_permission('staffHr.salary', 'view')
--     OR public.has_module_permission('staffHr', 'manage')
--   );

-- CREATE POLICY staff_documents_select_pilot ON public.staff_documents
--   FOR SELECT TO authenticated
--   USING (
--     public.has_module_permission('staffHr.documents', 'view')
--     OR staff_id IN (SELECT staff_id FROM public.users WHERE id = public.current_app_user_id())
--   );
*/

-- ---------------------------------------------------------------------------
-- Phase 4: First Timers / Follow-Ups pilot — policy sketches (NOT enabled)
-- ---------------------------------------------------------------------------
/*
Future intent:
- Super Admin / Main Pastor: all first_timers + follow_ups
- Church Pastor: church_id match
- Follow-Up staff: responsible_user_id = current user OR department scope
- Staff: own assignments only when permitted

-- ALTER TABLE public.first_timers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.follow_up_timeline_events ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY first_timers_select_pilot ON public.first_timers
--   FOR SELECT TO authenticated
--   USING (
--     public.current_app_user_scope() = 'all'
--     OR public.has_module_permission('firstTimers', 'view')
--     OR church_id = (SELECT church_id FROM public.users WHERE id = public.current_app_user_id())
--   );

-- CREATE POLICY follow_ups_select_pilot ON public.follow_ups
--   FOR SELECT TO authenticated
--   USING (
--     public.current_app_user_scope() = 'all'
--     OR public.has_module_permission('followUp', 'view')
--     OR church_id = (SELECT church_id FROM public.users WHERE id = public.current_app_user_id())
--     OR responsible_user_id = public.current_app_user_id()
--   );
*/

-- ---------------------------------------------------------------------------
-- Phase 5: Finance / Public Giving / Documents — policy sketches (NOT enabled)
-- ---------------------------------------------------------------------------
/*
Future intent:
- Super Admin / Finance Head: full finance access
- Finance Officer: view/verify if permitted
- Main Pastor: summaries per permission
- Church Pastor: own church summary only if allowed
- Staff: no finance by default
- Public giving: constrained insert later (Edge Function / form API)
- documents (finance-proofs): private; signed URL after Auth

-- ALTER TABLE public.finance_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.public_giving_submissions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.finance_disbursements ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
*/

-- ---------------------------------------------------------------------------
-- Phase 6: Requisitions + Venue/Inventory pilot - policy sketches (NOT enabled)
-- ---------------------------------------------------------------------------
/*
Future intent:
- Requisitions: church scope + department permission; approval/release only by roles.
- Inventory: church scope; maintenance/status updates by inventory/media/admin roles.
- Venue spaces/checklists: church scope; service checklists editable by assigned teams.
- Finance link: requisitions may prepare finance_disbursements, but never auto-create
  finance_records from browser actions.

-- ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.requisition_timeline_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory_maintenance_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.venue_spaces ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.service_checklists ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY requisitions_select_pilot ON public.requisitions
--   FOR SELECT TO authenticated
--   USING (
--     public.current_app_user_scope() = 'all'
--     OR public.has_module_permission('requisitions', 'view')
--     OR church_id = (SELECT church_id FROM public.users WHERE id = public.current_app_user_id())
--     OR requested_by = public.current_app_user_id()
--   );

-- CREATE POLICY inventory_select_pilot ON public.inventory_items
--   FOR SELECT TO authenticated
--   USING (
--     public.current_app_user_scope() = 'all'
--     OR public.has_module_permission('venueInventory', 'view')
--     OR church_id = (SELECT church_id FROM public.users WHERE id = public.current_app_user_id())
--   );
*/
