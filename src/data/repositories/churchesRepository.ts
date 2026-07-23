import { getDataProvider } from "../dataProvider";
import { getDataSource } from "../config";
import type { Church, ChurchServiceTime, EntityId } from "../types/entities";
import type { DataResult } from "../types/repository";
import { CHURCHES_SEED } from "../seeds/churchesSeed";

function fail<T>(error: string, code = "CHURCHES_ERROR"): DataResult<T> {
  return { ok: false, error, code };
}

function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}

function normalizeChurch(input: Partial<Church> & { id?: string }): Church {
  const id = input.id || input.church_id || `church-${Date.now()}`;
  const status = input.status || "Activa";
  return {
    ...input,
    id,
    church_id: input.church_id || id,
    church_name: input.church_name || input.name || input.public_name || "Igreja",
    public_name: input.public_name ?? input.publicName ?? input.church_name ?? "",
    province: input.province ?? null,
    city: input.city ?? null,
    status,
    isActive: input.isActive ?? status === "Activa",
    service_times: Array.isArray(input.service_times) ? input.service_times : [],
  };
}

/**
 * Seed empty providers with dashboard-compatible mock churches.
 * Safe to call repeatedly — only seeds when collection is empty.
 */
export async function ensureChurchesSeeded(): Promise<void> {
  const provider = getDataProvider();
  const listed = await provider.churches.list();
  if (!listed.ok) return;
  if ((listed.data || []).length > 0) return;

  // Prefer create when available so localStorage persists
  if (provider.churches.create) {
    for (const seed of CHURCHES_SEED) {
      await provider.churches.create(normalizeChurch(seed));
    }
  }
}

export async function listChurches(): Promise<DataResult<Church[]>> {
  try {
    await ensureChurchesSeeded();
    const provider = getDataProvider();
    const result = await provider.churches.list();
    if (!result.ok) return result;
    return ok((result.data || []).map((c) => normalizeChurch(c)));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao listar igrejas.");
  }
}

export async function getChurchById(id: EntityId): Promise<DataResult<Church | null>> {
  try {
    await ensureChurchesSeeded();
    const provider = getDataProvider();
    const result = await provider.churches.getById(id);
    if (!result.ok) return result;
    return ok(result.data ? normalizeChurch(result.data) : null);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao obter igreja.");
  }
}

export async function createChurch(payload: Partial<Church>): Promise<DataResult<Church>> {
  try {
    await ensureChurchesSeeded();
    const provider = getDataProvider();
    if (!provider.churches.create) {
      return fail("Criar igreja não suportado neste data source.", "NOT_SUPPORTED");
    }
    const church = normalizeChurch({
      ...payload,
      id: payload.id || payload.church_id || `church-${Date.now()}`,
      created_at: payload.created_at || new Date().toISOString().slice(0, 10),
      updated_at: payload.updated_at || new Date().toISOString().slice(0, 10),
    });
    const result = await provider.churches.create(church);
    if (!result.ok) return result;
    return ok(normalizeChurch(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao criar igreja.");
  }
}

export async function updateChurch(
  id: EntityId,
  payload: Partial<Church>,
): Promise<DataResult<Church>> {
  try {
    const provider = getDataProvider();
    if (!provider.churches.update) {
      return fail("Actualizar igreja não suportado neste data source.", "NOT_SUPPORTED");
    }
    const existing = await provider.churches.getById(id);
    if (!existing.ok) return fail(existing.error, existing.code);
    if (!existing.data) return fail("Igreja não encontrada.", "NOT_FOUND");

    const next = normalizeChurch({
      ...existing.data,
      ...payload,
      id,
      church_id: id,
      updated_at: new Date().toISOString().slice(0, 10),
    });
    const result = await provider.churches.update(id, next);
    if (!result.ok) return result;
    return ok(normalizeChurch(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao actualizar igreja.");
  }
}

export async function deleteChurch(id: EntityId): Promise<DataResult<boolean>> {
  try {
    const provider = getDataProvider();
    if (!provider.churches.remove) {
      return fail("Eliminar igreja não suportado neste data source.", "NOT_SUPPORTED");
    }
    return provider.churches.remove(id);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao eliminar igreja.");
  }
}

export async function searchChurches(query: string): Promise<DataResult<Church[]>> {
  try {
    const listed = await listChurches();
    if (!listed.ok) return listed;
    const q = String(query || "")
      .trim()
      .toLowerCase();
    if (!q) return listed;
    const filtered = listed.data.filter((church) =>
      [
        church.church_name,
        church.public_name,
        church.city,
        church.province,
        church.district_or_area,
        church.pastor_in_charge,
        church.phone_primary,
        church.phone_secondary,
        church.address,
      ].some((value) => String(value || "").toLowerCase().includes(q)),
    );
    return ok(filtered);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao pesquisar igrejas.");
  }
}

export async function getChurchServiceTimes(
  churchId: EntityId,
): Promise<DataResult<ChurchServiceTime[]>> {
  try {
    const result = await getChurchById(churchId);
    if (!result.ok) return fail(result.error, result.code);
    if (!result.data) return fail("Igreja não encontrada.", "NOT_FOUND");
    return ok(result.data.service_times || []);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao obter horários.");
  }
}

/** Diagnostic helper for docs / console. */
export function getChurchesDataSourceInfo() {
  const provider = getDataProvider();
  return {
    source: getDataSource(),
    provider: provider.name,
    ready: provider.isReady(),
    description: provider.description,
  };
}
