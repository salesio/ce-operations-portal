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

export function normalizeMemberRegistrationCandidate(
  input: Partial<MemberRegistrationCandidate>,
  actor?: CandidateActor,
): MemberRegistrationCandidate {
  const now = new Date().toISOString();
  const fullName = String(input.full_name || "").trim();
  const source = input.registration_source || (actor?.role === "Cell Assistant" ? "CellAssistant" : actor?.role === "Cell Leader" ? "CellLeader" : "AdminManual");
  const phone = String(input.primary_phone || "").trim() || null;
  return {
    ...input,
    id: input.id || `member-candidate-${Date.now()}`,
    candidate_number: input.candidate_number || `MC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    full_name: fullName,
    primary_phone: phone,
    church_id: input.church_id || actor?.church_id || "",
    cell_id: input.cell_id || "",
    registration_source: source,
    registered_by_user_id: input.registered_by_user_id || actor?.id || "",
    registered_by_name: input.registered_by_name || actor?.name || "",
    registered_at: input.registered_at || now,
    membership_status: input.membership_status || "Candidate",
    approval_status: input.approval_status || "Draft",
    data_quality_status: input.data_quality_status || (phone ? "Valid" : "NeedsReview"),
    created_at: input.created_at || now,
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
  const ownEditable = existing.data.registered_by_user_id === actor.id && ["Draft", "NeedsCorrection", "ReadyForSubmission"].includes(String(existing.data.approval_status));
  if (!canReview(actor) && !ownEditable) return fail("Não tem permissão para editar este pedido.", "PERMISSION_DENIED");
  if (!canReview(actor) && input.cell_id && !(actor.authorized_cell_ids || []).includes(input.cell_id)) return fail("A célula escolhida não está autorizada.", "CELL_SCOPE_DENIED");
  if (!repository.update) return fail("O data source não suporta actualizar pedidos.", "NOT_SUPPORTED");
  return repository.update(id, normalizeMemberRegistrationCandidate({ ...existing.data, ...input, id }, actor));
}

