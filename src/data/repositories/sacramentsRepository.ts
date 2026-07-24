import { getDataProvider } from "../dataProvider";
import { getDataSource } from "../config";
import type {
  BabyDedication,
  Baptism,
  EntityId,
  Marriage,
  SacramentAppointment,
  SacramentCertificate,
  SacramentDocument,
} from "../types/entities";
import type { DataResult } from "../types/repository";
import { BAPTISMS_SEED } from "../seeds/baptismsSeed";
import { MARRIAGES_SEED } from "../seeds/marriagesSeed";
import { BABY_DEDICATIONS_SEED } from "../seeds/babyDedicationsSeed";
import { SACRAMENT_CERTIFICATES_SEED } from "../seeds/sacramentCertificatesSeed";
import { SACRAMENT_DOCUMENTS_SEED } from "../seeds/sacramentDocumentsSeed";
import { SACRAMENT_APPOINTMENTS_SEED } from "../seeds/sacramentAppointmentsSeed";

function fail<T>(error: string, code = "SACRAMENTS_ERROR"): DataResult<T> {
  return { ok: false, error, code };
}
function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function nowIso(): string {
  return new Date().toISOString();
}
function statusKey(s: string | null | undefined): string {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}
function nextNum(prefix: string, existing: string[]): string {
  const year = new Date().getFullYear();
  const re = new RegExp(`^${prefix}-${year}-(\\d+)$`, "i");
  let max = 0;
  for (const n of existing) {
    const m = String(n || "").match(re);
    if (m) max = Math.max(max, Number(m[1]) || 0);
  }
  return `${prefix}-${year}-${String(max + 1).padStart(4, "0")}`;
}

async function softAudit(action: string, entityType: string, entityId: string, details = "") {
  try {
    const root = globalThis as unknown as {
      CEAccessControlData?: { createAuditLog?: (p: Record<string, unknown>) => Promise<unknown> };
      CEDataLayer?: {
        accessControl?: { createAuditLog?: (p: Record<string, unknown>) => Promise<unknown> };
      };
    };
    const api = root.CEAccessControlData || root.CEDataLayer?.accessControl;
    if (api?.createAuditLog) {
      await api.createAuditLog({
        action,
        entity_type: entityType,
        entity_id: entityId,
        module: "sacraments",
        details,
        severity: /issue|cancel|verify|reject|completed|export|document_view/i.test(action)
          ? "critical"
          : "info",
      });
    }
  } catch {
    /* soft */
  }
}

// ---------------------------------------------------------------------------
// Normalize
// ---------------------------------------------------------------------------

