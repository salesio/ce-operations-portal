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
  VITE_SUPABASE_URL: "https://kmurqbgpybrolrrumiue.supabase.co",
  VITE_SUPABASE_ANON_KEY: "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli"
});
