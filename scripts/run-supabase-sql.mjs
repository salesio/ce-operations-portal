import fs from "node:fs";
import path from "node:path";

export function getSupabaseCredentials() {
  let token = process.env.SUPABASE_ACCESS_TOKEN || "";
  let projectRef = process.env.SUPABASE_PROJECT_ID || "";

  const envPath = path.resolve(".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const matchToken = line.match(/^SUPABASE_ACCESS_TOKEN=["']?([^"'\r\n]+)["']?/);
      if (matchToken) token = matchToken[1].trim();
      const matchRef = line.match(/^SUPABASE_PROJECT_ID=["']?([^"'\r\n]+)["']?/);
      if (matchRef) projectRef = matchRef[1].trim();
    }
  }

  return { token, projectRef };
}

export async function executeSql(sql) {
  const { token, projectRef } = getSupabaseCredentials();
  if (!token || !projectRef) {
    throw new Error("SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_ID missing in .env.local");
  }

  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${errText}`);
  }

  const result = await response.json();
  return result;
}

async function main() {
  const sqlFile = process.argv[2] || "supabase/migrations/0034_secure_authenticated_users_permissions.sql";
  console.log(`Executing SQL file: ${sqlFile}...`);
  const sql = fs.readFileSync(sqlFile, "utf8");

  const result = await executeSql(sql);
  console.log("SQL Execution SUCCESS!");
  console.log("Result:", JSON.stringify(result, null, 2));
}

if (process.argv[1]?.endsWith("run-supabase-sql.mjs")) {
  main().catch((e) => {
    console.error("SQL Execution FAILED:", e);
    process.exit(1);
  });
}
