import { executeSql } from "./run-supabase-sql.mjs";

async function verifyDiamantesCells() {
  const cells = await executeSql("SELECT id, name, cell_group_name FROM public.cells WHERE cell_group_name = 'Diamantes Main' ORDER BY name;");
  console.log("Diamantes Main cells in DB:", cells);

  const users = await executeSql("SELECT email, cell_id, cell_group_id, assigned_cells FROM public.users WHERE email LIKE '%diamantes.main%';");
  console.log("Diamantes Main users in DB:", users);
}

verifyDiamantesCells().catch(console.error);
