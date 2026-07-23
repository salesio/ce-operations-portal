import { getDataProvider } from "../dataProvider";
import { getDataSource } from "../config";
import type {
  EntityId,
  FoundationClassGroup,
  FoundationStudent,
  FoundationTeacher,
} from "../types/entities";
import type { DataResult } from "../types/repository";
import { FOUNDATION_STUDENTS_SEED } from "../seeds/foundationStudentsSeed";
import { FOUNDATION_TEACHERS_SEED } from "../seeds/foundationTeachersSeed";
import { FOUNDATION_CLASSES_SEED } from "../seeds/foundationClassesSeed";
import { listChurches } from "./churchesRepository";

function fail<T>(error: string, code = "FOUNDATION_ERROR"): DataResult<T> {
  return { ok: false, error, code };
}
function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}
function asBool(v: unknown): boolean {
  return v === true || v === "on" || v === "true" || v === 1 || v === "1";
}
function statusKey(s: string | null | undefined): string {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

export function normalizeFoundationStudent(
  input: Partial<FoundationStudent> & { id?: string },
): FoundationStudent {
  const id = input.id || `fs-${Date.now()}`;
  const nome = input.nome || "";
  const apelido = input.apelido || "";
  const full =
    input.full_name ||
    input.fullName ||
    [nome, apelido].filter(Boolean).join(" ").trim() ||
    "Aluno ESF";
  const attendance = (input.class_attendance || {}) as Record<string, boolean>;
  let completed = Number(input.completed_classes ?? input.completed_lessons_count ?? 0);
  if (!completed && attendance) {
    completed = Object.values(attendance).filter(Boolean).length;
  }
  const percent =
    Number(input.class_progress_percent ?? input.lesson_progress_percent ?? 0) ||
    Math.round((completed / 7) * 100);
  const exam = Number(input.nota_exame ?? input.final_exam_score ?? 0);
  const estado = input.estado || input.status || "Em Curso";
  const graduated = asBool(input.graduado ?? input.graduated);
  const approved = asBool(input.aprovado ?? input.course_passed);
  const cert = asBool(input.certificado_emitido ?? input.certificate_issued);
  const evangelism = asBool(input.pratica_evangelismo ?? input.soul_winning_completed);
  const souls = Number(input.numero_de_almas_ganhas ?? input.souls_won_count ?? 0);

  return {
    ...input,
    id,
    nome,
    apelido,
    full_name: full,
    fullName: full,
    telefone: input.telefone || input.phone || "",
    phone: input.phone || input.telefone || "",
    whatsapp: input.whatsapp || input.telefone || input.phone || "",
    email: input.email || "",
    church_id: input.church_id || input.churchId || null,
    churchId: input.churchId || input.church_id || null,
    church_name: input.church_name || null,
    celula: input.celula || input.cell_name || "",
    cell_id: input.cell_id || null,
    cell_name: input.cell_name || input.celula || null,
    cell_group_id: input.cell_group_id || null,
    cell_group_name: input.cell_group_name || null,
    class_group_id: input.class_group_id || null,
    class_group_name: input.class_group_name || null,
    preferred_delivery_mode: input.preferred_delivery_mode || "in_person",
    assigned_delivery_mode: input.assigned_delivery_mode || input.preferred_delivery_mode || "in_person",
    assigned_location_id: input.assigned_location_id || null,
    assigned_location_name: input.assigned_location_name || null,
    is_prison_ministry_student: asBool(input.is_prison_ministry_student),
    prison_center_id: input.prison_center_id || null,
    prison_center_name: input.prison_center_name || null,
    needs_home_visit_class: asBool(input.needs_home_visit_class),
    home_address: input.home_address || "",
    can_attend_online: asBool(input.can_attend_online),
    online_contact: input.online_contact || input.whatsapp || input.telefone || input.phone || "",
    first_timer_id: input.first_timer_id || null,
    member_id: input.member_id || null,
    mes_de_inscricao: input.mes_de_inscricao || input.enrollment_date?.slice(0, 7) || "",
    enrollment_date: input.enrollment_date || input.created_at?.toString().slice(0, 10) || null,
    class_attendance: attendance,
    completed_classes: completed,
    completed_lessons_count: completed,
    class_progress_percent: percent,
    lesson_progress_percent: percent,
    estado,
    status: input.status || estado,
    nota_exame: exam,
    final_exam_score: exam,
    final_exam_max_score: Number(input.final_exam_max_score || 100),
    final_exam_percentage: Number(input.final_exam_percentage ?? exam),
    lesson_tests_total_score: Number(input.lesson_tests_total_score || 0),
    lesson_tests_max_score: Number(input.lesson_tests_max_score || 0),
    lesson_tests_percentage: Number(input.lesson_tests_percentage || 0),
    course_final_percentage: Number(input.course_final_percentage || 0),
    course_passed: approved || asBool(input.course_passed),
    pratica_evangelismo: evangelism,
    soul_winning_completed: evangelism,
    numero_de_almas_ganhas: souls,
    souls_won_count: souls,
    aprovado: approved,
    graduado: graduated,
    graduated,
    graduation_date: input.graduation_date || null,
    certificado_emitido: cert,
    certificate_issued: cert,
    ready_for_exam:
      asBool(input.ready_for_exam) || (completed >= 7 && exam === 0 && !graduated),
    ready_for_graduation:
      asBool(input.ready_for_graduation) || (approved && exam >= 50 && !graduated),
    quarter: input.quarter || "3º Trimestre",
    year: Number(input.year || 2026),
    notes: input.notes || input.notas || "",
    notas: input.notas || input.notes || "",
    created_at: input.created_at || input.createdAt || todayIso(),
    updated_at: input.updated_at || input.updatedAt || todayIso(),
    createdAt: input.createdAt || (typeof input.created_at === "string" ? input.created_at : undefined),
    updatedAt: input.updatedAt || (typeof input.updated_at === "string" ? input.updated_at : undefined),
  };
}

export function normalizeFoundationTeacher(
  input: Partial<FoundationTeacher> & { id?: string },
): FoundationTeacher {
  const id = input.id || `ftch-${Date.now()}`;
  const name = input.full_name || input.fullName || "Professor";
  const lessons = Array.isArray(input.can_teach_lessons)
    ? input.can_teach_lessons
    : Array.isArray(input.subjects_or_lessons_allowed)
      ? input.subjects_or_lessons_allowed
      : [];
  const modes = Array.isArray(input.delivery_modes_allowed)
    ? input.delivery_modes_allowed
    : ["in_person"];
  const role =
    input.role_type ||
    (input.title === "Reitor" || /rector/i.test(String(input.title || ""))
      ? "Rector"
      : input.title === "Coordenador" || /coord/i.test(String(input.title || ""))
        ? "Coordinator"
        : /assist/i.test(String(input.title || ""))
          ? "Assistant Teacher"
          : "Teacher");
  return {
    ...input,
    id,
    user_id: input.user_id || null,
    staff_id: input.staff_id || null,
    full_name: name,
    fullName: name,
    title: input.title || "Professor",
    role_type: role,
    phone: input.phone || "",
    whatsapp: input.whatsapp || input.phone || "",
    email: input.email || "",
    church_id: input.church_id || null,
    church_name: input.church_name || null,
    status: input.status || "Activo",
    can_teach_lessons: lessons,
    subjects_or_lessons_allowed: lessons,
    can_teach_all_lessons: asBool(input.can_teach_all_lessons),
    delivery_modes_allowed: modes,
    assigned_locations: Array.isArray(input.assigned_locations)
      ? input.assigned_locations
      : [],
    max_classes_per_week: Number(input.max_classes_per_week || 3),
    is_prison_ministry_teacher:
      asBool(input.is_prison_ministry_teacher) || modes.includes("prison_ministry"),
    can_teach_online: asBool(input.can_teach_online) || modes.includes("online"),
    can_teach_home_visit: asBool(input.can_teach_home_visit) || modes.includes("home_visit"),
    can_teach_in_person:
      input.can_teach_in_person !== false && (modes.includes("in_person") || !modes.length),
    notes: input.notes || "",
    created_at: input.created_at || input.createdAt || todayIso(),
    updated_at: input.updated_at || input.updatedAt || todayIso(),
  };
}

export function normalizeFoundationClass(
  input: Partial<FoundationClassGroup> & { id?: string; name?: string },
): FoundationClassGroup {
  const id = input.id || `fcg-${Date.now()}`;
  return {
    ...input,
    id,
    name: input.name || "Turma ESF",
    church_id: input.church_id || null,
    church_name: input.church_name || null,
    quarter: input.quarter || "3º Trimestre",
    year: Number(input.year || 2026),
    delivery_mode: input.delivery_mode || "in_person",
    primary_location_id: input.primary_location_id || null,
    primary_location_name: input.primary_location_name || "",
    location_type: input.location_type || null,
    prison_center_id: input.prison_center_id || null,
    prison_center_name: input.prison_center_name || null,
    online_platform: input.online_platform || "",
    online_link: input.online_link || "",
    start_date: input.start_date || null,
    expected_graduation_date: input.expected_graduation_date || null,
    main_teacher_id: input.main_teacher_id || null,
    main_teacher_name: input.main_teacher_name || "",
    assistant_teacher_ids: Array.isArray(input.assistant_teacher_ids)
      ? input.assistant_teacher_ids
      : [],
    rector_id: input.rector_id || null,
    rector_name: input.rector_name || "",
    coordinator_id: input.coordinator_id || null,
    coordinator_name: input.coordinator_name || "",
    status: input.status || "Aberta",
    notes: input.notes || "",
    sequence: input.sequence ?? null,
    created_at: input.created_at || input.createdAt || todayIso(),
    updated_at: input.updated_at || input.updatedAt || todayIso(),
  };
}

async function attachChurchNameStudent(s: FoundationStudent): Promise<FoundationStudent> {
  if (!s.church_id || s.church_name) return s;
  try {
    const churches = await listChurches();
    if (!churches.ok) return s;
    const c = (churches.data || []).find((x) => x.id === s.church_id);
    if (!c) return s;
    return normalizeFoundationStudent({
      ...s,
      church_name: c.church_name || c.public_name || "",
    });
  } catch {
    return s;
  }
}

export async function ensureFoundationSchoolSeeded(): Promise<void> {
  const provider = getDataProvider();
  const students = await provider.foundationStudents.list();
  if (students.ok && (students.data || []).length === 0 && provider.foundationStudents.create) {
    for (const seed of FOUNDATION_STUDENTS_SEED) {
      await provider.foundationStudents.create(normalizeFoundationStudent(seed));
    }
  }
  const teachers = await provider.foundationTeachers.list();
  if (teachers.ok && (teachers.data || []).length === 0 && provider.foundationTeachers.create) {
    for (const seed of FOUNDATION_TEACHERS_SEED) {
      await provider.foundationTeachers.create(normalizeFoundationTeacher(seed));
    }
  }
  const classes = await provider.foundationClassGroups.list();
  if (classes.ok && (classes.data || []).length === 0 && provider.foundationClassGroups.create) {
    for (const seed of FOUNDATION_CLASSES_SEED) {
      await provider.foundationClassGroups.create(normalizeFoundationClass(seed));
    }
  }
}

// --- Students API ---

export async function listFoundationStudents(): Promise<DataResult<FoundationStudent[]>> {
  try {
    await ensureFoundationSchoolSeeded();
    const result = await getDataProvider().foundationStudents.list();
    if (!result.ok) return result;
    const rows = await Promise.all(
      (result.data || []).map(async (r) => attachChurchNameStudent(normalizeFoundationStudent(r))),
    );
    return ok(rows);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao listar alunos da ESF.");
  }
}

export async function getFoundationStudentById(
  id: EntityId,
): Promise<DataResult<FoundationStudent | null>> {
  try {
    await ensureFoundationSchoolSeeded();
    const result = await getDataProvider().foundationStudents.getById(id);
    if (!result.ok) return result;
    if (!result.data) return ok(null);
    return ok(await attachChurchNameStudent(normalizeFoundationStudent(result.data)));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao obter aluno da ESF.");
  }
}

export async function createFoundationStudent(
  payload: Partial<FoundationStudent>,
): Promise<DataResult<FoundationStudent>> {
  try {
    await ensureFoundationSchoolSeeded();
    const provider = getDataProvider();
    if (!provider.foundationStudents.create) {
      return fail("Criar aluno ESF não suportado neste data source.", "NOT_SUPPORTED");
    }
    let row = normalizeFoundationStudent({
      ...payload,
      id: payload.id || `fs-${Date.now()}`,
      created_at: payload.created_at || todayIso(),
      updated_at: todayIso(),
    });
    row = await attachChurchNameStudent(row);
    const result = await provider.foundationStudents.create(row);
    if (!result.ok) return result;
    return ok(normalizeFoundationStudent(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao criar aluno da ESF.");
  }
}

export async function updateFoundationStudent(
  id: EntityId,
  payload: Partial<FoundationStudent>,
): Promise<DataResult<FoundationStudent>> {
  try {
    const provider = getDataProvider();
    if (!provider.foundationStudents.update) {
      return fail("Actualizar aluno ESF não suportado neste data source.", "NOT_SUPPORTED");
    }
    const existing = await provider.foundationStudents.getById(id);
    if (!existing.ok) return fail(existing.error, existing.code);
    if (!existing.data) return fail("Aluno ESF não encontrado.", "NOT_FOUND");
    let next = normalizeFoundationStudent({
      ...existing.data,
      ...payload,
      id,
      updated_at: todayIso(),
    });
    next = await attachChurchNameStudent(next);
    const result = await provider.foundationStudents.update(id, next);
    if (!result.ok) return result;
    return ok(normalizeFoundationStudent(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao actualizar aluno da ESF.");
  }
}

export async function deleteFoundationStudent(
  id: EntityId,
): Promise<DataResult<boolean>> {
  try {
    const provider = getDataProvider();
    if (!provider.foundationStudents.remove) {
      return fail("Eliminar aluno ESF não suportado neste data source.", "NOT_SUPPORTED");
    }
    return provider.foundationStudents.remove(id);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao eliminar aluno da ESF.");
  }
}

export async function searchFoundationStudents(
  query: string,
): Promise<DataResult<FoundationStudent[]>> {
  const listed = await listFoundationStudents();
  if (!listed.ok) return listed;
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) return listed;
  return ok(
    listed.data.filter((s) =>
      [s.full_name, s.nome, s.apelido, s.telefone, s.phone, s.celula, s.estado, s.church_name].some(
        (v) => String(v || "").toLowerCase().includes(q),
      ),
    ),
  );
}

export async function getFoundationStudentsByChurch(churchId: EntityId) {
  const listed = await listFoundationStudents();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((s) => s.church_id === churchId || s.churchId === churchId));
}

export async function getFoundationStudentsByClassGroup(classGroupId: EntityId) {
  const listed = await listFoundationStudents();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((s) => s.class_group_id === classGroupId));
}

export async function getFoundationStudentsByStatus(status: string) {
  const listed = await listFoundationStudents();
  if (!listed.ok) return listed;
  const key = statusKey(status);
  return ok(
    listed.data.filter(
      (s) => statusKey(s.estado) === key || statusKey(s.status) === key,
    ),
  );
}

export async function getFoundationStudentsByQuarter(quarter: string, year: number) {
  const listed = await listFoundationStudents();
  if (!listed.ok) return listed;
  return ok(
    listed.data.filter(
      (s) =>
        String(s.quarter || "").includes(String(quarter)) &&
        Number(s.year || 0) === Number(year),
    ),
  );
}

export async function getReadyForExamStudents() {
  const listed = await listFoundationStudents();
  if (!listed.ok) return listed;
  return ok(
    listed.data.filter(
      (s) =>
        s.ready_for_exam ||
        statusKey(s.estado).includes("exame") ||
        statusKey(s.estado) === "readyforexam",
    ),
  );
}

export async function getReadyForGraduationStudents() {
  const listed = await listFoundationStudents();
  if (!listed.ok) return listed;
  return ok(
    listed.data.filter(
      (s) =>
        s.ready_for_graduation ||
        statusKey(s.estado).includes("gradua") ||
        statusKey(s.estado) === "readyforgraduation",
    ),
  );
}

export async function getGraduatedStudents() {
  const listed = await listFoundationStudents();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((s) => s.graduado || s.graduated));
}

// --- Classes API ---

export async function listFoundationClasses(): Promise<DataResult<FoundationClassGroup[]>> {
  try {
    await ensureFoundationSchoolSeeded();
    const result = await getDataProvider().foundationClassGroups.list();
    if (!result.ok) return result;
    return ok((result.data || []).map((r) => normalizeFoundationClass(r)));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao listar turmas da ESF.");
  }
}

export async function getFoundationClassById(id: EntityId) {
  try {
    await ensureFoundationSchoolSeeded();
    const result = await getDataProvider().foundationClassGroups.getById(id);
    if (!result.ok) return result;
    return ok(result.data ? normalizeFoundationClass(result.data) : null);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao obter turma da ESF.");
  }
}

export async function createFoundationClass(payload: Partial<FoundationClassGroup>) {
  try {
    await ensureFoundationSchoolSeeded();
    const provider = getDataProvider();
    if (!provider.foundationClassGroups.create) {
      return fail("Criar turma ESF não suportado neste data source.", "NOT_SUPPORTED");
    }
    const row = normalizeFoundationClass({
      ...payload,
      id: payload.id || `fcg-${Date.now()}`,
      created_at: payload.created_at || todayIso(),
      updated_at: todayIso(),
    });
    const result = await provider.foundationClassGroups.create(row);
    if (!result.ok) return result;
    return ok(normalizeFoundationClass(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao criar turma da ESF.");
  }
}

export async function updateFoundationClass(
  id: EntityId,
  payload: Partial<FoundationClassGroup>,
) {
  try {
    const provider = getDataProvider();
    if (!provider.foundationClassGroups.update) {
      return fail("Actualizar turma ESF não suportado neste data source.", "NOT_SUPPORTED");
    }
    const existing = await provider.foundationClassGroups.getById(id);
    if (!existing.ok) return fail(existing.error, existing.code);
    if (!existing.data) return fail("Turma ESF não encontrada.", "NOT_FOUND");
    const next = normalizeFoundationClass({
      ...existing.data,
      ...payload,
      id,
      updated_at: todayIso(),
    });
    const result = await provider.foundationClassGroups.update(id, next);
    if (!result.ok) return result;
    return ok(normalizeFoundationClass(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao actualizar turma da ESF.");
  }
}

export async function deleteFoundationClass(id: EntityId) {
  try {
    const provider = getDataProvider();
    if (!provider.foundationClassGroups.remove) {
      return fail("Eliminar turma ESF não suportado neste data source.", "NOT_SUPPORTED");
    }
    return provider.foundationClassGroups.remove(id);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao eliminar turma da ESF.");
  }
}

export async function getFoundationClassesByChurch(churchId: EntityId) {
  const listed = await listFoundationClasses();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((c) => c.church_id === churchId));
}

export async function getActiveFoundationClasses() {
  const listed = await listFoundationClasses();
  if (!listed.ok) return listed;
  return ok(
    listed.data.filter((c) => {
      const key = statusKey(c.status);
      return key === "aberta" || key === "activa" || key === "active" || key === "open";
    }),
  );
}

// --- Teachers API ---

export async function listFoundationTeachers(): Promise<DataResult<FoundationTeacher[]>> {
  try {
    await ensureFoundationSchoolSeeded();
    const result = await getDataProvider().foundationTeachers.list();
    if (!result.ok) return result;
    return ok((result.data || []).map((r) => normalizeFoundationTeacher(r)));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao listar professores da ESF.");
  }
}

export async function getFoundationTeacherById(id: EntityId) {
  try {
    await ensureFoundationSchoolSeeded();
    const result = await getDataProvider().foundationTeachers.getById(id);
    if (!result.ok) return result;
    return ok(result.data ? normalizeFoundationTeacher(result.data) : null);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao obter professor da ESF.");
  }
}

export async function createFoundationTeacher(payload: Partial<FoundationTeacher>) {
  try {
    await ensureFoundationSchoolSeeded();
    const provider = getDataProvider();
    if (!provider.foundationTeachers.create) {
      return fail("Criar professor ESF não suportado neste data source.", "NOT_SUPPORTED");
    }
    const row = normalizeFoundationTeacher({
      ...payload,
      id: payload.id || `ftch-${Date.now()}`,
      created_at: payload.created_at || todayIso(),
      updated_at: todayIso(),
    });
    const result = await provider.foundationTeachers.create(row);
    if (!result.ok) return result;
    return ok(normalizeFoundationTeacher(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao criar professor da ESF.");
  }
}

export async function updateFoundationTeacher(
  id: EntityId,
  payload: Partial<FoundationTeacher>,
) {
  try {
    const provider = getDataProvider();
    if (!provider.foundationTeachers.update) {
      return fail("Actualizar professor ESF não suportado neste data source.", "NOT_SUPPORTED");
    }
    const existing = await provider.foundationTeachers.getById(id);
    if (!existing.ok) return fail(existing.error, existing.code);
    if (!existing.data) return fail("Professor ESF não encontrado.", "NOT_FOUND");
    const next = normalizeFoundationTeacher({
      ...existing.data,
      ...payload,
      id,
      updated_at: todayIso(),
    });
    const result = await provider.foundationTeachers.update(id, next);
    if (!result.ok) return result;
    return ok(normalizeFoundationTeacher(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao actualizar professor da ESF.");
  }
}

export async function deleteFoundationTeacher(id: EntityId) {
  try {
    const provider = getDataProvider();
    if (!provider.foundationTeachers.remove) {
      return fail("Eliminar professor ESF não suportado neste data source.", "NOT_SUPPORTED");
    }
    return provider.foundationTeachers.remove(id);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao eliminar professor da ESF.");
  }
}

export async function getActiveFoundationTeachers() {
  const listed = await listFoundationTeachers();
  if (!listed.ok) return listed;
  return ok(
    listed.data.filter((t) => {
      const key = statusKey(t.status);
      return key === "activo" || key === "active" || key === "ativa";
    }),
  );
}

export async function getFoundationTeachersByChurch(churchId: EntityId) {
  const listed = await listFoundationTeachers();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((t) => t.church_id === churchId));
}

// Bridge-friendly aliases
export const listStudents = listFoundationStudents;
export const createStudent = createFoundationStudent;
export const updateStudent = updateFoundationStudent;
export const deleteStudent = deleteFoundationStudent;
export const listClasses = listFoundationClasses;
export const createClass = createFoundationClass;
export const updateClass = updateFoundationClass;
export const listTeachers = listFoundationTeachers;
export const createTeacher = createFoundationTeacher;
export const updateTeacher = updateFoundationTeacher;

export function getFoundationSchoolDataSourceInfo() {
  const provider = getDataProvider();
  return {
    source: getDataSource(),
    provider: provider.name,
    ready: provider.isReady(),
    description: provider.description,
  };
}
