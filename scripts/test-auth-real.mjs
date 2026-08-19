/**
 * Test Suite: Real Supabase Auth Foundation
 * Validates real auth configuration, session handling, lockout for suspended/inactive users,
 * and no silent fallback when real auth is enabled.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");

const authRepo = read("src/data/repositories/authRepository.ts");
const dashboard = read("js/dashboard.js");
const accessControl = read("js/access-control.js");

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

console.log("\n=== Testing Real Supabase Auth Foundation ===");

check("authRepository checks for suspended/inactive/locked users",
  /suspend|inactiv|lock/.test(authRepo) &&
  /AUTH_LOCKED/.test(authRepo)
);

check("authRepository provides getCurrentScope method",
  /getCurrentScope\(\)/.test(authRepo) &&
  /cellGroups/.test(authRepo) &&
  /cells/.test(authRepo)
);

check("dashboard enterDashboard checks isRealAuthEnabled",
  /isRealAuthEnabled/.test(dashboard) &&
  /AUTH_NOT_CONFIGURED/.test(dashboard)
);

check("no silent demo fallback when real auth is enabled",
  /const wantReal = !!\(auth\.isRealAuthEnabled && auth\.isRealAuthEnabled\(\)\)/.test(dashboard) &&
  /if \(!wantReal && \["AUTH_ERROR", "AUTH_TIMEOUT"\]\.includes\(code\)\)/.test(dashboard)
);

check("auth session auto-restore on DOMContentLoaded",
  /function initRealAuthSession/.test(dashboard) &&
  /onAuthStateChange/.test(dashboard) &&
  /SIGNED_OUT/.test(dashboard) &&
  /resolveUserAccountFromAuth/.test(dashboard)
);

check("documentation exists",
  existsSync(join(root, "docs/auth/AUTH_REAL_IMPLEMENTATION.md"))
);

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
