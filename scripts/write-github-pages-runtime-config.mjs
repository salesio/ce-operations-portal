import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const outputPath = resolve(process.argv[2] || "js/runtime-config.js");
const url = String(process.env.VITE_SUPABASE_URL || "").trim();
const anonKey = String(process.env.VITE_SUPABASE_ANON_KEY || "").trim();
const liveSupabase = /^(1|true|yes|on)$/i.test(process.env.VITE_ENABLE_SUPABASE || "")
  && process.env.VITE_DATA_SOURCE === "supabase"
  && /^https:\/\/[^/]+\.supabase\.co\/?$/i.test(url)
  && anonKey.length > 20;

const config = liveSupabase
  ? {
      VITE_DATA_SOURCE: "supabase",
      VITE_ENABLE_SUPABASE: "true",
      VITE_ENABLE_STORAGE: "false",
      VITE_ENABLE_REAL_AUTH: "false",
      VITE_SUPABASE_URL: url.replace(/\/$/, ""),
      VITE_SUPABASE_ANON_KEY: anonKey,
    }
  : {
      VITE_DATA_SOURCE: "mock",
      VITE_ENABLE_SUPABASE: "false",
      VITE_ENABLE_STORAGE: "false",
      VITE_ENABLE_REAL_AUTH: "false",
      VITE_SUPABASE_URL: "",
      VITE_SUPABASE_ANON_KEY: "",
    };

const serializedConfig = JSON.stringify(config).replace(/</g, "\\u003c");
const content = `/* Generated during GitHub Pages deployment. Do not edit or add backend credentials. */\nwindow.__CE_ENV__ = Object.assign(window.__CE_ENV__ || {}, ${serializedConfig});\n`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, content, "utf8");
console.log(`GitHub Pages runtime config: ${liveSupabase ? "Supabase enabled" : "safe mock fallback"}.`);
