import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DEFAULT_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const DEFAULT_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

const outputPath = resolve(process.argv[2] || "js/runtime-config.js");
const url = String(process.env.VITE_SUPABASE_URL || process.env.CE_SUPABASE_URL || DEFAULT_URL).trim();
const anonKey = String(process.env.VITE_SUPABASE_ANON_KEY || process.env.CE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY).trim();
const dataSource = String(process.env.VITE_DATA_SOURCE || process.env.CE_DATA_SOURCE || "supabase").trim();
const enableSupabase = String(process.env.VITE_ENABLE_SUPABASE || "true").trim();
const enableRealAuth = String(process.env.VITE_ENABLE_REAL_AUTH || process.env.CE_ENABLE_REAL_AUTH || "true").trim();
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
      VITE_DATA_SOURCE: dataSource || "supabase",
      VITE_ENABLE_SUPABASE: /^(1|true|yes|on)$/i.test(enableSupabase) ? "true" : "false",
      VITE_ENABLE_STORAGE: "false",
      VITE_ENABLE_REAL_AUTH: /^(1|true|yes|on)$/i.test(enableRealAuth) ? "true" : "false",
      VITE_SUPABASE_URL: url ? url.replace(/\/$/, "") : DEFAULT_URL,
      VITE_SUPABASE_ANON_KEY: anonKey || DEFAULT_ANON_KEY,
    };

const serializedConfig = JSON.stringify(config).replace(/</g, "\\u003c");
const content = `/* Generated during GitHub Pages deployment. Do not edit or add backend credentials. */\nwindow.__CE_ENV__ = Object.assign(window.__CE_ENV__ || {}, ${serializedConfig});\n`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, content, "utf8");
console.log(`GitHub Pages runtime config: ${liveSupabase ? "Supabase enabled" : `data source=${dataSource}`}.`);

