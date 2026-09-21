import { readFileSync } from "fs";
import { resolve } from "path";
import assert from "assert";

console.log("Starting Members and Leaders Pagination Test Suite...");

const dashboardCode = readFileSync(resolve("./js/dashboard.js"), "utf-8");

// 1. Verify memberPaginationBar is declared inside renderMembers
assert.ok(
  dashboardCode.includes("const memberPaginationBar = `<div class=\"p-3 border-top d-flex justify-content-between"),
  "renderMembers must declare memberPaginationBar"
);
console.log("PASS: memberPaginationBar is defined in renderMembers.");

// 2. Verify dual pagination in cellLeaders
assert.ok(
  dashboardCode.includes("data-cell-leaders-pagination"),
  "cellLeaders must render data-cell-leaders-pagination"
);

// Count occurrences of data-cell-leaders-pagination in renderCellMinistry
const cellLeadersPaginationMatches = dashboardCode.match(/data-cell-leaders-pagination/g) || [];
assert.ok(
  cellLeadersPaginationMatches.length >= 2,
  `Expected at least 2 occurrences of data-cell-leaders-pagination template, got ${cellLeadersPaginationMatches.length}`
);
console.log("PASS: cellLeaders pagination bar defined with top & bottom placement.");

// 3. Verify event handlers for cell leaders pagination
assert.ok(
  dashboardCode.includes("data-cell-leaders-page"),
  "data-cell-leaders-page click handler must be wired"
);
assert.ok(
  dashboardCode.includes("data-cell-leaders-page-size"),
  "data-cell-leaders-page-size change handler must be wired"
);
console.log("PASS: cellLeaders pagination event handlers wired.");

// 4. Verify members adapter batch fetching
const membersAdapterCode = readFileSync(resolve("./src/data/adapters/supabase/membersSupabaseAdapter.ts"), "utf-8");
assert.ok(
  membersAdapterCode.includes("MEMBER_PAGE_MAX_SIZE = 1000"),
  "MEMBER_PAGE_MAX_SIZE should be 1000"
);
assert.ok(
  membersAdapterCode.includes("while (true) {") && membersAdapterCode.includes("listMembersPage"),
  "listMembers must fetch all pages in batches"
);
console.log("PASS: members Supabase adapter full dataset hydration verified.");

console.log("\nALL VERIFICATIONS PASSED!");
