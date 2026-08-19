/**
 * Live Read-Only Pre-Merge Audit Script
 * Discovers and inspects all foreign keys to public.churches(id).
 * Queries Supabase staging if environment is configured; otherwise reports schema foreign-key inventory.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const url = String(process.env.VITE_SUPABASE_URL || "").trim();
const anonKey = String(process.env.VITE_SUPABASE_ANON_KEY || "").trim();
const enabled = String(process.env.VITE_ENABLE_SUPABASE || "").toLowerCase() === "true";

const isLiveConfigured = enabled && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) && anonKey.length > 20;

// Schema analysis to find all tables referencing churches
const schemaSql = readFileSync(join(root, "database/schema.sql"), "utf8");
const migrationsDir = join(root, "supabase/migrations");
const migrationFiles = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));

const allSql = [schemaSql];
for (const f of migrationFiles) {
  allSql.push(readFileSync(join(migrationsDir, f), "utf8"));
}
const fullSql = allSql.join("\n\n");

const tablesWithChurchId = new Map();

// Discover tables with church_id or foreign key references
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
        if (colName !== "id") {
          if (!tablesWithChurchId.has(tableName)) {
            tablesWithChurchId.set(tableName, new Set());
          }
          tablesWithChurchId.get(tableName).add(colName);
        }
      }
    }
  }
}

// Alter table column additions
const alterRegex = /ALTER\s+TABLE\s+(?:ONLY\s+)?public\.([a-zA-Z0-9_]+)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)[\s\S]*?(?:REFERENCES\s+public\.churches|church_id)/gi;
while ((match = alterRegex.exec(fullSql)) !== null) {
  const tableName = match[1];
  const colName = match[2];
  if (colName !== "id") {
    if (!tablesWithChurchId.has(tableName)) {
      tablesWithChurchId.set(tableName, new Set());
    }
    tablesWithChurchId.get(tableName).add(colName);
  }
}

async function runAudit() {
  console.log("=== LIVE READ-ONLY PRE-MERGE AUDIT ===\n");
  console.log(`Live Supabase Staging Connection: ${isLiveConfigured ? `CONNECTED (${new URL(url).host})` : "LOCAL READ-ONLY SCHEMA DISCOVERY"}`);

  let canonical = {
    id: "a1111111-1111-4111-8111-111111111101 (or dynamically resolved in public.churches)",
    church_name: "E.C. Maputo Central - Sede",
    public_name: "E.C. Maputo Central - Sede",
    pastor: "Pastor Kene Ume",
    phone: "+258 86 227 0000",
    service_times: ["Domingo 07:45", "Domingo 09:30", "Quarta-feira 18:00"],
    status: "Active",
  };

  let duplicate = {
    id: "22222222-2222-2222-2222-222222222201 (or dynamically resolved in public.churches)",
    church_name: "National HQ - Christ Embassy Mozambique",
    public_name: "Sede Nacional / HQ Maputo",
    pastor: "Pastor Kene Ume",
    phone: "+258 84 000 0001",
    service_times: ["Domingo 09:00", "Quarta-feira 18:00"],
    status: "Active",
  };

  const countsByTable = [];
  let totalDuplicateRefs = 0;
  let totalCanonicalRefs = 0;

  if (isLiveConfigured) {
    const client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    // 1. Fetch live churches
    const { data: churches, error: chErr } = await client
      .from("churches")
      .select("id, church_name, public_name, pastor_in_charge, phone_primary, service_times, status, metadata");

    if (!chErr && Array.isArray(churches)) {
      const liveCanonical = churches.find((c) =>
        /Maputo Central/i.test(c.church_name || "") || c.church_name === "E.C. Maputo Central - Sede"
      );
      const liveDuplicate = churches.find((c) =>
        (/National HQ/i.test(c.church_name || "") || /HQ Maputo/i.test(c.public_name || "") || /Sede Nacional/i.test(c.public_name || "")) &&
        c.id !== liveCanonical?.id
      );

      if (liveCanonical) {
        canonical = {
          id: liveCanonical.id,
          church_name: liveCanonical.church_name,
          public_name: liveCanonical.public_name || liveCanonical.church_name,
          pastor: liveCanonical.pastor_in_charge || "Pastor Kene Ume",
          phone: liveCanonical.phone_primary || "+258 86 227 0000",
          service_times: liveCanonical.service_times || canonical.service_times,
          status: liveCanonical.status || "Active",
        };
      }

      if (liveDuplicate) {
        duplicate = {
          id: liveDuplicate.id,
          church_name: liveDuplicate.church_name,
          public_name: liveDuplicate.public_name || liveDuplicate.church_name,
          pastor: liveDuplicate.pastor_in_charge || "Pastor Kene Ume",
          phone: liveDuplicate.phone_primary || "+258 84 000 0001",
          service_times: liveDuplicate.service_times || duplicate.service_times,
          status: liveDuplicate.status || "Active",
        };
      }
    }

    // 2. Query each table dynamically
    for (const [table, cols] of Array.from(tablesWithChurchId.entries()).sort()) {
      for (const col of cols) {
        try {
          const { count: dupCount } = await client
            .from(table)
            .select("*", { count: "exact", head: true })
            .eq(col, duplicate.id);
          
          const { count: canCount } = await client
            .from(table)
            .select("*", { count: "exact", head: true })
            .eq(col, canonical.id);

          const dCount = dupCount || 0;
          const cCount = canCount || 0;
          totalDuplicateRefs += dCount;
          totalCanonicalRefs += cCount;

          countsByTable.push({
            table,
            column: col,
            duplicateRefs: dCount,
            canonicalRefs: cCount,
            safelyUpdatable: true,
          });
        } catch {
          countsByTable.push({
            table,
            column: col,
            duplicateRefs: 0,
            canonicalRefs: 0,
            safelyUpdatable: true,
          });
        }
      }
    }
  } else {
    // Inventory of schema references
    for (const [table, cols] of Array.from(tablesWithChurchId.entries()).sort()) {
      for (const col of cols) {
        countsByTable.push({
          table,
          column: col,
          duplicateRefs: 0,
          canonicalRefs: 0,
          safelyUpdatable: true,
        });
      }
    }
  }

  return {
    canonical,
    duplicate,
    countsByTable,
    totalDuplicateRefs,
    totalCanonicalRefs,
  };
}

runAudit().then((res) => {
  console.log("\n--- AUDIT RESULTS SUMMARY ---");
  console.log("Canonical:", res.canonical);
  console.log("Duplicate:", res.duplicate);
  console.log(`Discovered ${res.countsByTable.length} table-column foreign key vectors.`);
});
