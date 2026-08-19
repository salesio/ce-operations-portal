/**
 * Test Suite: Cell Member Reconciliation & Normalization
 * Validates member reconciliation field schema, adapters, single/bulk confirmation,
 * restricted field editing, disassociation logging, and KPI calculations.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");

const migration = read("supabase/migrations/0019_member_reconciliation_and_transfers.sql");
const adapter = read("src/data/adapters/supabase/membersSupabaseAdapter.ts");
const membersRepo = read("src/data/repositories/membersRepository.ts");
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

console.log("\n=== Testing Cell Member Reconciliation ===");

check("migration 0019 adds reconciliation fields to public.members",
  /reconciliation_status\s+text\s+(NOT NULL\s+)?DEFAULT\s+'Pending'/i.test(migration) &&
  /confirmed_by\s+uuid/i.test(migration) &&
  /confirmed_at\s+timestamptz/i.test(migration) &&
  /reconciliation_notes\s+text/i.test(migration) &&
  /CREATE TABLE IF NOT EXISTS public\.cell_member_removal_logs/i.test(migration)
);

check("membersSupabaseAdapter maps reconciliation fields both ways",
  /reconciliation_status: \(row\.reconciliation_status as string\) \|\| "Pending"/.test(adapter) &&
  /confirmed_by: \(row\.confirmed_by as string\) \|\| null/.test(adapter) &&
  /confirmed_at: \(row\.confirmed_at as string\) \|\| null/.test(adapter) &&
  /reconciliation_status: member\.reconciliation_status \?\? "Pending"/.test(adapter)
);

check("members repository and adapter support reconciliationStatus filter",
  /request = request\.eq\("reconciliation_status", query\.reconciliationStatus\)/.test(adapter) &&
  /query\.reconciliationStatus/.test(membersRepo)
);

check("single-click confirmation updates status and audit fields",
  /async function confirmCellMember/.test(dashboard) &&
  /reconciliation_status:\s*"Confirmed"/.test(dashboard) &&
  /confirmed_by:\s*activeUser\?\.id/.test(dashboard) &&
  /confirmed_at:\s*now/.test(dashboard)
);

check("bulk confirmation function exists with max 50 batch cap",
  /async function bulkConfirmCellMembers/.test(dashboard) &&
  /\.slice\(0,\s*50\)/.test(dashboard)
);

check("permitted fields editing modal and handler implemented",
  /function openEditCellMemberModal/.test(dashboard) &&
  /async function submitCellMemberEditForm/.test(dashboard) &&
  /full_name/.test(dashboard) &&
  /primary_phone/.test(dashboard) &&
  /kingschat_username/.test(dashboard)
);

check("non-destructive disassociation with reason selector implemented",
  /function openRemoveCellMemberModal/.test(dashboard) &&
  /async function submitCellMemberRemovalForm/.test(dashboard) &&
  /cell_id:\s*null/.test(dashboard) &&
  /reconciliation_status:\s*"NotInCell"/.test(dashboard) &&
  /logCellMemberRemoval/.test(dashboard)
);

check("reconciliation KPIs and status badges rendered in Cell Portal",
  /reconciliationCounts/.test(dashboard) &&
  /reconciliationStatusBadge/.test(dashboard) &&
  /data-cell-member-confirm/.test(dashboard) &&
  /data-cell-member-edit/.test(dashboard) &&
  /data-cell-member-remove/.test(dashboard)
);

check("documentation exists",
  existsSync(join(root, "docs/auth/CELL_MEMBER_RECONCILIATION.md"))
);

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
