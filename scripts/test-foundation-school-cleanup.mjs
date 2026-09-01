import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";

console.log("------------------------------------------------------------");
console.log("RUNNING TEST: test-foundation-school-cleanup");
console.log("------------------------------------------------------------");

const db = new PGlite();

console.log("1. Initializing schema in PGlite...");
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
  AS $$ SELECT 'ac47e5fa-f9f5-4d58-ab91-eebcb01f1b01'::uuid; $$;

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
    church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
    full_name text NOT NULL,
    phone text,
    status text NOT NULL DEFAULT 'Active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.cells (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.first_timers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_timer_number text,
    full_name text NOT NULL,
    phone text,
    church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'Pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.follow_ups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_timer_id uuid REFERENCES public.first_timers(id) ON DELETE SET NULL,
    full_name text,
    phone text,
    church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
    status text DEFAULT 'Pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.foundation_students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
    first_name text,
    last_name text,
    full_name text,
    phone text,
    status text DEFAULT 'Inscrito'
  );

  CREATE TABLE IF NOT EXISTS public.member_registration_candidates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
    first_name text,
    last_name text,
    full_name text,
    phone text,
    status text DEFAULT 'Pending'
  );
`);

console.log("2. Applying migrations 0008, 0026, 0027, 0028, and 0029...");
const mig08 = fs.readFileSync("supabase/migrations/0008_foundation_school_pilot.sql", "utf8");
await db.exec(mig08);
console.log("  [PASS] Migration applied: 0008_foundation_school_pilot.sql");

const mig26 = fs.readFileSync("supabase/migrations/0026_pastoral_care_rector_role_and_rls.sql", "utf8");
await db.exec(mig26);
console.log("  [PASS] Migration applied: 0026_pastoral_care_rector_role_and_rls.sql");

const mig27 = fs.readFileSync("supabase/migrations/0027_first_timers_real_dataset_schema.sql", "utf8");
await db.exec(mig27);
console.log("  [PASS] Migration applied: 0027_first_timers_real_dataset_schema.sql");

const mig28 = fs.readFileSync("supabase/migrations/0028_fix_members_first_timers_rls_and_import_sync.sql", "utf8");
await db.exec(mig28);
console.log("  [PASS] Migration applied: 0028_fix_members_first_timers_rls_and_import_sync.sql");

// Insert demo seed to test migration 0029 purge logic
await db.exec(`
  INSERT INTO public.foundation_school_teachers (id, teacher_number, full_name, role, metadata)
  VALUES ('81000000-0000-4000-8000-000000000001', 'FST-DEMO-001', 'Professor Demo A', 'Professor', '{"demo":true}');

  INSERT INTO public.foundation_school_classes (id, class_code, name, modality, metadata)
  VALUES ('82000000-0000-4000-8000-000000000001', 'FSC-DEMO-001', 'Turma Presencial Demo', 'Presencial', '{"demo":true}');

  INSERT INTO public.foundation_school_students (id, student_number, class_id, full_name, modality, status, metadata)
  VALUES ('84000000-0000-4000-8000-000000000001', 'FSS-DEMO-001', '82000000-0000-4000-8000-000000000001', 'Aluno Demo 1', 'Presencial', 'Active', '{"demo":true}');
`);

const mig29 = fs.readFileSync("supabase/migrations/0029_clean_foundation_school_mock_data.sql", "utf8");
await db.exec(mig29);
console.log("  [PASS] Migration applied: 0029_clean_foundation_school_mock_data.sql");

console.log("3. Testing inserting and verifying clean real Foundation School records...");
const churchId = "a1111111-1111-4111-8111-111111111101";
await db.query(`
  INSERT INTO public.churches (id, church_name)
  VALUES ($1, 'E.C. Maputo Central – Sede')
  ON CONFLICT (id) DO NOTHING;
`, [churchId]);

// Real Teacher
const teacherId = "91111111-1111-4111-8111-111111111101";
await db.query(`
  INSERT INTO public.foundation_school_teachers (
    id, teacher_number, full_name, phone, email, church_id, church_name, role, status
  ) VALUES (
    $1, 'FST-001', 'Pastor Valdemiro Machava', '+258 84 123 4567', 'p.care@embaixadadecristo.org', $2, 'E.C. Maputo Central – Sede', 'Reitor', 'Active'
  )
`, [teacherId, churchId]);
console.log("  [PASS] Real teacher inserted successfully.");

// Real Class
const classId = "92222222-2222-4222-8222-222222222202";
await db.query(`
  INSERT INTO public.foundation_school_classes (
    id, class_code, name, church_id, church_name, modality, teacher_id, teacher_name, status
  ) VALUES (
    $1, 'TURMA-2026-Q3', 'Turma Central Q3 2026', $2, 'E.C. Maputo Central – Sede', 'Presencial', $3, 'Pastor Valdemiro Machava', 'Active'
  )
`, [classId, churchId, teacherId]);
console.log("  [PASS] Real class group inserted successfully.");

// Real Student
const studentId = "93333333-3333-4333-8333-333333333303";
await db.query(`
  INSERT INTO public.foundation_school_students (
    id, student_number, class_id, church_id, church_name, full_name, phone, modality, status, lessons_completed
  ) VALUES (
    $1, 'ALUNO-2026-001', $2, $3, 'E.C. Maputo Central – Sede', 'Carlos Alberto Sitoe', '+258 84 999 8888', 'Presencial', 'Active', 0
  )
`, [studentId, classId, churchId]);
console.log("  [PASS] Real student inserted successfully.");

// Verify zero demo data in database
const demoStudents = await db.query("SELECT COUNT(*) as count FROM public.foundation_school_students WHERE metadata->>'demo' = 'true' OR full_name ILIKE '%Demo%'");
const demoTeachers = await db.query("SELECT COUNT(*) as count FROM public.foundation_school_teachers WHERE metadata->>'demo' = 'true' OR full_name ILIKE '%Demo%'");
const demoClasses = await db.query("SELECT COUNT(*) as count FROM public.foundation_school_classes WHERE metadata->>'demo' = 'true' OR name ILIKE '%Demo%'");

if (Number(demoStudents.rows[0].count) !== 0 || Number(demoTeachers.rows[0].count) !== 0 || Number(demoClasses.rows[0].count) !== 0) {
  throw new Error("Demo records still detected in database!");
}
console.log("  [PASS] Verified 0 demo records in Supabase/PGlite database.");

console.log("------------------------------------------------------------");
console.log("ALL test-foundation-school-cleanup TESTS PASSED (100% SUCCESS)");
console.log("------------------------------------------------------------");
await db.close();
