// ============================================================================
// TEST: Angelica Provisioning Validation Against Real Database Schema (PGLite)
// ============================================================================
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("------------------------------------------------------------");
console.log("RUNNING TEST: test-provision-angelica");
console.log("------------------------------------------------------------");

// 1. Static Audit of provision-angelica.sql
const provisionPath = path.join(rootDir, "scripts", "provision-angelica.sql");
assert(fs.existsSync(provisionPath), `Provisioning file must exist at ${provisionPath}`);
const provisionSql = fs.readFileSync(provisionPath, "utf8");

console.log("1. Performing Static Script Audit...");
assert(provisionSql.includes("ANGELICA_AUTH_USER_ID"), "Script must use placeholder ANGELICA_AUTH_USER_ID");
assert(!provisionSql.includes("has_dashboard_access"), "Script must NOT contain has_dashboard_access");
assert(provisionSql.includes("full_name"), "Script must use full_name for public.users");
assert(!provisionSql.includes("users.name") && !provisionSql.includes("EXCLUDED.name"), "Script must NOT reference users.name");
assert(!provisionSql.toLowerCase().includes("password"), "Script must NOT contain passwords");
assert(!provisionSql.includes("service_role") && !provisionSql.includes("sb_secret"), "Script must NOT contain secrets");
console.log("  [PASS] Static audit passed: full_name used, has_dashboard_access removed, 0 secrets.");

// 2. Real Database Execution using PGlite
console.log("\n2. Initializing Local PostgreSQL Engine (PGlite) with Real Schema...");
const db = new PGlite();

// Create extensions and auth/public schemas
await db.exec(`
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE SCHEMA IF NOT EXISTS public;

  -- auth.users (Supabase Auth representation)
  CREATE TABLE auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE,
    encrypted_password text,
    email_confirmed_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  -- public.roles (Real schema)
  CREATE TABLE public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    description text,
    hierarchy_level integer NOT NULL DEFAULT 1,
    role_scope text NOT NULL DEFAULT 'church',
    status text NOT NULL DEFAULT 'Active',
    is_system_role boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  -- public.churches (Real schema)
  CREATE TABLE public.churches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    church_name text NOT NULL,
    status text NOT NULL DEFAULT 'Active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  -- public.members (Real schema)
  CREATE TABLE public.members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    church_id uuid REFERENCES public.churches(id),
    status text NOT NULL DEFAULT 'Active'
  );

  -- public.users (REAL PRODUCTION SCHEMA)
  CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid UNIQUE,
    staff_id uuid,
    full_name text,
    email text UNIQUE,
    phone text,
    role_id uuid REFERENCES public.roles(id) ON DELETE SET NULL,
    church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
    department_id uuid,
    status text NOT NULL DEFAULT 'Active',
    preferred_language text DEFAULT 'pt',
    last_login_at timestamptz,
    last_active_at timestamptz,
    failed_login_attempts integer NOT NULL DEFAULT 0,
    locked_until timestamptz,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    cell_group_id uuid,
    cell_id uuid,
    department_name text,
    assigned_cells text[],
    assigned_cell_groups text[]
  );
`);

console.log("  [PASS] Schema initialized matching production table definitions.");

// Seed baseline data
const TEST_SUPER_ADMIN_AUTH_ID = "00000000-0000-0000-0000-000000000099";
const TEST_SUPER_ADMIN_USER_ID = "11111111-1111-1111-1111-111111111199";
const TEST_SEDE_CHURCH_ID = "a1111111-1111-4111-8111-111111111101";
const TEST_ANGELICA_AUTH_ID = "008969ce-f123-41e3-bce0-e58f477b4622";
const TEST_TARGET_EMAIL = "angelicaamilcar27@gmail.com";

await db.exec(`
  -- Seed roles
  INSERT INTO public.roles (name, status, is_system_role) VALUES
    ('Super Admin', 'Active', true),
    ('alec_manager', 'Active', true);

  -- Seed Sede Church
  INSERT INTO public.churches (id, church_name, status) VALUES
    ('${TEST_SEDE_CHURCH_ID}'::uuid, 'E.C. Maputo Central – Sede', 'Active');

  -- Seed Super Admin
  INSERT INTO auth.users (id, email) VALUES
    ('${TEST_SUPER_ADMIN_AUTH_ID}'::uuid, 'admin@cemozambique.org');

  INSERT INTO public.users (id, auth_user_id, full_name, email, role_id, church_id, status)
  VALUES (
    '${TEST_SUPER_ADMIN_USER_ID}'::uuid,
    '${TEST_SUPER_ADMIN_AUTH_ID}'::uuid,
    'Super Admin User',
    'admin@cemozambique.org',
    (SELECT id FROM public.roles WHERE name = 'Super Admin'),
    '${TEST_SEDE_CHURCH_ID}'::uuid,
    'Active'
  );

  -- Seed 5 sample members to test unimpacted integrity
  INSERT INTO public.members (full_name, church_id) VALUES
    ('Member 1', '${TEST_SEDE_CHURCH_ID}'::uuid),
    ('Member 2', '${TEST_SEDE_CHURCH_ID}'::uuid),
    ('Member 3', '${TEST_SEDE_CHURCH_ID}'::uuid),
    ('Member 4', '${TEST_SEDE_CHURCH_ID}'::uuid),
    ('Member 5', '${TEST_SEDE_CHURCH_ID}'::uuid);
`);

console.log("  [PASS] Baseline data seeded (Super Admin + Sede Church + alec_manager role + members).");

