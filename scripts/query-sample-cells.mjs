import { executeSql } from "./run-supabase-sql.mjs";

async function queryCells() {
  const cells = await executeSql("SELECT id, name, cell_name, raw_name, cell_group_name, member_count FROM public.cells LIMIT 15;");
  console.log("Sample cells in DB:", cells);
}

queryCells().catch(console.error);
