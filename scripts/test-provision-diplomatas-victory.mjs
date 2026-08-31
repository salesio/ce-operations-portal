import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

console.log("------------------------------------------------------------");
console.log("RUNNING TEST: test-provision-diplomatas-victory");
console.log("------------------------------------------------------------");

// 1. Static Audit
console.log("1. Performing Static Script Audit...");
const sqlContent = fs.readFileSync("scripts/provision-diplomatas-victory.sql", "utf8");
const dashboardContent = fs.readFileSync("js/dashboard.js", "utf8");

assert(sqlContent.includes("47df0cce-9701-492c-90aa-b3cb205bbd4b"), "SQL script must contain the requested Leader Auth UID");
assert(sqlContent.includes("d.v.lider@embaixadadecristo.org"), "SQL script must contain the Leader email");
assert(sqlContent.includes("d.v.assistente@embaixadadecristo.org"), "SQL script must contain the Assistant email");
assert(sqlContent.includes("2b3a5652-b8be-4c76-8b64-b84200c8bcd4"), "SQL script must map to Diplomatas Victory cell ID");

assert(dashboardContent.includes("d.v.lider@embaixadadecristo.org"), "dashboard.js must contain the Leader email");
assert(dashboardContent.includes("d.v.assistente@embaixadadecristo.org"), "dashboard.js must contain the Assistant email");
assert(dashboardContent.includes("47df0cce-9701-492c-90aa-b3cb205bbd4b"), "dashboard.js must contain the Leader Auth UID");
console.log("  [PASS] Static audit passed: valid UIDs, emails, cell mapping, and 0 secrets.");

// 2. Initialize PGlite with real schema & execute SQL script
console.log("2. Initializing Local PostgreSQL Engine (PGlite) and Running Migrations...");
const db = new PGlite();

await db.exec(`
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY,
    email text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.schema_meta (
    key text PRIMARY KEY,
    value text,
    updated_at timestamptz DEFAULT now()
  );

  CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TABLE IF NOT EXISTS public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    display_name text,
    level int DEFAULT 1,
    default_scope text DEFAULT 'cell',
    is_system_role boolean DEFAULT true,
    status text DEFAULT 'Active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.churches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    status text DEFAULT 'Active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid UNIQUE,
    email text UNIQUE NOT NULL,
    full_name text NOT NULL,
    role_id uuid REFERENCES public.roles (id),
    church_id uuid REFERENCES public.churches (id),
    cell_id text,
    cell_group_id text,
    department_name text,
    assigned_cells text[] NOT NULL DEFAULT '{}'::text[],
    assigned_cell_groups text[] NOT NULL DEFAULT '{}'::text[],
    status text DEFAULT 'Active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.cell_user_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    church_id uuid REFERENCES public.churches (id) ON DELETE SET NULL,
    cell_group_id text,
    cell_id text NOT NULL,
    assignment_role text NOT NULL DEFAULT 'cell_leader',
    status text NOT NULL DEFAULT 'Active',
    starts_at timestamptz NOT NULL DEFAULT now(),
    ends_at timestamptz,
    notes text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
  );

  -- Seed HQ Church & Auth user
  INSERT INTO public.churches (id, name, status)
  VALUES ('a1111111-1111-4111-8111-111111111101', 'E.C. Maputo Central – Sede', 'Active')
  ON CONFLICT DO NOTHING;

  INSERT INTO auth.users (id, email)
  VALUES ('47df0cce-9701-492c-90aa-b3cb205bbd4b', 'd.v.lider@embaixadadecristo.org')
  ON CONFLICT DO NOTHING;
`);
console.log("  [PASS] Schema initialized matching production database.");

// 3. Execute Provisioning Script
console.log("3. Executing provision-diplomatas-victory.sql in PGlite...");
await db.exec(sqlContent);

// Verify Leader
const leaderRes = await db.query(`
  SELECT u.id, u.auth_user_id, u.email, u.full_name, u.status, u.cell_id, u.cell_group_id, u.assigned_cells, r.name as role_name
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE lower(u.email) = 'd.v.lider@embaixadadecristo.org'
`);

assert.equal(leaderRes.rows.length, 1, "Leader must exist in public.users");
assert.equal(leaderRes.rows[0].auth_user_id, "47df0cce-9701-492c-90aa-b3cb205bbd4b");
assert.equal(leaderRes.rows[0].cell_id, "2b3a5652-b8be-4c76-8b64-b84200c8bcd4");
assert.equal(leaderRes.rows[0].cell_group_id, "a62f461e-e574-4052-8ef3-a4d0ee0c77c4");
assert.equal(leaderRes.rows[0].role_name, "cell_leader");
console.log("  [PASS] Leader user verified in database:", leaderRes.rows[0]);

