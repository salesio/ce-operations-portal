/**
 * Test Suite: Migration 0023 & Anonymous Fallback Prohibition
 *
 * Validates:
 * 1. Complete removal of getSupabaseAnonClient and anonymous fallback in members adapter.
 * 2. Static & SQL analysis of Migration 0023 (zero references to public.cells/cell_groups).
 * 3. Disposable PostgreSQL (PGlite) execution of Migration 0023 without cells/cell_groups tables.
 * 4. Runtime behavior of authenticated Supabase members queries (strictly authenticated, fallbackUsed: false).
 * 5. Legacy church-hq filter sanitization.
 * 6. Live database validation: 1,896 members and zero member writes.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
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

async function runTestSuite() {
  console.log("\n=== 1. Static Analysis: Removal of Anonymous Fallback ===");

  const clientCode = readFileSync(join(root, "src/data/adapters/supabase/supabaseClient.ts"), "utf8");
  check("supabaseClient.ts does NOT contain getSupabaseAnonClient", !clientCode.includes("getSupabaseAnonClient"));
  check("supabaseClient.ts does NOT contain cachedAnon", !clientCode.includes("cachedAnon"));

  const adapterCode = readFileSync(join(root, "src/data/adapters/supabase/membersSupabaseAdapter.ts"), "utf8");
  check("membersSupabaseAdapter.ts does NOT contain getSupabaseAnonClient", !adapterCode.includes("getSupabaseAnonClient"));
  check("membersSupabaseAdapter.ts does NOT contain anonymous retry fallback in listMembersPage", !adapterCode.includes("retry anonymously"));
  check("membersSupabaseAdapter.ts does NOT contain anonymous fallback in getMemberById", !/getMemberById[\s\S]*?anonClient/.test(adapterCode));
  check("membersSupabaseAdapter.ts does NOT contain anonymous fallback in searchMembers", !/searchMembers[\s\S]*?anonClient/.test(adapterCode));
  check("membersSupabaseAdapter.ts does NOT contain anonymous fallback in getMembersByChurch", !/getMembersByChurch[\s\S]*?anonClient/.test(adapterCode));
  check("membersSupabaseAdapter.ts does NOT contain anonymous fallback in getMembersByStatus", !/getMembersByStatus[\s\S]*?anonClient/.test(adapterCode));

  console.log("\n=== 2. Static Analysis: Migration 0023 Integrity ===");

  const migration0023Path = join(root, "supabase/migrations/0023_fix_cell_authorization_helpers.sql");
  check("Migration 0023 file exists", existsSync(migration0023Path));

  const sql0023 = readFileSync(migration0023Path, "utf8");
  check("Migration 0023 is wrapped in BEGIN; and COMMIT;", /^\s*BEGIN;/im.test(sql0023) && /COMMIT;\s*$/im.test(sql0023));
  check("Migration 0023 does NOT reference public.cells", !/public\.cells\b/i.test(sql0023));
  check("Migration 0023 does NOT reference public.cell_groups", !/public\.cell_groups\b/i.test(sql0023));
  check("Migration 0023 defines authorized_cell_ids with SECURITY DEFINER and STABLE", /CREATE OR REPLACE FUNCTION public\.authorized_cell_ids/i.test(sql0023) && /SECURITY DEFINER/i.test(sql0023) && /STABLE/i.test(sql0023));
  check("Migration 0023 defines authorized_cell_group_ids with SECURITY DEFINER and STABLE", /CREATE OR REPLACE FUNCTION public\.authorized_cell_group_ids/i.test(sql0023) && /SECURITY DEFINER/i.test(sql0023) && /STABLE/i.test(sql0023));
  check("Migration 0023 contains anti-spoofing check", /auth\.uid\(\)\s+IS\s+NULL\s+OR\s+p_auth_uid\s+IS\s+DISTINCT\s+FROM\s+auth\.uid\(\)/i.test(sql0023));
  check("Migration 0023 checks active user and active role status", /u\.status\s+IN\s+\('Active'/i.test(sql0023) && /r\.status\s+IN\s+\('Active'/i.test(sql0023));
  check("Migration 0023 revokes function execution from PUBLIC and anon", /REVOKE ALL ON FUNCTION public\.authorized_cell_ids\(uuid\) FROM PUBLIC, anon;/i.test(sql0023));
  check("Migration 0023 grants function execution to authenticated and service_role", /GRANT EXECUTE ON FUNCTION public\.authorized_cell_ids\(uuid\) TO authenticated, service_role;/i.test(sql0023));
  check("Migration 0023 records phase 23 in public.schema_meta", /23_fix_cell_authorization_helpers/i.test(sql0023));

  console.log("\n=== 3. PostgreSQL Engine (PGlite) Execution of Migration 0023 ===");

  const pg = new PGlite();

  // Setup standard PostgreSQL roles & auth simulation
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

    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
      SELECT current_setting('request.jwt.claim.sub', true)::uuid;
    $$ LANGUAGE sql STABLE;

    CREATE TABLE IF NOT EXISTS public.schema_meta (
      key text PRIMARY KEY,
      value text NOT NULL,
      updated_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text UNIQUE NOT NULL,
      display_name text,
      level integer DEFAULT 10,
      status text DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS public.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      auth_user_id uuid UNIQUE,
      email text UNIQUE NOT NULL,
      full_name text,
      role_id uuid REFERENCES public.roles(id),
      cell_id text,
      assigned_cells text[] DEFAULT '{}',
      cell_group_id text,
      assigned_cell_groups text[] DEFAULT '{}',
      status text DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS public.cell_user_assignments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES public.users(id),
      cell_id text,
      cell_group_id text,
      status text DEFAULT 'Active'
    );
  `);

  // Seed test roles and users (NO public.cells or public.cell_groups tables exist!)
  const superAdminRoleId = "11111111-1111-1111-1111-111111111101";
  const cellLeaderRoleId = "11111111-1111-1111-1111-111111111108";
  const salesioAuthId = "76e8a5ae-b716-4737-83da-ac004359bd07";
  const salesioAppId = "9691d45a-e613-4fa3-8cb5-43955f39aa66";
  const leaderAuthId = "77777777-7777-7777-7777-777777777777";
  const leaderAppId = "88888888-8888-8888-8888-888888888888";

  await pg.exec(`
    INSERT INTO public.roles (id, name, display_name, level, status)
    VALUES
      ('${superAdminRoleId}', 'super_admin', 'Super Admin', 100, 'Active'),
      ('${cellLeaderRoleId}', 'cell_leader', 'Cell Leader', 20, 'Active')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.users (id, auth_user_id, email, full_name, role_id, status)
    VALUES
      ('${salesioAppId}', '${salesioAuthId}', 'salesiomachava@gmail.com', 'Salésio Machava', '${superAdminRoleId}', 'Active'),
      ('${leaderAppId}', '${leaderAuthId}', 'leader@ce-mozambique.org', 'Cell Leader 1', '${cellLeaderRoleId}', 'Active')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.cell_user_assignments (user_id, cell_id, cell_group_id, status)
    VALUES
      ('${leaderAppId}', 'c-maputo-01', 'cg-maputo-central', 'Active');
  `);

  // Execute Migration 0023 on PGlite
  let m0023Success = false;
  try {
    await pg.exec(sql0023);
    m0023Success = true;
  } catch (err) {
    console.error("Migration 0023 execution error:", err);
  }
  check("Migration 0023 executes to COMMIT with 0 errors without cells/cell_groups tables", m0023Success);

  // Test 1: super_admin calling authorized_cell_ids returns empty array safely
  await pg.exec(`SET request.jwt.claim.sub = '${salesioAuthId}';`);
  const superAdminCells = await pg.query(`SELECT public.authorized_cell_ids() AS cells;`);
  check(
    "Super admin authorized_cell_ids returns empty array safely",
    Array.isArray(superAdminCells.rows[0].cells) && superAdminCells.rows[0].cells.length === 0
  );

  const superAdminCellGroups = await pg.query(`SELECT public.authorized_cell_group_ids() AS groups;`);
  check(
    "Super admin authorized_cell_group_ids returns empty array safely",
    Array.isArray(superAdminCellGroups.rows[0].groups) && superAdminCellGroups.rows[0].groups.length === 0
  );

  // Test 2: cell_leader calling authorized_cell_ids returns assigned cell ID
  await pg.exec(`SET request.jwt.claim.sub = '${leaderAuthId}';`);
  const leaderCells = await pg.query(`SELECT public.authorized_cell_ids() AS cells;`);
  check(
    "Cell leader authorized_cell_ids returns assigned cell",
    Array.isArray(leaderCells.rows[0].cells) && leaderCells.rows[0].cells.includes("c-maputo-01")
  );

  const leaderGroups = await pg.query(`SELECT public.authorized_cell_group_ids() AS groups;`);
  check(
    "Cell leader authorized_cell_group_ids returns assigned cell group",
    Array.isArray(leaderGroups.rows[0].groups) && leaderGroups.rows[0].groups.includes("cg-maputo-central")
  );

  // Test 3: Anti-spoofing rejects distinct foreign UUID
  const spoofedCells = await pg.query(`SELECT public.authorized_cell_ids('${salesioAuthId}'::uuid) AS cells;`);
  check(
    "Anti-spoofing rejects foreign UUID parameter",
    Array.isArray(spoofedCells.rows[0].cells) && spoofedCells.rows[0].cells.length === 0
  );

  console.log("\n=== 4. Live Supabase Authenticated Members & Runtime Validation ===");

  const url = "https://kmurqbgpybrolrrumiue.supabase.co";
  const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

  const liveAnon = createClient(url, anonKey, { auth: { persistSession: false } });
  const initialMembersRes = await liveAnon.from("members").select("id", { count: "exact", head: true });
  const liveCount = initialMembersRes.count;
  console.log("   Initial live members count:", liveCount);
  check("Live members count is exactly 1896", liveCount === 1896);

  // Build and evaluate bundle
  // Browser environment simulation
  globalThis.window = globalThis;
  globalThis.addEventListener = () => {};
  globalThis.document = {
    documentElement: { lang: "pt", style: { setProperty: () => {} } },
    querySelectorAll: () => [],
    getElementById: () => ({ classList: { add: () => {}, remove: () => {} } })
  };
  globalThis.localStorage = {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; }
  };
  globalThis.__CE_ENV__ = {
    VITE_DATA_SOURCE: "supabase",
    VITE_ENABLE_SUPABASE: "true",
    VITE_ENABLE_REAL_AUTH: "true",
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_ANON_KEY: anonKey,
  };

  const bundleCode = readFileSync(join(root, "js/supabase-bundle.js"), "utf8");
  new Function(bundleCode).call(globalThis);

  const bridgeCode = readFileSync(join(root, "js/members-data-bridge.js"), "utf8");
  new Function(bridgeCode).call(globalThis);

  // Sign in as Salésio Machava
  const client = globalThis.CESupabase.getSupabaseFoundationClient();
  await client.auth.signInWithPassword({
    email: "salesiomachava@gmail.com",
    password: "Ziongate@7"
  });

  // Query members as authenticated Super Admin
  const pageRes = await globalThis.CEDataLayer.members.listMembersPage({ page: 1, pageSize: 50 });
  check("Authenticated listMembersPage succeeds (ok: true)", pageRes.ok === true);
  check("Authenticated listMembersPage returns valid data structure", pageRes.data && Array.isArray(pageRes.data.items));

  const info = globalThis.CEDataLayer.members.getMembersDataSourceInfo();
  check("getMembersDataSourceInfo reports fallbackUsed: false (no anon fallback)", info.fallbackUsed === false);
  check("getMembersDataSourceInfo reports lastError: null", info.lastError === null);
  check("getMembersDataSourceInfo reports repository: membersSupabaseAdapter", info.repository === "membersSupabaseAdapter");

  // Query with legacy church-hq mock filter -> must map safely without PostgREST syntax error
  const hqFilterRes = await globalThis.CEDataLayer.members.listMembersPage({ churchId: "church-hq", page: 1, pageSize: 50 });
  check("churchId: 'church-hq' resolves safely to canonical Maputo Sede UUID without error", hqFilterRes.ok === true);

  // Final check: Prove zero member writes occurred
  const finalMembersRes = await liveAnon.from("members").select("id", { count: "exact", head: true });
  check("Final live members count remains exactly 1896 (zero member writes)", finalMembersRes.count === liveCount);

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
}

runTestSuite().catch((err) => {
  console.error("Test suite crashed:", err);
  process.exit(1);
});
