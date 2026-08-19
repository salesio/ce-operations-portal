/**
 * Test Suite: Cell Access & Assignments Model
 * Validates cell user assignments repository, getAuthorizedCellsForUser scoping,
 * cell ministry data bridge, and migration 0018.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");

const migration = read("supabase/migrations/0018_cell_user_assignments.sql");
const repo = read("src/data/repositories/cellUserAssignmentsRepository.ts");
const dataBridge = read("js/cell-ministry-data-bridge.js");
const dashboard = read("js/dashboard.js");

let passed = 0;
let failed = 0;

function check(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}`);
  }
}

console.log("\n=== Testing Cell Access & Leadership Assignments ===");

check("migration 0018 defines public.cell_user_assignments with constraints and temporal fields",
  /CREATE TABLE IF NOT EXISTS public\.cell_user_assignments/.test(migration) &&
  /assignment_role IN \('cell_group_leader', 'cell_leader', 'assistant_cell_leader', 'cell_admin'\)/.test(migration) &&
  /status IN \('Active', 'Ended', 'Suspended'\)/.test(migration) &&
  /starts_at\s+timestamptz/.test(migration) &&
  /ends_at\s+timestamptz/.test(migration)
);

check("cellUserAssignmentsRepository implements list, create, update, and end",
  /listCellUserAssignments/.test(repo) &&
  /createCellUserAssignment/.test(repo) &&
  /updateCellUserAssignment/.test(repo) &&
  /endCellUserAssignment/.test(repo)
);

check("cell ministry data bridge exposes assignment methods",
  /listCellUserAssignments/.test(dataBridge) &&
  /createCellUserAssignment/.test(dataBridge)
);

check("getAuthorizedCellsForUser handles Assistant Cell Leader and Cell Group Leader",
  /Assistant Cell Leader/.test(dashboard) &&
  /Cell Group Leader/.test(dashboard) &&
  /assigned_cell_groups/.test(dashboard)
);

check("mapAccountToDashboardUser maps cell and cell group assignments",
  /cell_id:\s*account\.cell_id/.test(dashboard) &&
  /cell_group_id:\s*account\.cell_group_id/.test(dashboard) &&
  /assigned_cells:\s*account\.assigned_cells/.test(dashboard)
);

check("documentation exists",
  existsSync(join(root, "docs/auth/CELL_ACCESS_MODEL.md"))
);

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
