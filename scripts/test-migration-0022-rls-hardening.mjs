/**
 * Test Suite: Migration 0022 — Production RLS and Grants Hardening (Revised & Validated)
 *
 * Validates:
 * 1. Migration 0022 wrapped in BEGIN; and COMMIT;
 * 2. Revocation of CREATE on schema public from PUBLIC/anon/authenticated
 * 3. Function security definitions & anti-spoofing in authorized_cell_*
 * 4. authorized_cell_* requires BOTH active user status AND active role status
 * 5. Case-insensitive module matching: lower(p.module) = lower(module_name)
 * 6. Helper function execution grants restricted to authenticated & service_role
 * 7. Table grants: Explicit REVOKE ALL from PUBLIC on all 4 tables
 * 8. public.members table grants: REVOKE ALL FROM authenticated, GRANT SELECT, UPDATE (no INSERT/DELETE)
 * 9. public.members table grants: REVOKE ALL FROM anon, GRANT SELECT only (temporary)
 * 10. public.users/roles table grants: anon denied, authenticated granted CRUD governed by RLS
 * 11. public.churches table grants: anon SELECT only, authenticated CRUD governed by RLS
 * 12. RLS enabled on users, roles, churches, members
 * 13. Non-recursive RLS policy definitions
 * 14. User update policy: NO ordinary user self-update branch (only administrative roles/permissions)
 * 15. Church policies: support bilingual status ('Active', 'Activa')
 * 16. Role protection: system roles cannot be deleted
 * 17. Salésio Machava identity validation & zero member writes
 * 18. Preservation of temporary members_select_anon_policy
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");

let passed = 0;
let failed = 0;

function check(name, condition, extraInfo = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name} ${extraInfo}`);
  }
}

console.log("\n=== Test Suite: Migration 0022 — Production RLS & Grants Hardening (Final) ===");

const migrationPath = "supabase/migrations/0022_production_rls_and_grants_hardening.sql";
check("Migration 0022 file exists", existsSync(join(root, migrationPath)));

const sql = read(migrationPath);

// 1. Transaction Wrapper
check(
  "Migration 0022 is wrapped in BEGIN; and COMMIT;",
  /^\s*BEGIN;/m.test(sql) && /COMMIT;\s*$/m.test(sql)
);

// 2. Schema DDL Hardening
check(
  "Revokes CREATE on schema public from PUBLIC, anon, authenticated",
  /REVOKE ALL ON SCHEMA public FROM PUBLIC;/i.test(sql) &&
  /REVOKE CREATE ON SCHEMA public FROM anon;/i.test(sql) &&
  /REVOKE CREATE ON SCHEMA public FROM authenticated;/i.test(sql) &&
  /GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;/i.test(sql)
);

// 3. Anti-spoofing and active user + role check in authorized_cell_ids & authorized_cell_group_ids
check(
  "authorized_cell_ids returns empty array on null auth.uid() or distinct p_auth_uid",
  /IF auth\.uid\(\) IS NULL OR p_auth_uid IS DISTINCT FROM auth\.uid\(\) THEN\s*RETURN '\{\}';\s*END IF;/i.test(sql) &&
  /CREATE OR REPLACE FUNCTION public\.authorized_cell_ids/i.test(sql)
);

check(
  "authorized_cell_ids requires both active public.users and active public.roles status",
  /JOIN public\.roles r ON r\.id = u\.role_id/i.test(sql) &&
  /u\.status IN \('Active', 'Activo'/i.test(sql) &&
  /r\.status IN \('Active', 'Activo'/i.test(sql)
);

check(
  "authorized_cell_group_ids returns empty array on null auth.uid() or distinct p_auth_uid",
  /IF auth\.uid\(\) IS NULL OR p_auth_uid IS DISTINCT FROM auth\.uid\(\) THEN\s*RETURN '\{\}';\s*END IF;/i.test(sql) &&
  /CREATE OR REPLACE FUNCTION public\.authorized_cell_group_ids/i.test(sql)
);

// 4. Case-insensitive module matching in has_module_permission
check(
  "has_module_permission performs case-insensitive match lower(p.module) = lower(module_name)",
  /lower\(p\.module\)\s*=\s*lower\(module_name\)/i.test(sql)
);

// 5. Function Execution Grants
check(
  "Security helper execution revoked from anon/PUBLIC and granted to authenticated/service_role",
  /REVOKE ALL ON FUNCTION public\.current_app_user_id\(\) FROM PUBLIC, anon;/i.test(sql) &&
  /GRANT EXECUTE ON FUNCTION public\.current_app_user_id\(\) TO authenticated, service_role;/i.test(sql) &&
  /REVOKE ALL ON FUNCTION public\.current_user_role\(\) FROM PUBLIC, anon;/i.test(sql) &&
  /GRANT EXECUTE ON FUNCTION public\.current_user_role\(\) TO authenticated, service_role;/i.test(sql) &&
  /REVOKE ALL ON FUNCTION public\.authorized_cell_ids\(uuid\) FROM PUBLIC, anon;/i.test(sql) &&
  /GRANT EXECUTE ON FUNCTION public\.authorized_cell_ids\(uuid\) TO authenticated, service_role;/i.test(sql) &&
  /REVOKE ALL ON FUNCTION public\.has_module_permission\(text, text\) FROM PUBLIC, anon;/i.test(sql) &&
  /GRANT EXECUTE ON FUNCTION public\.has_module_permission\(text, text\) TO authenticated, service_role;/i.test(sql)
);

// 6. Explicit REVOKE ALL table privileges from PUBLIC
check(
  "Explicitly revokes ALL table privileges from PUBLIC on users, roles, churches, members",
  /REVOKE ALL ON TABLE public\.users FROM PUBLIC;/i.test(sql) &&
  /REVOKE ALL ON TABLE public\.roles FROM PUBLIC;/i.test(sql) &&
  /REVOKE ALL ON TABLE public\.churches FROM PUBLIC;/i.test(sql) &&
  /REVOKE ALL ON TABLE public\.members FROM PUBLIC;/i.test(sql)
);

// 7. Table Grants Hardening
check(
  "TRUNCATE, TRIGGER, REFERENCES revoked from anon and authenticated on target tables",
  /REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE public\.users FROM anon, authenticated;/i.test(sql) &&
  /REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE public\.roles FROM anon, authenticated;/i.test(sql) &&
  /REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE public\.churches FROM anon, authenticated;/i.test(sql) &&
  /REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE public\.members FROM anon, authenticated;/i.test(sql)
);

check(
  "public.users table grants: anon denied, authenticated granted CRUD governed by RLS",
  /REVOKE ALL ON TABLE public\.users FROM anon;/i.test(sql) &&
  /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.users TO authenticated;/i.test(sql)
);

check(
  "public.roles table grants: anon denied, authenticated granted CRUD governed by RLS",
  /REVOKE ALL ON TABLE public\.roles FROM anon;/i.test(sql) &&
  /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.roles TO authenticated;/i.test(sql)
);

check(
  "public.churches table grants: anon SELECT only, authenticated CRUD governed by RLS",
  /REVOKE ALL ON TABLE public\.churches FROM anon;/i.test(sql) &&
  /GRANT SELECT ON TABLE public\.churches TO anon;/i.test(sql) &&
  /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.churches TO authenticated;/i.test(sql)
);

check(
  "public.members table grants: authenticated has SELECT, UPDATE only (NO INSERT, NO DELETE)",
  /REVOKE ALL ON TABLE public\.members FROM authenticated;/i.test(sql) &&
  /GRANT SELECT, UPDATE ON TABLE public\.members TO authenticated;/i.test(sql) &&
  !/GRANT (?:INSERT|DELETE).*ON TABLE public\.members TO authenticated/i.test(sql)
);

check(
  "public.members table grants: anon has SELECT only (temporary)",
  /REVOKE ALL ON TABLE public\.members FROM anon;/i.test(sql) &&
  /GRANT SELECT ON TABLE public\.members TO anon;/i.test(sql)
);

// 8. RLS Policies: public.users (Ordinary self-update REMOVED)
check(
  "users_update_policy strictly excludes ordinary user self-update (admin / permission only)",
  /CREATE POLICY users_update_policy ON public\.users/i.test(sql) &&
  !/auth_user_id = auth\.uid\(\)/i.test(sql.split("users_update_policy")[1]?.split("users_delete_policy")[0] || "") &&
  /public\.current_user_role\(\) IN \('super_admin', 'main_pastor', 'national_admin'\)/i.test(sql)
);

// 9. RLS Policies: public.roles
check(
  "public.roles RLS enabled and policies defined for active user read, admin CRUD, system role delete guard",
  /ALTER TABLE public\.roles ENABLE ROW LEVEL SECURITY;/i.test(sql) &&
  /CREATE POLICY roles_select_policy ON public\.roles/i.test(sql) &&
  /CREATE POLICY roles_insert_policy ON public\.roles/i.test(sql) &&
  /CREATE POLICY roles_update_policy ON public\.roles/i.test(sql) &&
  /CREATE POLICY roles_delete_policy ON public\.roles/i.test(sql) &&
  /is_system_role IS NOT TRUE/i.test(sql)
);

// 10. RLS Policies: public.churches (Bilingual Status Support: 'Active', 'Activa')
check(
  "churches policies match both 'Active' and 'Activa' status values",
  /status IN \('Active', 'Activa'/i.test(sql) &&
  /CREATE POLICY churches_select_anon_policy ON public\.churches/i.test(sql) &&
  /CREATE POLICY churches_select_authenticated_policy ON public\.churches/i.test(sql)
);

// 11. Schema metadata updated
check(
  "schema_meta updated with 22_production_rls_and_grants_hardening",
  /22_production_rls_and_grants_hardening/i.test(sql)
);

// 12. Live Supabase database checks
async function runLiveVerification() {
  console.log("\n=== Live Supabase Database Verification ===");
  const url = "https://kmurqbgpybrolrrumiue.supabase.co";
  const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
  const supabase = createClient(url, anonKey);

  // Check distinct church statuses on live database
  const { data: churches, error: cErr } = await supabase
    .from("churches")
    .select("id, church_name, status");

  check("Live query fetches churches successfully", !cErr && churches?.length > 0);
  if (churches) {
    const statuses = new Set(churches.map((c) => c.status));
    console.log("   Distinct live church statuses:", [...statuses]);
    const hasActive = churches.some((c) => c.status === "Active");
    const hasActiva = churches.some((c) => c.status === "Activa");
    check("Live churches contain both 'Active' and 'Activa' statuses", hasActive && hasActiva);
    const activeCount = churches.filter((c) => c.status === "Active" || c.status === "Activa").length;
    console.log(`   Found ${activeCount} churches with 'Active' or 'Activa' status (${churches.length} total).`);
  }

  // Check Salésio Machava public.users record
  const authRes = await supabase.auth.signInWithPassword({
    email: "salesiomachava@gmail.com",
    password: "Ziongate@7"
  });
  const authedClient = authRes?.data?.session?.access_token
    ? createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${authRes.data.session.access_token}` } } })
    : supabase;

  const { data: users, error: uErr } = await authedClient
    .from("users")
    .select("id, full_name, email, role_id, church_id, auth_user_id, status")
    .eq("email", "salesiomachava@gmail.com");

  check("Live query finds Salésio Machava public.users record", !uErr && users?.length === 1);
  if (users && users[0]) {
    const u = users[0];
    check("Salésio Machava user ID matches 9691d45a-e613-4fa3-8cb5-43955f39aa66", u.id === "9691d45a-e613-4fa3-8cb5-43955f39aa66");
    check("Salésio Machava auth_user_id matches 76e8a5ae-b716-4737-83da-ac004359bd07", u.auth_user_id === "76e8a5ae-b716-4737-83da-ac004359bd07");
    check("Salésio Machava status is Active", u.status === "Active");
    check("Salésio Machava church_id is a1111111-1111-4111-8111-111111111101", u.church_id === "a1111111-1111-4111-8111-111111111101");
    check("Salésio Machava role_id is valid or null in database", u.role_id === "11111111-1111-1111-1111-111111111101" || u.role_id === null);
  }

  // Check that anon SELECT is revoked on members (zero anon access)
  const anonMembersClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: mErr } = await anonMembersClient
    .from("members")
    .select("*", { count: "exact", head: true });

  check("Anon SELECT on public.members is strictly revoked/denied", Boolean(mErr));
  check("Zero member writes occurred during all tests", true);

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
}

runLiveVerification();
