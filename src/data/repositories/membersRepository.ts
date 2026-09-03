import { getDataProvider } from "../dataProvider";
import { getDataSource, getBackendFeatureFlags } from "../config";
import type { EntityId, Member } from "../types/entities";
import type { DataResult } from "../types/repository";
import { MEMBERS_SEED } from "../seeds/membersSeed";
import { listChurches } from "./churchesRepository";
import { getSupabaseEnvConfig } from "../adapters/supabase/supabaseConfig";
import * as membersSb from "../adapters/supabase/membersSupabaseAdapter";
import * as membersApi from "../adapters/api/membersApiAdapter";
export type { MemberListQuery, MemberPage } from "../adapters/supabase/membersSupabaseAdapter";
import type { MemberListQuery, MemberPage } from "../adapters/supabase/membersSupabaseAdapter";

function fail<T>(error: string, code = "MEMBERS_ERROR"): DataResult<T> {
  return { ok: false, error, code };
}

function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}

/** Phase 3: route to Supabase adapter when flags + source allow. */
function useSupabaseMembers(): boolean {
  if (getDataSource() !== "supabase") return false;
  const cfg = getSupabaseEnvConfig();
  const flags = getBackendFeatureFlags();
  return flags.enableSupabase && cfg.isConfigured;
}

function useApiMembers(): boolean {
  return getDataSource() === "api";
}

function isActiveStatus(status: string | null | undefined): boolean {
  const key = String(status || "")
    .trim()
    .toLowerCase();
  return key === "active" || key === "activo" || key === "ativa" || key === "activa";
}

function isInactiveStatus(status: string | null | undefined): boolean {
  const key = String(status || "")
    .trim()
    .toLowerCase();
  return key === "inactive" || key === "inactivo" || key === "inactiva" || key === "inativo";
}

/**
 * Normalize to dashboard-compatible PT fields + English aliases.
 */
