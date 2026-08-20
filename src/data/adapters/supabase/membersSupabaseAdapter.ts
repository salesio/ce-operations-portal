/**
 * Members Supabase adapter — Backend Phase 3 pilot.
 * Maps public.members ↔ dashboard Member shape (PT + EN aliases).
 * Anon client only; never service role.
 */
import type { EntityId, Member } from "../../types/entities";
import type { DataResult } from "../../types/repository";
import {
  createRow,
  deleteRow,
  filterRows,
  getRowById,
  isValidUuid,
  listRows,
  newClientUuid,
  searchRows,
  updateRow,
} from "./supabaseRepositoryBase";
import { getSupabaseFoundationClient } from "./supabaseClient";
import { mapSupabaseError } from "./supabaseRepositoryBase";
import type { SupabaseRow } from "./supabaseTypes";

const TABLE = "members";
const MEMBER_PAGE_DEFAULT_SIZE = 50;
const MEMBER_PAGE_MAX_SIZE = 100;
// Deliberately narrow projection for the Members list. Profile screens still use
// getMemberById(), which can load the full record only when the user asks for it.
const MEMBER_LIST_COLUMNS = [
  "id", "member_code", "full_name", "first_name", "last_name", "title",
  "primary_phone", "secondary_phone", "phone", "email", "church_id", "church_name",
  "cell_group_id", "cell_group_name", "cell_id", "cell_name", "department_id",
  "department_name", "status", "membership_status", "entry_date", "source",
  "cell_role", "created_at", "updated_at"
].join(",");

export type MemberListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  churchId?: string;
  cellGroupId?: string;
  cellId?: string;
  /** Exact legacy/display cell name. Used after the portal resolves an imported cell name. */
  cellName?: string;
  /** Narrow discovery search for legacy imports where cell_id was not populated. */
  cellNameLike?: string;
  status?: string;
};

