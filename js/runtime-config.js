/*
 * Safe browser-runtime defaults.
 *
 * The GitHub Pages deployment workflow replaces this file in its published
 * artifact when the public Supabase secrets are configured in GitHub. Do not
 * add a service-role key, DATABASE_URL, or any other backend credential here.
 */
window.__CE_ENV__ = Object.assign(window.__CE_ENV__ || {}, {
  VITE_DATA_SOURCE: "supabase",
  VITE_ENABLE_SUPABASE: "true",
  VITE_ENABLE_STORAGE: "true",
  VITE_ENABLE_REAL_AUTH: "true",
  VITE_SUPABASE_URL: "https://api.embaixadadecristo.org",
  VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkxNDY0NTQ0LCJleHAiOjIwMDcwMDQ1NDR9.xMLsM1EBKV-hJCWRsYjpXP91ESaq5Msns9FamCVMJh0"
});
