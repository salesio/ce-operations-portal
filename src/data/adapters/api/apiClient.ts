/**
 * Lightweight fetch wrapper for future REST API.
 * Safe when base URL is empty (returns NOT_CONFIGURED).
 */
import { getApiEnvConfig } from "./apiConfig";

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; code?: string; status?: number };

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<ApiResult<T>> {
  const { baseUrl, isConfigured } = getApiEnvConfig();
  if (!isConfigured) {
    return {
      ok: false,
      error: "API not configured (set VITE_API_BASE_URL).",
      code: "NOT_CONFIGURED",
    };
  }
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) {
      return {
        ok: false,
        error: typeof data === "object" && data && "error" in data
          ? String((data as { error: unknown }).error)
          : `HTTP ${res.status}`,
        code: "HTTP_ERROR",
        status: res.status,
      };
    }
    return { ok: true, data: data as T, status: res.status };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Network error",
      code: "NETWORK_ERROR",
    };
  }
}

export const apiClient = {
  get: <T>(path: string, headers?: Record<string, string>) =>
    request<T>("GET", path, undefined, headers),
  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>("POST", path, body, headers),
  put: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>("PUT", path, body, headers),
  patch: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>("PATCH", path, body, headers),
  delete: <T>(path: string, headers?: Record<string, string>) =>
    request<T>("DELETE", path, undefined, headers),
};