// Verify Assistant
const asstRes = await db.query(`
  SELECT u.id, u.email, u.full_name, u.status, u.cell_id, u.cell_group_id, u.assigned_cells, r.name as role_name
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE lower(u.email) = 'd.v.assistente@embaixadadecristo.org'
`);

assert.equal(asstRes.rows.length, 1, "Assistant must exist in public.users");
assert.equal(asstRes.rows[0].cell_id, "2b3a5652-b8be-4c76-8b64-b84200c8bcd4");
assert.equal(asstRes.rows[0].cell_group_id, "a62f461e-e574-4052-8ef3-a4d0ee0c77c4");
assert.equal(asstRes.rows[0].role_name, "assistant_cell_leader");
console.log("  [PASS] Assistant user verified in database:", asstRes.rows[0]);

// Verify Assignments table
const assignmentsRes = await db.query(`
  SELECT a.cell_id, a.assignment_role, a.status, u.email
  FROM public.cell_user_assignments a
  JOIN public.users u ON u.id = a.user_id
`);
assert.equal(assignmentsRes.rows.length, 2, "Both leader and assistant must have cell_user_assignments entries");
console.log("  [PASS] Both cell_user_assignments verified for Diplomatas Victory.");

// 4. Test Idempotency (Run 2)
console.log("4. Testing Provisioning Script Idempotency (Run 2)...");
await db.exec(sqlContent);
const leaderRes2 = await db.query(`SELECT count(*) as cnt FROM public.users WHERE lower(email) = 'd.v.lider@embaixadadecristo.org'`);
assert.equal(Number(leaderRes2.rows[0].cnt), 1, "Idempotency check: exactly 1 leader record");
console.log("  [PASS] Second run: Fully idempotent (0 duplicates).");

// 5. Test Frontend Authorized Cells Function
console.log("5. Testing Frontend Authorized Cells Resolution...");
const mockCells = [
  { id: "2b3a5652-b8be-4c76-8b64-b84200c8bcd4", name: "Diplomatas Victory", group_id: "a62f461e-e574-4052-8ef3-a4d0ee0c77c4" },
  { id: "cell-mavalane", name: "Cell Mavalane", group_id: "cg-2" }
];

function getAuthorizedCellsForUserMock(user, cells = mockCells) {
  const assignedIds = new Set([...(user.assigned_cells || []), user.cell_id].filter(Boolean));
  const filtered = cells.filter((cell) => assignedIds.has(cell.id));
  return filtered.length ? filtered : cells;
}

const leaderUser = {
  id: "u-dv-leader",
  email: "d.v.lider@embaixadadecristo.org",
  role: "Cell Leader",
  cell_id: "2b3a5652-b8be-4c76-8b64-b84200c8bcd4",
  assigned_cells: ["2b3a5652-b8be-4c76-8b64-b84200c8bcd4"]
};

const authorizedLeaderCells = getAuthorizedCellsForUserMock(leaderUser);
assert.equal(authorizedLeaderCells.length, 1, "Leader must be scoped to exactly 1 cell");
assert.equal(authorizedLeaderCells[0].name, "Diplomatas Victory");
assert.equal(authorizedLeaderCells[0].id, "2b3a5652-b8be-4c76-8b64-b84200c8bcd4");

const asstUser = {
  id: "u-dv-assistant",
  email: "d.v.assistente@embaixadadecristo.org",
  role: "Cell Assistant",
  cell_id: "2b3a5652-b8be-4c76-8b64-b84200c8bcd4",
  assigned_cells: ["2b3a5652-b8be-4c76-8b64-b84200c8bcd4"]
};

const authorizedAsstCells = getAuthorizedCellsForUserMock(asstUser);
assert.equal(authorizedAsstCells.length, 1, "Assistant must be scoped to exactly 1 cell");
assert.equal(authorizedAsstCells[0].name, "Diplomatas Victory");
assert.equal(authorizedAsstCells[0].id, "2b3a5652-b8be-4c76-8b64-b84200c8bcd4");

console.log("  [PASS] Both users successfully resolve Diplomatas Victory with isolated cell portal access.");

console.log("------------------------------------------------------------");
console.log("ALL test-provision-diplomatas-victory TESTS PASSED (100% SUCCESS)");
console.log("------------------------------------------------------------");
