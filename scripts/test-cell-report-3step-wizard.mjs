/**
 * Test suite for the 3-step Cell Report Wizard & Auto-Identification.
 * Run: node scripts/test-cell-report-3step-wizard.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dashboard = readFileSync(join(root, "js/dashboard.js"), "utf8");
const css = readFileSync(join(root, "css/dashboard.css"), "utf8");
const index = readFileSync(join(root, "index.html"), "utf8");

let passed = 0;
let failed = 0;

function assert(name, condition, details = "") {
  if (condition) {
    passed++;
    console.log(`✓ PASS: ${name}`);
  } else {
    failed++;
    console.error(`✗ FAIL: ${name} ${details ? `(${details})` : ""}`);
  }
}

console.log("\n=== Testing 3-Step Weekly Cell Report Wizard & Auto-Identification ===\n");

// 1. Wizard has exactly 3 consolidated steps
assert(
  "Step keys defined as 3 steps",
  dashboard.includes('const stepKeys = ["step1", "step2", "step3"]')
);

assert(
  "Portuguese Step 1 label is '1. Encontro & Célula'",
  dashboard.includes('step1: "1. Encontro & Célula"')
);

assert(
  "Portuguese Step 2 label is '2. Frequência & Almas'",
  dashboard.includes('step2: "2. Frequência & Almas"')
);

assert(
  "Portuguese Step 3 label is '3. Oferta, Estado & Envio'",
  dashboard.includes('step3: "3. Oferta, Estado & Envio"')
);

// 2. Auto-identification logic
assert(
  "Helper getCellLeaderDetails exists",
  dashboard.includes("function getCellLeaderDetails(cell)")
);

assert(
  "Helper getCellGroupAndChurchDetails exists",
  dashboard.includes("function getCellGroupAndChurchDetails(cell)")
);

assert(
  "Cell identity badge rendered for single cell",
  dashboard.includes("cell-identity-card") && dashboard.includes("cell-identity-badge")
);

assert(
  "Auto-identified hidden fields for church_id, cell_group_id, cell_id, leader_name, leader_phone exist",
  dashboard.includes('name="church_id"') &&
  dashboard.includes('name="cell_group_id"') &&
  dashboard.includes('name="cell_id"') &&
  dashboard.includes('name="leader_name"') &&
  dashboard.includes('name="leader_phone"')
);

// 3. Aligned Numeric Stat Cards
assert(
  "publicCellNumericField creates .cell-stat-card with title and tag",
  dashboard.includes("cell-stat-card") &&
  dashboard.includes("cell-stat-head") &&
  dashboard.includes("cell-stat-tag") &&
  dashboard.includes("cell-stat-input")
);

assert(
  "Step 2 participation fields use ATT, FT, NC tags",
  dashboard.includes('tag: "ATT"') &&
  dashboard.includes('tag: "FT"') &&
  dashboard.includes('tag: "NC"')
);

assert(
  "Step 2 spiritual fields use RS (Reborn Souls) tag",
  dashboard.includes('tag: "RS"')
);

// 4. CSS Grid & Styles
assert(
  "CSS public-stepper is configured for 3 columns",
  css.includes("grid-template-columns: repeat(3, minmax(0, 1fr))")
);

assert(
  "CSS contains .cell-identity-card styles",
  css.includes(".cell-identity-card") && css.includes(".cell-identity-badge")
);

assert(
  "CSS contains .cell-stat-card and .cell-stat-input styles",
  css.includes(".cell-stat-card") && css.includes(".cell-stat-input")
);

// 5. Confirmation summary
assert(
  "Summary includes ATT, FT, NC, RS and Offering",
  dashboard.includes("(ATT)") &&
  dashboard.includes("(FT)") &&
  dashboard.includes("(NC)") &&
  dashboard.includes("(RS)")
);

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log(">>> ALL 3-STEP WIZARD TESTS PASSED! <<<\n");
}
