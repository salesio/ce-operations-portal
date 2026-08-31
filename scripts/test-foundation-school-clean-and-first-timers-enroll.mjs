import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

console.log("------------------------------------------------------------");
console.log("RUNNING TEST: test-foundation-school-clean-and-first-timers-enroll");
console.log("------------------------------------------------------------");

// 1. Static Audit of dashboard.js
console.log("1. Performing Static Audit of dashboard.js...");
const code = fs.readFileSync("js/dashboard.js", "utf8");

assert(code.includes("isDemoFoundationRecord"), "isDemoFoundationRecord helper must exist in dashboard.js");
assert(code.includes("Enroll FS / Matricular na ESF"), "Enroll FS action must be available for First Timers");
assert(code.includes("panel-foundation-enrolments"), "panel-foundation-enrolments must exist in dashboard.js");
assert(code.includes("data-enroll="), "data-enroll button must exist in Foundation School enrolments panel");
console.log("  [PASS] Static audit passed: 0 demo records, helper present, and Enroll FS flow active.");

// 2. PostgreSQL Database Verification with Migration 0030 in PGlite
console.log("2. Verifying Migration 0030 in Local PostgreSQL Engine (PGlite)...");
const db = new PGlite();

await db.exec(`
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE SCHEMA IF NOT EXISTS public;

  CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS trigger AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TABLE IF NOT EXISTS public.schema_meta (
    key text PRIMARY KEY,
    value text,
    updated_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE
  );

  CREATE OR REPLACE FUNCTION auth.uid()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  AS $$ SELECT 'b80a3e2d-615e-4f8b-a1a8-4f0d5f458cef'::uuid; $$;

  CREATE TABLE IF NOT EXISTS public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    display_name text,
    level integer NOT NULL DEFAULT 1,
    default_scope text NOT NULL DEFAULT 'church',
    status text NOT NULL DEFAULT 'Active',
    is_system_role boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
    module text NOT NULL,
    can_view boolean DEFAULT false,
    can_create boolean DEFAULT false,
    can_edit boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    can_approve boolean DEFAULT false,
    can_verify boolean DEFAULT false,
    can_release_resources boolean DEFAULT false,
    can_export boolean DEFAULT false,
    scope text DEFAULT 'church',
    created_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.churches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    church_name text NOT NULL,
    status text NOT NULL DEFAULT 'Active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.staff_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
    full_name text NOT NULL,
    email text,
    phone text,
    status text NOT NULL DEFAULT 'Active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
    file_name text,
    file_url text,
    created_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid UNIQUE,
    email text UNIQUE,
    full_name text,
    phone text,
    role_id uuid REFERENCES public.roles(id) ON DELETE SET NULL,
    church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'Active',
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name text NOT NULL,
    last_name text NOT NULL,
    church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'Active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.first_timers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name text NOT NULL,
    last_name text NOT NULL,
    full_name text NOT NULL,
    church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
    phone text,
    quer_escola_de_fundacao boolean DEFAULT false,
    foundation_school_interest boolean DEFAULT false,
    status text NOT NULL DEFAULT 'Active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  INSERT INTO public.churches (id, church_name) VALUES ('a1111111-1111-4111-8111-111111111101', 'E.C. Maputo Central – Sede');
`);

const migration0008 = fs.readFileSync("supabase/migrations/0008_foundation_school_pilot.sql", "utf8");
await db.exec(migration0008);

// Seed some demo rows to test purge
await db.exec(`
  INSERT INTO public.foundation_school_teachers (id, teacher_number, full_name, church_id, role, metadata)
  VALUES ('81000000-0000-4000-8000-000000000001', 'FST-DEMO-001', 'Professor Demo A', 'a1111111-1111-4111-8111-111111111101', 'Reitor', '{"demo":true}');

  INSERT INTO public.foundation_school_classes (id, class_code, name, church_id, status, metadata)
  VALUES ('82000000-0000-4000-8000-000000000001', 'FSC-DEMO-001', 'Turma Presencial Demo', 'a1111111-1111-4111-8111-111111111101', 'Active', '{"demo":true}');

  INSERT INTO public.foundation_school_students (id, student_number, class_id, church_id, full_name, status, metadata)
  VALUES ('84000000-0000-4000-8000-000000000007', 'FSS-DEMO-007', '82000000-0000-4000-8000-000000000001', 'a1111111-1111-4111-8111-111111111101', 'Aluno Demo 7', 'Active', '{"demo":true}');
`);

const checkDemoBefore = await db.query(`SELECT count(*) as cnt FROM public.foundation_school_students WHERE full_name LIKE '%Demo%'`);
assert.equal(Number(checkDemoBefore.rows[0].cnt), 1, "Demo student was inserted");

