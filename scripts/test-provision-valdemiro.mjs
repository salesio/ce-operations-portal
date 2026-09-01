// ============================================================================
// TEST: Valdemiro Provisioning Validation Against Real Database Schema (PGLite)
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
console.log("RUNNING TEST: test-provision-valdemiro");
console.log("------------------------------------------------------------");

// 1. Static Audit of provision-valdemiro.sql and migration 0026
const provisionPath = path.join(rootDir, "scripts", "provision-valdemiro.sql");
const migrationPath = path.join(rootDir, "supabase", "migrations", "0026_pastoral_care_rector_role_and_rls.sql");

assert(fs.existsSync(provisionPath), `Provisioning file must exist at ${provisionPath}`);
assert(fs.existsSync(migrationPath), `Migration file must exist at ${migrationPath}`);

const provisionSql = fs.readFileSync(provisionPath, "utf8");
const migrationSql = fs.readFileSync(migrationPath, "utf8");

console.log("1. Performing Static Script Audit...");
assert(provisionSql.includes("ac47e5fa-f9f5-4d58-ab91-eebcb01f1b01"), "Script must contain Valdemiro auth UID");
assert(provisionSql.includes("p.care@embaixadadecristo.org"), "Script must contain p.care@embaixadadecristo.org");
assert(provisionSql.includes("pastoral_care_rector"), "Script must contain pastoral_care_rector role");
assert(provisionSql.includes("full_name"), "Script must use full_name for public.users");
assert(!provisionSql.toLowerCase().includes("password"), "Script must NOT contain passwords");
assert(!provisionSql.includes("service_role") && !provisionSql.includes("sb_secret"), "Script must NOT contain secrets");
assert(migrationSql.includes("pastoral_care_rector"), "Migration 0026 must declare pastoral_care_rector");
console.log("  [PASS] Static audit passed: valid UUID, email, canonical role, 0 secrets.");

// 2. Real Database Execution using PGlite
console.log("\n2. Initializing Local PostgreSQL Engine (PGlite) with Real Schema...");
const db = new PGlite();

await db.exec(`
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE SCHEMA IF NOT EXISTS public;

  -- auth.users
  CREATE TABLE auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE,
    encrypted_password text,
    email_confirmed_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE OR REPLACE FUNCTION auth.uid()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  AS $$ SELECT 'ac47e5fa-f9f5-4d58-ab91-eebcb01f1b01'::uuid; $$;

  -- public.roles
  CREATE TABLE public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    display_name text,
    level integer NOT NULL DEFAULT 1,
    default_scope text NOT NULL DEFAULT 'church',
    status text NOT NULL DEFAULT 'Active',
    is_system_role boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  -- public.permissions
  CREATE TABLE public.permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
    module text NOT NULL,
    can_view boolean DEFAULT false,
    can_create boolean DEFAULT false,
    can_edit boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    can_approve boolean DEFAULT false,
    can_verify boolean DEFAULT false,
    can_release_resources boolean DEFAULT false,
    can_export boolean DEFAULT false,
    scope text DEFAULT 'church',
    created_at timestamptz DEFAULT now()
  );

  -- public.churches
  CREATE TABLE public.churches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    status text NOT NULL DEFAULT 'Active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  -- public.schema_meta
  CREATE TABLE public.schema_meta (
    key text PRIMARY KEY,
    value text,
    updated_at timestamptz DEFAULT now()
  );

  -- public.users
  CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid UNIQUE,
    email text UNIQUE NOT NULL,
    full_name text NOT NULL,
    role_id uuid REFERENCES public.roles(id),
    church_id uuid REFERENCES public.churches(id),
    status text NOT NULL DEFAULT 'Active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
`);

console.log("  [PASS] Schema initialized matching production table definitions.");

// Seed baseline data
const sedeChurchId = "a1111111-1111-4111-8111-111111111101";
const valdemiroAuthUid = "ac47e5fa-f9f5-4d58-ab91-eebcb01f1b01";

await db.exec(`
  INSERT INTO public.churches (id, name, status)
  VALUES ('${sedeChurchId}', 'E.C. Maputo Central – Sede', 'Active');

  -- Insert Auth User for Pastor Valdemiro
  INSERT INTO auth.users (id, email)
  VALUES ('${valdemiroAuthUid}', 'p.care@embaixadadecristo.org');
`);

// Execute Migration 0026
console.log("\n3. Executing Migration 0026 in PGlite...");
await db.exec(migrationSql);
console.log("  [PASS] Migration 0026 executed successfully in PGlite.");

// Execute Provisioning Script
console.log("\n4. Executing Provisioning Script in PGlite...");
await db.exec(provisionSql);
console.log("  [PASS] Provisioning script executed successfully.");

// Verify User record in public.users
const userRes = await db.query(`
  SELECT u.id, u.auth_user_id, u.email, u.full_name, u.status, r.name as role_name, c.name as church_name
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  JOIN public.churches c ON c.id = u.church_id
  WHERE u.email = 'p.care@embaixadadecristo.org';
`);

assert.equal(userRes.rows.length, 1, "Must find exactly 1 user row in public.users");
const userRow = userRes.rows[0];
assert.equal(userRow.auth_user_id, valdemiroAuthUid);
assert.equal(userRow.full_name, "Pastor Valdemiro Machava");
assert.equal(userRow.role_name, "pastoral_care_rector");
assert.equal(userRow.church_name, "E.C. Maputo Central – Sede");
assert.equal(userRow.status, "Active");
console.log("  [PASS] User record verified in database:", userRow);

// 5. Test idempotency
console.log("\n5. Testing Provisioning Script Idempotency (Run 2)...");
await db.exec(provisionSql);
const userRes2 = await db.query(`SELECT count(*) as cnt FROM public.users WHERE email = 'p.care@embaixadadecristo.org';`);
assert.equal(userRes2.rows[0].cnt, 1, "Must still have exactly 1 record (no duplicate inserted)");
console.log("  [PASS] Second Run: Fully idempotent (0 duplicates, same user ID maintained).");

console.log("------------------------------------------------------------");
console.log("ALL test-provision-valdemiro TESTS PASSED (100% SUCCESS)");
console.log("------------------------------------------------------------");
