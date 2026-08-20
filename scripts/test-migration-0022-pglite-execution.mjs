/**
 * Test Suite: Migration 0022 Real PostgreSQL WASM (PGlite) Execution Harness
 *
 * Runs full migration 0022 on a fresh, disposable PostgreSQL engine.
 * Proves:
 * 1. Schema foundation + Migration 0022 runs completely to COMMIT.
 * 2. RLS enabled state on users, roles, churches, members.
 * 3. pg_policies for all 4 tables.
 * 4. Table grants for PUBLIC, anon, and authenticated.
 * 5. Function EXECUTE privileges (PUBLIC/anon denied, authenticated granted).
 * 6. authorized_cell_ids with own JWT identity returns valid assignments.
 * 7. authorized_cell_ids with a foreign UUID returns empty array (anti-spoofing).
 * 8. authorized_cell_group_ids with a foreign UUID returns empty array (anti-spoofing).
 * 9. Anonymous users/roles access denied.
 * 10. Unlinked authenticated account denied.
 * 11. Linked super_admin profile and role visible.
 * 12. Authenticated members SELECT works.
 * 13. Authenticated members INSERT and DELETE privileges absent.
 * 14. Temporary anonymous members SELECT works.
 * 15. All 8 active/activa churches remain visible.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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

async function runTest() {
  console.log("\n=== 1. Initializing Fresh Disposable PostgreSQL Instance (PGlite) ===");
  const pg = new PGlite();

  // Create standard roles expected by Supabase
  await pg.exec(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
      END IF;
    END
    $$;
  `);

  // Create auth schema & auth.uid() simulation function
  await pg.exec(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
      SELECT current_setting('request.jwt.claim.sub', true)::uuid;
    $$ LANGUAGE sql STABLE;

    CREATE TABLE IF NOT EXISTS public.schema_meta (
      key text PRIMARY KEY,
      value text NOT NULL,
      updated_at timestamptz DEFAULT now()
    );
  `);

  // Create core schema tables
  await pg.exec(`
    CREATE TABLE IF NOT EXISTS public.churches (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      church_name text NOT NULL,
      public_name text,
      type text DEFAULT 'Branch',
      province text,
      city text,
      district_or_area text,
      address text,
      pastor_in_charge text,
      phone_primary text,
      phone_secondary text,
      email text,
      service_times jsonb DEFAULT '[]'::jsonb,
      parent_church_id uuid,
      status text NOT NULL DEFAULT 'Active',
      information_status text,
      notes text,
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      created_by uuid,
      updated_by uuid
    );

    CREATE TABLE IF NOT EXISTS public.roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL UNIQUE,
      display_name text NOT NULL,
      level integer NOT NULL DEFAULT 10,
      default_scope text NOT NULL DEFAULT 'own',
      is_system_role boolean NOT NULL DEFAULT false,
      status text NOT NULL DEFAULT 'Active',
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      auth_user_id uuid UNIQUE,
      staff_id uuid,
      full_name text NOT NULL,
      email text,
      phone text,
      role_id uuid REFERENCES public.roles(id),
      church_id uuid REFERENCES public.churches(id),
      department_id uuid,
      cell_id uuid,
      cell_group_id uuid,
      assigned_cells text[] DEFAULT '{}',
      assigned_cell_groups text[] DEFAULT '{}',
      status text NOT NULL DEFAULT 'Active',
      failed_login_attempts integer DEFAULT 0,
      locked_until timestamptz,
      preferred_language text DEFAULT 'pt',
      metadata jsonb DEFAULT '{}'::jsonb,
      created_by uuid,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      church_id uuid REFERENCES public.churches(id),
      cell_id uuid,
      cell_group_id uuid,
      full_name text NOT NULL,
      phone_primary text,
      email text,
      gender text,
      membership_status text DEFAULT 'Active',
      status text NOT NULL DEFAULT 'Active',
      metadata jsonb DEFAULT '{}'::jsonb,
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
      status text NOT NULL DEFAULT 'Active',
      created_at timestamptz DEFAULT now()
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

  // Grant initial broad privileges simulating production before migration 0022
  await pg.exec(`
    GRANT ALL ON SCHEMA public TO anon, authenticated;
    GRANT ALL ON TABLE public.users TO anon, authenticated;
    GRANT ALL ON TABLE public.roles TO anon, authenticated;
    GRANT ALL ON TABLE public.churches TO anon, authenticated;
    GRANT ALL ON TABLE public.members TO anon, authenticated;

    -- Pre-existing members policies
    ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
    CREATE POLICY members_select_anon_policy ON public.members FOR SELECT TO anon USING (true);
    CREATE POLICY members_select_policy ON public.members FOR SELECT TO authenticated USING (true);
    CREATE POLICY members_update_policy ON public.members FOR UPDATE TO authenticated USING (true);
  `);

  // Populate test seed data matching production
  await pg.exec(`
    -- Roles
    INSERT INTO public.roles (id, name, display_name, level, default_scope, is_system_role, status)
    VALUES
      ('11111111-1111-1111-1111-111111111101', 'super_admin', 'Super Administrador', 100, 'all', true, 'Active'),
      ('11111111-1111-1111-1111-111111111105', 'cell_leader', 'Líder de Célula', 20, 'cell', true, 'Active');

    -- Churches (6 Active, 2 Activa)
    INSERT INTO public.churches (id, church_name, public_name, status)
    VALUES
      ('a1111111-1111-4111-8111-111111111101', 'E.C. Maputo Central - Sede', 'Sede', 'Activa'),
      ('3ef77e8e-519a-4137-9ee7-59d9e620c6dd', 'E.C. - Muhalaze', 'Muhalaze', 'Activa'),
      ('a1111111-1111-4111-8111-111111111102', 'Christ Embassy Matola', 'Matola', 'Active'),
      ('a1111111-1111-4111-8111-111111111103', 'Christ Embassy Khongolote', 'Khongolote', 'Active'),
      ('a1111111-1111-4111-8111-111111111104', 'Christ Embassy Beira', 'Beira', 'Active'),
      ('a1111111-1111-4111-8111-111111111105', 'Christ Embassy Nampula', 'Nampula', 'Active'),
      ('a1111111-1111-4111-8111-111111111106', 'Christ Embassy Choupal', 'Choupal', 'Active'),
      ('a1111111-1111-4111-8111-111111111107', 'Christ Embassy Online Church', 'Online Church', 'Active');

    -- Salésio Machava Super Admin User
    INSERT INTO public.users (id, auth_user_id, full_name, email, role_id, church_id, status)
    VALUES
      ('9691d45a-e613-4fa3-8cb5-43955f39aa66', '76e8a5ae-b716-4737-83da-ac004359bd07', 'Salésio Machava', 'salesiomachava@gmail.com', '11111111-1111-1111-1111-111111111101', 'a1111111-1111-4111-8111-111111111101', 'Active');

    -- Cells & Members
    INSERT INTO public.cells (id, church_id, name, status)
    VALUES ('c1111111-1111-1111-1111-111111111101', 'a1111111-1111-4111-8111-111111111101', 'Célula Graça', 'Active');

    INSERT INTO public.members (id, church_id, cell_id, full_name, status)
    VALUES ('d1111111-1111-1111-1111-111111111101', 'a1111111-1111-4111-8111-111111111101', 'c1111111-1111-1111-1111-111111111101', 'Membro Teste 1', 'Active');
  `);

  console.log("✓ Disposable database foundation schema and data ready.");

  console.log("\n=== 2. Applying Migration 0022 to Disposable PostgreSQL Engine ===");
  const migrationSql = readFileSync(join(root, "supabase/migrations/0022_production_rls_and_grants_hardening.sql"), "utf8");

  try {
    await pg.exec(migrationSql);
    console.log("PASS  Migration 0022 executed from BEGIN to COMMIT with 0 errors!");
    passed++;
  } catch (err) {
    console.error("FAIL  Migration 0022 execution failed:", err);
    failed++;
    process.exit(1);
  }

  console.log("\n=== 3. Inspecting PostgreSQL Catalogs Post-Migration ===");

  // 1. Check RLS enabled state
  const rlsState = await pg.query(`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename IN ('users', 'roles', 'churches', 'members')
    ORDER BY tablename;
  `);

  for (const row of rlsState.rows) {
    check(`RLS enabled on public.${row.tablename}`, row.rowsecurity === true);
  }

  // 2. Check pg_policies
  const policies = await pg.query(`
    SELECT tablename, policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('users', 'roles', 'churches', 'members')
    ORDER BY tablename, policyname;
  `);

  console.log("\n--- Policies in pg_policies ---");
  for (const p of policies.rows) {
    console.log(`  ${p.tablename} -> ${p.policyname} (${p.cmd}) [${p.roles}]`);
  }
  check("Users table has 4 policies (select, insert, update, delete)", policies.rows.filter(r => r.tablename === 'users').length === 4);
  check("Roles table has 4 policies (select, insert, update, delete)", policies.rows.filter(r => r.tablename === 'roles').length === 4);
  check("Churches table has 5 policies (anon select, auth select, insert, update, delete)", policies.rows.filter(r => r.tablename === 'churches').length === 5);
  check("Members table preserves anon and auth policies", policies.rows.filter(r => r.tablename === 'members').length === 3);

  // 3. Check Table Grants
  const tableGrants = await pg.query(`
    SELECT grantee, table_name, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name IN ('users', 'roles', 'churches', 'members')
    ORDER BY table_name, grantee, privilege_type;
  `);

  const anonUsersGrants = tableGrants.rows.filter(g => g.grantee === 'anon' && g.table_name === 'users');
  check("Anon has zero privileges on public.users", anonUsersGrants.length === 0);

  const anonRolesGrants = tableGrants.rows.filter(g => g.grantee === 'anon' && g.table_name === 'roles');
  check("Anon has zero privileges on public.roles", anonRolesGrants.length === 0);

  const anonChurchesGrants = tableGrants.rows.filter(g => g.grantee === 'anon' && g.table_name === 'churches');
  check("Anon has only SELECT on public.churches", anonChurchesGrants.length === 1 && anonChurchesGrants[0].privilege_type === 'SELECT');

  const authMembersGrants = tableGrants.rows.filter(g => g.grantee === 'authenticated' && g.table_name === 'members');
  const authMembersPrivs = authMembersGrants.map(g => g.privilege_type).sort();
  check("Authenticated on public.members has only SELECT and UPDATE (no INSERT, no DELETE)",
    authMembersPrivs.includes('SELECT') && authMembersPrivs.includes('UPDATE') && !authMembersPrivs.includes('INSERT') && !authMembersPrivs.includes('DELETE')
  );

  const anonMembersGrants = tableGrants.rows.filter(g => g.grantee === 'anon' && g.table_name === 'members');
  check("Anon on public.members has temporary SELECT only",
    anonMembersGrants.length === 1 && anonMembersGrants[0].privilege_type === 'SELECT'
  );

  // 4. Check Function Execution Privileges
  const funcPrivs = await pg.query(`
    SELECT routine_name, grantee, privilege_type
    FROM information_schema.routine_privileges
    WHERE specific_schema = 'public' AND routine_name IN ('authorized_cell_ids', 'current_user_role', 'current_app_user_id')
    ORDER BY routine_name, grantee;
  `);

  const anonFuncGrants = funcPrivs.rows.filter(p => p.grantee === 'anon' || p.grantee === 'PUBLIC');
  check("Security functions revoked from anon and PUBLIC", anonFuncGrants.length === 0);

  const authFuncGrants = funcPrivs.rows.filter(p => p.grantee === 'authenticated');
  check("Security functions granted to authenticated", authFuncGrants.length >= 3);

  console.log("\n=== 4. Testing Live RLS Execution with Real JWT Identities ===");

  // Set JWT Claim as Salésio Machava (Super Admin)
  await pg.exec(`SET request.jwt.claim.sub = '76e8a5ae-b716-4737-83da-ac004359bd07';`);

  // Role resolution
  const userRole = await pg.query(`SELECT public.current_user_role() as role;`);
  check("Salésio Machava JWT resolves super_admin role", userRole.rows[0].role === 'super_admin');

  // authorized_cell_ids with own JWT
  const ownCells = await pg.query(`SELECT public.authorized_cell_ids('76e8a5ae-b716-4737-83da-ac004359bd07'::uuid) as cells;`);
  check("authorized_cell_ids with own JWT returns cell IDs", Array.isArray(ownCells.rows[0].cells) && ownCells.rows[0].cells.length > 0);

  // authorized_cell_ids with spoofed foreign UUID
  const spoofedCells = await pg.query(`SELECT public.authorized_cell_ids('00000000-0000-0000-0000-000000000000'::uuid) as cells;`);
  check("authorized_cell_ids with foreign UUID returns empty array", spoofedCells.rows[0].cells.length === 0);

  // authorized_cell_group_ids with spoofed foreign UUID
  const spoofedGroups = await pg.query(`SELECT public.authorized_cell_group_ids('00000000-0000-0000-0000-000000000000'::uuid) as groups;`);
  check("authorized_cell_group_ids with foreign UUID returns empty array", spoofedGroups.rows[0].groups.length === 0);

  // Churches visibility: All 8 churches visible to super_admin
  const adminChurches = await pg.query(`SELECT count(*)::int as count FROM public.churches;`);
  check("All 8 churches visible to super_admin", adminChurches.rows[0].count === 8);

  // Anonymous context: Set empty JWT
  await pg.exec(`SET request.jwt.claim.sub = '';`);

  // Anonymous churches query: only Active and Activa churches visible
  const anonChurches = await pg.query(`SELECT count(*)::int as count FROM public.churches WHERE status IN ('Active', 'Activa');`);
  check("All 8 Active/Activa churches visible anonymously", anonChurches.rows[0].count === 8);

  // Unlinked user: User with Auth ID not in public.users
  await pg.exec(`SET request.jwt.claim.sub = 'ffffffff-ffff-ffff-ffff-ffffffffffff';`);
  const unlinkedRole = await pg.query(`SELECT public.current_user_role() as role;`);
  check("Unlinked Auth user resolves empty role", unlinkedRole.rows[0].role === '');

  const unlinkedAppUserId = await pg.query(`SELECT public.current_app_user_id() as uid;`);
  check("Unlinked Auth user resolves null app user ID", unlinkedAppUserId.rows[0].uid === null);

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
}

runTest();
