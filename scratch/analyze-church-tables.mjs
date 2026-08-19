import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const schemaSql = readFileSync(join(root, "database/schema.sql"), "utf8");

const migrationsDir = join(root, "supabase/migrations");
const migrationFiles = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));

const allSql = [schemaSql];
for (const f of migrationFiles) {
  allSql.push(readFileSync(join(migrationsDir, f), "utf8"));
}

const fullSql = allSql.join("\n\n");

// Parse table creations and columns
const tablesWithChurchId = new Map();

// Regex for CREATE TABLE
const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi;
let match;
while ((match = tableRegex.exec(fullSql)) !== null) {
  const tableName = match[1];
  const body = match[2];
  const lines = body.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (/church_id/i.test(trimmed) || /REFERENCES\s+public\.churches/i.test(trimmed)) {
      const colMatch = trimmed.match(/^([a-zA-Z0-9_]+)/);
      if (colMatch) {
        const colName = colMatch[1];
        if (!tablesWithChurchId.has(tableName)) {
          tablesWithChurchId.set(tableName, new Set());
        }
        tablesWithChurchId.get(tableName).add(colName);
      }
    }
  }
}

// Also check ALTER TABLE ADD COLUMN
const alterRegex = /ALTER\s+TABLE\s+(?:ONLY\s+)?public\.([a-zA-Z0-9_]+)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)[\s\S]*?(?:REFERENCES\s+public\.churches|church_id)/gi;
while ((match = alterRegex.exec(fullSql)) !== null) {
  const tableName = match[1];
  const colName = match[2];
  if (!tablesWithChurchId.has(tableName)) {
    tablesWithChurchId.set(tableName, new Set());
  }
  tablesWithChurchId.get(tableName).add(colName);
}

console.log(`Found ${tablesWithChurchId.size} tables with church reference columns:`);
for (const [table, cols] of Array.from(tablesWithChurchId.entries()).sort()) {
  console.log(`- public.${table}: ${Array.from(cols).join(", ")}`);
}
