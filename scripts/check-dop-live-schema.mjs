import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const envPath = join(root, ".env.local");
const parseEnv = (raw) => Object.fromEntries(raw.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
}));
const localEnv = existsSync(envPath) ? parseEnv(readFileSync(envPath, "utf8")) : {};
const token = process.env.SUPABASE_ACCESS_TOKEN || localEnv.SUPABASE_ACCESS_TOKEN;
const projectId = process.env.SUPABASE_PROJECT_ID || localEnv.SUPABASE_PROJECT_ID;

if (!token || !projectId) {
  throw new Error("SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_ID are required for the live D.O.P. schema check.");
}

const expected = [
  "programs", "program_sessions", "program_teams", "program_participants", "program_registrations", "program_resources", "program_budgets", "program_checklists", "program_reports",
  "prison_locations", "prison_representatives", "prison_services", "prison_participants", "prison_foundation_students", "prison_agenda_items", "prison_follow_ups", "prison_reports", "prison_materials_requests",
  "ministry_materials_catalog", "ministry_materials_stock", "ministry_materials_sales", "ministry_materials_distributions", "ministry_materials_requests", "ministry_materials_funds", "ministry_materials_reports",
];
const names = expected.map((name) => `'${name}'`).join(", ");
const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: `select table_name from information_schema.tables where table_schema = 'public' and table_name in (${names});` }),
});
if (!response.ok) throw new Error(`Live D.O.P. schema query failed (${response.status}).`);
const rows = await response.json();
const present = new Set(rows.map((row) => row.table_name));
const missing = expected.filter((name) => !present.has(name));
if (missing.length) throw new Error(`Live D.O.P. schema missing: ${missing.join(", ")}`);

console.log(`D.O.P. live schema passed: ${expected.length}/${expected.length} operational tables verified.`);
