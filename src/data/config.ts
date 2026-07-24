import type { DataSourceName } from "./types/repository";

const VALID_SOURCES: DataSourceName[] = ["mock", "local", "api", "supabase"];

function readViteEnv(name: string): string {
  try {
    const runtime =
      typeof window !== "undefined"
        ? (window as Window & { __CE_ENV__?: Record<string, string> }).__CE_ENV__?.[name]
        : undefined;
    const fromEnv = (import.meta.env as Record<string, string | undefined>)[name];
    return String(runtime || fromEnv || "").trim();
  } catch {
    return "";
  }
}

function flagTrue(name: string): boolean {
  return /^(1|true|yes|on)$/i.test(readViteEnv(name));
}

function normalizeSource(raw: string | undefined | null): DataSourceName {
  const value = (raw || "mock").trim().toLowerCase();
  if (VALID_SOURCES.includes(value as DataSourceName)) {
    return value as DataSourceName;
  }
  console.warn(
    `[CE Data] Unknown VITE_DATA_SOURCE="${raw}". Falling back to "mock". Valid: ${VALID_SOURCES.join(", ")}`,
  );
  return "mock";
}

/**
 * Active data source flag.
 * Default remains "mock" so the existing dashboard behaviour is unchanged.
 *
 * IMPORTANT: use direct `import.meta.env.VITE_*` only (replaced by Vite `define`).
 * Do NOT write `typeof import.meta` — Vite's IIFE polyfill evaluates
 * `new URL("supabase-bundle.js", document.baseURI)` and can throw, breaking createChurch.
 */
export function getDataSource(): DataSourceName {
  const runtime =
    typeof window !== "undefined" ? window.__CE_ENV__?.VITE_DATA_SOURCE : undefined;
  // Replaced at build time with a string literal, e.g. "mock"
  const fromEnv = import.meta.env.VITE_DATA_SOURCE as string | undefined;
  return normalizeSource(runtime || fromEnv || "mock");
}

/** Optional future REST/API base (used only when source=api). */
export function getApiBaseUrl(): string {
  const runtime =
    typeof window !== "undefined" ? window.__CE_ENV__?.VITE_API_BASE_URL : undefined;
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (runtime || fromEnv || "").trim().replace(/\/$/, "");
}

export function getAppEnv(): string {
  return readViteEnv("VITE_APP_ENV") || "development";
}

/** Backend Phase 1 feature flags (all false by default). */
export function getBackendFeatureFlags() {
  return {
    enableSupabase: flagTrue("VITE_ENABLE_SUPABASE"),
    enableRealAuth: flagTrue("VITE_ENABLE_REAL_AUTH"),
    enableStorage: flagTrue("VITE_ENABLE_STORAGE"),
    enableRls: flagTrue("VITE_ENABLE_RLS"),
  };
}

export function listDataSources(): DataSourceName[] {
  return [...VALID_SOURCES];
}
