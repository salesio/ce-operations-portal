import fs from "fs";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

async function checkTable(tableName) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=5`, {
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Table '${tableName}' EXISTS. Row count sample: ${data.length}`);
      if (data.length > 0) {
        console.log(`Sample columns for '${tableName}':`, Object.keys(data[0]));
      }
      return true;
    } else {
      console.log(`❌ Table '${tableName}' returned status ${res.status}`);
      return false;
    }
  } catch (err) {
    console.log(`❌ Table '${tableName}' error: ${err.message}`);
    return false;
  }
}

console.log("Checking tables in Supabase DB...");
await checkTable("cell_groups");
await checkTable("cell_registry");
await checkTable("cells");
await checkTable("members");
