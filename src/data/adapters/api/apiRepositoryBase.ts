/**
 * Generic REST helpers for future API pilots.
 * Not wired into domain repositories yet.
 */
import { apiClient } from "./apiClient";
import type { ApiResult } from "./apiClient";

export async function apiList<T>(resource: string): Promise<ApiResult<T[]>> {
  return apiClient.get<T[]>(`/api/${resource}`);
}

export async function apiGetById<T>(resource: string, id: string): Promise<ApiResult<T>> {
  return apiClient.get<T>(`/api/${resource}/${id}`);
}

export async function apiCreate<T>(
  resource: string,
  payload: unknown,
): Promise<ApiResult<T>> {
  return apiClient.post<T>(`/api/${resource}`, payload);
}

export async function apiUpdate<T>(
  resource: string,
  id: string,
  payload: unknown,
): Promise<ApiResult<T>> {
  return apiClient.patch<T>(`/api/${resource}/${id}`, payload);
}

export async function apiDelete(
  resource: string,
  id: string,
): Promise<ApiResult<boolean>> {
  const r = await apiClient.delete<unknown>(`/api/${resource}/${id}`);
  if (!r.ok) return r as ApiResult<boolean>;
  return { ok: true, data: true, status: r.status };
}
