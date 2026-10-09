/**
 * Runtime Supabase config for staging / live data layer.
 * Anon key only — public client initialization.
 */
window.__CE_ENV__ = Object.assign(window.__CE_ENV__ || {}, {
  VITE_DATA_SOURCE: "supabase",
  VITE_ENABLE_SUPABASE: "true",
  VITE_ENABLE_STORAGE: "false",
  VITE_ENABLE_REAL_AUTH: "true",
  VITE_ENABLE_PUBLIC_CELL_REPORT: "false",
  VITE_SUPABASE_URL: "https://api.embaixadadecristo.org",
  VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkxNDY0NTQ0LCJleHAiOjIwMDcwMDQ1NDR9.xMLsM1EBKV-hJCWRsYjpXP91ESaq5Msns9FamCVMJh0"
});