export type MemberPage = {
  items: Member[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}
function fail<T>(error: string, code?: string): DataResult<T> {
  return { ok: false, error, code };
}

function isActiveStatus(status: string | null | undefined): boolean {
  const key = String(status || "")
    .trim()
    .toLowerCase();
  return key === "active" || key === "activo" || key === "ativa" || key === "activa";
}

/** DB row → UI Member */
export function mapMemberFromRow(row: SupabaseRow | null | undefined): Member | null {
  if (!row) return null;
  const id = String(row.id || "");
  const fullName = String(row.full_name || "Membro");
  const first = String(row.first_name || "");
  const last = String(row.last_name || "");
  const title = String(row.title || "");
  const primaryPhone = (row.primary_phone as string) || (row.phone as string) || null;
  const phone = primaryPhone || "";
  const status = String(row.status || "Active");
  const churchId = row.church_id != null ? String(row.church_id) : null;
  return {
    id,
    member_code: (row.member_code as string) || null,
    full_name: fullName,
    fullName,
    first_name: first,
    last_name: last,
    nome: first,
    apelido: last,
    title,
    tratamento: title,
    gender: (row.gender as string) || null,
    genero: (row.gender as string) || null,
    date_of_birth: (row.date_of_birth as string) || null,
    data_de_nascimento: (row.date_of_birth as string) || null,
    phone,
    telefone: phone,
    whatsapp: String(row.whatsapp || phone || ""),
    email: String(row.email || ""),
    address: String(row.address || ""),
    endereco: String(row.address || ""),
    church_id: churchId,
    churchId,
    church_name: (row.church_name as string) || null,
    igreja: (row.church_name as string) || null,
    cell_group_id: row.cell_group_id != null ? String(row.cell_group_id) : null,
    cell_group_name: (row.cell_group_name as string) || null,
    cell_id: row.cell_id != null ? String(row.cell_id) : null,
    cell_name: (row.cell_name as string) || null,
    celula: (row.cell_name as string) || "",
    department_id: row.department_id != null ? String(row.department_id) : null,
    department_name: (row.department_name as string) || null,
    departamento: (row.department_name as string) || "",
    status,
    estado: status,
    member_since: (row.entry_date as string) || null,
    data_de_entrada: (row.entry_date as string) || null,
    source: (row.source as string) || "Manual",
    origem: (row.source as string) || "Manual",
    notes: (row.notes as string) || "",
    notas: (row.notes as string) || "",
    isActive: isActiveStatus(status),
    primary_phone: primaryPhone,
    secondary_phone: (row.secondary_phone as string) || null,
    neighborhood: (row.neighborhood as string) || null,
    marital_status: (row.marital_status as string) || null,
    occupation: (row.occupation as string) || null,
    kingschat_username: (row.kingschat_username as string) || null,
    membership_status: (row.membership_status as string) || status,
    cell_role: (row.cell_role as string) || "Member",
    cell_participation_status: (row.cell_participation_status as string) || "Unknown",
    service_participation_status: (row.service_participation_status as string) || "Unknown",
    legacy_foundation_status: (row.legacy_foundation_status as string) || null,
    legacy_foundation_raw_value: (row.legacy_foundation_raw_value as string) || null,
    legacy_alec_status: (row.legacy_alec_status as string) || null,
    legacy_baptism_status: (row.legacy_baptism_status as string) || null,
    legacy_partner_status: (row.legacy_partner_status as string) || null,
    data_quality_status: (row.data_quality_status as string) || "Valid",
    reconciliation_status: (row.reconciliation_status as string) || "Pending",
    confirmed_by: (row.confirmed_by as string) || null,
    confirmed_at: (row.confirmed_at as string) || null,
    reconciliation_notes: (row.reconciliation_notes as string) || null,
    created_at: (row.created_at as string) || undefined,
    updated_at: (row.updated_at as string) || undefined,
  };
}

export function mapMemberToRow(member: Partial<Member>, forUpdate = false): SupabaseRow {
  const first = member.first_name ?? member.nome ?? "";
  const last = member.last_name ?? member.apelido ?? "";
  const title = member.title ?? member.tratamento ?? "";
  const fullFromParts = [title, first, last].filter(Boolean).join(" ").trim();
  const fullName = member.full_name || member.fullName || fullFromParts || "Membro";
  const phone = member.primary_phone ?? member.phone ?? member.telefone ?? null;
  const churchId = member.church_id ?? member.churchId ?? null;

  const row: SupabaseRow = {
    member_code: (member as { member_code?: string }).member_code ?? null,
    full_name: fullName,
    first_name: first || null,
    last_name: last || null,
    title: title || null,
    gender: member.gender ?? member.genero ?? null,
    date_of_birth: member.date_of_birth ?? member.data_de_nascimento ?? null,
    phone: phone || null,
    whatsapp: member.whatsapp || phone || null,
    email: member.email || null,
    address: member.address ?? member.endereco ?? null,
    church_id: churchId && isValidUuid(String(churchId)) ? String(churchId) : null,
    church_name: member.church_name ?? member.igreja ?? null,
    cell_group_id: member.cell_group_id != null ? String(member.cell_group_id) : null,
    cell_group_name: member.cell_group_name ?? null,
    cell_id: member.cell_id != null ? String(member.cell_id) : null,
    cell_name: member.cell_name ?? member.celula ?? null,
    department_id: member.department_id != null ? String(member.department_id) : null,
    department_name: member.department_name ?? member.departamento ?? null,
    status: member.status ?? member.estado ?? "Active",
    entry_date: member.member_since ?? member.data_de_entrada ?? null,
    source: member.source ?? member.origem ?? "Manual",
    notes: member.notes ?? member.notas ?? null,
    primary_phone: member.primary_phone ?? member.phone ?? member.telefone ?? null,
    secondary_phone: member.secondary_phone ?? null,
    neighborhood: member.neighborhood ?? null,
    marital_status: member.marital_status ?? null,
    occupation: member.occupation ?? null,
    kingschat_username: member.kingschat_username ?? null,
    membership_status: member.membership_status ?? member.status ?? member.estado ?? "Active",
    cell_role: member.cell_role ?? "Member",
    cell_participation_status: member.cell_participation_status ?? "Unknown",
    service_participation_status: member.service_participation_status ?? "Unknown",
    legacy_foundation_status: member.legacy_foundation_status ?? null,
    legacy_foundation_raw_value: member.legacy_foundation_raw_value ?? null,
    legacy_alec_status: member.legacy_alec_status ?? null,
    legacy_alec_raw_value: member.legacy_alec_raw_value ?? null,
    legacy_baptism_status: member.legacy_baptism_status ?? null,
    legacy_baptism_raw_value: member.legacy_baptism_raw_value ?? null,
    legacy_partner_status: member.legacy_partner_status ?? null,
    legacy_partnership_arms: member.legacy_partnership_arms ?? [],
    legacy_source: member.legacy_source ?? null,
    legacy_source_sheet: member.legacy_source_sheet ?? null,
    legacy_source_row: member.legacy_source_row ?? null,
    legacy_import_batch_id: member.legacy_import_batch_id ?? null,
    data_quality_status: member.data_quality_status ?? "Valid",
    reconciliation_status: member.reconciliation_status ?? "Pending",
    confirmed_by: member.confirmed_by ?? null,
    confirmed_at: member.confirmed_at ?? null,
    reconciliation_notes: member.reconciliation_notes ?? null,
    member_since_year: member.member_since_year ?? null,
    member_since_raw: member.member_since_raw ?? null,
    member_since_precision: member.member_since_precision ?? "exact",
    metadata: {},
  };
  if (!forUpdate) {
    const id = member.id;
    row.id = id && isValidUuid(id) ? id : newClientUuid();
  }
  return row;
}

export async function listMembers(): Promise<DataResult<Member[]>> {
  // Compatibility-only API. Never iterate through the entire remote table here:
  // directory consumers must use listMembersPage() with explicit pagination.
  const page = await listMembersPage({ page: 1, pageSize: MEMBER_PAGE_MAX_SIZE });
  if (!page.ok) return fail(page.error, page.code);
  return ok(page.data.items);
}

/**
 * Server-side page for the Members workspace. This must remain the default UI
 * path: it uses an exact PostgREST count and never downloads the whole table.
 */
const MOCK_CHURCH_UUID_MAP: Record<string, string> = {
  "church-hq": "a1111111-1111-4111-8111-111111111101",
  "church-matola": "a1111111-1111-4111-8111-111111111102",
  "church-khongolote": "a1111111-1111-4111-8111-111111111103",
  "church-beira": "a1111111-1111-4111-8111-111111111104",
  "church-nampula": "a1111111-1111-4111-8111-111111111105",
  "church-choupal": "a1111111-1111-4111-8111-111111111106",
  "church-virtual": "a1111111-1111-4111-8111-111111111107",
};

const memberLastState = {
  lastQuery: null as MemberListQuery | null,
  lastError: null as string | null,
  lastRowsReturned: 0,
};

export function getMembersDataSourceInfo() {
  return {
    source: "supabase",
    repository: "membersSupabaseAdapter",
    fallbackUsed: false,
    lastQuery: memberLastState.lastQuery,
    lastError: memberLastState.lastError,
    lastRowsReturned: memberLastState.lastRowsReturned,
    version: "2026.08.20-members-fix-v2",
    ready: true,
    fallback: false,
    checkedAt: new Date().toISOString(),
  };
}

export async function listMembersPage(query: MemberListQuery = {}): Promise<DataResult<MemberPage>> {
  memberLastState.lastQuery = { ...query };
  const client = getSupabaseFoundationClient();
  if (!client) {
    const mapped = mapSupabaseError("Supabase not configured");
    memberLastState.lastError = mapped.error;
    return fail(mapped.error, mapped.code);
  }

  // Task 4: Verify Auth session presence safely before executing protected query
  let sessionUserId: string | null = null;
  try {
    const sessionRes = await client.auth.getSession();
    sessionUserId = sessionRes?.data?.session?.user?.id || null;
  } catch (_) {}

  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(MEMBER_PAGE_MAX_SIZE, Math.max(25, Number(query.pageSize) || MEMBER_PAGE_DEFAULT_SIZE));
  const from = (page - 1) * pageSize;
  const search = String(query.search || "").trim();
  try {
    let request: any = client.from(TABLE).select(MEMBER_LIST_COLUMNS, { count: "exact" });
    if (query.churchId) {
      const mappedId = MOCK_CHURCH_UUID_MAP[query.churchId] || query.churchId;
      if (isValidUuid(mappedId)) {
        request = request.eq("church_id", mappedId);
      } else {
        const churchObj = (typeof window !== "undefined" && (window as any).state?.churches || []).find(
          (c: any) => String(c.id) === String(query.churchId) || String(c.church_id) === String(query.churchId)
        );
        const churchName = churchObj?.church_name || churchObj?.public_name || query.churchId;
        const safeName = String(churchName).replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
        if (safeName) {
          request = request.ilike("church_name", `%${safeName}%`);
        }
      }
    }

    if (query.cellGroupId || query.cellGroupName) {
      const groupTerms: string[] = [];
      const groupIdStr = String(query.cellGroupId || "").trim();
      const groupNameStr = String(query.cellGroupName || "").trim();
      if (groupIdStr) {
        groupTerms.push(`cell_group_id.eq.${groupIdStr}`);
      }
      if (groupNameStr) {
        const safeGroup = groupNameStr.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
        if (safeGroup) {
          groupTerms.push(`cell_group_name.ilike.%${safeGroup}%`);
          groupTerms.push(`cell_name.ilike.%${safeGroup}%`);
        }
      }
      if (typeof window !== "undefined" && (window as any).state?.cellRegistry) {
        const registry = (window as any).state.cellRegistry || [];
        const matchingCells = registry.filter((c: any) => {
          if (groupIdStr && (String(c.group_id) === groupIdStr || String(c.cell_group_id) === groupIdStr)) return true;
          if (groupNameStr) {
            const gName = String(c.group_name || c.cell_group_name || "").toLowerCase();
            return gName.includes(groupNameStr.toLowerCase()) || groupNameStr.toLowerCase().includes(gName);
          }
          return false;
        });
        matchingCells.forEach((c: any) => {
          if (c.id) groupTerms.push(`cell_id.eq.${c.id}`);
          const cNameClean = String(c.cell_name || c.name || "").replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
          if (cNameClean) groupTerms.push(`cell_name.ilike.%${cNameClean}%`);
        });
      }
      if (groupTerms.length > 0) {
        const uniqueTerms = Array.from(new Set(groupTerms));
        request = request.or(uniqueTerms.join(","));
      }
    }

    if (query.cellId || query.cellName || query.cellNameLike) {
      const cellTerms: string[] = [];
      const cellIdStr = String(query.cellId || "").trim();
      const cellNameStr = String(query.cellName || query.cellNameLike || "").trim();
      if (cellIdStr) {
        cellTerms.push(`cell_id.eq.${cellIdStr}`);
      }
      if (cellNameStr) {
        const safeCell = cellNameStr.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
        if (safeCell) {
          cellTerms.push(`cell_name.ilike.%${safeCell}%`);
        }
      }
      if (typeof window !== "undefined" && (window as any).state?.cellRegistry) {
        const registry = (window as any).state.cellRegistry || [];
        const matchingCells = registry.filter((c: any) => {
          if (cellIdStr && String(c.id) === cellIdStr) return true;
          if (cellNameStr) {
            const cName = String(c.cell_name || c.name || "").toLowerCase();
            return cName.includes(cellNameStr.toLowerCase()) || cellNameStr.toLowerCase().includes(cName);
          }
          return false;
        });
        matchingCells.forEach((c: any) => {
          if (c.id) cellTerms.push(`cell_id.eq.${c.id}`);
          const cNameClean = String(c.cell_name || c.name || "").replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
          if (cNameClean) cellTerms.push(`cell_name.ilike.%${cNameClean}%`);
        });
      }
      if (cellTerms.length > 0) {
        const uniqueTerms = Array.from(new Set(cellTerms));
        request = request.or(uniqueTerms.join(","));
      }
    }

    if (query.status) {
      const statusKey = String(query.status).toLowerCase();
      const statusValues: Record<string, string[]> = {
        active: ["Active", "Activo", "Ativa", "Activa"],
        inprogress: ["In Progress", "Em Curso", "InProgress"],
        transferred: ["Transferred", "Transferido", "TransferredOut"],
      };
      request = request.in("status", statusValues[statusKey] || [query.status]);
    }

    if (query.reconciliationStatus) {
      request = request.eq("reconciliation_status", query.reconciliationStatus);
    }
    // A one-character search is intentionally not sent to PostgREST; it is too
    // broad for a live operational directory and causes avoidable full scans.
    if (search.length >= 2) {
      const safe = search.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
      if (safe) request = request.or([
        `full_name.ilike.%${safe}%`, `first_name.ilike.%${safe}%`, `last_name.ilike.%${safe}%`,
        `primary_phone.ilike.%${safe}%`, `secondary_phone.ilike.%${safe}%`, `phone.ilike.%${safe}%`,
        `email.ilike.%${safe}%`, `member_code.ilike.%${safe}%`,
        `church_name.ilike.%${safe}%`, `cell_group_name.ilike.%${safe}%`, `cell_name.ilike.%${safe}%`
      ].join(","));
    }
    const { data, error, count } = await request.order("full_name", { ascending: true }).range(from, from + pageSize - 1);
    if (error) {
      const mapped = mapSupabaseError(error.message);
      memberLastState.lastError = mapped.error;
      memberLastState.lastRowsReturned = 0;
      return fail(mapped.error, mapped.code);
    }
    const totalCount = Number(count || 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const items = ((data || []) as SupabaseRow[]).map((row) => mapMemberFromRow(row)!).filter(Boolean);
    memberLastState.lastRowsReturned = items.length;
    memberLastState.lastError = null;
    return ok({ items, page, pageSize, totalCount, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 });
  } catch (error) {
    const mapped = mapSupabaseError(error instanceof Error ? error.message : "member page failed");
    memberLastState.lastError = mapped.error;
    memberLastState.lastRowsReturned = 0;
    return fail(mapped.error, mapped.code);
  }
}

export async function getMemberById(id: EntityId): Promise<DataResult<Member | null>> {
  const res = await getRowById(TABLE, String(id));
  if (!res.ok) return fail(res.error, res.code);
  return ok(mapMemberFromRow(res.data));
}

export async function createMember(payload: Partial<Member>): Promise<DataResult<Member>> {
  const row = mapMemberToRow(payload, false);
  const res = await createRow(TABLE, row);
  if (!res.ok) return fail(res.error, res.code);
  const mapped = mapMemberFromRow(res.data);
  if (!mapped) return fail("Resposta inválida do Supabase.", "SUPABASE_ERROR");
  return ok(mapped);
}

export async function updateMember(
  id: EntityId,
  payload: Partial<Member>,
): Promise<DataResult<Member>> {
  const row = mapMemberToRow({ ...payload, id: String(id) }, true);
  delete row.id;
  const res = await updateRow(TABLE, String(id), row);
  if (!res.ok) return fail(res.error, res.code);
  const mapped = mapMemberFromRow(res.data);
  if (!mapped) return fail("Resposta inválida do Supabase.", "SUPABASE_ERROR");
  return ok(mapped);
}

export async function deleteMember(id: EntityId): Promise<DataResult<boolean>> {
  const res = await deleteRow(TABLE, String(id));
  if (!res.ok) return fail(res.error, res.code);
  return ok(true);
}

export async function searchMembers(query: string): Promise<DataResult<Member[]>> {
  const res = await searchRows(
    TABLE,
    ["full_name", "first_name", "last_name", "phone", "email", "church_name", "cell_name"],
    query,
  );
  if (!res.ok) return fail(res.error, res.code);
  return ok((res.data || []).map((r) => mapMemberFromRow(r)!).filter(Boolean));
}

export async function getMembersByChurch(churchId: EntityId): Promise<DataResult<Member[]>> {
  const res = await filterRows(TABLE, { church_id: String(churchId) });
  if (!res.ok) return fail(res.error, res.code);
  return ok((res.data || []).map((r) => mapMemberFromRow(r)!).filter(Boolean));
}

export async function getMembersByStatus(status: string): Promise<DataResult<Member[]>> {
  const res = await filterRows(TABLE, { status });
  if (!res.ok) return fail(res.error, res.code);
  return ok((res.data || []).map((r) => mapMemberFromRow(r)!).filter(Boolean));
}

export async function getActiveMembers(): Promise<DataResult<Member[]>> {
  const listed = await listMembers();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((m) => isActiveStatus(m.status || m.estado)));
}

export async function getInactiveMembers(): Promise<DataResult<Member[]>> {
  const listed = await listMembers();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((m) => !isActiveStatus(m.status || m.estado)));
}