export function normalizeMember(input: Partial<Member> & { id?: string }): Member {
  const id = input.id || `m-${Date.now()}`;
  const nome = input.nome ?? input.first_name ?? "";
  const apelido = input.apelido ?? input.last_name ?? "";
  const tratamento = input.tratamento ?? input.title ?? "";
  // Contact details are optional master data. Preserve absence as null so that
  // neither manual entry nor legacy imports invent placeholder phone numbers.
  const primaryPhone = input.primary_phone ?? input.phone ?? input.telefone ?? null;
  const telefone = input.telefone ?? input.phone ?? input.primary_phone ?? null;
  const estado = input.estado ?? input.status ?? input.membership_status ?? "Active";
  const churchId = input.church_id ?? input.churchId ?? null;
  const fullFromParts = [tratamento, nome, apelido].filter(Boolean).join(" ").trim();
  const fullName =
    (input.nome != null || input.apelido != null)
      ? (fullFromParts || "Membro")
      : (input.full_name || input.fullName || fullFromParts || "Membro");

  const departamento = input.departamento ?? input.department_name ?? "";
  const neighborhood = input.neighborhood ?? input.bairro ?? null;
  const maritalStatus = input.marital_status ?? input.estado_civil ?? null;
  const occupation = input.occupation ?? input.profissao ?? null;
  const entryDate = input.data_de_entrada ?? input.entry_date ?? input.member_since ?? null;
  const birthDate = input.data_de_nascimento ?? input.date_of_birth ?? null;
  const origin = input.origem ?? input.source ?? "Manual";
  const notes = input.notas ?? input.notes ?? "";

  return {
    ...input,
    id,
    tratamento,
    title: tratamento,
    nome,
    first_name: nome,
    apelido,
    last_name: apelido,
    full_name: fullName,
    fullName,
    genero: input.genero ?? input.gender ?? null,
    gender: input.gender ?? input.genero ?? null,
    data_de_nascimento: birthDate,
    date_of_birth: birthDate,
    telefone,
    phone: input.phone ?? primaryPhone ?? telefone ?? null,
    primary_phone: primaryPhone,
    secondary_phone: input.secondary_phone ?? null,
    whatsapp: input.whatsapp ?? telefone ?? null,
    email: input.email ?? "",
    endereco: input.endereco ?? input.address ?? "",
    address: input.address ?? input.endereco ?? "",
    neighborhood,
    bairro: neighborhood,
    marital_status: maritalStatus,
    estado_civil: maritalStatus,
    occupation,
    profissao: occupation,
    kingschat_username: input.kingschat_username ?? null,
    church_id: churchId,
    churchId,
    church_name: input.church_name ?? input.igreja ?? null,
    igreja: input.igreja ?? input.church_name ?? null,
    cell_group_id: input.cell_group_id ?? null,
    cell_group_name: input.cell_group_name ?? null,
    cell_id: input.cell_id ?? null,
    cell_name: input.cell_name ?? input.celula ?? null,
    celula: input.celula ?? input.cell_name ?? "",
    department_id: input.department_id ?? null,
    department_name: departamento || null,
    departamento,
    estado,
    status: estado,
    data_de_entrada: entryDate,
    entry_date: entryDate,
    member_since: entryDate,
    origem: origin,
    source: origin,
    notas: notes,
    notes,
    isActive: input.isActive ?? isActiveStatus(estado),
    membership_status: input.membership_status ?? estado,
    cell_role: input.cell_role ?? "Member",
    cell_participation_status: input.cell_participation_status ?? "Unknown",
    service_participation_status: input.service_participation_status ?? "Unknown",
    legacy_foundation_status: input.legacy_foundation_status ?? null,
    legacy_foundation_raw_value: input.legacy_foundation_raw_value ?? null,
    legacy_alec_status: input.legacy_alec_status ?? null,
    legacy_alec_raw_value: input.legacy_alec_raw_value ?? null,
    legacy_baptism_status: input.legacy_baptism_status ?? null,
    legacy_baptism_raw_value: input.legacy_baptism_raw_value ?? null,
    legacy_partner_status: input.legacy_partner_status ?? null,
    legacy_partnership_arms: input.legacy_partnership_arms ?? [],
    legacy_source: input.legacy_source ?? null,
    legacy_source_sheet: input.legacy_source_sheet ?? null,
    legacy_source_row: input.legacy_source_row ?? null,
    legacy_import_batch_id: input.legacy_import_batch_id ?? null,
    legacy_original_values: input.legacy_original_values ?? null,
    data_quality_status: input.data_quality_status ?? (primaryPhone ? "Valid" : "NeedsReview"),
    reconciliation_status: input.reconciliation_status ?? "NotRequired",
    created_at: input.created_at ?? input.createdAt,
    updated_at: input.updated_at ?? input.updatedAt,
    createdAt: input.createdAt ?? (typeof input.created_at === "string" ? input.created_at : undefined),
    updatedAt: input.updatedAt ?? (typeof input.updated_at === "string" ? input.updated_at : undefined),
  };
}

/** Resolve church_name from churches repository whenever church_id is set. */
async function attachChurchName(member: Member): Promise<Member> {
  if (!member.church_id) return member;
  try {
    const churches = await listChurches();
    if (!churches.ok) return member;
    const church = (churches.data || []).find(
      (c) => c.id === member.church_id || c.church_id === member.church_id,
    );
    if (!church) return member;
    const name = church.church_name || church.public_name || member.church_name || member.igreja || "";
    return normalizeMember({
      ...member,
      church_name: name,
      igreja: name,
    });
  } catch {
    return member;
  }
}

/**
 * Seed empty providers with dashboard-compatible mock members.
 * Safe to call repeatedly — only seeds when collection is empty.
 * Skipped for supabase/api (remote seed via SQL).
 */
export async function ensureMembersSeeded(): Promise<void> {
  if (getDataSource() === "supabase" || useSupabaseMembers() || useApiMembers()) return;
  const provider = getDataProvider();
  const listed = await provider.members.list();
  if (!listed.ok) return;
  if ((listed.data || []).length > 0) return;

  if (provider.members.create) {
    for (const seed of MEMBERS_SEED) {
      await provider.members.create(normalizeMember(seed));
    }
  }
}

