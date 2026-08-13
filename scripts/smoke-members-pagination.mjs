import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(resolve(root, file), "utf8");
const adapter = read("src/data/adapters/supabase/membersSupabaseAdapter.ts");
const dashboard = read("js/dashboard.js");
const bridge = read("js/members-data-bridge.js");
const required = [
  [adapter, "listMembersPage", "Supabase member page function"],
  [adapter, 'count: "exact"', "exact total count"],
  [adapter, "MEMBER_LIST_COLUMNS", "narrow list projection"],
  [adapter, ".range(from, from + pageSize - 1)", "server range pagination"],
  [dashboard, "data-members-page-size", "page-size selector"],
  [dashboard, 'members: { view: "cards"', "Cards default view"],
  [dashboard, "loadMembersPage", "dashboard page loader"],
  [dashboard, "slice(0, pageState.pageSize || 50)", "render page guard"],
  [bridge, "listMembersPage", "runtime bridge method"],
];
for (const [text, needle, label] of required) {
  if (!text.includes(needle)) throw new Error(`Missing ${label}: ${needle}`);
}
if (adapter.includes("while (true)")) throw new Error("Members adapter still iterates through every remote page.");
console.log("Members pagination smoke test passed.");
