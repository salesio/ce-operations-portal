/**
 * API provider config (future Node/Express or Edge API).
 */

export interface ApiEnvConfig {
  baseUrl: string;
  appEnv: string;
  isConfigured: boolean;
}

function readEnv(name: string): string {
  try {
    const runtime =
      typeof window !== "undefined"
        ? (window as Window & { __CE_ENV__?: Record<string, string> }).__CE_ENV__?.[name]
        : undefined;
    const fromVite = (import.meta.env as Record<string, string | undefined>)[name];
    return String(runtime || fromVite || "").trim();
  } catch {
    return "";
  }
}

export function getApiEnvConfig(): ApiEnvConfig {
  const baseUrl = readEnv("VITE_API_BASE_URL").replace(/\/$/, "");
  const appEnv = readEnv("VITE_APP_ENV") || "development";
  return {
    baseUrl,
    appEnv,
    isConfigured: baseUrl.length > 0 && !/example\.com|placeholder/i.test(baseUrl),
  };
}

export function getApiConnectionInfo() {
  const cfg = getApiEnvConfig();
  return {
    status: cfg.isConfigured ? ("ready" as const) : ("disabled" as const),
    baseUrl: cfg.baseUrl || null,
    appEnv: cfg.appEnv,
    message: cfg.isConfigured
      ? "API base URL configured (domain repos still on mock/local until wired)."
      : "VITE_API_BASE_URL empty — API provider is a safe placeholder.",
  };
}
