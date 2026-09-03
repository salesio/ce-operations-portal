import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");
const dashboard = read("js/dashboard.js");
const repository = read("src/data/repositories/membersRepository.ts");
const adapter = read("src/data/adapters/supabase/membersSupabaseAdapter.ts");
let failed = 0;

function check(condition, message) {
  console.log(`${condition ? "PASS" : "FAIL"} ${message}`);
  if (!condition) failed += 1;
}

check(/\["departamento", "department", "departmentSelect"\]/.test(dashboard), "member form renders Department as a portal dropdown");
check(/function memberDepartmentOptions/.test(dashboard) && /state\.departments/.test(dashboard), "department choices are sourced from portal departments");
check(/function enrichMemberDepartmentFields/.test(dashboard) && /data\.department_id = selected\?\.id \|\| null/.test(dashboard), "chosen department name and id are saved together");
check(/mountDepartmentSelectControls\(form\)/.test(dashboard), "department selection reacts to the chosen church");
check(/if \(soft && !liveSupabase\)/.test(dashboard), "Supabase write errors cannot masquerade as local saves");
check(/if \(liveSupabase\) return \{ ok: false, error:/.test(dashboard), "unavailable Supabase writes are reported to the user");
check(/hasPayloadDepartment/.test(repository) && /department_id: hasPayloadDepartmentId/.test(repository), "repository preserves explicit department changes and clears");
check(/department_id: row\.department_id/.test(adapter) && /department_name: \(row\.department_name/.test(adapter), "Supabase adapter maps department id and name back to the form");

if (failed) process.exit(1);