// Helper to run provisioning with a given auth_user_id
async function runProvisioningWithUuid(testUuid) {
  const sqlToRun = provisionSql.replaceAll("ANGELICA_AUTH_USER_ID", testUuid);
  return await db.exec(sqlToRun);
}

// 3. Test Failure Scenarios
console.log("\n3. Testing Safety Abort Scenarios...");

// 3.1: Missing in auth.users
try {
  await runProvisioningWithUuid(TEST_ANGELICA_AUTH_ID);
  assert.fail("Should have failed when auth.users does not contain the user");
} catch (err) {
  assert(String(err).includes("Utilizador Auth não encontrado"), `Expected auth not found error, got: ${err.message}`);
  console.log("  [PASS] Aborts when auth.users has 0 records for email/ID.");
}

// Create auth.users row for Angelica
await db.exec(`
  INSERT INTO auth.users (id, email) VALUES
    ('${TEST_ANGELICA_AUTH_ID}'::uuid, '${TEST_TARGET_EMAIL}');
`);

// 3.2: UUID mismatch with email
const MISMATCH_AUTH_ID = "00000000-0000-0000-0000-000000000002";
try {
  await runProvisioningWithUuid(MISMATCH_AUTH_ID);
  assert.fail("Should have failed when UUID does not match target email");
} catch (err) {
  assert(String(err).includes("Utilizador Auth não encontrado"), `Expected mismatch error, got: ${err.message}`);
  console.log("  [PASS] Aborts when UUID does not match target email.");
}

// 3.3: Conflicting user in public.users (same email, different auth_user_id)
await db.exec(`
  INSERT INTO public.users (auth_user_id, email, full_name) VALUES
    ('00000000-0000-0000-0000-000000000999'::uuid, '${TEST_TARGET_EMAIL}', 'Conflict Person');
`);
try {
  await runProvisioningWithUuid(TEST_ANGELICA_AUTH_ID);
  assert.fail("Should have failed on email/auth_user_id conflict");
} catch (err) {
  assert(String(err).includes("Erro de integridade"), `Expected integrity error, got: ${err.message}`);
  console.log("  [PASS] Aborts when conflicting user with different auth_user_id exists.");
}

// Clean up conflict record
await db.exec(`DELETE FROM public.users WHERE email = '${TEST_TARGET_EMAIL}';`);

// 4. Test Successful Execution & Idempotency
console.log("\n4. Testing Execution & Full Idempotency...");

// First Run (INSERT)
await runProvisioningWithUuid(TEST_ANGELICA_AUTH_ID);

const check1 = await db.query(`
  SELECT u.id, u.full_name, u.email, u.auth_user_id, r.name as role_name, u.church_id, u.status
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE lower(u.email) = lower('${TEST_TARGET_EMAIL}')
`);

assert.equal(check1.rows.length, 1, "Exactly 1 user row must exist after first run");
const angelicaRow1 = check1.rows[0];
assert.equal(angelicaRow1.full_name, "Sister Angélica");
assert.equal(angelicaRow1.email, TEST_TARGET_EMAIL);
assert.equal(angelicaRow1.auth_user_id, TEST_ANGELICA_AUTH_ID);
assert.equal(angelicaRow1.role_name, "alec_manager");
assert.equal(angelicaRow1.church_id, TEST_SEDE_CHURCH_ID);
assert.equal(angelicaRow1.status, "Active");
console.log("  [PASS] First Run: User record successfully created with canonical role and Sede church.");

// Second Run (UPDATE / IDEMPOTENT)
await runProvisioningWithUuid(TEST_ANGELICA_AUTH_ID);

const check2 = await db.query(`
  SELECT u.id, u.full_name, u.email, u.auth_user_id, r.name as role_name, u.church_id, u.status
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE lower(u.email) = lower('${TEST_TARGET_EMAIL}')
`);

assert.equal(check2.rows.length, 1, "Exactly 1 user row must exist after second run (no duplicates)");
const angelicaRow2 = check2.rows[0];
assert.equal(angelicaRow2.id, angelicaRow1.id, "Second run MUST preserve the exact same user ID");
assert.equal(angelicaRow2.full_name, "Sister Angélica");
assert.equal(angelicaRow2.role_name, "alec_manager");
assert.equal(angelicaRow2.church_id, TEST_SEDE_CHURCH_ID);
assert.equal(angelicaRow2.status, "Active");
console.log("  [PASS] Second Run: Fully idempotent (0 duplicates, same user ID maintained).");

// 5. Verify Super Admin & Members Integrity
console.log("\n5. Verifying Super Admin and Members Unimpacted Integrity...");
const superAdminCheck = await db.query(`
  SELECT u.id, u.full_name, u.email, r.name as role_name, u.status
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE u.id = '${TEST_SUPER_ADMIN_USER_ID}'::uuid
`);
assert.equal(superAdminCheck.rows.length, 1);
assert.equal(superAdminCheck.rows[0].role_name, "Super Admin");
assert.equal(superAdminCheck.rows[0].status, "Active");
console.log("  [PASS] Super Admin is 100% intact and untouched.");

const membersCheck = await db.query(`SELECT count(*) as count FROM public.members`);
assert.equal(Number(membersCheck.rows[0].count), 5);
console.log("  [PASS] Members table is 100% intact and untouched.");

console.log("\n------------------------------------------------------------");
console.log("ALL test-provision-angelica TESTS PASSED (100% SUCCESS)");
console.log("------------------------------------------------------------");
await db.close();
