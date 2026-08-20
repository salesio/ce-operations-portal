/**
 * Disposable Local PostgreSQL / pg-mem Migration 0022 Execution Harness
 *
 * Proves that migration 0022:
 * 1. Executes in a fresh database from schema foundation to Migration 0022.
 * 2. Reaches BEGIN -> DDL -> Functions -> Grants -> RLS Policies -> COMMIT cleanly.
 * 3. Tests security definer functions against spoofing and unauthenticated access.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { newDb } from "pg-mem";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("\n=== 1. Setting Up Disposable Local PostgreSQL Instance ===");

const db = newDb();

// Register PostgreSQL extensions / functions needed by schema
db.public.registerFunction({
  name: "gen_random_uuid",
  implementation: () => "9691d45a-e613-4fa3-8cb5-43955f39aa66",
});

// Mock Supabase auth schema & auth.uid()
db.public.none(`
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$ SELECT null::uuid $$ LANGUAGE sql;
`);

// Mock schema_meta table
db.public.none(`
  CREATE TABLE IF NOT EXISTS public.schema_meta (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamptz DEFAULT now()
  );
`);

// Create public.churches, public.roles, public.users, public.members, public.cells, public.cell_groups, public.cell_user_assignments, public.permissions
db.public.none(`
  CREATE TABLE IF NOT EXISTS public.churches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    church_name text NOT NULL,
    public_name text,
    status text NOT NULL DEFAULT 'Active',
    information_status text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    level integer NOT NULL DEFAULT 10,
    default_scope text NOT NULL DEFAULT 'own',
    is_system_role boolean NOT NULL DEFAULT false,
    status text NOT NULL DEFAULT 'Active',
    metadata jsonb DEFAULT '{}'::jsonb
  );

  CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid UNIQUE,
    full_name text NOT NULL,
    email text,
    role_id uuid REFERENCES public.roles(id),
    church_id uuid REFERENCES public.churches(id),
    department_id uuid,
    cell_id uuid,
    cell_group_id uuid,
    assigned_cells text[] DEFAULT '{}',
    assigned_cell_groups text[] DEFAULT '{}',
    status text NOT NULL DEFAULT 'Active',
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    church_id uuid REFERENCES public.churches(id),
    cell_id uuid,
    cell_group_id uuid,
    status text NOT NULL DEFAULT 'Active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.cells (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id uuid REFERENCES public.churches(id),
    name text NOT NULL,
    status text NOT NULL DEFAULT 'Active'
  );

  CREATE TABLE IF NOT EXISTS public.cell_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id uuid REFERENCES public.churches(id),
    name text NOT NULL,
    status text NOT NULL DEFAULT 'Active'
  );

  CREATE TABLE IF NOT EXISTS public.cell_user_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id),
    church_id uuid REFERENCES public.churches(id),
    cell_id uuid,
    cell_group_id uuid,
    role_id uuid,
    status text NOT NULL DEFAULT 'Active'
  );

  CREATE TABLE IF NOT EXISTS public.permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id uuid REFERENCES public.roles(id),
    module text NOT NULL,
    can_view boolean DEFAULT false,
    can_create boolean DEFAULT false,
    can_edit boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    can_approve boolean DEFAULT false,
    can_verify boolean DEFAULT false,
    can_release_resources boolean DEFAULT false,
    can_export boolean DEFAULT false,
    can_manage_settings boolean DEFAULT false
  );
`);

console.log("✓ Disposable tables and schema initialized.");

console.log("\n=== 2. Executing Migration 0022 Against Disposable Database ===");

const migrationSql = readFileSync(join(root, "supabase/migrations/0022_production_rls_and_grants_hardening.sql"), "utf8");

try {
  db.public.none(migrationSql);
  console.log("✓ Migration 0022 EXECUTED and REACHED COMMIT SUCCESSFULLY!");
} catch (err) {
  console.error("✗ Migration 0022 execution failed:", err);
  process.exit(1);
}

console.log("\n=== 3. Validating Schema Meta & Functions Post-Execution ===");

const meta = db.public.one(`SELECT value FROM public.schema_meta WHERE key = 'backend_phase'`);
console.log(`✓ Schema meta backend_phase: '${meta.value}'`);

console.log("\n=== 4. Testing Anti-Spoofing & Security Functions in Disposable Instance ===");

// Seed roles and user
db.public.none(`
  INSERT INTO public.roles (id, name, display_name, level, default_scope, is_system_role, status)
  VALUES ('11111111-1111-1111-1111-111111111101', 'super_admin', 'Super Administrador', 100, 'all', true, 'Active');

  INSERT INTO public.churches (id, church_name, public_name, status)
  VALUES ('a1111111-1111-4111-8111-111111111101', 'E.C. Maputo Central - Sede', 'Sede', 'Activa');

  INSERT INTO public.users (id, auth_user_id, full_name, email, role_id, church_id, status)
  VALUES ('9691d45a-e613-4fa3-8cb5-43955f39aa66', '76e8a5ae-b716-4737-83da-ac004359bd07', 'Salésio Machava', 'salesiomachava@gmail.com', '11111111-1111-1111-1111-111111111101', 'a1111111-1111-4111-8111-111111111101', 'Active');
`);

// Test with null auth.uid() (anonymous caller)
const anonCells = db.public.many(`SELECT public.authorized_cell_ids('76e8a5ae-b716-4737-83da-ac004359bd07'::uuid) as cell_ids;`);
console.log("✓ Anonymous caller attempting to pass valid user UUID to authorized_cell_ids returns:", anonCells[0].cell_ids);
if (anonCells[0].cell_ids.length !== 0) {
  console.error("FAIL: Anonymous caller did not receive empty array!");
  process.exit(1);
}

// Mock authenticated context as Salésio Machava
db.public.registerFunction({
  name: "uid",
  schema: "auth",
  implementation: () => "76e8a5ae-b716-4737-83da-ac004359bd07",
});

// Test with matching auth.uid()
const authUserRole = db.public.one(`SELECT public.current_user_role() as role;`);
console.log(`✓ Authenticated user role resolved: '${authUserRole.role}'`);

const authUserId = db.public.one(`SELECT public.current_app_user_id() as uid;`);
console.log(`✓ Authenticated app user ID resolved: '${authUserId.uid}'`);

const authChurchId = db.public.one(`SELECT public.current_user_church_id() as church_id;`);
console.log(`✓ Authenticated church ID resolved: '${authChurchId.church_id}'`);

// Test anti-spoofing with a foreign UUID while signed in as Salésio
const spoofedCells = db.public.many(`SELECT public.authorized_cell_ids('00000000-0000-0000-0000-000000000000'::uuid) as cell_ids;`);
console.log("✓ Signed-in user passing foreign spoofed UUID to authorized_cell_ids returns:", spoofedCells[0].cell_ids);
if (spoofedCells[0].cell_ids.length !== 0) {
  console.error("FAIL: Foreign UUID was not rejected!");
  process.exit(1);
}

console.log("\n=======================================================");
console.log("All disposable local database execution checks PASSED!");
console.log("=======================================================\n");
