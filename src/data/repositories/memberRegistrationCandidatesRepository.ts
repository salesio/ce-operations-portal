import { getDataProvider } from "../dataProvider";
import type {
  EntityId,
  Member,
  MemberRegistrationCandidate,
} from "../types/entities";
import type { DataResult } from "../types/repository";

export type CandidateActor = {
  id: EntityId;
  name?: string;
  role?: string;
  church_id?: EntityId | null;
  authorized_cell_ids?: EntityId[];
};

function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}

function fail<T>(error: string, code = "MEMBER_CANDIDATE_ERROR"): DataResult<T> {
  return { ok: false, error, code };
}

function normal(value: unknown): string {
  return String(value || "").trim().toLocaleLowerCase();
}

function canReview(actor?: CandidateActor): boolean {
  return ["Super Admin", "Church Admin", "Membership Officer", "Cell Ministry Head"].includes(String(actor?.role || ""));
}

function cleanString(val: unknown): string | null {
  if (val == null) return null;
  const s = String(val).trim();
  return s === "" ? null : s;
}

function cleanDate(val: unknown): string | null {
  if (val == null) return null;
  const s = String(val).trim();
  if (!s || s === "" || s === "—" || s === "-" || s === "null" || s === "undefined") return null;
  return s;
}

function cleanUuid(val: unknown): string | null {
  if (val == null) return null;
  const s = String(val).trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s) ? s : null;
}

