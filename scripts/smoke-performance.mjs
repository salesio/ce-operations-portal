import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const required = [
  "docs/performance/PERFORMANCE_AUDIT.md",
  "docs/performance/PERFORMANCE_BASELINE.md",
  "docs/performance/PERFORMANCE_IMPROVEMENTS.md",
  "docs/performance/SUPABASE_INDEX_RECOMMENDATIONS.sql",
  "docs/performance/PERFORMANCE_MANUAL_QA.md",
  "supabase/migrations/0016_members_performance_indexes.sql",
];
for (const file of required) if (!existsSync(resolve(root, file))) throw new Error(`Missing ${file}`);
const dashboard = readFileSync(resolve(root, "js/dashboard.js"), "utf8");
if (dashboard.includes("hydrateMembersFromRepository,\n    hydrateFirstTimers")) throw new Error("Members full hydration is still scheduled globally.");
if (!dashboard.includes("DASHBOARD_AUTO_REFRESH_MS")) throw new Error("Refresh interval is missing.");
console.log("Performance smoke test passed.");
