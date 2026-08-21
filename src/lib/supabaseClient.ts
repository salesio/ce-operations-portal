import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseFoundationClient, resetSupabaseFoundationClient } from "../data/adapters/supabase/supabaseClient";
import { getSupabaseEnvConfig } from "../data/adapters/supabase/supabaseConfig";

declare global {
  interface Window {
    __CE_ENV__?: {
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      VITE_DATA_SOURCE?: string;
      VITE_API_BASE_URL?: string;
    };
  }
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  const cfg = getSupabaseEnvConfig();
  return { url: cfg.url, anonKey: cfg.anonKey, isConfigured: cfg.isConfigured };
}

/** Canonical singleton delegating to data-layer foundation client */
export function getSupabaseClient(): SupabaseClient | null {
  return getSupabaseFoundationClient();
}

export function resetSupabaseClient(): void {
  resetSupabaseFoundationClient();
}

export const PAYMENT_PROOFS_BUCKET = "payment-proofs";