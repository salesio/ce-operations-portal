import type { EntityId } from "../types/entities";
import type { DataResult, EntityRepository, ListOptions } from "../types/repository";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

type WithId = { id: EntityId };

/**
 * In-memory repository used by mock (and as a base for localStorage).
 * Not connected to the live dashboard UI yet.
 */
export function createMemoryRepository<T extends WithId>(
  seed: T[] = [],
): EntityRepository<T> & { __rows: T[] } {
  const rows: T[] = seed.map((r) => ({ ...r }));

  return {
    __rows: rows,

    async list(options?: ListOptions): Promise<DataResult<T[]>> {
      let list = [...rows];
      if (options?.churchId) {
        list = list.filter((row) => {
          const r = row as T & { churchId?: string | null };
          return r.churchId === options.churchId;
        });
      }
      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? list.length;
      return { ok: true, data: list.slice(offset, offset + limit) };
    },

    async getById(id: EntityId): Promise<DataResult<T | null>> {
      return { ok: true, data: rows.find((r) => r.id === id) ?? null };
    },

    async create(input: Partial<T>): Promise<DataResult<T>> {
      const row = {
        ...input,
        id: (input as Partial<WithId>).id || newId(),
        createdAt: (input as { createdAt?: string }).createdAt || nowIso(),
        updatedAt: nowIso(),
      } as unknown as T;
      rows.push(row);
      return { ok: true, data: row };
    },

    async update(id: EntityId, input: Partial<T>): Promise<DataResult<T>> {
      const idx = rows.findIndex((r) => r.id === id);
      if (idx < 0) return { ok: false, error: "Not found", code: "NOT_FOUND" };
      const next = {
        ...rows[idx],
        ...input,
        id,
        updatedAt: nowIso(),
      } as T;
      rows[idx] = next;
      return { ok: true, data: next };
    },

    async remove(id: EntityId): Promise<DataResult<boolean>> {
      const idx = rows.findIndex((r) => r.id === id);
      if (idx < 0) return { ok: false, error: "Not found", code: "NOT_FOUND" };
      rows.splice(idx, 1);
      return { ok: true, data: true };
    },
  };
}