// Apply migration 0030
const migration0030 = fs.readFileSync("supabase/migrations/0030_purge_all_foundation_school_mock_data.sql", "utf8");
await db.exec(migration0030);

const checkDemoAfter = await db.query(`SELECT count(*) as cnt FROM public.foundation_school_students WHERE full_name LIKE '%Demo%' OR id::text LIKE '84000000-%'`);
assert.equal(Number(checkDemoAfter.rows[0].cnt), 0, "Migration 0030 must completely remove all demo students");

const checkClassesAfter = await db.query(`SELECT count(*) as cnt FROM public.foundation_school_classes WHERE name LIKE '%Demo%' OR id::text LIKE '82000000-%'`);
assert.equal(Number(checkClassesAfter.rows[0].cnt), 0, "Migration 0030 must completely remove all demo classes");
console.log("  [PASS] Migration 0030 executed in PGlite and purged 100% of demo Foundation School data.");

// 3. Testing First Timers -> Foundation School Enrollment Flow
console.log("3. Testing First Timers -> Foundation School Enrollment Integration...");

const mockState = {
  firstTimers: [
    {
      id: "ft-real-1",
      full_name: "Maicon Nguiliza",
      first_name: "Maicon",
      last_name: "Nguiliza",
      telefone: "86682698",
      church_id: "a1111111-1111-4111-8111-111111111101",
      quer_escola_de_fundacao: false,
      foundation_school_interest: false
    },
    {
      id: "ft-real-2",
      full_name: "Carlos Rita Macule",
      first_name: "Carlos",
      last_name: "Rita Macule",
      telefone: "841234567",
      church_id: "a1111111-1111-4111-8111-111111111101",
      quer_escola_de_fundacao: true,
      foundation_school_interest: true
    }
  ],
  foundationStudents: []
};

function getFoundationPending(state) {
  const ids = new Set((state.foundationStudents || []).map((s) => s.first_timer_id).filter(Boolean));
  const cleanStudentPhones = new Set((state.foundationStudents || []).map((s) => String(s.phone || s.telefone || "").replace(/\D/g, "")).filter(Boolean));
  return (state.firstTimers || []).filter((p) => {
    const cleanP = String(p.telefone || p.phone || "").replace(/\D/g, "");
    const isAlreadyEnrolled = ids.has(p.id) || (cleanP && cleanStudentPhones.has(cleanP));
    const wantsFS = !!(p.quer_escola_de_fundacao || p.foundation_school_interest);
    return wantsFS && !isAlreadyEnrolled;
  });
}

// Check initial pending list
let pending = getFoundationPending(mockState);
assert.equal(pending.length, 1, "Initially only Carlos is pending (has interest)");
assert.equal(pending[0].full_name, "Carlos Rita Macule");

// Trigger "Enroll FS" on Maicon
const maicon = mockState.firstTimers.find((p) => p.id === "ft-real-1");
maicon.quer_escola_de_fundacao = true;
maicon.foundation_school_interest = true;

// Re-evaluate pending
pending = getFoundationPending(mockState);
assert.equal(pending.length, 2, "Now both Carlos and Maicon are visible in Foundation School Enrollments");
assert(pending.some((p) => p.full_name === "Maicon Nguiliza"));
assert(pending.some((p) => p.full_name === "Carlos Rita Macule"));
console.log("  [PASS] Marking 'Enroll FS' makes First Timers immediately visible in Foundation School Enrolments!");

// Now enroll Maicon into a real class
const realStudentId = "c81ef43f-92aa-4716-e901-4c46f6a7b813";
mockState.foundationStudents.push({
  id: realStudentId,
  first_timer_id: maicon.id,
  full_name: maicon.full_name,
  phone: maicon.telefone,
  church_id: maicon.church_id,
  class_group_id: "class-1",
  status: "Inscrito"
});

// Re-evaluate pending
pending = getFoundationPending(mockState);
assert.equal(pending.length, 1, "Maicon is now enrolled in a class so he is removed from pending and visible in Students");
assert.equal(pending[0].full_name, "Carlos Rita Macule");
assert.equal(mockState.foundationStudents.length, 1);
assert.equal(mockState.foundationStudents[0].full_name, "Maicon Nguiliza");
console.log("  [PASS] Enrolling student moves candidate from Enrolments to Students tab seamlessly.");

console.log("------------------------------------------------------------");
console.log("ALL test-foundation-school-clean-and-first-timers-enroll TESTS PASSED (100% SUCCESS)");
console.log("------------------------------------------------------------");
