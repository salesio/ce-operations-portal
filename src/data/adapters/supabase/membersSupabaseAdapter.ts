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
import type { SupabaseRow } from "./supabaseTypes";

const TABLE = "members";
const MEMBERS_PAGE_SIZE = 1000;

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
    reconciliation_status: member.reconciliation_status ?? "NotRequired",
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
  // Supabase/PostgREST caps an unpaged select at its configured maximum (commonly
  // 1,000 rows). Load stable, ordered pages so the Members dashboard represents
  // the full database rather than only the first page of an import.
  const rows: SupabaseRow[] = [];
  let offset = 0;

  while (true) {
    const res = await listRows(TABLE, {
      orderBy: "full_name",
      offset,
      limit: MEMBERS_PAGE_SIZE,
    });
    if (!res.ok) return fail(res.error, res.code);

    const page = res.data || [];
    rows.push(...page);
    if (page.length < MEMBERS_PAGE_SIZE) break;
    offset += MEMBERS_PAGE_SIZE;
  }

  return ok(rows.map((r) => mapMemberFromRow(r)!).filter(Boolean));
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
