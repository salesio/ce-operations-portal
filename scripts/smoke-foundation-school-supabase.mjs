import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const checks = [];
const read = (rel) => readFileSync(join(root, rel), "utf8");
const exists = (rel) => checks.push([`exists ${rel}`, existsSync(join(root, rel))]);
const has = (rel, needle, label = String(needle)) => checks.push([`${rel} has ${label}`, needle instanceof RegExp ? needle.test(read(rel)) : read(rel).includes(needle)]);
const notHas = (rel, needle, label = String(needle)) => checks.push([`${rel} excludes ${label}`, !(needle instanceof RegExp ? needle.test(read(rel)) : read(rel).includes(needle))]);

const supabaseAdapter = "src/data/adapters/supabase/foundationSchoolSupabaseAdapter.ts";
const apiAdapter = "src/data/adapters/api/foundationSchoolApiAdapter.ts";
const migration = "supabase/migrations/0008_foundation_school_pilot.sql";
const seed = "supabase/seeds/foundation_school_seed.sql";

for (const file of [supabaseAdapter, apiAdapter, migration, seed, "docs/backend/FOUNDATION_SCHOOL_SUPABASE_PILOT.md"]) exists(file);

const tables = ["enrollments", "classes", "students", "teachers", "lessons", "lesson_progress", "attendance", "online_tests", "test_results", "soul_winning", "final_exams", "graduations"];
for (const suffix of tables) {
  const table = `foundation_school_${suffix}`;
  has(migration, table, table);
  has("database/schema.sql", table, table);
}

for (const fn of [
  "listFoundationEnrollments", "createFoundationEnrollment", "listFoundationClasses", "assignTeacherToClass",
  "listFoundationStudents", "enrollFirstTimer", "enrollMember", "assignStudentToClass", "listFoundationTeachers",
  "markLessonCompleted", "recalculateStudentLessonProgress", "createFoundationAttendance", "createTestResult",
  "recalculateStudentTestsAverage", "createSoulWinningRecord", "gradeFinalExam", "recalculateStudentFinalGrade",
  "createGraduation", "completeGraduation", "markStudentGraduated", "getFoundationOverviewStats", "getTeacherActivityReport",
]) {
  has(supabaseAdapter, fn, fn);
  has(apiAdapter, fn, fn);
}

has("src/data/adapters/supabaseProvider.ts", "foundationSchoolSupabaseAdapter");
has("src/data/adapters/supabaseProvider.ts", "createFoundationStudentsRepository");
has("src/data/repositories/foundationSchoolRepository.ts", 'getDataSource() === "supabase"');
has(seed, "generate_series(1, 7)", "seven lesson test configurations");
has(seed, "generate_series(1, 12)", "twelve demo students/enrollments");
for (let lesson = 1; lesson <= 7; lesson += 1) has(migration, `(${lesson}, 'Aula ${lesson}`, `base lesson ${lesson}`);
has(supabaseAdapter, "testsAverage * 0.4 + examPercentage * 0.6", "40/60 final-grade calculation");
has(supabaseAdapter, "automatic_member_creation: false");
has(supabaseAdapter, "certificates_generated: false");
has("js/dashboard.js", "foundation school:");
has("js/dashboard.js", "external forms metadata");
for (const flag of ["VITE_DATA_SOURCE", "VITE_ENABLE_SUPABASE", "VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"]) has(".env.example", flag, flag);
notHas(migration, /drop\s+table/i, "DROP TABLE");
notHas(supabaseAdapter, /googleapis|forms\.googleapis\.com/i, "Google Forms API client");

for (const frontend of [supabaseAdapter, apiAdapter, "src/data/adapters/supabaseProvider.ts", "js/dashboard.js"]) {
  notHas(frontend, "SUPABASE_SERVICE_ROLE_KEY", `service role reference in ${frontend}`);
}

let failed = 0;
for (const [label, passed] of checks) {
  if (passed) console.log(`PASS ${label}`);
  else { failed += 1; console.error(`FAIL ${label}`); }
}
if (failed) {
  console.error(`\nFoundation School Supabase smoke failed: ${failed} check(s).`);
  process.exit(1);
}
console.log(`\nFoundation School Supabase smoke passed: ${checks.length} checks.`);

