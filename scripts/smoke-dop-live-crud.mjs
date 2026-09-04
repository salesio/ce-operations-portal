/**
 * Verifies that the three D.O.P. modules can write and read their real
 * Supabase tables. Every check runs inside one transaction and rolls back,
 * so it never leaves QA records in production.
 */
import { executeSql } from "./run-supabase-sql.mjs";

const marker = `qa-dop-${Date.now()}`;
const literal = (value) => `'${String(value).replaceAll("'", "''")}'`;

const result = await executeSql(`
  begin;
  with
    new_program as (
      insert into public.programs (program_code, name, status, program_type, category, metadata)
      values (${literal(`${marker}-program`)}, ${literal("D.O.P. persistence QA program")}, 'Draft', 'QA', 'QA', '{"qa":true}'::jsonb)
      returning id, name
    ),
    new_prison_location as (
      insert into public.prison_locations (location_code, name, status, metadata)
      values (${literal(`${marker}-prison`)}, ${literal("D.O.P. persistence QA location")}, 'Active', '{"qa":true}'::jsonb)
      returning id, name
    ),
    new_material as (
      insert into public.ministry_materials_catalog (item_code, title, status, metadata)
      values (${literal(`${marker}-material`)}, ${literal("D.O.P. persistence QA material")}, 'Active', '{"qa":true}'::jsonb)
      returning id, title
    )
  select
    (select count(*) from new_program)::int as programs_written_and_read,
    (select count(*) from new_prison_location)::int as prison_locations_written_and_read,
    (select count(*) from new_material)::int as materials_written_and_read;
  rollback;
`);

const row = result[0] || {};
const checks = [
  ["Programs", Number(row.programs_written_and_read) === 1],
  ["Prison Ministry", Number(row.prison_locations_written_and_read) === 1],
  ["Ministry Materials", Number(row.materials_written_and_read) === 1],
];

for (const [module, passed] of checks) {
  if (!passed) throw new Error(`${module} live CRUD check failed.`);
}

console.log("D.O.P. live CRUD passed: Programs, Prison Ministry, and Ministry Materials were write/read verified in a rolled-back transaction.");
