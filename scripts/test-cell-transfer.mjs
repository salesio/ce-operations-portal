/**
 * Test Suite: Cell Member Transfers
 * Validates cell transfer request creation, status lifecycle (Submitted, Approved, Rejected),
 * repository implementation, and data bridge exposure.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");

const migration = read("supabase/migrations/0019_member_reconciliation_and_transfers.sql");
const repo = read("src/data/repositories/cellTransferRequestsRepository.ts");
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

console.log("\n=== Testing Cell Member Transfer Workflow ===");

check("migration 0019 defines public.cell_transfer_requests with status enum",
  /CREATE TABLE IF NOT EXISTS public\.cell_transfer_requests/i.test(migration) &&
  /status IN \('Draft', 'Submitted', 'Approved', 'Rejected', 'Cancelled'\)/.test(migration) &&
  /member_id\s+uuid/i.test(migration) &&
  /from_cell_id\s+text/i.test(migration)
);

check("cellTransferRequestsRepository implements create, approve, and reject methods",
  /createCellTransferRequest/.test(repo) &&
  /approveCellTransferRequest/.test(repo) &&
  /rejectCellTransferRequest/.test(repo) &&
  /listCellTransferRequests/.test(repo)
);

check("cell ministry data bridge exposes transfer request methods",
  /createCellTransferRequest/.test(dataBridge) &&
  /approveCellTransferRequest/.test(dataBridge) &&
  /rejectCellTransferRequest/.test(dataBridge)
);

check("transfer modal and submission handler wired in Cell Leader Portal",
  /function openTransferCellMemberModal/.test(dashboard) &&
  /async function submitCellMemberTransferForm/.test(dashboard) &&
  /data-cell-member-transfer/.test(dashboard) &&
  /modalType === "cellMemberTransfer"/.test(dashboard)
);

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
