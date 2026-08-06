import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;
function check(ok, label) {
  if (ok) { passed += 1; console.log(`PASS ${label}`); }
  else { failed += 1; console.error(`FAIL ${label}`); }
}
const file = (path) => join(root, path);
const text = (path) => readFileSync(file(path), "utf8");

const requiredFiles = [
  ".env.staging.example",
  "docs/backend/SUPABASE_STAGING_DRY_RUN_GUIDE.md",
  "docs/backend/STAGING_MIGRATION_APPLY_CHECKLIST.md",
  "docs/backend/STAGING_SEED_CHECKLIST.md",
  "docs/backend/STAGING_STORAGE_BUCKET_CHECKLIST.md",
  "docs/backend/STAGING_RLS_CHECKLIST.md",
  "docs/qa/STAGING_MANUAL_QA_CHECKLIST.md",
  "docs/qa/STAGING_TEST_REPORT_TEMPLATE.md",
  "docs/backend/STAGING_ROLLBACK_FALLBACK_CHECKLIST.md",
  "scripts/smoke-supabase-staging-connection.mjs",
  "scripts/check-supabase-live-schema.mjs",
];
for (const path of requiredFiles) check(existsSync(file(path)), `${path} exists`);

const pkg = JSON.parse(text("package.json"));
check(pkg.scripts["test:supabase-staging-connection"]?.includes("smoke-supabase-staging-connection.mjs"), "connection script registered");
check(pkg.scripts["test:supabase-live-schema"]?.includes("check-supabase-live-schema.mjs"), "schema script registered");
check(pkg.scripts["test:phase-14-staging-dry-run"]?.includes("smoke-phase-14-staging-dry-run.mjs"), "Phase 14 script registered");

const env = text(".env.staging.example");
check(env.includes("VITE_DATA_SOURCE=supabase") && env.includes("REQUIRE_SUPABASE_LIVE=false"), "staging template has safe defaults");
check(env.includes("YOUR-STAGING-PROJECT") && env.includes("YOUR_STAGING_ANON_KEY"), "staging template contains placeholders only");
check(!/https:\/\/(?!YOUR-STAGING-PROJECT)[a-z0-9-]+\.supabase\.co/i.test(env), "no real Supabase URL in staging template");

const settings = `${text("src/data/repositories/settingsRepository.ts")}\n${text("js/dashboard.js")}`;
check(settings.includes("Staging Dry Run") && settings.includes("last_dry_run_report"), "Settings mentions Staging Dry Run readiness");
check(text("README.md").includes("Phase 14"), "README documents Phase 14");
check(text("MILESTONES.md").includes("backend-phase-14-supabase-staging-dry-run-v1"), "milestone document updated");

const runtimeFiles = ["src", "js"].flatMap((folder) => {
  // The explicit critical files cover frontend configuration paths without scanning generated/vendor content.
  return folder === "src"
    ? ["src/data/adapters/supabase/supabaseConfig.ts", "src/data/repositories/settingsRepository.ts"]
    : ["js/dashboard.js"];
});
const runtime = runtimeFiles.map(text).join("\n");
check(!/SUPABASE_SERVICE_ROLE_KEY\s*[=:]\s*[^\s#]/i.test(runtime), "no service-role value in frontend runtime");
check(!/DATABASE_URL\s*[=:]\s*[^\s#]/i.test(runtime), "no DATABASE_URL value in frontend runtime");

const liveScripts = `${text("scripts/smoke-supabase-staging-connection.mjs")}\n${text("scripts/check-supabase-live-schema.mjs")}`;
check(liveScripts.includes("skipping live checks") && liveScripts.includes("REQUIRE_SUPABASE_LIVE"), "live checks have safe skip gate");
check(!liveScripts.includes("SUPABASE_SERVICE_ROLE_KEY") && !liveScripts.includes("DATABASE_URL"), "live checks use no backend credential");

console.log(`\nPhase 14 staging dry-run checks: ${passed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
