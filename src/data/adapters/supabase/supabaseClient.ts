/**
 * Safe Supabase browser client (anon key only).
 * Does not break build when env is missing.
 * NEVER use SUPABASE_SERVICE_ROLE_KEY here.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnvConfig, getSupabaseConnectionInfo } from "./supabaseConfig";
import type { SupabaseConnectionInfo } from "./supabaseTypes";

let cached: SupabaseClient | null = null;

export function getSupabaseFoundationClient(): SupabaseClient | null {
  const cfg = getSupabaseEnvConfig();
  if (!cfg.isConfigured) {
    if (cfg.enableSupabase && typeof console !== "undefined") {
      console.warn("[CE Supabase] Foundation client not initialized:", getSupabaseConnectionInfo().message);
    }
    return null;
  }
  if (!cached) {
    cached = createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: cfg.enableRealAuth,
        autoRefreshToken: cfg.enableRealAuth,
        detectSessionInUrl: cfg.enableRealAuth,
      },
    });
  }
  return cached;
}

export function resetSupabaseFoundationClient(): void {
  cached = null;
}

export function getSupabaseInfo(): SupabaseConnectionInfo {
  return getSupabaseConnectionInfo();
}

/** Re-export for callers that need legacy path too */
export { getSupabaseEnvConfig };
