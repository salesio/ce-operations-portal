import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const checks = [];

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function exists(rel) {
  checks.push([`exists ${rel}`, existsSync(join(root, rel))]);
}

function has(rel, pattern, label = pattern) {
  const text = read(rel);
  const ok = pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern);
  checks.push([`${rel} has ${label}`, ok]);
}

function notHas(rel, pattern, label = pattern) {
  const text = read(rel);
  const ok = !(pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern));
  checks.push([`${rel} does not have ${label}`, ok]);
}

exists("src/data/adapters/supabase/staffHrSupabaseAdapter.ts");
exists("src/data/adapters/api/staffHrApiAdapter.ts");
exists("supabase/migrations/0007_staff_hr_documents_pilot.sql");
exists("supabase/seeds/staff_hr_seed.sql");
exists("docs/backend/STAFF_HR_DOCUMENTS_SUPABASE_PILOT.md");

for (const table of [
  "staff_departments",
  "staff_roles",
  "staff_members",
  "staff_salaries",
  "staff_performance_reviews",
  "staff_documents",
  "staff_attendance",
]) {
  has("database/schema.sql", table, table);
  has("supabase/migrations/0007_staff_hr_documents_pilot.sql", table, table);
}

for (const needle of [
  "idx_staff_members_user_auth",
  "idx_staff_salaries_staff_effective",
  "idx_staff_documents_staff_status",
  "idx_staff_attendance_staff_date",
  "user_id",
  "auth_user_id",
  "access_role_id",
  "can_access_dashboard",
  "staff-documents",
  "is_sensitive",
  "no_finance_record_created",
]) {
  has("supabase/migrations/0007_staff_hr_documents_pilot.sql", needle);
}

notHas("supabase/migrations/0007_staff_hr_documents_pilot.sql", /drop\s+table/i, "DROP TABLE");
notHas("src/data/adapters/supabase/staffHrSupabaseAdapter.ts", "createFinanceRecord");
notHas("src/data/adapters/api/staffHrApiAdapter.ts", "createFinanceRecord");

for (const fn of [
  "listStaffMembers",
  "createStaffMember",
  "listStaffDepartments",
  "listStaffRoles",
  "listStaffSalaries",
  "listPerformanceReviews",
  "listStaffDocuments",
  "listStaffAttendance",
  "linkStaffToUser",
  "maskSensitiveStaffData",
  "canViewSalary",
  "canViewSensitiveStaffData",
  "getStaffHrDataSourceInfo",
]) {
  has("src/data/adapters/supabase/staffHrSupabaseAdapter.ts", fn, fn);
  has("src/data/adapters/api/staffHrApiAdapter.ts", fn, fn);
}

for (const providerNeedle of [
  "staffHrSupabaseAdapter",
  "createStaffRepository",
  "staffDepartments",
  "staffSalaries",
  "staffDocuments",
  "staffAttendance",
]) {
  has("src/data/adapters/supabaseProvider.ts", providerNeedle);
}

for (const providerNeedle of [
  "staffHrApiAdapter",
  "map.staff",
  "staffPerformance",
  "staffDocuments",
]) {
  has("src/data/adapters/apiProvider.ts", providerNeedle);
}

has("src/data/adapters/supabase/supabaseTypes.ts", '"staff_documents"');
has("js/dashboard.js", "staff & rh");
has("js/dashboard.js", "staff documents");
has("docs/backend/MIGRATION_ROADMAP.md", "Phase 7 - Staff & RH + Documents pilot");
has("DATA_LAYER_PLAN.md", "Backend Phase 7 - Staff & RH + Documents Supabase/API pilot");
has("docs/backend/SUPABASE_SETUP_PLAN.md", "staff_hr_seed.sql");

if (existsSync(join(root, "js/supabase-bundle.js"))) {
  has("js/supabase-bundle.js", "getStaffHrDataSourceInfo");
}

let failed = 0;
for (const [label, ok] of checks) {
  if (ok) {
    console.log(`PASS ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL ${label}`);
  }
}

if (failed) {
  console.error(`\nStaff/RH Supabase smoke failed: ${failed} check(s).`);
  process.exit(1);
}

console.log(`\nStaff/RH Supabase smoke passed: ${checks.length} checks.`);
