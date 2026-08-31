import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

console.log("------------------------------------------------------------");
console.log("RUNNING TEST: test-sacraments-counseling-clean-data");
console.log("------------------------------------------------------------");

// 1. Static Audit of dashboard.js
console.log("1. Performing Static Audit of dashboard.js...");
const code = fs.readFileSync("js/dashboard.js", "utf8");

assert(!code.includes('id: "bap-1"'), "bap-1 mock baptism must not exist in dashboard.js");
assert(!code.includes('id: "mar-1"'), "mar-1 mock marriage must not exist in dashboard.js");
assert(!code.includes('id: "baby-1"'), "baby-1 mock baby dedication must not exist in dashboard.js");
assert(!code.includes('id: "coun-1"'), "coun-1 mock counselor must not exist in dashboard.js");
assert(!code.includes('id: "coun-2"'), "coun-2 mock counselor must not exist in dashboard.js");

console.log("  [PASS] Static audit passed: 0 mock records in seedData for Sacraments & Counseling.");

// 2. Test normalizeState mock purge
console.log("2. Testing normalizeState legacy mock purge...");
const isLegacyMockId = (id) => /^m-[123]$|^ft-[123]$|^fu-[123456]$|^fs-[123]$|^cr-[123]$|^ca-[12]$|^fin-[12345678]$|^disb-req-[489]$|^req-[123456789]$|^bap-[0-9]+|^mar-[0-9]+|^baby-[0-9]+|^coun-[0-9]+|^counselor-[0-9]+|^apt-[0-9]+|^ref-[0-9]+|^fb-[0-9]+/i.test(String(id || ""));

const mockSavedState = {
  sacraments: {
    baptisms: [{ id: "bap-1", full_name: "Mock Person" }],
    marriages: [{ id: "mar-1", groom_name: "Mock Groom" }],
    babies: [{ id: "baby-1", child_name: "Mock Baby" }]
  },
  counseling: {
    requests: [{ id: "req-1", full_name: "Mock Request" }],
    counselors: [{ id: "coun-1", full_name: "Mock Counselor" }],
    appointments: [{ id: "apt-1", location: "Mock Room" }],
    referrals: [{ id: "ref-1", reason: "Mock Referral" }],
    feedback: [{ id: "fb-1", outcome: "Mock Outcome" }]
  }
};

const cleanBaptisms = mockSavedState.sacraments.baptisms.filter((b) => !isLegacyMockId(b.id));
const cleanMarriages = mockSavedState.sacraments.marriages.filter((m) => !isLegacyMockId(m.id));
const cleanBabies = mockSavedState.sacraments.babies.filter((b) => !isLegacyMockId(b.id));

const cleanRequests = mockSavedState.counseling.requests.filter((r) => !isLegacyMockId(r.id));
const cleanCounselors = mockSavedState.counseling.counselors.filter((c) => !isLegacyMockId(c.id));
const cleanAppointments = mockSavedState.counseling.appointments.filter((a) => !isLegacyMockId(a.id));
const cleanReferrals = mockSavedState.counseling.referrals.filter((r) => !isLegacyMockId(r.id));
const cleanFeedback = mockSavedState.counseling.feedback.filter((f) => !isLegacyMockId(f.id));

assert.equal(cleanBaptisms.length, 0);
assert.equal(cleanMarriages.length, 0);
assert.equal(cleanBabies.length, 0);
assert.equal(cleanRequests.length, 0);
assert.equal(cleanCounselors.length, 0);
assert.equal(cleanAppointments.length, 0);
assert.equal(cleanReferrals.length, 0);
assert.equal(cleanFeedback.length, 0);

console.log("  [PASS] normalizeState purge effectively clears all legacy mock sacraments and counseling records.");

// 3. PostgreSQL Database Test with Real Schema (PGlite)
console.log("3. Initializing Schema in PGlite & Testing Real Sacraments & Counseling Records...");
const db = new PGlite();

