/**
 * Test Suite: PostgreSQL Row-Level Security (RLS) Policies
 * Validates migration 0020 helper functions, authorized cell scoping,
 * and policy coverage across members, transfers, removals, candidates, and assignments.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");

const rlsMigration = read("supabase/migrations/0020_auth_rls_policies.sql");

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

console.log("\n=== Testing RLS Policies & SQL Helpers ===");

check("migration 0020 defines current_app_user_id helper",
  /CREATE OR REPLACE FUNCTION public\.current_app_user_id\(\)/.test(rlsMigration) &&
  /auth_user_id = auth\.uid\(\)/.test(rlsMigration)
);

check("migration 0020 defines current_user_role helper",
  /CREATE OR REPLACE FUNCTION public\.current_user_role\(\)/.test(rlsMigration) &&
  /public\.roles/.test(rlsMigration)
);

check("migration 0020 defines authorized_cell_ids helper",
  /CREATE OR REPLACE FUNCTION public\.authorized_cell_ids/.test(rlsMigration) &&
  /public\.cell_user_assignments/.test(rlsMigration)
);

check("migration 0020 defines authorized_cell_group_ids helper",
  /CREATE OR REPLACE FUNCTION public\.authorized_cell_group_ids/.test(rlsMigration)
);

check("RLS enabled on all target tables",
  /ALTER TABLE public\.members ENABLE ROW LEVEL SECURITY;/.test(rlsMigration) &&
  /ALTER TABLE public\.cell_user_assignments ENABLE ROW LEVEL SECURITY;/.test(rlsMigration) &&
  /ALTER TABLE public\.cell_transfer_requests ENABLE ROW LEVEL SECURITY;/.test(rlsMigration) &&
  /ALTER TABLE public\.cell_member_removal_logs ENABLE ROW LEVEL SECURITY;/.test(rlsMigration) &&
  /ALTER TABLE public\.member_registration_candidates ENABLE ROW LEVEL SECURITY;/.test(rlsMigration)
);

check("members table has select and update policies for cell leaders",
  /members_select_policy/.test(rlsMigration) &&
  /members_update_policy/.test(rlsMigration) &&
  /cell_id = ANY\(public\.authorized_cell_ids\(\)\)/.test(rlsMigration)
);

check("cell_user_assignments has church and cell scoping policies",
  /cell_assignments_select/.test(rlsMigration) &&
  /cell_assignments_admin_all/.test(rlsMigration)
);

check("cell_transfer_requests has scoped select and insert policies",
  /cell_transfers_select/.test(rlsMigration) &&
  /cell_transfers_insert/.test(rlsMigration)
);

check("documentation exists",
  existsSync(join(root, "docs/auth/RLS_ACCESS_MATRIX.md"))
);

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
