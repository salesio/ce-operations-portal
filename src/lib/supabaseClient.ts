import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

function isValidSupabaseConfig(url: string, anonKey: string): boolean {
  if (!url || !anonKey) return false;
  if (/YOUR_PROJECT|YOUR_SUPABASE|example\.com|placeholder/i.test(url + anonKey)) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export function getSupabaseConfig(): SupabaseConfig {
  const runtimeUrl = typeof window !== "undefined" ? window.__CE_ENV__?.VITE_SUPABASE_URL : "";
  const runtimeKey = typeof window !== "undefined" ? window.__CE_ENV__?.VITE_SUPABASE_ANON_KEY : "";
  const url = (import.meta.env.VITE_SUPABASE_URL || runtimeUrl || "").trim();
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || runtimeKey || "").trim();
  return { url, anonKey, isConfigured: isValidSupabaseConfig(url, anonKey) };
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  if (!cachedClient) {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return cachedClient;
}

export function resetSupabaseClient(): void {
  cachedClient = null;
}

export const PAYMENT_PROOFS_BUCKET = "payment-proofs";