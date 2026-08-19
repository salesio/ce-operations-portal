import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const outputPath = resolve(process.argv[2] || "js/runtime-config.js");
const url = String(process.env.VITE_SUPABASE_URL || process.env.CE_SUPABASE_URL || "").trim();
const anonKey = String(process.env.VITE_SUPABASE_ANON_KEY || process.env.CE_SUPABASE_ANON_KEY || "").trim();
const dataSource = String(process.env.VITE_DATA_SOURCE || process.env.CE_DATA_SOURCE || (url && anonKey ? "supabase" : "mock")).trim();
const enableSupabase = String(process.env.VITE_ENABLE_SUPABASE || (url && anonKey ? "true" : "false")).trim();
const enableRealAuth = String(process.env.VITE_ENABLE_REAL_AUTH || process.env.CE_ENABLE_REAL_AUTH || "false").trim();
const enableStorage = String(process.env.VITE_ENABLE_STORAGE || "false").trim();

const liveSupabase = /^(1|true|yes|on)$/i.test(enableSupabase)
  && dataSource === "supabase"
  && /^https:\/\/[^/]+\.supabase\.co\/?$/i.test(url)
  && anonKey.length > 20;

const config = liveSupabase
  ? {
      VITE_DATA_SOURCE: "supabase",
      VITE_ENABLE_SUPABASE: "true",
      VITE_ENABLE_STORAGE: /^(1|true|yes|on)$/i.test(enableStorage) ? "true" : "false",
      VITE_ENABLE_REAL_AUTH: /^(1|true|yes|on)$/i.test(enableRealAuth) ? "true" : "false",
      VITE_SUPABASE_URL: url.replace(/\/$/, ""),
      VITE_SUPABASE_ANON_KEY: anonKey,
    }
  : {
      VITE_DATA_SOURCE: dataSource || "mock",
      VITE_ENABLE_SUPABASE: /^(1|true|yes|on)$/i.test(enableSupabase) ? "true" : "false",
      VITE_ENABLE_STORAGE: "false",
      VITE_ENABLE_REAL_AUTH: /^(1|true|yes|on)$/i.test(enableRealAuth) ? "true" : "false",
      VITE_SUPABASE_URL: url ? url.replace(/\/$/, "") : "",
      VITE_SUPABASE_ANON_KEY: anonKey,
    };

const serializedConfig = JSON.stringify(config).replace(/</g, "\\u003c");
const content = `/* Generated during GitHub Pages deployment. Do not edit or add backend credentials. */\nwindow.__CE_ENV__ = Object.assign(window.__CE_ENV__ || {}, ${serializedConfig});\n`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, content, "utf8");
console.log(`GitHub Pages runtime config: ${liveSupabase ? "Supabase enabled" : `data source=${dataSource}`}.`);