export function normalizeMemberRegistrationCandidate(
  input: Partial<MemberRegistrationCandidate>,
  actor?: CandidateActor,
): MemberRegistrationCandidate {
  const now = new Date().toISOString();
  const fullName = cleanString(input.full_name) || "Candidato";
  const source = input.registration_source || (actor?.role === "Cell Assistant" ? "CellAssistant" : actor?.role === "Cell Leader" ? "CellLeader" : "AdminManual");
  const phone = cleanString(input.primary_phone || (input as any).phone || (input as any).telefone) || null;
  const rawChurch = cleanString(input.church_id || actor?.church_id);
  const churchId = rawChurch || "a1111111-1111-4111-8111-111111111101";
  const parts = fullName.split(/\s+/);
  const first = cleanString(input.first_name) || parts[0] || null;
  const last = cleanString(input.last_name) || parts.slice(1).join(" ") || null;
  const rawId = cleanString(input.id);
  const idVal = (rawId && cleanUuid(rawId)) ? rawId : (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : (rawId || `mc-${Date.now()}`));

  return {
    ...input,
    id: idVal,
    candidate_number: cleanString(input.candidate_number) || `MC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    full_name: fullName,
    first_name: first,
    last_name: last,
    date_of_birth: cleanDate(input.date_of_birth ?? (input as any).data_de_nascimento),
    primary_phone: phone,
    secondary_phone: cleanString(input.secondary_phone ?? (input as any).telefone_alternativo),
    email: cleanString(input.email),
    neighborhood: cleanString(input.neighborhood ?? (input as any).bairro),
    address: cleanString(input.address ?? (input as any).endereco ?? (input as any).morada),
    marital_status: cleanString(input.marital_status ?? (input as any).estado_civil),
    occupation: cleanString(input.occupation ?? (input as any).profissao),
    kingschat_username: cleanString(input.kingschat_username),
    church_id: churchId,
    church_name: cleanString(input.church_name ?? (input as any).igreja),
    cell_group_id: cleanString(input.cell_group_id),
    cell_group_name: cleanString(input.cell_group_name),
    cell_id: String(input.cell_id || ""),
    cell_name: cleanString(input.cell_name ?? (input as any).celula),
    registration_source: source,
    registered_by_user_id: cleanUuid(input.registered_by_user_id || actor?.id) || null,
    registered_by_name: cleanString(input.registered_by_name || actor?.name) || "",
    registered_by_cell_role: cleanString(input.registered_by_cell_role),
    registered_at: cleanDate(input.registered_at) || now,
    membership_status: cleanString(input.membership_status) || "Candidate",
    approval_status: cleanString(input.approval_status) || "Draft",
    submitted_for_approval_by: cleanUuid(input.submitted_for_approval_by) || null,
    submitted_for_approval_at: cleanDate(input.submitted_for_approval_at) || null,
    reviewed_by_user_id: cleanUuid(input.reviewed_by_user_id) || null,
    reviewed_by_name: cleanString(input.reviewed_by_name) || null,
    reviewed_at: cleanDate(input.reviewed_at) || null,
    approval_decision: cleanString(input.approval_decision) || null,
    correction_reason: cleanString(input.correction_reason) || null,
    rejection_reason: cleanString(input.rejection_reason) || null,
    approved_member_id: cleanUuid(input.approved_member_id) || null,
    approved_at: cleanDate(input.approved_at) || null,
    possible_existing_member_id: cleanUuid(input.possible_existing_member_id) || null,
    duplicate_confidence: cleanString(input.duplicate_confidence) || null,
    data_quality_status: cleanString(input.data_quality_status) || (phone ? "Valid" : "NeedsReview"),
    notes: cleanString(input.notes ?? (input as any).notas) || null,
    created_at: cleanDate(input.created_at) || now,
    updated_at: now,
  } as MemberRegistrationCandidate;
}

export function findMemberCandidateDuplicates(candidate: Partial<MemberRegistrationCandidate>, members: Member[]) {
  const name = normal(candidate.full_name);
  const phone = String(candidate.primary_phone || "").replace(/\D/g, "");
  const email = normal(candidate.email);
  const dob = String(candidate.date_of_birth || "");
  return members.map((member) => {
    const memberName = normal(member.full_name || [member.nome, member.apelido].filter(Boolean).join(" "));
    const memberPhone = String(member.primary_phone || member.phone || member.telefone || "").replace(/\D/g, "");
    const memberEmail = normal(member.email);
    const memberDob = String(member.date_of_birth || member.data_de_nascimento || "");
    const likely = Boolean((phone && memberPhone && phone === memberPhone) || (email && memberEmail && email === memberEmail) || (name && dob && memberName === name && memberDob === dob));
    const possible = !likely && Boolean(name && candidate.church_id && memberName === name && member.church_id === candidate.church_id && normal(candidate.neighborhood) && normal(member.neighborhood) === normal(candidate.neighborhood));
    return likely || possible ? { member, confidence: likely ? "Likely" : "Possible" } : null;
  }).filter(Boolean) as Array<{ member: Member; confidence: "Likely" | "Possible" }>;
}

export async function listMemberRegistrationCandidates(): Promise<DataResult<MemberRegistrationCandidate[]>> {
  return getDataProvider().memberRegistrationCandidates.list();
}

export async function createMemberRegistrationCandidate(input: Partial<MemberRegistrationCandidate>, actor: CandidateActor): Promise<DataResult<MemberRegistrationCandidate>> {
  const candidate = normalizeMemberRegistrationCandidate(input, actor);
  if (!candidate.full_name || !candidate.church_id || !candidate.cell_id) return fail("Nome completo, igreja e célula são obrigatórios.", "VALIDATION_ERROR");
  if (!canReview(actor) && !(actor.authorized_cell_ids || []).includes(candidate.cell_id)) return fail("A célula escolhida não está autorizada para este utilizador.", "CELL_SCOPE_DENIED");
  const repository = getDataProvider().memberRegistrationCandidates;
  if (!repository.create) return fail("O data source não suporta pedidos de adesão.", "NOT_SUPPORTED");
  return repository.create(candidate);
}

export async function updateMemberRegistrationCandidate(id: EntityId, input: Partial<MemberRegistrationCandidate>, actor: CandidateActor): Promise<DataResult<MemberRegistrationCandidate>> {
  const repository = getDataProvider().memberRegistrationCandidates;
  const existing = await repository.getById(id);
  if (!existing.ok || !existing.data) return fail("Pedido de adesão não encontrado.", "NOT_FOUND");
  const cellAuthorized = !existing.data.cell_id || (actor.authorized_cell_ids || []).includes(existing.data.cell_id) || canReview(actor);
  const ownRecord = existing.data.registered_by_user_id === actor.id;
  const isLeaderOrAssistant = ["Cell Leader", "Cell Assistant", "Cell Group Leader", "cell_leader", "assistant_cell_leader", "cell_assistant", "Leader", "Assistant"].includes(String(actor?.role || ""));
  const canEditCandidate = canReview(actor) || cellAuthorized || ownRecord || isLeaderOrAssistant;
  if (!canEditCandidate) return fail("Não tem permissão para editar este pedido.", "PERMISSION_DENIED");
  if (!canReview(actor) && input.cell_id && (actor.authorized_cell_ids || []).length > 0 && !(actor.authorized_cell_ids || []).includes(input.cell_id)) return fail("A célula escolhida não está autorizada.", "CELL_SCOPE_DENIED");
  if (!repository.update) return fail("O data source não suporta actualizar pedidos.", "NOT_SUPPORTED");
  return repository.update(id, normalizeMemberRegistrationCandidate({ ...existing.data, ...input, id }, actor));
}

