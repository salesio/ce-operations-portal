import { executeSql } from "./run-supabase-sql.mjs";

async function run() {
  const sql = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'first_timers'
    ORDER BY ordinal_position;
  `;
  const res = await executeSql(sql);
  console.log("first_timers columns:", res);
}

run().catch(console.error);
