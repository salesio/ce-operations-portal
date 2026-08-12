import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sql = readFileSync(join(root, "supabase/migrations/0014_pastoral_care_access.sql"), "utf8");
let passed = 0;
let failed = 0;
const check = (label, condition) => {
  if (condition) {
    passed += 1;
    console.log(`PASS ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL ${label}`);
  }
};

check("does not reference legacy user_roles", !/\b(?:public\.)?user_roles\b/i.test(sql));
check("uses canonical application users", /public\.users\s+u/i.test(sql));
check("joins canonical roles", /join\s+public\.roles\s+r/i.test(sql));
check("uses role permissions", /public\.permissions\s+p/i.test(sql));
check("resolves authenticated user by auth_user_id", /u\.auth_user_id\s*=\s*auth\.uid\(\)/i.test(sql));
check("requires active users and roles", /lower\(u\.status\)\s*=\s*'active'/i.test(sql) && /lower\(r\.status\)\s*=\s*'active'/i.test(sql));
check("checks pastoral church scope", /can_access_pastoral_church\(church_id\)/i.test(sql) && /u\.church_id\s*=\s*target_church_id/i.test(sql));
check("uses permission-based approval", /can_approve\s*=\s*true/i.test(sql));
check("uses permission-based follow-up editing", /can_edit\s*=\s*true/i.test(sql));
check("uses safe security-definer search paths", /SECURITY DEFINER\s+SET search_path = public, auth/gi.test(sql));
check("recreates policies idempotently", (sql.match(/DROP POLICY IF EXISTS/gi) || []).length >= 5 && (sql.match(/CREATE POLICY/gi) || []).length >= 5);
check("does not add anonymous unrestricted access", !/\bTO\s+anon\b/i.test(sql) && !/USING\s*\(\s*true\s*\)/i.test(sql));
check("contains no browser or service-role secret", !/(SUPABASE_SERVICE_ROLE_KEY|DATABASE_URL|VITE_SUPABASE_ANON_KEY)/i.test(sql));

console.log(`Pastoral care access migration: ${passed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