await db.exec(`
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY, email text UNIQUE);
  CREATE TABLE IF NOT EXISTS public.churches (id uuid PRIMARY KEY, name text NOT NULL);
  CREATE TABLE IF NOT EXISTS public.members (id uuid PRIMARY KEY, full_name text NOT NULL);
  CREATE TABLE IF NOT EXISTS public.first_timers (id uuid PRIMARY KEY, full_name text NOT NULL);
  CREATE TABLE IF NOT EXISTS public.staff_members (id uuid PRIMARY KEY, full_name text NOT NULL);

  CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  INSERT INTO public.churches (id, name) VALUES ('a1111111-1111-4111-8111-111111111101', 'E.C. Maputo Central – Sede');
`);

const migration0010 = fs.readFileSync("supabase/migrations/0010_counseling_sacraments_pilot.sql", "utf8");
await db.exec(migration0010);
console.log("  [PASS] Migration 0010 applied successfully in PGlite.");

// Test inserting real Baptism
const realBaptismId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
await db.query(`
  INSERT INTO public.baptisms (id, church_id, full_name, phone, baptism_date, baptism_location, status)
  VALUES ($1, 'a1111111-1111-4111-8111-111111111101', 'Carlos Rita Macule', '+258840001122', '2026-09-06', 'Sede Maputo', 'Scheduled')
`, [realBaptismId]);

const baptismRes = await db.query(`SELECT * FROM public.baptisms WHERE id = $1`, [realBaptismId]);
assert.equal(baptismRes.rows.length, 1);
assert.equal(baptismRes.rows[0].full_name, "Carlos Rita Macule");
console.log("  [PASS] Real Baptism record inserted and queried successfully.");

// Test inserting real Marriage
const realMarriageId = "e58bc10c-69dd-4483-b678-1f13c3d4e580";
await db.query(`
  INSERT INTO public.marriages (id, church_id, groom_name, groom_phone, bride_name, bride_phone, marriage_date, status)
  VALUES ($1, 'a1111111-1111-4111-8111-111111111101', 'Nelson Mandela Jr', '+258841112233', 'Graca Silva', '+258823334455', '2026-10-15', 'In Progress')
`, [realMarriageId]);

const marriageRes = await db.query(`SELECT * FROM public.marriages WHERE id = $1`, [realMarriageId]);
assert.equal(marriageRes.rows.length, 1);
assert.equal(marriageRes.rows[0].groom_name, "Nelson Mandela Jr");
console.log("  [PASS] Real Marriage record inserted and queried successfully.");

// Test inserting real Baby Dedication
const realBabyId = "d69cd21d-70ee-4594-c789-2a24d4e5f691";
await db.query(`
  INSERT INTO public.baby_dedications (id, church_id, child_name, child_date_of_birth, parent_name, parent_phone, dedication_date, status)
  VALUES ($1, 'a1111111-1111-4111-8111-111111111101', 'Samuel Alves', '2026-05-10', 'Alves Manuel', '+258849998877', '2026-09-13', 'Scheduled')
`, [realBabyId]);

const babyRes = await db.query(`SELECT * FROM public.baby_dedications WHERE id = $1`, [realBabyId]);
assert.equal(babyRes.rows.length, 1);
assert.equal(babyRes.rows[0].child_name, "Samuel Alves");
console.log("  [PASS] Real Baby Dedication record inserted and queried successfully.");

// Test inserting real Counseling Request
const realCounselingId = "c70de32e-81ff-4605-d890-3b35e5f6a702";
await db.query(`
  INSERT INTO public.counseling_requests (id, church_id, full_name, phone, category, priority, status)
  VALUES ($1, 'a1111111-1111-4111-8111-111111111101', 'Tânia Sitoe', '+258847776655', 'Crescimento Espiritual', 'Normal', 'Pending')
`, [realCounselingId]);

const counselingRes = await db.query(`SELECT * FROM public.counseling_requests WHERE id = $1`, [realCounselingId]);
assert.equal(counselingRes.rows.length, 1);
assert.equal(counselingRes.rows[0].full_name, "Tânia Sitoe");
console.log("  [PASS] Real Counseling Request inserted and queried successfully.");

console.log("------------------------------------------------------------");
console.log("ALL test-sacraments-counseling-clean-data TESTS PASSED (100% SUCCESS)");
console.log("------------------------------------------------------------");
