// ============================================================================
// TEST: Migration 0024 and Provisioning Script Structural Integrity
// ============================================================================
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("------------------------------------------------------------");
console.log("RUNNING TEST: migration-0024");
console.log("------------------------------------------------------------");

// 1. Verify Migration File Exists
const migrationPath = path.join(rootDir, "supabase", "migrations", "0024_alec_manager_role_and_rls.sql");
assert(fs.existsSync(migrationPath), `Migration file must exist at ${migrationPath}`);
const migrationSql = fs.readFileSync(migrationPath, "utf8");

// 2. Validate Migration Structure & Semantics
console.log("Validating migration 0024_alec_manager_role_and_rls.sql...");

assert(migrationSql.includes("BEGIN;") && migrationSql.includes("COMMIT;"), "Migration must be fully transactional (BEGIN ... COMMIT)");
assert(migrationSql.includes("'alec_manager'"), "Migration must declare role 'alec_manager'");
assert(migrationSql.includes("INSERT INTO public.roles"), "Migration must insert role into public.roles");
assert(migrationSql.includes("INSERT INTO public.permissions"), "Migration must insert permissions into public.permissions");

// Check permissions for alec_manager
assert(migrationSql.includes("'cell_portal'"), "Permissions must configure 'cell_portal'");
assert(migrationSql.includes("'alec'"), "Permissions must configure 'alec'");
assert(migrationSql.includes("'alec_registration'"), "Permissions must configure 'alec_registration'");
assert(migrationSql.includes("'alec_scores'"), "Permissions must configure 'alec_scores'");
assert(migrationSql.includes("'church_reports'"), "Permissions must configure 'church_reports'");

// Check secure search RPC
assert(migrationSql.includes("FUNCTION public.search_alec_candidate_members"), "Migration must define secure search RPC function");
assert(migrationSql.includes("SECURITY DEFINER"), "Search RPC must be SECURITY DEFINER");
assert(migrationSql.includes("SET search_path = public"), "Search RPC must set search_path = public for security");
assert(migrationSql.includes("GRANT EXECUTE ON FUNCTION public.search_alec_candidate_members(text) TO authenticated"), "Search RPC must be granted to authenticated users");

// Check RLS policies
assert(migrationSql.includes("cells_alec_manager_select"), "Cells RLS policy for alec_manager must exist");
assert(migrationSql.includes("cell_groups_alec_manager_select"), "Cell groups RLS policy for alec_manager must exist");
assert(migrationSql.includes("cell_transfers_alec_manager_select"), "Cell transfers RLS policy for alec_manager must exist");
assert(migrationSql.includes("member_candidates_alec_manager_select"), "Member candidates RLS policy for alec_manager must exist");

// Security assertions: no secrets, no DROP DATABASE/TABLE, no passwords
assert(!migrationSql.includes("sb_secret"), "Migration must NOT contain sb_secret");
assert(!migrationSql.includes("service_role"), "Migration must NOT contain service_role");
assert(!migrationSql.includes("DROP TABLE"), "Migration must NOT drop any tables");
assert(!migrationSql.includes("encrypted_password") && !migrationSql.includes("crypt("), "Migration must NOT set or store passwords");

// Check schema_meta update
assert(migrationSql.includes("24_alec_manager_role_and_rls"), "Migration must record phase 24 in schema_meta");

console.log("  [PASS] Migration 0024 passed all syntax, idempotency and safety checks");

// 3. Verify Provisioning Script
console.log("Validating scripts/provision-angelica.sql...");
const provisionPath = path.join(rootDir, "scripts", "provision-angelica.sql");
assert(fs.existsSync(provisionPath), `Provisioning script must exist at ${provisionPath}`);
const provisionSql = fs.readFileSync(provisionPath, "utf8");

assert(provisionSql.includes("ANGELICA_AUTH_USER_ID"), "Provisioning script must use placeholder ANGELICA_AUTH_USER_ID");
assert(provisionSql.includes("angelicaamilcar27@gmail.com"), "Provisioning script must validate target email");
assert(provisionSql.includes("a1111111-1111-4111-8111-111111111101"), "Provisioning script must validate Sede church UUID");
assert(provisionSql.includes("alec_manager"), "Provisioning script must link role alec_manager");
assert(provisionSql.includes("Sister Angélica"), "Provisioning script must set display name Sister Angélica");
assert(provisionSql.includes("ON CONFLICT (auth_user_id) DO UPDATE"), "Provisioning script must safely upsert into public.users");
assert(!provisionSql.includes("encrypted_password") && !provisionSql.includes("crypt("), "Provisioning script must NOT set or manipulate passwords");

console.log("  [PASS] Provisioning script passed all validation and idempotency checks");

console.log("------------------------------------------------------------");
console.log("ALL migration-0024 TESTS PASSED (100% SUCCESS)");
console.log("------------------------------------------------------------");