export function normalizeBaptism(input: Partial<Baptism> & { id?: string }): Baptism {
  const first = input.first_name || input.nome || "";
  const last = input.last_name || input.apelido || "";
  const full =
    input.full_name ||
    [first, last].filter(Boolean).join(" ") ||
    input.nome ||
    "";
  const date = input.scheduled_date || input.data_do_baptismo || null;
  const certPaid = !!(input.certificate_paid ?? input.certificado_pago);
  const certIssued =
    !!(input.certificado_emitido) ||
    /issued|emitido/i.test(String(input.certificate_status || input.status || ""));
  let certStatus = input.certificate_status || "Not Required";
  if (input.certificate_required ?? input.quer_certificado) {
    if (certIssued) certStatus = "Issued";
    else if (certPaid) certStatus = certStatus === "Not Required" ? "Paid" : certStatus;
    else if (certStatus === "Not Required") certStatus = "Pending";
  }
  const status = input.status || input.estado || "Pending";
  return {
    ...input,
    id: input.id || `bap-${Date.now()}`,
    baptism_number: input.baptism_number || "",
    person_type: input.person_type || "Member",
    full_name: full,
    first_name: first || full.split(" ")[0] || "",
    last_name: last || full.split(" ").slice(1).join(" ") || "",
    nome: input.nome || first || full.split(" ")[0] || "",
    apelido: input.apelido || last || "",
    phone: input.phone || input.telefone || "",
    telefone: input.telefone || input.phone || "",
    age: Number(input.age ?? input.idade ?? 0) || null,
    idade: Number(input.idade ?? input.age ?? 0) || null,
    church_id: input.church_id || null,
    church_name: input.church_name || "",
    cell_name: input.cell_name || input.celula || "",
    celula: input.celula || input.cell_name || "",
    foundation_school_completed: !!input.foundation_school_completed,
    scheduled_date: date,
    data_do_baptismo: date || input.data_do_baptismo || null,
    scheduled_time: input.scheduled_time || "",
    location: input.location || input.local_do_baptismo || "",
    local_do_baptismo: input.local_do_baptismo || input.location || "",
    pastor_name: input.pastor_name || input.baptizado_por || "",
    baptizado_por: input.baptizado_por || input.pastor_name || "",
    baptism_type: input.baptism_type || "Water Baptism",
    status,
    estado: input.estado || status,
    certificate_required: !!(input.certificate_required ?? input.quer_certificado),
    quer_certificado: !!(input.quer_certificado ?? input.certificate_required),
    certificate_paid: certPaid,
    certificado_pago: certPaid,
    certificate_status: certStatus,
    certificate_id: input.certificate_id || null,
    certificado_emitido: certIssued,
    notes: input.notes || input.observacoes || "",
    observacoes: input.observacoes || input.notes || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

export function normalizeMarriage(input: Partial<Marriage> & { id?: string }): Marriage {
  const date = input.scheduled_date || input.data_do_casamento || null;
  const counseling = !!(input.counseling_completed ?? input.aconselhamento_concluido);
  const docsDelivered = !!(input.documentos_entregues);
  let docsStatus = input.documents_status || (docsDelivered ? "Partial" : "Pending");
  const status = input.status || input.estado || "Pending";
  return {
    ...input,
    id: input.id || `mar-${Date.now()}`,
    marriage_number: input.marriage_number || "",
    groom_name: input.groom_name || input.nome_do_noivo || "",
    nome_do_noivo: input.nome_do_noivo || input.groom_name || "",
    groom_phone: input.groom_phone || input.telefone_do_noivo || "",
    telefone_do_noivo: input.telefone_do_noivo || input.groom_phone || "",
    bride_name: input.bride_name || input.nome_da_noiva || "",
    nome_da_noiva: input.nome_da_noiva || input.bride_name || "",
    bride_phone: input.bride_phone || input.telefone_da_noiva || "",
    telefone_da_noiva: input.telefone_da_noiva || input.bride_phone || "",
    church_id: input.church_id || null,
    church_name: input.church_name || "",
    counseling_completed: counseling,
    aconselhamento_concluido: counseling,
    counseling_case_id: input.counseling_case_id || null,
    documents_status: docsStatus,
    documentos_entregues: docsDelivered || /complete|verified|parcial|partial/i.test(docsStatus),
    scheduled_date: date,
    data_do_casamento: date || input.data_do_casamento || null,
    location: input.location || input.venue_space_name || "",
    pastor_name: input.pastor_name || input.pastor_responsavel || "",
    pastor_responsavel: input.pastor_responsavel || input.pastor_name || "",
    witnesses: Array.isArray(input.witnesses) ? input.witnesses : [],
    status,
    estado: input.estado || status,
    certificate_required: input.certificate_required !== false,
    certificate_paid: !!input.certificate_paid,
    certificate_status: input.certificate_status || "Not Required",
    certificate_id: input.certificate_id || null,
    notes: input.notes || input.observacoes || "",
    observacoes: input.observacoes || input.notes || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

export function normalizeBabyDedication(
  input: Partial<BabyDedication> & { id?: string },
): BabyDedication {
  const date = input.scheduled_date || input.data_da_dedicacao || null;
  const child = input.child_full_name || input.nome_da_crianca || "";
  const status = input.status || input.estado || "Pending";
  const certIssued =
    !!input.certificado_emitido ||
    /issued|emitido/i.test(String(input.certificate_status || status));
  return {
    ...input,
    id: input.id || `baby-${Date.now()}`,
    dedication_number: input.dedication_number || "",
    child_full_name: child,
    nome_da_crianca: input.nome_da_crianca || child,
    child_date_of_birth: input.child_date_of_birth || input.data_de_nascimento || null,
    data_de_nascimento: input.data_de_nascimento || input.child_date_of_birth || null,
    father_name: input.father_name || input.nome_do_pai || "",
    nome_do_pai: input.nome_do_pai || input.father_name || "",
    mother_name: input.mother_name || input.nome_da_mae || "",
    nome_da_mae: input.nome_da_mae || input.mother_name || "",
    father_phone: input.father_phone || input.telefone_dos_pais || "",
    mother_phone: input.mother_phone || input.telefone_dos_pais || "",
    telefone_dos_pais:
      input.telefone_dos_pais || input.father_phone || input.mother_phone || "",
    church_id: input.church_id || null,
    church_name: input.church_name || "",
    scheduled_date: date,
    data_da_dedicacao: date || input.data_da_dedicacao || null,
    location: input.location || "",
    pastor_name: input.pastor_name || input.pastor_responsavel || "",
    pastor_responsavel: input.pastor_responsavel || input.pastor_name || "",
    status,
    estado: input.estado || status,
    certificate_required: input.certificate_required !== false,
    certificate_paid: !!input.certificate_paid,
    certificate_status: input.certificate_status || (certIssued ? "Issued" : "Not Required"),
    certificate_id: input.certificate_id || null,
    certificado_emitido: certIssued,
    notes: input.notes || input.observacoes || "",
    observacoes: input.observacoes || input.notes || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

export function normalizeSacramentCertificate(
  input: Partial<SacramentCertificate> & { id?: string },
): SacramentCertificate {
  return {
    ...input,
    id: input.id || `scert-${Date.now()}`,
    certificate_number: input.certificate_number || "",
    sacrament_type: input.sacrament_type || "Baptism",
    sacrament_id: input.sacrament_id || null,
    person_name: input.person_name || "",
    church_id: input.church_id || null,
    church_name: input.church_name || "",
    issued_date: input.issued_date || null,
    status: input.status || "Pending",
    // Internal only — never auto-creates financeRecord
    payment_status: input.payment_status || "Not Required",
    amount_paid: Number(input.amount_paid ?? 0) || 0,
    currency: input.currency || "MZN",
    file_url: input.file_url || "",
    file_name: input.file_name || "",
    notes: input.notes || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

export function normalizeSacramentDocument(
  input: Partial<SacramentDocument> & { id?: string },
): SacramentDocument {
  return {
    ...input,
    id: input.id || `sdoc-${Date.now()}`,
    sacrament_type: input.sacrament_type || "Baptism",
    sacrament_id: input.sacrament_id || null,
    person_name: input.person_name || "",
    document_type: input.document_type || "Other",
    document_title: input.document_title || "",
    file_url: input.file_url || "",
    file_name: input.file_name || "",
    status: input.status || "Pending Review",
    notes: input.notes || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

export function normalizeSacramentAppointment(
  input: Partial<SacramentAppointment> & { id?: string },
): SacramentAppointment {
  return {
    ...input,
    id: input.id || `sapt-${Date.now()}`,
    sacrament_type: input.sacrament_type || "Baptism",
    sacrament_id: input.sacrament_id || null,
    title: input.title || "",
    church_id: input.church_id || null,
    church_name: input.church_name || "",
    scheduled_date: input.scheduled_date || todayIso(),
    start_time: input.start_time || "",
    end_time: input.end_time || "",
    location: input.location || input.venue_space_name || "",
    pastor_name: input.pastor_name || "",
    status: input.status || "Scheduled",
    notes: input.notes || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

// ---------------------------------------------------------------------------
// Baptisms
// ---------------------------------------------------------------------------

export async function listBaptisms(): Promise<DataResult<Baptism[]>> {
  try {
    const result = await getDataProvider().baptisms.list();
    if (!result.ok) return result as DataResult<Baptism[]>;
    return ok((result.data || []).map((r) => normalizeBaptism(r as Baptism)));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listBaptisms failed");
  }
}
export async function getBaptismById(id: EntityId) {
  try {
    const result = await getDataProvider().baptisms.getById(id);
    if (!result.ok) return result as DataResult<Baptism | null>;
    return ok(result.data ? normalizeBaptism(result.data as Baptism) : null);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getBaptismById failed");
  }
}
export async function createBaptism(payload: Partial<Baptism>) {
  try {
    const listed = await listBaptisms();
    const nums = listed.ok ? listed.data.map((b) => b.baptism_number || "") : [];
    const row = normalizeBaptism({
      ...payload,
      baptism_number: payload.baptism_number || nextNum("BAP", nums),
    });
    const repo = getDataProvider().baptisms;
    if (!repo.create) return fail("create not supported", "NOT_SUPPORTED");
    const result = await repo.create(row);
    if (!result.ok) return result as DataResult<Baptism>;
    const n = normalizeBaptism(result.data as Baptism);
    void softAudit("sacrament_baptism_created", "baptism", n.id, n.baptism_number || "");
    return ok(n);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createBaptism failed");
  }
}
export async function updateBaptism(id: EntityId, payload: Partial<Baptism>) {
  try {
    const existing = await getBaptismById(id);
    if (!existing.ok || !existing.data) return fail("Baptismo não encontrado", "NOT_FOUND");
    const row = normalizeBaptism({ ...existing.data, ...payload, id, updated_at: todayIso() });
    const repo = getDataProvider().baptisms;
    if (!repo.update) return fail("update not supported", "NOT_SUPPORTED");
    const result = await repo.update(id, row);
    if (!result.ok) return result as DataResult<Baptism>;
    const n = normalizeBaptism(result.data as Baptism);
    if (/completed|conclu/i.test(String(n.status))) {
      void softAudit("sacrament_baptism_completed", "baptism", n.id);
    }
    return ok(n);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "updateBaptism failed");
  }
}
export async function deleteBaptism(id: EntityId) {
  try {
    const repo = getDataProvider().baptisms;
    if (!repo.remove) return fail("delete not supported", "NOT_SUPPORTED");
    return (await repo.remove(id)) as DataResult<boolean>;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "deleteBaptism failed");
  }
}
export async function searchBaptisms(query: string) {
  const list = await listBaptisms();
  if (!list.ok) return list;
  const q = statusKey(query);
  if (!q) return list;
  return ok(
    list.data.filter((b) =>
      statusKey([b.baptism_number, b.full_name, b.nome, b.apelido, b.phone].join(" ")).includes(q),
    ),
  );
}
export async function getBaptismsByChurch(churchId: EntityId) {
  const list = await listBaptisms();
  if (!list.ok) return list;
  return ok(list.data.filter((b) => b.church_id === churchId));
}
export async function getBaptismsByMember(memberId: EntityId) {
  const list = await listBaptisms();
  if (!list.ok) return list;
  return ok(list.data.filter((b) => b.member_id === memberId || b.person_id === memberId));
}
export async function getBaptismsByStatus(status: string) {
  const list = await listBaptisms();
  if (!list.ok) return list;
  const k = statusKey(status);
  return ok(
    list.data.filter(
      (b) => statusKey(b.status || "").includes(k) || statusKey(b.estado || "").includes(k),
    ),
  );
}
export async function getBaptismsByDateRange(startDate: string, endDate: string) {
  const list = await listBaptisms();
  if (!list.ok) return list;
  return ok(
    list.data.filter((b) => {
      const d = String(b.scheduled_date || b.data_do_baptismo || "").slice(0, 10);
      return d >= startDate && d <= endDate;
    }),
  );
}
export async function getUpcomingBaptisms() {
  const list = await listBaptisms();
  if (!list.ok) return list;
  const today = todayIso();
  return ok(
    list.data.filter((b) => {
      const d = String(b.scheduled_date || b.data_do_baptismo || "");
      const s = statusKey(b.status || b.estado);
      return d >= today && !s.includes("cancel") && !s.includes("completed") && !s.includes("conclu");
    }),
  );
}
export async function getCompletedBaptisms() {
  return getBaptismsByStatus("Completed");
}
export async function getPendingBaptismCertificates() {
  const list = await listBaptisms();
  if (!list.ok) return list;
  return ok(
    list.data.filter((b) => {
      const c = statusKey(b.certificate_status);
      const s = statusKey(b.status || b.estado);
      return (
        (c.includes("pending") || c.includes("paid") || s.includes("certificate pending")) &&
        !c.includes("issued") &&
        !!(b.certificate_required || b.quer_certificado)
      );
    }),
  );
}

// ---------------------------------------------------------------------------
// Marriages
// ---------------------------------------------------------------------------

export async function listMarriages(): Promise<DataResult<Marriage[]>> {
  try {
    const result = await getDataProvider().marriages.list();
    if (!result.ok) return result as DataResult<Marriage[]>;
    return ok((result.data || []).map((r) => normalizeMarriage(r as Marriage)));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listMarriages failed");
  }
}
export async function getMarriageById(id: EntityId) {
  try {
    const result = await getDataProvider().marriages.getById(id);
    if (!result.ok) return result as DataResult<Marriage | null>;
    return ok(result.data ? normalizeMarriage(result.data as Marriage) : null);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getMarriageById failed");
  }
}
export async function createMarriage(payload: Partial<Marriage>) {
  try {
    const listed = await listMarriages();
    const nums = listed.ok ? listed.data.map((m) => m.marriage_number || "") : [];
    const row = normalizeMarriage({
      ...payload,
      marriage_number: payload.marriage_number || nextNum("MAR", nums),
    });
    const repo = getDataProvider().marriages;
    if (!repo.create) return fail("create not supported", "NOT_SUPPORTED");
    const result = await repo.create(row);
    if (!result.ok) return result as DataResult<Marriage>;
    const n = normalizeMarriage(result.data as Marriage);
    void softAudit("sacrament_marriage_created", "marriage", n.id, n.marriage_number || "");
    return ok(n);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createMarriage failed");
  }
}
export async function updateMarriage(id: EntityId, payload: Partial<Marriage>) {
  try {
    const existing = await getMarriageById(id);
    if (!existing.ok || !existing.data) return fail("Casamento não encontrado", "NOT_FOUND");
    const row = normalizeMarriage({ ...existing.data, ...payload, id, updated_at: todayIso() });
    const repo = getDataProvider().marriages;
    if (!repo.update) return fail("update not supported", "NOT_SUPPORTED");
    const result = await repo.update(id, row);
    if (!result.ok) return result as DataResult<Marriage>;
    const n = normalizeMarriage(result.data as Marriage);
    if (/completed|conclu/i.test(String(n.status))) {
      void softAudit("sacrament_marriage_completed", "marriage", n.id);
    }
    return ok(n);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "updateMarriage failed");
  }
}
export async function deleteMarriage(id: EntityId) {
  try {
    const repo = getDataProvider().marriages;
    if (!repo.remove) return fail("delete not supported", "NOT_SUPPORTED");
    return (await repo.remove(id)) as DataResult<boolean>;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "deleteMarriage failed");
  }
}
export async function searchMarriages(query: string) {
  const list = await listMarriages();
  if (!list.ok) return list;
  const q = statusKey(query);
  if (!q) return list;
  return ok(
    list.data.filter((m) =>
      statusKey(
        [m.marriage_number, m.groom_name, m.bride_name, m.nome_do_noivo, m.nome_da_noiva].join(" "),
      ).includes(q),
    ),
  );
}
export async function getMarriagesByChurch(churchId: EntityId) {
  const list = await listMarriages();
  if (!list.ok) return list;
  return ok(list.data.filter((m) => m.church_id === churchId));
}
export async function getMarriagesByStatus(status: string) {
  const list = await listMarriages();
  if (!list.ok) return list;
  const k = statusKey(status);
  return ok(
    list.data.filter(
      (m) => statusKey(m.status || "").includes(k) || statusKey(m.estado || "").includes(k),
    ),
  );
}
export async function getMarriagesByDateRange(startDate: string, endDate: string) {
  const list = await listMarriages();
  if (!list.ok) return list;
  return ok(
    list.data.filter((m) => {
      const d = String(m.scheduled_date || m.data_do_casamento || "").slice(0, 10);
      return d >= startDate && d <= endDate;
    }),
  );
}
export async function getUpcomingMarriages() {
  const list = await listMarriages();
  if (!list.ok) return list;
  const today = todayIso();
  return ok(
    list.data.filter((m) => {
      const d = String(m.scheduled_date || m.data_do_casamento || "");
      return d >= today && !/cancel|completed|conclu/i.test(String(m.status || m.estado));
    }),
  );
}
export async function getCompletedMarriages() {
  return getMarriagesByStatus("Completed");
}
export async function getPendingMarriageDocuments() {
  const list = await listMarriages();
  if (!list.ok) return list;
  return ok(
    list.data.filter((m) =>
      /pending|partial|document/i.test(String(m.documents_status || m.status || "")),
    ),
  );
}
export async function getPendingMarriageCertificates() {
  const list = await listMarriages();
  if (!list.ok) return list;
  return ok(
    list.data.filter((m) => {
      const c = statusKey(m.certificate_status);
      return (c.includes("pending") || c.includes("paid")) && !c.includes("issued");
    }),
  );
}

// ---------------------------------------------------------------------------
// Baby dedications
// ---------------------------------------------------------------------------

export async function listBabyDedications(): Promise<DataResult<BabyDedication[]>> {
  try {
    const result = await getDataProvider().babyDedications.list();
    if (!result.ok) return result as DataResult<BabyDedication[]>;
    return ok((result.data || []).map((r) => normalizeBabyDedication(r as BabyDedication)));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listBabyDedications failed");
  }
}
export async function getBabyDedicationById(id: EntityId) {
  try {
    const result = await getDataProvider().babyDedications.getById(id);
    if (!result.ok) return result as DataResult<BabyDedication | null>;
    return ok(result.data ? normalizeBabyDedication(result.data as BabyDedication) : null);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getBabyDedicationById failed");
  }
}
export async function createBabyDedication(payload: Partial<BabyDedication>) {
  try {
    const listed = await listBabyDedications();
    const nums = listed.ok ? listed.data.map((b) => b.dedication_number || "") : [];
    const row = normalizeBabyDedication({
      ...payload,
      dedication_number: payload.dedication_number || nextNum("DED", nums),
    });
    const repo = getDataProvider().babyDedications;
    if (!repo.create) return fail("create not supported", "NOT_SUPPORTED");
    const result = await repo.create(row);
    if (!result.ok) return result as DataResult<BabyDedication>;
    const n = normalizeBabyDedication(result.data as BabyDedication);
    void softAudit("sacrament_baby_dedication_created", "baby_dedication", n.id);
    return ok(n);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createBabyDedication failed");
  }
}
export async function updateBabyDedication(id: EntityId, payload: Partial<BabyDedication>) {
  try {
    const existing = await getBabyDedicationById(id);
    if (!existing.ok || !existing.data) return fail("Dedicação não encontrada", "NOT_FOUND");
    const row = normalizeBabyDedication({
      ...existing.data,
      ...payload,
      id,
      updated_at: todayIso(),
    });
    const repo = getDataProvider().babyDedications;
    if (!repo.update) return fail("update not supported", "NOT_SUPPORTED");
    const result = await repo.update(id, row);
    if (!result.ok) return result as DataResult<BabyDedication>;
    const n = normalizeBabyDedication(result.data as BabyDedication);
    if (/completed|conclu/i.test(String(n.status))) {
      void softAudit("sacrament_baby_dedication_completed", "baby_dedication", n.id);
    }
    return ok(n);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "updateBabyDedication failed");
  }
}
export async function deleteBabyDedication(id: EntityId) {
  try {
    const repo = getDataProvider().babyDedications;
    if (!repo.remove) return fail("delete not supported", "NOT_SUPPORTED");
    return (await repo.remove(id)) as DataResult<boolean>;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "deleteBabyDedication failed");
  }
}
export async function searchBabyDedications(query: string) {
  const list = await listBabyDedications();
  if (!list.ok) return list;
  const q = statusKey(query);
  if (!q) return list;
  return ok(
    list.data.filter((b) =>
      statusKey(
        [b.dedication_number, b.child_full_name, b.father_name, b.mother_name].join(" "),
      ).includes(q),
    ),
  );
}
export async function getBabyDedicationsByChurch(churchId: EntityId) {
  const list = await listBabyDedications();
  if (!list.ok) return list;
  return ok(list.data.filter((b) => b.church_id === churchId));
}
export async function getBabyDedicationsByParent(parentId: EntityId) {
  const list = await listBabyDedications();
  if (!list.ok) return list;
  return ok(
    list.data.filter(
      (b) => b.father_member_id === parentId || b.mother_member_id === parentId,
    ),
  );
}
export async function getBabyDedicationsByStatus(status: string) {
  const list = await listBabyDedications();
  if (!list.ok) return list;
  const k = statusKey(status);
  return ok(
    list.data.filter(
      (b) => statusKey(b.status || "").includes(k) || statusKey(b.estado || "").includes(k),
    ),
  );
}
export async function getBabyDedicationsByDateRange(startDate: string, endDate: string) {
  const list = await listBabyDedications();
  if (!list.ok) return list;
  return ok(
    list.data.filter((b) => {
      const d = String(b.scheduled_date || b.data_da_dedicacao || "").slice(0, 10);
      return d >= startDate && d <= endDate;
    }),
  );
}
export async function getUpcomingBabyDedications() {
  const list = await listBabyDedications();
  if (!list.ok) return list;
  const today = todayIso();
  return ok(
    list.data.filter((b) => {
      const d = String(b.scheduled_date || b.data_da_dedicacao || "");
      return d >= today && !/cancel|completed|conclu/i.test(String(b.status || b.estado));
    }),
  );
}
export async function getCompletedBabyDedications() {
  return getBabyDedicationsByStatus("Completed");
}
export async function getPendingBabyDedicationCertificates() {
  const list = await listBabyDedications();
  if (!list.ok) return list;
  return ok(
    list.data.filter((b) => {
      const c = statusKey(b.certificate_status);
      return (c.includes("pending") || c.includes("paid")) && !c.includes("issued");
    }),
  );
}

// ---------------------------------------------------------------------------
// Certificates — NEVER auto-create finance records
// ---------------------------------------------------------------------------

export async function listSacramentCertificates(): Promise<DataResult<SacramentCertificate[]>> {
  try {
    const result = await getDataProvider().sacramentCertificates.list();
    if (!result.ok) return result as DataResult<SacramentCertificate[]>;
    return ok(
      (result.data || []).map((r) => normalizeSacramentCertificate(r as SacramentCertificate)),
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listSacramentCertificates failed");
  }
}
export async function getSacramentCertificateById(id: EntityId) {
  try {
    const result = await getDataProvider().sacramentCertificates.getById(id);
    if (!result.ok) return result as DataResult<SacramentCertificate | null>;
    return ok(
      result.data
        ? normalizeSacramentCertificate(result.data as SacramentCertificate)
        : null,
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getSacramentCertificateById failed");
  }
}
export async function createSacramentCertificate(payload: Partial<SacramentCertificate>) {
  try {
    const listed = await listSacramentCertificates();
    const nums = listed.ok ? listed.data.map((c) => c.certificate_number || "") : [];
    const typePrefix =
      payload.sacrament_type === "Marriage"
        ? "CERT-MAR"
        : payload.sacrament_type === "Baby Dedication"
          ? "CERT-DED"
          : "CERT-BAP";
    const row = normalizeSacramentCertificate({
      ...payload,
      certificate_number: payload.certificate_number || nextNum(typePrefix, nums),
    });
    // Explicit: no financeRecord side-effect
    delete (row as { transaction_type?: unknown }).transaction_type;
    const repo = getDataProvider().sacramentCertificates;
    if (!repo.create) return fail("create not supported", "NOT_SUPPORTED");
    const result = await repo.create(row);
    if (!result.ok) return result as DataResult<SacramentCertificate>;
    return ok(normalizeSacramentCertificate(result.data as SacramentCertificate));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createSacramentCertificate failed");
  }
}
export async function updateSacramentCertificate(
  id: EntityId,
  payload: Partial<SacramentCertificate>,
) {
  try {
    const existing = await getSacramentCertificateById(id);
    if (!existing.ok || !existing.data) return fail("Certificado não encontrado", "NOT_FOUND");
    const row = normalizeSacramentCertificate({
      ...existing.data,
      ...payload,
      id,
      updated_at: todayIso(),
    });
    delete (row as { transaction_type?: unknown }).transaction_type;
    const repo = getDataProvider().sacramentCertificates;
    if (!repo.update) return fail("update not supported", "NOT_SUPPORTED");
    const result = await repo.update(id, row);
    if (!result.ok) return result as DataResult<SacramentCertificate>;
    return ok(normalizeSacramentCertificate(result.data as SacramentCertificate));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "updateSacramentCertificate failed");
  }
}
export async function issueSacramentCertificate(
  id: EntityId,
  payload: { issued_by_user_id?: string; issued_by_name?: string; issued_date?: string } = {},
) {
  const result = await updateSacramentCertificate(id, {
    status: "Issued",
    issued_date: payload.issued_date || todayIso(),
    issued_by_user_id: payload.issued_by_user_id || null,
    issued_by_name: payload.issued_by_name || "",
  });
  if (result.ok) {
    void softAudit("sacrament_certificate_issued", "sacrament_certificate", String(id));
    // Sync sacrament record certificate flags
    const cert = result.data;
    if (cert?.sacrament_id && cert.sacrament_type === "Baptism") {
      await updateBaptism(cert.sacrament_id, {
        certificate_status: "Issued",
        certificado_emitido: true,
        certificate_id: cert.id,
        status: "Certificate Issued",
      });
    } else if (cert?.sacrament_id && cert.sacrament_type === "Marriage") {
      await updateMarriage(cert.sacrament_id, {
        certificate_status: "Issued",
        certificate_id: cert.id,
        status: "Certificate Issued",
      });
    } else if (cert?.sacrament_id && cert.sacrament_type === "Baby Dedication") {
      await updateBabyDedication(cert.sacrament_id, {
        certificate_status: "Issued",
        certificado_emitido: true,
        certificate_id: cert.id,
        status: "Certificate Issued",
      });
    }
  }
  return result;
}
export async function cancelSacramentCertificate(
  id: EntityId,
  payload: { notes?: string } = {},
) {
  const result = await updateSacramentCertificate(id, {
    status: "Cancelled",
    notes: payload.notes || "",
  });
  if (result.ok) void softAudit("sacrament_certificate_cancelled", "sacrament_certificate", String(id));
  return result;
}
export async function getCertificatesBySacrament(type: string, sacramentId: EntityId) {
  const list = await listSacramentCertificates();
  if (!list.ok) return list;
  const k = statusKey(type);
  return ok(
    list.data.filter(
      (c) => statusKey(c.sacrament_type || "").includes(k) && c.sacrament_id === sacramentId,
    ),
  );
}
export async function getCertificatesByStatus(status: string) {
  const list = await listSacramentCertificates();
  if (!list.ok) return list;
  const k = statusKey(status);
  return ok(list.data.filter((c) => statusKey(c.status || "").includes(k)));
}
export async function getPendingCertificates() {
  return getCertificatesByStatus("Pending");
}
export async function getIssuedCertificates() {
  return getCertificatesByStatus("Issued");
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export async function listSacramentDocuments(): Promise<DataResult<SacramentDocument[]>> {
  try {
    const result = await getDataProvider().sacramentDocuments.list();
    if (!result.ok) return result as DataResult<SacramentDocument[]>;
    return ok(
      (result.data || []).map((r) => normalizeSacramentDocument(r as SacramentDocument)),
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listSacramentDocuments failed");
  }
}
export async function getSacramentDocumentById(id: EntityId) {
  try {
    const result = await getDataProvider().sacramentDocuments.getById(id);
    if (!result.ok) return result as DataResult<SacramentDocument | null>;
    if (result.data) {
      void softAudit("sacrament_document_viewed", "sacrament_document", String(id));
    }
    return ok(
      result.data ? normalizeSacramentDocument(result.data as SacramentDocument) : null,
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getSacramentDocumentById failed");
  }
}
export async function createSacramentDocument(payload: Partial<SacramentDocument>) {
  try {
    const row = normalizeSacramentDocument(payload);
    const repo = getDataProvider().sacramentDocuments;
    if (!repo.create) return fail("create not supported", "NOT_SUPPORTED");
    const result = await repo.create(row);
    if (!result.ok) return result as DataResult<SacramentDocument>;
    return ok(normalizeSacramentDocument(result.data as SacramentDocument));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createSacramentDocument failed");
  }
}
export async function updateSacramentDocument(id: EntityId, payload: Partial<SacramentDocument>) {
  try {
    const existing = await getDataProvider().sacramentDocuments.getById(id);
    if (!existing.ok || !existing.data) return fail("Documento não encontrado", "NOT_FOUND");
    const row = normalizeSacramentDocument({
      ...(existing.data as SacramentDocument),
      ...payload,
      id,
      updated_at: todayIso(),
    });
    const repo = getDataProvider().sacramentDocuments;
    if (!repo.update) return fail("update not supported", "NOT_SUPPORTED");
    const result = await repo.update(id, row);
    if (!result.ok) return result as DataResult<SacramentDocument>;
    return ok(normalizeSacramentDocument(result.data as SacramentDocument));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "updateSacramentDocument failed");
  }
}
export async function deleteSacramentDocument(id: EntityId) {
  try {
    const repo = getDataProvider().sacramentDocuments;
    if (!repo.remove) return fail("delete not supported", "NOT_SUPPORTED");
    return (await repo.remove(id)) as DataResult<boolean>;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "deleteSacramentDocument failed");
  }
}
export async function getDocumentsBySacrament(type: string, sacramentId: EntityId) {
  const list = await listSacramentDocuments();
  if (!list.ok) return list;
  const k = statusKey(type);
  return ok(
    list.data.filter(
      (d) => statusKey(d.sacrament_type || "").includes(k) && d.sacrament_id === sacramentId,
    ),
  );
}
export async function getPendingDocumentReviews() {
  const list = await listSacramentDocuments();
  if (!list.ok) return list;
  return ok(
    list.data.filter((d) => /pending/i.test(String(d.status || ""))),
  );
}
export async function verifySacramentDocument(
  id: EntityId,
  payload: { verified_by_user_id?: string; verified_by_name?: string } = {},
) {
  const result = await updateSacramentDocument(id, {
    status: "Verified",
    verified_at: nowIso(),
    verified_by_user_id: payload.verified_by_user_id || null,
    verified_by_name: payload.verified_by_name || "",
  });
  if (result.ok) void softAudit("sacrament_document_verified", "sacrament_document", String(id));
  return result;
}
export async function rejectSacramentDocument(
  id: EntityId,
  payload: {
    rejected_by_user_id?: string;
    rejected_by_name?: string;
    rejection_reason?: string;
  } = {},
) {
  const result = await updateSacramentDocument(id, {
    status: "Rejected",
    rejected_at: nowIso(),
    rejected_by_user_id: payload.rejected_by_user_id || null,
    rejected_by_name: payload.rejected_by_name || "",
    rejection_reason: payload.rejection_reason || "",
  });
  if (result.ok) void softAudit("sacrament_document_rejected", "sacrament_document", String(id));
  return result;
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export async function listSacramentAppointments(): Promise<DataResult<SacramentAppointment[]>> {
  try {
    const result = await getDataProvider().sacramentAppointments.list();
    if (!result.ok) return result as DataResult<SacramentAppointment[]>;
    return ok(
      (result.data || []).map((r) => normalizeSacramentAppointment(r as SacramentAppointment)),
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listSacramentAppointments failed");
  }
}
export async function getSacramentAppointmentById(id: EntityId) {
  try {
    const result = await getDataProvider().sacramentAppointments.getById(id);
    if (!result.ok) return result as DataResult<SacramentAppointment | null>;
    return ok(
      result.data
        ? normalizeSacramentAppointment(result.data as SacramentAppointment)
        : null,
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getSacramentAppointmentById failed");
  }
}
export async function createSacramentAppointment(payload: Partial<SacramentAppointment>) {
  try {
    const row = normalizeSacramentAppointment(payload);
    const repo = getDataProvider().sacramentAppointments;
    if (!repo.create) return fail("create not supported", "NOT_SUPPORTED");
    const result = await repo.create(row);
    if (!result.ok) return result as DataResult<SacramentAppointment>;
    const n = normalizeSacramentAppointment(result.data as SacramentAppointment);
    if (n.sacrament_id && n.sacrament_type === "Baptism") {
      await updateBaptism(n.sacrament_id, {
        status: "Scheduled",
        scheduled_date: n.scheduled_date || undefined,
      });
    }
    return ok(n);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createSacramentAppointment failed");
  }
}
export async function updateSacramentAppointment(
  id: EntityId,
  payload: Partial<SacramentAppointment>,
) {
  try {
    const existing = await getSacramentAppointmentById(id);
    if (!existing.ok || !existing.data) return fail("Agendamento não encontrado", "NOT_FOUND");
    const row = normalizeSacramentAppointment({
      ...existing.data,
      ...payload,
      id,
      updated_at: todayIso(),
    });
    const repo = getDataProvider().sacramentAppointments;
    if (!repo.update) return fail("update not supported", "NOT_SUPPORTED");
    const result = await repo.update(id, row);
    if (!result.ok) return result as DataResult<SacramentAppointment>;
    return ok(normalizeSacramentAppointment(result.data as SacramentAppointment));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "updateSacramentAppointment failed");
  }
}
export async function cancelSacramentAppointment(
  id: EntityId,
  payload: { notes?: string } = {},
) {
  return updateSacramentAppointment(id, { status: "Cancelled", notes: payload.notes || "" });
}
export async function completeSacramentAppointment(
  id: EntityId,
  payload: { completed_by_user_id?: string; completed_by_name?: string } = {},
) {
  const result = await updateSacramentAppointment(id, {
    status: "Completed",
    completed_at: nowIso(),
    completed_by_user_id: payload.completed_by_user_id || null,
    completed_by_name: payload.completed_by_name || "",
  });
  if (result.ok && result.data?.sacrament_id) {
    const t = statusKey(result.data.sacrament_type);
    const sid = result.data.sacrament_id;
    if (t.includes("baptism")) {
      await updateBaptism(sid, {
        status: "Completed",
        completed_at: nowIso(),
        completed_by_name: payload.completed_by_name || "",
      });
    } else if (t.includes("marriage")) {
      await updateMarriage(sid, {
        status: "Completed",
        completed_at: nowIso(),
        completed_by_name: payload.completed_by_name || "",
      });
    } else if (t.includes("baby") || t.includes("dedication")) {
      await updateBabyDedication(sid, {
        status: "Completed",
        completed_at: nowIso(),
        completed_by_name: payload.completed_by_name || "",
      });
    }
  }
  return result;
}
export async function getAppointmentsByChurch(churchId: EntityId) {
  const list = await listSacramentAppointments();
  if (!list.ok) return list;
  return ok(list.data.filter((a) => a.church_id === churchId));
}
export async function getAppointmentsByPastor(pastorId: EntityId) {
  const list = await listSacramentAppointments();
  if (!list.ok) return list;
  return ok(
    list.data.filter(
      (a) => a.pastor_id === pastorId || statusKey(a.pastor_name || "").includes(statusKey(String(pastorId))),
    ),
  );
}
export async function getAppointmentsByDate(date: string) {
  const list = await listSacramentAppointments();
  if (!list.ok) return list;
  const d = String(date).slice(0, 10);
  return ok(list.data.filter((a) => String(a.scheduled_date || "").slice(0, 10) === d));
}
export async function getAppointmentsByDateRange(startDate: string, endDate: string) {
  const list = await listSacramentAppointments();
  if (!list.ok) return list;
  return ok(
    list.data.filter((a) => {
      const d = String(a.scheduled_date || "").slice(0, 10);
      return d >= startDate && d <= endDate;
    }),
  );
}
export async function getTodaySacramentAppointments() {
  return getAppointmentsByDate(todayIso());
}
export async function getUpcomingSacramentAppointments() {
  const list = await listSacramentAppointments();
  if (!list.ok) return list;
  const today = todayIso();
  return ok(
    list.data
      .filter((a) => String(a.scheduled_date || "") >= today)
      .filter((a) => !/cancel|completed|conclu/i.test(String(a.status || "")))
      .sort((a, b) =>
        String(a.scheduled_date || "").localeCompare(String(b.scheduled_date || "")),
      ),
  );
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export async function getSacramentsOverviewStats(_filters: Record<string, unknown> = {}) {
  const [baptisms, marriages, babies, certs, docs, apts] = await Promise.all([
    listBaptisms(),
    listMarriages(),
    listBabyDedications(),
    listSacramentCertificates(),
    listSacramentDocuments(),
    listSacramentAppointments(),
  ]);
  const b = baptisms.ok ? baptisms.data : [];
  const m = marriages.ok ? marriages.data : [];
  const d = babies.ok ? babies.data : [];
  const c = certs.ok ? certs.data : [];
  const docsList = docs.ok ? docs.data : [];
  const a = apts.ok ? apts.data : [];
  const today = todayIso();
  const month = today.slice(0, 7);
  const isPending = (s?: string | null) => /pending|under review/i.test(String(s || ""));
  const isScheduled = (s?: string | null) => /scheduled|confirm/i.test(String(s || ""));
  const isCompleted = (s?: string | null) => /completed|conclu|issued/i.test(String(s || ""));
  return ok({
    baptismsPending: b.filter((x) => isPending(x.status || x.estado)).length,
    baptismsScheduled: b.filter((x) => isScheduled(x.status || x.estado)).length,
    baptismsCompleted: b.filter((x) => isCompleted(x.status || x.estado)).length,
    marriagesPending: m.filter((x) => isPending(x.status || x.estado)).length,
    marriagesScheduled: m.filter((x) => isScheduled(x.status || x.estado)).length,
    dedicationsPending: d.filter((x) => isPending(x.status || x.estado)).length,
    dedicationsScheduled: d.filter((x) => isScheduled(x.status || x.estado)).length,
    todayAppointments: a.filter((x) => String(x.scheduled_date || "") === today).length,
    pendingDocuments: docsList.filter((x) => /pending/i.test(String(x.status || ""))).length,
    pendingCertificates: c.filter((x) => /pending|prepared/i.test(String(x.status || ""))).length,
    issuedCertificates: c.filter((x) => /issued/i.test(String(x.status || ""))).length,
    thisMonth:
      b.filter((x) => String(x.scheduled_date || x.completed_at || "").startsWith(month)).length +
      m.filter((x) => String(x.scheduled_date || x.completed_at || "").startsWith(month)).length +
      d.filter((x) => String(x.scheduled_date || x.completed_at || "").startsWith(month)).length,
  });
}

export async function getBaptismReport(filters: { startDate?: string; endDate?: string } = {}) {
  if (filters.startDate && filters.endDate) {
    return getBaptismsByDateRange(filters.startDate, filters.endDate);
  }
  return listBaptisms();
}
export async function getMarriageReport(filters: { startDate?: string; endDate?: string } = {}) {
  if (filters.startDate && filters.endDate) {
    return getMarriagesByDateRange(filters.startDate, filters.endDate);
  }
  return listMarriages();
}
export async function getBabyDedicationReport(
  filters: { startDate?: string; endDate?: string } = {},
) {
  if (filters.startDate && filters.endDate) {
    return getBabyDedicationsByDateRange(filters.startDate, filters.endDate);
  }
  return listBabyDedications();
}
export async function getCertificatesReport(_filters = {}) {
  return listSacramentCertificates();
}
export async function getDocumentsReport(_filters = {}) {
  // Aggregated metadata — UI should hide file_url without permission
  const list = await listSacramentDocuments();
  if (!list.ok) return list;
  return ok(
    list.data.map((d) => ({
      id: d.id,
      sacrament_type: d.sacrament_type,
      sacrament_id: d.sacrament_id,
      person_name: d.person_name,
      document_type: d.document_type,
      document_title: d.document_title,
      status: d.status,
      has_file: !!(d.file_url || d.file_name),
      // file_url intentionally omitted from aggregated report
    })),
  );
}

// ---------------------------------------------------------------------------
// Seed + info
// ---------------------------------------------------------------------------

export async function ensureSacramentsSeeded(): Promise<DataResult<boolean>> {
  try {
    const b = await listBaptisms();
    if (b.ok && b.data.length === 0) {
      for (const s of BAPTISMS_SEED) {
        const repo = getDataProvider().baptisms;
        if (repo.create) await repo.create(normalizeBaptism(s));
      }
    }
    const m = await listMarriages();
    if (m.ok && m.data.length === 0) {
      for (const s of MARRIAGES_SEED) {
        const repo = getDataProvider().marriages;
        if (repo.create) await repo.create(normalizeMarriage(s));
      }
    }
    const d = await listBabyDedications();
    if (d.ok && d.data.length === 0) {
      for (const s of BABY_DEDICATIONS_SEED) {
        const repo = getDataProvider().babyDedications;
        if (repo.create) await repo.create(normalizeBabyDedication(s));
      }
    }
    const c = await listSacramentCertificates();
    if (c.ok && c.data.length === 0) {
      for (const s of SACRAMENT_CERTIFICATES_SEED) {
        const repo = getDataProvider().sacramentCertificates;
        if (repo.create) await repo.create(normalizeSacramentCertificate(s));
      }
    }
    const docs = await listSacramentDocuments();
    if (docs.ok && docs.data.length === 0) {
      for (const s of SACRAMENT_DOCUMENTS_SEED) {
        const repo = getDataProvider().sacramentDocuments;
        if (repo.create) await repo.create(normalizeSacramentDocument(s));
      }
    }
    const a = await listSacramentAppointments();
    if (a.ok && a.data.length === 0) {
      for (const s of SACRAMENT_APPOINTMENTS_SEED) {
        const repo = getDataProvider().sacramentAppointments;
        if (repo.create) await repo.create(normalizeSacramentAppointment(s));
      }
    }
    return ok(true);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "ensureSacramentsSeeded failed");
  }
}

export function getSacramentsDataSourceInfo() {
  const source = getDataSource();
  const provider = getDataProvider();
  return {
    source,
    provider: provider.name,
    ready: provider.isReady(),
    description: provider.description,
    domain: "sacraments",
  };
}

export {
  BAPTISMS_SEED,
  MARRIAGES_SEED,
  BABY_DEDICATIONS_SEED,
  SACRAMENT_CERTIFICATES_SEED,
  SACRAMENT_DOCUMENTS_SEED,
  SACRAMENT_APPOINTMENTS_SEED,
};

export const sacramentsRepository = {
  listBaptisms,
  getBaptismById,
  createBaptism,
  updateBaptism,
  deleteBaptism,
  searchBaptisms,
  getBaptismsByChurch,
  getBaptismsByMember,
  getBaptismsByStatus,
  getBaptismsByDateRange,
  getUpcomingBaptisms,
  getCompletedBaptisms,
  getPendingBaptismCertificates,
  listMarriages,
  getMarriageById,
  createMarriage,
  updateMarriage,
  deleteMarriage,
  searchMarriages,
  getMarriagesByChurch,
  getMarriagesByStatus,
  getMarriagesByDateRange,
  getUpcomingMarriages,
  getCompletedMarriages,
  getPendingMarriageDocuments,
  getPendingMarriageCertificates,
  listBabyDedications,
  getBabyDedicationById,
  createBabyDedication,
  updateBabyDedication,
  deleteBabyDedication,
  searchBabyDedications,
  getBabyDedicationsByChurch,
  getBabyDedicationsByParent,
  getBabyDedicationsByStatus,
  getBabyDedicationsByDateRange,
  getUpcomingBabyDedications,
  getCompletedBabyDedications,
  getPendingBabyDedicationCertificates,
  listSacramentCertificates,
  getSacramentCertificateById,
  createSacramentCertificate,
  updateSacramentCertificate,
  issueSacramentCertificate,
  cancelSacramentCertificate,
  getCertificatesBySacrament,
  getCertificatesByStatus,
  getPendingCertificates,
  getIssuedCertificates,
  listSacramentDocuments,
  getSacramentDocumentById,
  createSacramentDocument,
  updateSacramentDocument,
  deleteSacramentDocument,
  getDocumentsBySacrament,
  getPendingDocumentReviews,
  verifySacramentDocument,
  rejectSacramentDocument,
  listSacramentAppointments,
  getSacramentAppointmentById,
  createSacramentAppointment,
  updateSacramentAppointment,
  cancelSacramentAppointment,
  completeSacramentAppointment,
  getAppointmentsByChurch,
  getAppointmentsByPastor,
  getAppointmentsByDate,
  getAppointmentsByDateRange,
  getTodaySacramentAppointments,
  getUpcomingSacramentAppointments,
  getSacramentsOverviewStats,
  getBaptismReport,
  getMarriageReport,
  getBabyDedicationReport,
  getCertificatesReport,
  getDocumentsReport,
  ensureSacramentsSeeded,
  getSacramentsDataSourceInfo,
  getInfo: getSacramentsDataSourceInfo,
};
