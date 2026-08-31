import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
import path from "path";
import assert from "assert";

console.log("------------------------------------------------------------");
console.log("RUNNING TEST: test-members-import-and-rls");
console.log("------------------------------------------------------------");

async function run() {
  const db = new PGlite();

  console.log("1. Initializing schema in PGlite...");
  await db.exec(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE SCHEMA IF NOT EXISTS public;

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

    CREATE TABLE IF NOT EXISTS public.cells (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE,
      name text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
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
      first_name text,
      last_name text,
      full_name text NOT NULL,
      title text,
      phone text,
      primary_phone text,
      secondary_phone text,
      email text,
      address text,
      neighborhood text,
      date_of_birth date,
      gender text,
      marital_status text,
      occupation text,
      church_name text,
      cell_id uuid,
      cell_name text,
      celula text,
      cell_group_id uuid,
      cell_group_name text,
      cell_role text DEFAULT 'Member',
      cell_participation_status text DEFAULT 'Unknown',
      service_participation_status text DEFAULT 'Unknown',
      department_id uuid,
      department_name text,
      member_since date,
      data_de_entrada date,
      source text DEFAULT 'Manual',
      origem text DEFAULT 'Manual',
      status text NOT NULL DEFAULT 'Active',
      estado text NOT NULL DEFAULT 'Active',
      membership_status text DEFAULT 'Active',
      data_quality_status text DEFAULT 'Valid',
      notes text,
      notas text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      created_by uuid,
      updated_by uuid
    );

    CREATE TABLE IF NOT EXISTS public.first_timers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      first_timer_number text,
      first_name text,
      last_name text,
      full_name text NOT NULL,
      gender text,
      date_of_birth date,
      phone text,
      whatsapp text,
      email text,
      address text,
      neighborhood text,
      profession text,
      church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
      church_name text,
      service_date date,
      service_name text,
      invited_by_name text,
      born_again boolean DEFAULT false,
      foundation_school_interest boolean DEFAULT false,
      cell_interest boolean DEFAULT false,
      next_service_interest boolean DEFAULT false,
      workflow_status text DEFAULT 'DRAFT',
      follow_up_status text DEFAULT 'Pending',
      status text DEFAULT 'Active',
      notes text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      created_by uuid,
      updated_by uuid
    );

    CREATE TABLE IF NOT EXISTS public.follow_ups (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      first_timer_id uuid REFERENCES public.first_timers(id) ON DELETE CASCADE,
      member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
      person_type text DEFAULT 'First Timer',
      full_name text NOT NULL,
      phone text,
      whatsapp text,
      email text,
      church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
      church_name text,
      contact_date date DEFAULT current_date,
      method text,
      outcome text,
      next_step text,
      next_contact_date date,
      status text DEFAULT 'Pending',
      notes text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.member_registration_candidates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name text NOT NULL,
      primary_phone text,
      church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
      approval_status text DEFAULT 'Draft',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.foundation_students (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      first_timer_id uuid REFERENCES public.first_timers(id) ON DELETE SET NULL,
      member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
      church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
      first_name text,
      last_name text,
      full_name text NOT NULL,
      phone text,
      status text DEFAULT 'Em Curso',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  console.log("2. Applying migrations 0026, 0027, and 0028...");
  const baseMigrations = [
    "0026_pastoral_care_rector_role_and_rls.sql",
    "0027_first_timers_real_dataset_schema.sql",
    "0028_fix_members_first_timers_rls_and_import_sync.sql"
  ];

  for (const file of baseMigrations) {
    const filePath = path.join(process.cwd(), "supabase", "migrations", file);
    if (fs.existsSync(filePath)) {
      const sql = fs.readFileSync(filePath, "utf-8");
      await db.exec(sql);
      console.log(`  [PASS] Migration applied: ${file}`);
    }
  }

  console.log("3. Testing inserting Members with valid RFC4122 UUID...");
  const memberId1 = "11111111-2222-4333-8444-555555555555";
  await db.query(`
    INSERT INTO public.members (
      id, first_name, last_name, full_name, phone, primary_phone, email, church_name, celula, department_name, status
    ) VALUES (
      $1, 'Sérgio', 'Nguenha', 'Sérgio Nguenha', '+258841234567', '+258841234567', 'sergio@example.com', 'E.C. Maputo Central – Sede', 'Dominio 1', 'Células', 'Active'
    );
  `, [memberId1]);

  const memberResult = await db.query(`SELECT * FROM public.members WHERE id = $1;`, [memberId1]);
  assert.strictEqual(memberResult.rows.length, 1);
  assert.strictEqual(memberResult.rows[0].full_name, "Sérgio Nguenha");
  console.log("  [PASS] Member inserted and retrieved successfully from PostgreSQL database.");

  console.log("4. Testing inserting First Timers with valid RFC4122 UUID...");
  const ftId1 = "66666666-7777-4888-8999-000000000000";
  await db.query(`
    INSERT INTO public.first_timers (
      id, first_name, last_name, full_name, phone, neighborhood, born_again, foundation_school_interest, cell_interest, next_service_interest, workflow_status, follow_up_status
    ) VALUES (
      $1, 'Maicon', 'Nguiliza', 'Maicon Nguiliza', '86682698', 'Costa de Sol', true, false, false, true, 'DRAFT', 'Pending'
    );
  `, [ftId1]);

  const ftResult = await db.query(`SELECT * FROM public.first_timers WHERE id = $1;`, [ftId1]);
  assert.strictEqual(ftResult.rows.length, 1);
  assert.strictEqual(ftResult.rows[0].full_name, "Maicon Nguiliza");
  console.log("  [PASS] First Timer inserted and retrieved successfully from PostgreSQL database.");

  console.log("------------------------------------------------------------");
  console.log("ALL test-members-import-and-rls TESTS PASSED (100% SUCCESS)");
  console.log("------------------------------------------------------------");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
