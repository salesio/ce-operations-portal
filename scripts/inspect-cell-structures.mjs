import { executeSql } from "./run-supabase-sql.mjs";

async function check() {
  const groupsCols = await executeSql(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cell_groups'
    ORDER BY ordinal_position;
  `);
  console.log("cell_groups columns:", groupsCols);

  const cellsCols = await executeSql(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cells'
    ORDER BY ordinal_position;
  `);
  console.log("cells columns:", cellsCols);

  const groups = await executeSql(`SELECT id, name, code, church_id, status FROM public.cell_groups;`);
  console.log("Existing cell_groups:", groups);

  const churches = await executeSql(`SELECT id, name, code FROM public.churches;`);
  console.log("Existing churches:", churches);
}

check().catch(console.error);
