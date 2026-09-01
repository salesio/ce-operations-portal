import { executeSql } from "./run-supabase-sql.mjs";

async function run() {
  const sql = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'follow_ups'
    ORDER BY ordinal_position;
  `;
  const res = await executeSql(sql);
  console.log("follow_ups columns:", res);
}

run().catch(console.error);