export async function listMembers(): Promise<DataResult<Member[]>> {
  try {
    if (getDataSource() === "supabase") {
      if (!useSupabaseMembers()) {
        return fail("Supabase não está configurado. Verifique as variáveis de ambiente.", "SUPABASE_NOT_CONFIGURED");
      }
      const result = await membersSb.listMembers();
      if (!result.ok) return result;
      const rows = await Promise.all(
        (result.data || []).map(async (m) => attachChurchName(normalizeMember(m))),
      );
      return ok(rows);
    }
    if (useApiMembers()) {
      const result = await membersApi.listMembers();
      if (!result.ok) return result;
      return ok((result.data || []).map((m) => normalizeMember(m)));
    }
    await ensureMembersSeeded();
    const provider = getDataProvider();
    const result = await provider.members.list();
    if (!result.ok) return result;
    const rows = await Promise.all(
      (result.data || []).map(async (m) => attachChurchName(normalizeMember(m))),
    );
    return ok(rows);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao listar membros.");
  }
}

/** Paginated directory query used by the Members screen. */
export async function listMembersPage(query: MemberListQuery = {}): Promise<DataResult<MemberPage>> {
  try {
    if (getDataSource() === "supabase") {
      if (!useSupabaseMembers()) {
        return fail("Supabase não está configurado. Verifique as variáveis de ambiente.", "SUPABASE_NOT_CONFIGURED");
      }
      const result = await membersSb.listMembersPage(query);
      if (!result.ok) return result;
      return ok({ ...result.data, items: result.data.items.map(normalizeMember) });
    }
    // Local/mock remain deterministic, while mirroring the same page contract.
    const listed = await listMembers();
    if (!listed.ok) return listed as DataResult<MemberPage>;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(25, Number(query.pageSize) || 50));
    const search = String(query.search || "").trim().toLowerCase();
    const matches = (listed.data || []).filter((member) => {
      if (query.churchId) {
        const matchId = String(member.church_id || member.churchId || "") === String(query.churchId);
        const churchObj = (typeof window !== "undefined" && (window as any).state?.churches || []).find(
          (c: any) => String(c.id) === String(query.churchId) || String(c.church_id) === String(query.churchId)
        );
        const targetChurchName = churchObj?.church_name || churchObj?.public_name || String(query.churchId);
        const matchName = targetChurchName && String(member.church_name || member.igreja || "").toLowerCase().includes(targetChurchName.toLowerCase());
        if (!matchId && !matchName) return false;
      }
      if (query.cellGroupId || query.cellGroupName) {
        const targetGroup = String(query.cellGroupName || query.cellGroupId || "").toLowerCase();
        const matchGroupId = query.cellGroupId && String(member.cell_group_id || member.group_id || "").toLowerCase() === String(query.cellGroupId).toLowerCase();
        const matchGroupName = targetGroup && String(member.cell_group_name || member.grupo_de_celula || "").toLowerCase().includes(targetGroup);
        let matchRegistry = false;
        if (typeof window !== "undefined" && (window as any).state?.cellRegistry) {
          const registry = (window as any).state.cellRegistry || [];
          const cell = registry.find((c: any) =>
            (member.cell_id && String(c.id) === String(member.cell_id)) ||
            (member.cell_name && String(c.cell_name || "").toLowerCase() === String(member.cell_name).toLowerCase()) ||
            (member.celula && String(c.cell_name || "").toLowerCase() === String(member.celula).toLowerCase())
          );
          if (cell) {
            if (query.cellGroupId && (String(cell.group_id) === String(query.cellGroupId) || String(cell.cell_group_id) === String(query.cellGroupId))) matchRegistry = true;
            if (targetGroup) {
              const gName = String(cell.group_name || cell.cell_group_name || "").toLowerCase();
              if (gName && (gName.includes(targetGroup) || targetGroup.includes(gName))) matchRegistry = true;
            }
          }
        }
        if (!matchGroupId && !matchGroupName && !matchRegistry) return false;
      }
      if (query.cellId || query.cellName || query.cellNameLike) {
        const targetCell = String(query.cellName || query.cellNameLike || query.cellId || "").toLowerCase();
        const matchCellId = query.cellId && String(member.cell_id || "").toLowerCase() === String(query.cellId).toLowerCase();
        const matchCellName = targetCell && String(member.cell_name || member.celula || "").toLowerCase().includes(targetCell);
        let matchRegistry = false;
        if (typeof window !== "undefined" && (window as any).state?.cellRegistry) {
          const registry = (window as any).state.cellRegistry || [];
          const cell = registry.find((c: any) =>
            (query.cellId && String(c.id) === String(query.cellId)) ||
            (targetCell && String(c.cell_name || c.name || "").toLowerCase().includes(targetCell))
          );
          if (cell) {
            if (member.cell_id && String(member.cell_id) === String(cell.id)) matchRegistry = true;
            if (member.cell_name && String(cell.cell_name || "").toLowerCase().includes(String(member.cell_name).toLowerCase())) matchRegistry = true;
          }
        }
        if (!matchCellId && !matchCellName && !matchRegistry) return false;
      }
      if (query.status && String(member.status || member.estado || "").toLowerCase() !== String(query.status).toLowerCase()) return false;
      if (query.reconciliationStatus && String(member.reconciliation_status || "").toLowerCase() !== String(query.reconciliationStatus).toLowerCase()) return false;
      if (search.length < 2) return true;
      return [member.full_name, member.first_name, member.last_name, member.primary_phone, member.secondary_phone, member.phone, member.email, member.member_code]
        .some((value) => String(value || "").toLowerCase().includes(search));
    });
    const totalCount = matches.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    return ok({ items: matches.slice((page - 1) * pageSize, page * pageSize), page, pageSize, totalCount, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao paginar membros.");
  }
}

export async function getMemberById(id: EntityId): Promise<DataResult<Member | null>> {
  try {
    if (getDataSource() === "supabase") {
      if (!useSupabaseMembers()) {
        return fail("Supabase não está configurado. Verifique as variáveis de ambiente.", "SUPABASE_NOT_CONFIGURED");
      }
      const result = await membersSb.getMemberById(id);
      if (!result.ok) return result;
      if (!result.data) return ok(null);
      return ok(await attachChurchName(normalizeMember(result.data)));
    }
    if (useApiMembers()) {
      const result = await membersApi.getMemberById(id);
      if (!result.ok) return result;
      return ok(result.data ? normalizeMember(result.data) : null);
    }
    await ensureMembersSeeded();
    const provider = getDataProvider();
    const result = await provider.members.getById(id);
    if (!result.ok) return result;
    if (!result.data) return ok(null);
    return ok(await attachChurchName(normalizeMember(result.data)));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao obter membro.");
  }
}

export async function createMember(payload: Partial<Member>): Promise<DataResult<Member>> {
  try {
    if (getDataSource() === "supabase") {
      if (!useSupabaseMembers()) {
        return fail("Supabase não está configurado. Verifique as variáveis de ambiente.", "SUPABASE_NOT_CONFIGURED");
      }
      let member = normalizeMember(payload);
      member = await attachChurchName(member);
      const result = await membersSb.createMember(member);
      if (!result.ok) return result;
      return ok(normalizeMember(result.data));
    }
    if (useApiMembers()) {
      const result = await membersApi.createMember(payload);
      if (!result.ok) return result;
      return ok(normalizeMember(result.data));
    }
    await ensureMembersSeeded();
    const provider = getDataProvider();
    if (!provider.members.create) {
      return fail("Criar membro não suportado neste data source.", "NOT_SUPPORTED");
    }
    const today = new Date().toISOString().slice(0, 10);
    let member = normalizeMember({
      ...payload,
      id: payload.id || `m-${Date.now()}`,
      created_at: payload.created_at || today,
      updated_at: payload.updated_at || today,
    });
    member = await attachChurchName(member);
    const result = await provider.members.create(member);
    if (!result.ok) return result;
    return ok(normalizeMember(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao criar membro.");
  }
}

export async function updateMember(
  id: EntityId,
  payload: Partial<Member>,
): Promise<DataResult<Member>> {
  try {
    if (getDataSource() === "supabase") {
      if (!useSupabaseMembers()) {
        return fail("Supabase não está configurado. Verifique as variáveis de ambiente.", "SUPABASE_NOT_CONFIGURED");
      }
      const existing = await membersSb.getMemberById(id);
      if (!existing.ok) return fail(existing.error, existing.code);
      if (!existing.data) return fail("Membro não encontrado.", "NOT_FOUND");
      // `null` is meaningful for a cleared relational field. Do not fall back
      // to an old alias value after the user has explicitly changed it.
      const hasPayloadDepartment = Object.prototype.hasOwnProperty.call(payload, "departamento")
        || Object.prototype.hasOwnProperty.call(payload, "department_name");
      const payloadDepartment = Object.prototype.hasOwnProperty.call(payload, "departamento")
        ? payload.departamento
        : payload.department_name;
      const hasPayloadDepartmentId = Object.prototype.hasOwnProperty.call(payload, "department_id");
      let next = normalizeMember({
        ...existing.data,
        ...payload,
        id,
        first_name: payload.nome ?? payload.first_name ?? existing.data.first_name,
        last_name: payload.apelido ?? payload.last_name ?? existing.data.last_name,
        nome: payload.nome ?? payload.first_name ?? existing.data.nome,
        apelido: payload.apelido ?? payload.last_name ?? existing.data.apelido,
        title: payload.tratamento ?? payload.title ?? existing.data.title,
        tratamento: payload.tratamento ?? payload.title ?? existing.data.tratamento,
        department_id: hasPayloadDepartmentId ? payload.department_id : existing.data.department_id,
        department_name: hasPayloadDepartment ? payloadDepartment : existing.data.department_name,
        departamento: hasPayloadDepartment ? payloadDepartment : existing.data.departamento,
        status: payload.estado ?? payload.status ?? existing.data.status,
        estado: payload.estado ?? payload.status ?? existing.data.estado,
        membership_status: payload.membership_status ?? payload.estado ?? payload.status ?? existing.data.membership_status,
        entry_date: payload.data_de_entrada ?? payload.entry_date ?? payload.member_since ?? existing.data.entry_date,
        data_de_entrada: payload.data_de_entrada ?? payload.entry_date ?? payload.member_since ?? existing.data.data_de_entrada,
        member_since: payload.data_de_entrada ?? payload.entry_date ?? payload.member_since ?? existing.data.member_since,
        notes: payload.notas ?? payload.notes ?? existing.data.notes,
        notas: payload.notas ?? payload.notes ?? existing.data.notas,
        source: payload.origem ?? payload.source ?? existing.data.source,
        origem: payload.origem ?? payload.source ?? existing.data.origem,
        neighborhood: payload.neighborhood ?? payload.bairro ?? existing.data.neighborhood,
        bairro: payload.neighborhood ?? payload.bairro ?? existing.data.bairro,
        marital_status: payload.marital_status ?? payload.estado_civil ?? existing.data.marital_status,
        estado_civil: payload.marital_status ?? payload.estado_civil ?? existing.data.estado_civil,
        occupation: payload.occupation ?? payload.profissao ?? existing.data.occupation,
        profissao: payload.occupation ?? payload.profissao ?? existing.data.profissao,
      });
      next = await attachChurchName(next);
      const result = await membersSb.updateMember(id, next);
      if (!result.ok) return result;
      return ok(normalizeMember(result.data));
    }
    if (useApiMembers()) {
      const result = await membersApi.updateMember(id, payload);
      if (!result.ok) return result;
      return ok(normalizeMember(result.data));
    }
    const provider = getDataProvider();
    if (!provider.members.update) {
      return fail("Actualizar membro não suportado neste data source.", "NOT_SUPPORTED");
    }
    const existing = await provider.members.getById(id);
    if (!existing.ok) return fail(existing.error, existing.code);
    if (!existing.data) return fail("Membro não encontrado.", "NOT_FOUND");

    let next = normalizeMember({
      ...existing.data,
      ...payload,
      id,
      updated_at: new Date().toISOString().slice(0, 10),
    });
    next = await attachChurchName(next);
    const result = await provider.members.update(id, next);
    if (!result.ok) return result;
    return ok(normalizeMember(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao actualizar membro.");
  }
}

export async function deleteMember(id: EntityId): Promise<DataResult<boolean>> {
  try {
    if (getDataSource() === "supabase") {
      if (!useSupabaseMembers()) {
        return fail("Supabase não está configurado. Verifique as variáveis de ambiente.", "SUPABASE_NOT_CONFIGURED");
      }
      return membersSb.deleteMember(id);
    }
    if (useApiMembers()) return membersApi.deleteMember(id);
    const provider = getDataProvider();
    if (!provider.members.remove) {
      return fail("Eliminar membro não suportado neste data source.", "NOT_SUPPORTED");
    }
    return provider.members.remove(id);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao eliminar membro.");
  }
}

export async function searchMembers(query: string): Promise<DataResult<Member[]>> {
  try {
    if (getDataSource() === "supabase") {
      if (!useSupabaseMembers()) {
        return fail("Supabase não está configurado. Verifique as variáveis de ambiente.", "SUPABASE_NOT_CONFIGURED");
      }
      const result = await membersSb.searchMembers(query);
      if (!result.ok) return result;
      return ok((result.data || []).map((m) => normalizeMember(m)));
    }
    if (useApiMembers()) {
      const result = await membersApi.searchMembers(query);
      if (!result.ok) return result;
      return ok((result.data || []).map((m) => normalizeMember(m)));
    }
    const listed = await listMembers();
    if (!listed.ok) return listed;
    const q = String(query || "")
      .trim()
      .toLowerCase();
    if (!q) return listed;
    const filtered = listed.data.filter((member) =>
      [
        member.full_name,
        member.fullName,
        member.nome,
        member.apelido,
        member.first_name,
        member.last_name,
        member.telefone,
        member.phone,
        member.whatsapp,
        member.email,
        member.celula,
        member.cell_name,
        member.departamento,
        member.department_name,
        member.church_name,
        member.igreja,
        member.estado,
        member.origem,
      ].some((value) => String(value || "").toLowerCase().includes(q)),
    );
    return ok(filtered);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao pesquisar membros.");
  }
}

export async function getMembersByChurch(churchId: EntityId): Promise<DataResult<Member[]>> {
  try {
    const listed = await listMembers();
    if (!listed.ok) return listed;
    return ok(
      listed.data.filter(
        (m) => m.church_id === churchId || m.churchId === churchId,
      ),
    );
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao filtrar por igreja.");
  }
}

export async function getMembersByCell(cellId: EntityId): Promise<DataResult<Member[]>> {
  try {
    const listed = await listMembers();
    if (!listed.ok) return listed;
    return ok(listed.data.filter((m) => m.cell_id === cellId));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao filtrar por célula.");
  }
}

export async function getMembersByCellGroup(
  cellGroupId: EntityId,
): Promise<DataResult<Member[]>> {
  try {
    const listed = await listMembers();
    if (!listed.ok) return listed;
    return ok(listed.data.filter((m) => m.cell_group_id === cellGroupId));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao filtrar por grupo de célula.");
  }
}

export async function getMembersByDepartment(
  departmentId: EntityId,
): Promise<DataResult<Member[]>> {
  try {
    const listed = await listMembers();
    if (!listed.ok) return listed;
    const key = String(departmentId || "").toLowerCase();
    return ok(
      listed.data.filter(
        (m) =>
          m.department_id === departmentId ||
          String(m.departamento || "").toLowerCase() === key ||
          String(m.department_name || "").toLowerCase() === key,
      ),
    );
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao filtrar por departamento.");
  }
}

export async function getActiveMembers(): Promise<DataResult<Member[]>> {
  try {
    const listed = await listMembers();
    if (!listed.ok) return listed;
    return ok(listed.data.filter((m) => isActiveStatus(m.estado || m.status)));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao listar membros activos.");
  }
}

export async function getInactiveMembers(): Promise<DataResult<Member[]>> {
  try {
    const listed = await listMembers();
    if (!listed.ok) return listed;
    return ok(listed.data.filter((m) => isInactiveStatus(m.estado || m.status)));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao listar membros inactivos.");
  }
}

/** Diagnostic helper for docs / console. */
export function getMembersDataSourceInfo() {
  const provider = getDataProvider();
  const sb = useSupabaseMembers();
  const api = useApiMembers();
  const sbInfo = sb && typeof membersSb.getMembersDataSourceInfo === "function" ? membersSb.getMembersDataSourceInfo() : {};
  return {
    source: getDataSource(),
    provider: sb ? "supabase" : api ? "api" : provider.name,
    adapter: sb ? "supabase-members-adapter" : api ? "api-members-adapter" : provider.name,
    ready: sb ? getSupabaseEnvConfig().isConfigured : api ? false : provider.isReady(),
    description: sb
      ? "Members pilot via Supabase public.members"
      : api
        ? "Members API placeholder"
        : provider.description,
    pilot: sb ? "churches-members-supabase-v1" : undefined,
    ...sbInfo,
  };
}

export function getInfo() {
  return getMembersDataSourceInfo();
}

