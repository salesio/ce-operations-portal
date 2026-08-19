/**
 * Test Suite: Sede Church Consolidation Readiness
 * Validates:
 * 1. Migration 0021_consolidate_maputo_hq_church.sql structure, safety checks, and idempotency.
 * 2. Dynamic ID resolution (no hardcoded UUIDs in migration logic).
 * 3. Non-destructive field merge & historical metadata trace.
 * 4. Comprehensive foreign key update coverage across operational tables.
 * 5. Dynamic foreign key discovery via information_schema.
 * 6. Zero-reference pre-deletion safety assertion.
 * 7. Harmonization of seeds and codebase references to canonical 'E.C. Maputo Central - Sede'.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");

const migPath = "supabase/migrations/0021_consolidate_maputo_hq_church.sql";
const migExists = existsSync(join(root, migPath));
const mig = migExists ? read(migPath) : "";

const churchesSeed = read("src/data/seeds/churchesSeed.ts");
const dbSeed = read("database/seed.sql");
const sbSeed = read("supabase/seeds/churches_members_seed.sql");
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

console.log("\n=== Testing Sede Church Consolidation Readiness ===");

// 1. Migration file existence and basic structure
check("migration 0021 exists", migExists);

check("migration wraps operations in transactional PL/pgSQL block",
  /DO\s+\$\$/i.test(mig) && /LANGUAGE\s+plpgsql/i.test(mig)
);

// 2. Dynamic ID resolution (No hardcoded UUIDs in query selection)
check("migration resolves canonical record dynamically",
  /SELECT\s+id\s+INTO\s+v_canonical_id\s+FROM\s+public\.churches/i.test(mig) &&
  /E\.C\.\s+Maputo\s+Central\s+-\s+Sede/i.test(mig)
);

check("migration resolves duplicate record dynamically without hardcoded UUIDs",
  /SELECT\s+id\s+INTO\s+v_duplicate_id\s+FROM\s+public\.churches/i.test(mig) &&
  /National\s+HQ/i.test(mig) &&
  /id\s*<>\s*v_canonical_id/i.test(mig)
);

// 3. Field Merge and Metadata Preservation
check("migration merges metadata with historical trace and aliases",
  /merged_aliases/i.test(mig) &&
  /merged_from_church_id/i.test(mig) &&
  /duplicate_history/i.test(mig) &&
  /merged_at/i.test(mig)
);

check("migration non-destructively preserves canonical fields",
  /COALESCE\s*\(\s*NULLIF\s*\(\s*v_canonical_rec\.address/i.test(mig) &&
  /COALESCE\s*\(\s*NULLIF\s*\(\s*v_canonical_rec\.pastor_in_charge/i.test(mig) &&
  /COALESCE\s*\(\s*NULLIF\s*\(\s*v_canonical_rec\.phone_primary/i.test(mig)
);

// 4. Critical foreign key table updates
check("migration updates members table",
  /UPDATE\s+public\.members\s+SET\s+church_id\s*=\s*v_canonical_id\s+WHERE\s+church_id\s*=\s*v_duplicate_id/i.test(mig)
);

check("migration updates cell_groups and cells tables",
  /UPDATE\s+public\.cell_groups\s+SET\s+church_id\s*=\s*v_canonical_id/i.test(mig) &&
  /UPDATE\s+public\.cells\s+SET\s+church_id\s*=\s*v_canonical_id/i.test(mig)
);

check("migration updates cell_user_assignments and transfers",
  /UPDATE\s+public\.cell_user_assignments\s+SET\s+church_id\s*=\s*v_canonical_id/i.test(mig) &&
  /UPDATE\s+public\.cell_transfer_requests\s+SET\s+church_id\s*=\s*v_canonical_id/i.test(mig)
);

check("migration updates users and staff tables",
  /UPDATE\s+public\.users\s+SET\s+church_id\s*=\s*v_canonical_id/i.test(mig) &&
  /UPDATE\s+public\.staff_members\s+SET\s+church_id\s*=\s*v_canonical_id/i.test(mig)
);

check("migration updates first_timers and follow_ups",
  /UPDATE\s+public\.first_timers\s+SET\s+church_id\s*=\s*v_canonical_id/i.test(mig) &&
  /UPDATE\s+public\.follow_ups\s+SET\s+church_id\s*=\s*v_canonical_id/i.test(mig)
);

check("migration updates finance and requisitions",
  /UPDATE\s+public\.finance_records\s+SET\s+church_id\s*=\s*v_canonical_id/i.test(mig) &&
  /UPDATE\s+public\.requisitions\s+SET\s+church_id\s*=\s*v_canonical_id/i.test(mig)
);

// 5. Dynamic FK discovery & Pre-delete safety check
check("migration performs dynamic foreign key discovery via information_schema",
  /information_schema\.table_constraints/i.test(mig) &&
  /ccu\.table_name\s*=\s*'churches'/i.test(mig)
);

check("migration enforces zero-reference pre-deletion safety guard",
  /v_table_refs\s*>\s*0/i.test(mig) &&
  /RAISE\s+EXCEPTION/i.test(mig) &&
  /DELETE\s+FROM\s+public\.churches\s+WHERE\s+id\s*=\s*v_duplicate_id/i.test(mig)
);

// 6. Harmonization of seeds and dashboard
check("churchesSeed.ts defines canonical Sede name 'E.C. Maputo Central - Sede'",
  /church_name:\s*"E\.C\.\s+Maputo\s+Central\s+-\s+Sede"/i.test(churchesSeed)
);

check("database/seed.sql defines canonical Sede name",
  /'E\.C\.\s+Maputo\s+Central\s+-\s+Sede'/i.test(dbSeed)
);

check("supabase/seeds/churches_members_seed.sql defines canonical Sede name",
  /'E\.C\.\s+Maputo\s+Central\s+-\s+Sede'/i.test(sbSeed)
);

check("dashboard.js EC_CHURCH_DISPLAY_NAMES maps church-hq to 'E.C. Maputo Central - Sede'",
  /["']church-hq["']:\s*["']E\.C\.\s+Maputo\s+Central\s+-\s+Sede["']/.test(dashboard)
);

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
