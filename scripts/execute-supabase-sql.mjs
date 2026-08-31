import fs from "node:fs";
import path from "node:path";

// Load .env.local manually without external dotenv dependency
function loadEnvLocal() {
  const envPath = path.resolve(".env.local");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf8");
  const env = {};
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  });
  return env;
}

const env = loadEnvLocal();
const token = env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN;
const projectId = env.SUPABASE_PROJECT_ID || process.env.SUPABASE_PROJECT_ID;

const targetSqlFile = process.argv[2];

if (!targetSqlFile) {
  console.log("Usage: node scripts/execute-supabase-sql.mjs <path-to-sql-file>");
  console.log("Example: node scripts/execute-supabase-sql.mjs supabase/migrations/0030_purge_all_foundation_school_mock_data.sql");
  process.exit(0);
}

if (!token || !projectId) {
  console.error("❌ ERRO: SUPABASE_ACCESS_TOKEN ou SUPABASE_PROJECT_ID não estão preenchidos no .env.local!");
  console.error("Por favor adicione as suas credenciais ao ficheiro .env.local");
  process.exit(1);
}

if (!fs.existsSync(targetSqlFile)) {
  console.error(`❌ ERRO: Ficheiro SQL não encontrado: ${targetSqlFile}`);
  process.exit(1);
}

const sqlQuery = fs.readFileSync(targetSqlFile, "utf8");

console.log(`🚀 Executando ${targetSqlFile} no projecto Supabase (${projectId})...`);

try {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: sqlQuery
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`❌ Falha na execução do SQL (HTTP ${response.status}):\n`, errText);
    process.exit(1);
  }

  const result = await response.json();
  console.log("✅ SQL EXECUTADO COM SUCESSO NO SUPABASE!");
  if (result && Array.isArray(result) && result.length) {
    console.log("Resultado:", JSON.stringify(result.slice(0, 5), null, 2));
  }
} catch (error) {
  console.error("❌ Erro de conexão com a API do Supabase:", error.message);
  process.exit(1);
}
