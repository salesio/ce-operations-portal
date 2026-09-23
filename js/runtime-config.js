/*
 * Safe browser-runtime defaults.
 *
 * The GitHub Pages deployment workflow replaces this file in its published
 * artifact when the public Supabase secrets are configured in GitHub. Do not
 * add a service-role key, DATABASE_URL, or any other backend credential here.
 */
window.__CE_ENV__ = Object.assign(window.__CE_ENV__ || {}, {
  VITE_DATA_SOURCE: window.__CE_ENV__?.VITE_DATA_SOURCE || "mock",
  VITE_ENABLE_SUPABASE: window.__CE_ENV__?.VITE_ENABLE_SUPABASE || "false",
  VITE_ENABLE_STORAGE: window.__CE_ENV__?.VITE_ENABLE_STORAGE || "false",
  VITE_ENABLE_REAL_AUTH: window.__CE_ENV__?.VITE_ENABLE_REAL_AUTH || "false",
  VITE_SUPABASE_URL: window.__CE_ENV__?.VITE_SUPABASE_URL || "",
  VITE_SUPABASE_ANON_KEY: window.__CE_ENV__?.VITE_SUPABASE_ANON_KEY || ""
});
