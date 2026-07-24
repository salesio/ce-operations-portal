/**
 * Generic table helpers for future Supabase pilots.
 * Not wired into domain repositories yet — foundation only.
 */
import { getSupabaseFoundationClient } from "./supabaseClient";
import type { SupabaseResult, SupabaseRow, SupabaseTableName } from "./supabaseTypes";

function fail<T>(error: string, code = "SUPABASE_DISABLED"): SupabaseResult<T> {
  return { ok: false, error, code };
}
function ok<T>(data: T): SupabaseResult<T> {
  return { ok: true, data };
}

export async function supabaseList(
  table: SupabaseTableName,
  options: { limit?: number; churchId?: string } = {},
): Promise<SupabaseResult<SupabaseRow[]>> {
  const client = getSupabaseFoundationClient();
  if (!client) return fail("Supabase client not configured", "SUPABASE_DISABLED");
  try {
    let q = client.from(table).select("*");
    if (options.churchId) q = q.eq("church_id", options.churchId);
    if (options.limit) q = q.limit(options.limit);
    const { data, error } = await q;
    if (error) return fail(error.message, "SUPABASE_ERROR");
    return ok((data || []) as SupabaseRow[]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "supabaseList failed");
  }
}

export async function supabaseGetById(
  table: SupabaseTableName,
  id: string,
): Promise<SupabaseResult<SupabaseRow | null>> {
  const client = getSupabaseFoundationClient();
  if (!client) return fail("Supabase client not configured", "SUPABASE_DISABLED");
  try {
    const { data, error } = await client.from(table).select("*").eq("id", id).maybeSingle();
    if (error) return fail(error.message, "SUPABASE_ERROR");
    return ok((data as SupabaseRow) || null);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "supabaseGetById failed");
  }
}

export async function supabaseCreate(
  table: SupabaseTableName,
  payload: SupabaseRow,
): Promise<SupabaseResult<SupabaseRow>> {
  const client = getSupabaseFoundationClient();
  if (!client) return fail("Supabase client not configured", "SUPABASE_DISABLED");
  try {
    const { data, error } = await client.from(table).insert(payload).select("*").single();
    if (error) return fail(error.message, "SUPABASE_ERROR");
    return ok(data as SupabaseRow);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "supabaseCreate failed");
  }
}

export async function supabaseUpdate(
  table: SupabaseTableName,
  id: string,
  payload: SupabaseRow,
): Promise<SupabaseResult<SupabaseRow>> {
  const client = getSupabaseFoundationClient();
  if (!client) return fail("Supabase client not configured", "SUPABASE_DISABLED");
  try {
    const { data, error } = await client
      .from(table)
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return fail(error.message, "SUPABASE_ERROR");
    return ok(data as SupabaseRow);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "supabaseUpdate failed");
  }
}

export async function supabaseDelete(
  table: SupabaseTableName,
  id: string,
): Promise<SupabaseResult<boolean>> {
  const client = getSupabaseFoundationClient();
  if (!client) return fail("Supabase client not configured", "SUPABASE_DISABLED");
  try {
    const { error } = await client.from(table).delete().eq("id", id);
    if (error) return fail(error.message, "SUPABASE_ERROR");
    return ok(true);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "supabaseDelete failed");
  }
}
