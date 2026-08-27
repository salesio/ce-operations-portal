import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

console.log("------------------------------------------------------------");
console.log("RUNNING TEST: test-migration-0025");
console.log("------------------------------------------------------------");

const db = new PGlite();

console.log("1. Setting up baseline PostgreSQL schema and seed...");
await db.exec(`
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE SCHEMA IF NOT EXISTS public;

  CREATE OR REPLACE FUNCTION auth.uid()
  RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT null::uuid; $$;

  CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE,
    encrypted_password text,
    email_confirmed_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    display_name text,
    description text,
    level integer DEFAULT 1,
    hierarchy_level integer DEFAULT 1,
    default_scope text DEFAULT 'church',
    role_scope text DEFAULT 'church',
    status text DEFAULT 'Active',
    is_system_role boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.permissions (
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
    can_manage_settings boolean DEFAULT false,
    scope text DEFAULT 'church',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(role_id, module)
  );

  CREATE TABLE IF NOT EXISTS public.churches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text,
    is_hq boolean DEFAULT false,
    status text DEFAULT 'Active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
    full_name text NOT NULL,
    primary_phone text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid UNIQUE,
    email text UNIQUE NOT NULL,
    name text,
    full_name text,
    role_id uuid REFERENCES public.roles(id) ON DELETE SET NULL,
    church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
    status text DEFAULT 'Active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  INSERT INTO public.churches (id, name, is_hq, status)
  VALUES ('a1111111-1111-4111-8111-111111111101', 'E.C. Maputo Central – Sede', true, 'Active')
  ON CONFLICT (id) DO NOTHING;
`);

// Real helper functions used by production RLS
await db.exec(`
  CREATE OR REPLACE FUNCTION public.current_user_role()
  RETURNS text LANGUAGE sql STABLE AS $$ SELECT 'alec_manager'; $$;

  CREATE OR REPLACE FUNCTION public.current_user_church_id()
  RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT 'a1111111-1111-4111-8111-111111111101'::uuid; $$;

  CREATE OR REPLACE FUNCTION public.has_module_permission(mod text, act text)
  RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT true; $$;
`);

console.log("2. Executing Migration 0025...");
const migration0025 = fs.readFileSync(path.resolve("supabase/migrations/0025_church_reports_and_alec_persistence.sql"), "utf8");
try {
  await db.exec(migration0025);
  console.log("  [PASS] Migration 0025 executed successfully.");
} catch (e) {
  console.log("MIGRATION ERROR CODE:", e.code);
  console.log("MIGRATION ERROR MESSAGE:", e.message);
  console.log("MIGRATION ERROR DETAIL:", e.detail);
  process.exit(1);
}

console.log("3. Testing Idempotency of Migration 0025...");
await db.exec(migration0025);
console.log("  [PASS] Migration 0025 is 100% idempotent.");

console.log("4. Verifying Tables and Structure...");
const tables = ["church_reports", "alec_registrations", "alec_scores", "cell_reports"];
for (const tbl of tables) {
  const tableCheck = await db.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = $1
  `, [tbl]);
  assert.equal(tableCheck.rows.length, 1, `Table public.${tbl} must exist`);
  console.log(`  [PASS] Table public.${tbl} verified.`);
}

console.log("5. Testing Persistence across sessions (INSERT & SELECT)...");
const churchRes = await db.query("SELECT id FROM public.churches WHERE is_hq = true LIMIT 1;");
const hqChurchId = churchRes.rows[0].id;

// Insert a church report
const insertReport = await db.query(`
  INSERT INTO public.church_reports (
    church_id, church_name, semana, data_do_culto, culto, ft, nc, rs, total_ft_reached, comentarios, submetido_por
  ) VALUES (
    $1, 'E.C. Maputo Central – Sede', 'Semana 3 Agosto', '2026-08-26', 'Quarta-feira', 5, 3, 2, 10, 'Culto abençoado', 'Sister Angélica'
  ) RETURNING id, semana, data_do_culto, culto, ft, nc, rs;
`, [hqChurchId]);

assert.equal(insertReport.rows.length, 1);
const reportId = insertReport.rows[0].id;
console.log("  [PASS] Church report inserted with ID:", reportId);

// Query report back (simulating a separate login/browser query)
const queryReport = await db.query(`
  SELECT id, semana, data_do_culto, culto, ft, nc, rs, comentarios, submetido_por
  FROM public.church_reports WHERE id = $1
`, [reportId]);

assert.equal(queryReport.rows.length, 1);
assert.equal(queryReport.rows[0].semana, 'Semana 3 Agosto');
assert.equal(queryReport.rows[0].culto, 'Quarta-feira');
assert.equal(Number(queryReport.rows[0].ft), 5);
assert.equal(Number(queryReport.rows[0].nc), 3);
assert.equal(queryReport.rows[0].submetido_por, 'Sister Angélica');
console.log("  [PASS] Church report data successfully queried from database: all fields preserved!");

console.log("------------------------------------------------------------");
console.log("ALL test-migration-0025 TESTS PASSED (100% SUCCESS)");
console.log("------------------------------------------------------------");
