import type { EntityId } from "../../types/entities";
import type { DataResult } from "../../types/repository";
import { getSupabaseFoundationClient } from "./supabaseClient";
import * as documents from "./documentsSupabaseAdapter";

export type FoundationRecord = Record<string, unknown> & { id?: EntityId };
type Filters = Record<string, unknown>;

const TABLES = {
  enrollments: "foundation_school_enrollments",
  classes: "foundation_school_classes",
  students: "foundation_school_students",
  teachers: "foundation_school_teachers",
  lessons: "foundation_school_lessons",
  progress: "foundation_school_lesson_progress",
  attendance: "foundation_school_attendance",
  tests: "foundation_school_online_tests",
  results: "foundation_school_test_results",
  soulWinning: "foundation_school_soul_winning",
  finalExams: "foundation_school_final_exams",
  graduations: "foundation_school_graduations",
} as const;

const MISSING_CONFIG = "Supabase não está configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.";
const MISSING_TABLES = "Tabelas da Escola de Fundação ainda não foram criadas ou a migration não foi aplicada.";
const NO_PERMISSION = "Sem permissão para aceder aos dados da Escola de Fundação.";

function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}

function fail<T>(error: string, code = "FOUNDATION_SCHOOL_ERROR"): DataResult<T> {
  return { ok: false, error, code };
}

function errorResult<T>(error: { message?: string; code?: string } | null): DataResult<T> {
  const message = String(error?.message || "");
  if (error?.code === "42P01" || /relation .* does not exist|schema cache/i.test(message)) {
    return fail(MISSING_TABLES, "MIGRATION_REQUIRED");
  }
  if (error?.code === "42501" || /row-level security|permission denied/i.test(message)) {
    return fail(NO_PERMISSION, "PERMISSION_DENIED");
  }
  return fail(message || "Não foi possível aceder aos dados da Escola de Fundação.", error?.code || "SUPABASE_ERROR");
}

function clientOrError<T>() {
  const client = getSupabaseFoundationClient();
  return client ? { client } : { error: fail<T>(MISSING_CONFIG, "NOT_CONFIGURED") };
}

function cleanPayload(payload: FoundationRecord): FoundationRecord {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CORE_COLUMNS: Record<string, string[]> = {
  [TABLES.students]: ["id", "student_number", "enrollment_id", "class_id", "church_id", "church_name", "first_timer_id", "member_id", "full_name", "phone", "whatsapp", "email", "modality", "status", "lessons_completed", "lesson_progress_percentage", "tests_average", "final_exam_score", "final_grade", "passed", "graduated", "graduation_id", "notes", "metadata", "created_by", "updated_by", "created_at", "updated_at"],
  [TABLES.teachers]: ["id", "staff_id", "user_id", "teacher_number", "full_name", "phone", "email", "church_id", "church_name", "role", "specialization", "can_teach_online", "can_teach_prisons", "can_teach_home", "status", "notes", "metadata", "created_by", "updated_by", "created_at", "updated_at"],
  [TABLES.classes]: ["id", "class_code", "name", "description", "church_id", "church_name", "modality", "teacher_id", "teacher_name", "assistant_teacher_id", "assistant_teacher_name", "start_date", "end_date", "schedule_day", "schedule_time", "location", "capacity", "status", "notes", "metadata", "created_by", "updated_by", "created_at", "updated_at"],
};

function tablePayload(table: string, raw: FoundationRecord): FoundationRecord {
  const payload: FoundationRecord = { ...raw };
  if (table === TABLES.students) {
    payload.class_id ??= payload.class_group_id;
    payload.modality ??= payload.assigned_delivery_mode || payload.preferred_delivery_mode;
    payload.lessons_completed ??= payload.completed_lessons_count || payload.completed_classes;
    payload.lesson_progress_percentage ??= payload.lesson_progress_percent || payload.class_progress_percent;
    payload.passed ??= payload.course_passed || payload.aprovado;
    payload.graduated ??= payload.graduado;
  } else if (table === TABLES.teachers) {
    payload.role ??= payload.role_type || payload.title;
    payload.can_teach_home ??= payload.can_teach_home_visit;
    payload.can_teach_prisons ??= payload.is_prison_ministry_teacher;
  } else if (table === TABLES.classes) {
    payload.modality ??= payload.delivery_mode;
    payload.teacher_id ??= payload.main_teacher_id;
    payload.teacher_name ??= payload.main_teacher_name;
    payload.location ??= payload.primary_location_name;
  }
  if (payload.id && !UUID_PATTERN.test(String(payload.id))) delete payload.id;
  const allowed = CORE_COLUMNS[table];
  return cleanPayload(allowed ? Object.fromEntries(Object.entries(payload).filter(([key]) => allowed.includes(key))) : payload);
}

async function listRows(table: string, filters: Filters = {}, order = "created_at"): Promise<DataResult<FoundationRecord[]>> {
  const connection = clientOrError<FoundationRecord[]>();
  if ("error" in connection) return connection.error;
  let query = connection.client.from(table).select("*");
  for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
  const { data, error } = await query.order(order, { ascending: order === "lesson_number" || order.endsWith("_date") });
  return error ? errorResult(error) : ok((data || []) as FoundationRecord[]);
}

async function getRow(table: string, id: EntityId): Promise<DataResult<FoundationRecord | null>> {
  const connection = clientOrError<FoundationRecord | null>();
  if ("error" in connection) return connection.error;
  const { data, error } = await connection.client.from(table).select("*").eq("id", String(id)).maybeSingle();
  return error ? errorResult(error) : ok((data || null) as FoundationRecord | null);
}

async function createRow(table: string, payload: FoundationRecord): Promise<DataResult<FoundationRecord>> {
  const connection = clientOrError<FoundationRecord>();
  if ("error" in connection) return connection.error;
  const { data, error } = await connection.client.from(table).insert(tablePayload(table, payload)).select("*").single();
  return error ? errorResult(error) : ok(data as FoundationRecord);
}

async function updateRow(table: string, id: EntityId, payload: FoundationRecord): Promise<DataResult<FoundationRecord>> {
  const connection = clientOrError<FoundationRecord>();
  if ("error" in connection) return connection.error;
  const { id: _ignored, created_at: _created, ...changes } = tablePayload(table, payload);
  const { data, error } = await connection.client.from(table).update({ ...changes, updated_at: new Date().toISOString() }).eq("id", String(id)).select("*").single();
  return error ? errorResult(error) : ok(data as FoundationRecord);
}

async function deleteRow(table: string, id: EntityId): Promise<DataResult<boolean>> {
  const connection = clientOrError<boolean>();
  if ("error" in connection) return connection.error;
  const { error } = await connection.client.from(table).delete().eq("id", String(id));
  return error ? errorResult(error) : ok(true);
}

async function oneBy(table: string, filters: Filters): Promise<DataResult<FoundationRecord | null>> {
  const rows = await listRows(table, filters);
  if (!rows.ok) return rows;
  return ok(rows.data[0] || null);
}

function studentAliases(row: FoundationRecord): FoundationRecord {
  return {
    ...row,
    class_group_id: row.class_id,
    completed_classes: row.lessons_completed,
    completed_lessons_count: row.lessons_completed,
    class_progress_percent: row.lesson_progress_percentage,
    lesson_progress_percent: row.lesson_progress_percentage,
    estado: row.status,
    nota_exame: row.final_exam_score,
    aprovado: row.passed,
    graduado: row.graduated,
  };
}

function teacherAliases(row: FoundationRecord): FoundationRecord {
  return {
    ...row,
    title: row.role,
    role_type: row.role,
    can_teach_home_visit: row.can_teach_home,
    is_prison_ministry_teacher: row.can_teach_prisons,
  };
}

function classAliases(row: FoundationRecord): FoundationRecord {
  return {
    ...row,
    delivery_mode: row.modality,
    main_teacher_id: row.teacher_id,
    main_teacher_name: row.teacher_name,
    primary_location_name: row.location,
  };
}

function mapResult<T extends FoundationRecord | FoundationRecord[] | null>(result: DataResult<T>, mapper: (row: FoundationRecord) => FoundationRecord): DataResult<T> {
  if (!result.ok) return result;
  if (Array.isArray(result.data)) return ok(result.data.map(mapper) as T);
  return ok((result.data ? mapper(result.data as FoundationRecord) : null) as T);
}

// Enrollments
export const listFoundationEnrollments = () => listRows(TABLES.enrollments);
export const getFoundationEnrollmentById = (id: EntityId) => getRow(TABLES.enrollments, id);
export const createFoundationEnrollment = (payload: FoundationRecord) => createRow(TABLES.enrollments, payload);
export const updateFoundationEnrollment = (id: EntityId, payload: FoundationRecord) => updateRow(TABLES.enrollments, id, payload);
export const deleteFoundationEnrollment = (id: EntityId) => deleteRow(TABLES.enrollments, id);
export const getEnrollmentsByChurch = (churchId: EntityId) => listRows(TABLES.enrollments, { church_id: churchId });
export const getEnrollmentsByStatus = (status: string) => listRows(TABLES.enrollments, { status });
export const getEnrollmentsByModality = (modality: string) => listRows(TABLES.enrollments, { modality });
export const getEnrollmentsByFirstTimer = (firstTimerId: EntityId) => listRows(TABLES.enrollments, { first_timer_id: firstTimerId });
export const getEnrollmentsByMember = (memberId: EntityId) => listRows(TABLES.enrollments, { member_id: memberId });

// Classes
export async function listFoundationClasses() { return mapResult(await listRows(TABLES.classes, {}, "start_date"), classAliases); }
export async function getFoundationClassById(id: EntityId) { return mapResult(await getRow(TABLES.classes, id), classAliases); }
export async function createFoundationClass(payload: FoundationRecord) { return mapResult(await createRow(TABLES.classes, payload), classAliases); }
export async function updateFoundationClass(id: EntityId, payload: FoundationRecord) { return mapResult(await updateRow(TABLES.classes, id, payload), classAliases); }
export const deleteFoundationClass = (id: EntityId) => deleteRow(TABLES.classes, id);
export async function getClassesByChurch(churchId: EntityId) { return mapResult(await listRows(TABLES.classes, { church_id: churchId }), classAliases); }
export async function getClassesByTeacher(teacherId: EntityId) { return mapResult(await listRows(TABLES.classes, { teacher_id: teacherId }), classAliases); }
export async function getActiveClasses() { return mapResult(await listRows(TABLES.classes, { status: "Active" }), classAliases); }
export const assignTeacherToClass = (classId: EntityId, teacherId: EntityId, payload: FoundationRecord = {}) => updateFoundationClass(classId, { ...payload, teacher_id: teacherId });

// Students
export async function listFoundationStudents() { return mapResult(await listRows(TABLES.students), studentAliases); }
export async function getFoundationStudentById(id: EntityId) { return mapResult(await getRow(TABLES.students, id), studentAliases); }
export async function createFoundationStudent(payload: FoundationRecord) { return mapResult(await createRow(TABLES.students, payload), studentAliases); }
export async function updateFoundationStudent(id: EntityId, payload: FoundationRecord) { return mapResult(await updateRow(TABLES.students, id, payload), studentAliases); }
export const deleteFoundationStudent = (id: EntityId) => deleteRow(TABLES.students, id);
export async function getStudentsByClass(classId: EntityId) { return mapResult(await listRows(TABLES.students, { class_id: classId }), studentAliases); }
export async function getStudentsByChurch(churchId: EntityId) { return mapResult(await listRows(TABLES.students, { church_id: churchId }), studentAliases); }
export async function getStudentsByStatus(status: string) { return mapResult(await listRows(TABLES.students, { status }), studentAliases); }
export async function getStudentsAwaitingFinalExam() { return getStudentsByStatus("Awaiting Final Exam"); }
export async function getStudentsReadyForGraduation() {
  const rows = await listFoundationStudents();
  return rows.ok ? ok(rows.data.filter((row) => row.passed === true && row.graduated !== true)) : rows;
}
export const assignStudentToClass = (studentId: EntityId, classId: EntityId, payload: FoundationRecord = {}) => updateFoundationStudent(studentId, { ...payload, class_id: classId });

async function enrollLinkedPerson(kind: "first_timer" | "member", personId: EntityId, payload: FoundationRecord): Promise<DataResult<FoundationRecord>> {
  const connection = clientOrError<FoundationRecord>();
  if ("error" in connection) return connection.error;
  const table = kind === "first_timer" ? "first_timers" : "members";
  const key = `${kind}_id`;
  const existing = await oneBy(TABLES.students, { [key]: String(personId) });
  if (!existing.ok) return existing;
  if (existing.data) return ok(studentAliases(existing.data));
  const { data: person, error } = await connection.client.from(table).select("*").eq("id", String(personId)).maybeSingle();
  if (error) return errorResult(error);
  if (!person) return fail(kind === "first_timer" ? "Não foi possível encontrar o First Timer indicado." : "Não foi possível encontrar o membro indicado.", "NOT_FOUND");
  const fullName = payload.full_name || person.full_name || [person.first_name, person.last_name].filter(Boolean).join(" ") || person.name;
  const enrollment = await createFoundationEnrollment({
    ...payload,
    [key]: personId,
    source: kind === "first_timer" ? "First Timer" : "Member",
    source_id: personId,
    full_name: fullName,
    phone: payload.phone || person.phone,
    whatsapp: payload.whatsapp || person.whatsapp,
    email: payload.email || person.email,
    church_id: payload.church_id || person.church_id,
    status: payload.status || "Enrolled",
  });
  if (!enrollment.ok) return enrollment;
  return createFoundationStudent({
    ...payload,
    [key]: personId,
    enrollment_id: enrollment.data.id,
    full_name: fullName,
    phone: payload.phone || person.phone,
    whatsapp: payload.whatsapp || person.whatsapp,
    email: payload.email || person.email,
    church_id: payload.church_id || person.church_id,
    class_id: payload.class_id || payload.assigned_class_id,
    status: "Active",
    metadata: { ...(payload.metadata as object || {}), source, automatic_member_creation: false },
  });
}

const source = "foundation_school_explicit_enrollment";
export const enrollFirstTimer = (firstTimerId: EntityId, payload: FoundationRecord = {}) => enrollLinkedPerson("first_timer", firstTimerId, payload);
export const enrollMember = (memberId: EntityId, payload: FoundationRecord = {}) => enrollLinkedPerson("member", memberId, payload);

// Teachers
export async function listFoundationTeachers() { return mapResult(await listRows(TABLES.teachers), teacherAliases); }
export async function getFoundationTeacherById(id: EntityId) { return mapResult(await getRow(TABLES.teachers, id), teacherAliases); }
export async function createFoundationTeacher(payload: FoundationRecord) { return mapResult(await createRow(TABLES.teachers, payload), teacherAliases); }
export async function updateFoundationTeacher(id: EntityId, payload: FoundationRecord) { return mapResult(await updateRow(TABLES.teachers, id, payload), teacherAliases); }
export const deleteFoundationTeacher = (id: EntityId) => deleteRow(TABLES.teachers, id);
export async function getTeachersByChurch(churchId: EntityId) { return mapResult(await listRows(TABLES.teachers, { church_id: churchId }), teacherAliases); }
export async function getTeachersByStaff(staffId: EntityId) { return mapResult(await listRows(TABLES.teachers, { staff_id: staffId }), teacherAliases); }
export async function getActiveTeachers() { return mapResult(await listRows(TABLES.teachers, { status: "Active" }), teacherAliases); }

// Lessons and progress
export const listFoundationLessons = () => listRows(TABLES.lessons, {}, "lesson_number");
export const getFoundationLessonByNumber = (lessonNumber: number) => oneBy(TABLES.lessons, { lesson_number: lessonNumber });
export const listLessonProgress = () => listRows(TABLES.progress);
export const getLessonProgressByStudent = (studentId: EntityId) => listRows(TABLES.progress, { student_id: studentId });
export const getLessonProgressByClass = (classId: EntityId) => listRows(TABLES.progress, { class_id: classId });
export const updateLessonProgress = (id: EntityId, payload: FoundationRecord) => updateRow(TABLES.progress, id, payload);

export async function markLessonCompleted(studentId: EntityId, lessonNumber: number, payload: FoundationRecord = {}) {
  const existing = await oneBy(TABLES.progress, { student_id: String(studentId), lesson_number: lessonNumber });
  if (!existing.ok) return existing;
  const lesson = await getFoundationLessonByNumber(lessonNumber);
  if (!lesson.ok) return lesson;
  const record = {
    ...payload,
    student_id: studentId,
    lesson_id: payload.lesson_id || lesson.data?.id,
    lesson_number: lessonNumber,
    lesson_title: payload.lesson_title || lesson.data?.title,
    status: "Completed",
    completed: true,
    completed_at: payload.completed_at || new Date().toISOString(),
  };
  const result = existing.data?.id ? await updateRow(TABLES.progress, existing.data.id, record) : await createRow(TABLES.progress, record);
  if (result.ok) await recalculateStudentLessonProgress(studentId);
  return result;
}

export async function recalculateStudentLessonProgress(studentId: EntityId) {
  const rows = await getLessonProgressByStudent(studentId);
  if (!rows.ok) return rows;
  const lessonsCompleted = new Set(rows.data.filter((row) => row.completed === true).map((row) => Number(row.lesson_number))).size;
  const percentage = Math.round((Math.min(7, lessonsCompleted) / 7) * 10000) / 100;
  const student = await getFoundationStudentById(studentId);
  if (!student.ok || !student.data) return student;
  const status = lessonsCompleted >= 7 && !student.data.passed ? "Awaiting Final Exam" : student.data.status;
  return updateFoundationStudent(studentId, { lessons_completed: lessonsCompleted, lesson_progress_percentage: percentage, status });
}

// Attendance
export const listFoundationAttendance = () => listRows(TABLES.attendance, {}, "attendance_date");
export const createFoundationAttendance = (payload: FoundationRecord) => createRow(TABLES.attendance, payload);
export const updateFoundationAttendance = (id: EntityId, payload: FoundationRecord) => updateRow(TABLES.attendance, id, payload);
export const getAttendanceByClass = (classId: EntityId) => listRows(TABLES.attendance, { class_id: classId });
export const getAttendanceByStudent = (studentId: EntityId) => listRows(TABLES.attendance, { student_id: studentId });
export const getAttendanceByDate = (date: string) => listRows(TABLES.attendance, { attendance_date: date });
export const getAttendanceByLesson = (classId: EntityId, lessonNumber: number) => listRows(TABLES.attendance, { class_id: classId, lesson_number: lessonNumber });

// Online test metadata and manually recorded/import-ready results
export const listOnlineTests = () => listRows(TABLES.tests, {}, "lesson_number");
export const getOnlineTestByLesson = (lessonNumber: number) => oneBy(TABLES.tests, { lesson_number: lessonNumber });
export const createOnlineTest = (payload: FoundationRecord) => createRow(TABLES.tests, payload);
export const updateOnlineTest = (id: EntityId, payload: FoundationRecord) => updateRow(TABLES.tests, id, payload);
export const deactivateOnlineTest = (id: EntityId, payload: FoundationRecord = {}) => updateOnlineTest(id, { ...payload, is_active: false });
export const listTestResults = () => listRows(TABLES.results);
export const getTestResultsByStudent = (studentId: EntityId) => listRows(TABLES.results, { student_id: studentId });
export const getTestResultsByClass = (classId: EntityId) => listRows(TABLES.results, { class_id: classId });
export const getTestResultsByLesson = (lessonNumber: number) => listRows(TABLES.results, { lesson_number: lessonNumber });

function withScore(payload: FoundationRecord) {
  const score = Number(payload.score || 0);
  const maxScore = Number(payload.max_score || 100);
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 10000) / 100 : 0;
  return { ...payload, percentage, passed: percentage >= Number(payload.passing_score || 50), source: payload.source || "Manual Entry" };
}
export async function createTestResult(payload: FoundationRecord) {
  const result = await createRow(TABLES.results, withScore(payload));
  if (result.ok && payload.student_id) await recalculateStudentTestsAverage(payload.student_id as EntityId);
  return result;
}
export async function updateTestResult(id: EntityId, payload: FoundationRecord) {
  const result = await updateRow(TABLES.results, id, withScore(payload));
  if (result.ok && result.data.student_id) await recalculateStudentTestsAverage(result.data.student_id as EntityId);
  return result;
}
export async function recalculateStudentTestsAverage(studentId: EntityId) {
  const rows = await getTestResultsByStudent(studentId);
  if (!rows.ok) return rows;
  const valid = rows.data.map((row) => Number(row.percentage)).filter(Number.isFinite);
  const average = valid.length ? Math.round((valid.reduce((sum, value) => sum + value, 0) / valid.length) * 100) / 100 : 0;
  return updateFoundationStudent(studentId, { tests_average: average });
}

// Soul winning practical: counts only, never creates First Timers.
export const listSoulWinningRecords = () => listRows(TABLES.soulWinning);
export const createSoulWinningRecord = (payload: FoundationRecord) => createRow(TABLES.soulWinning, { ...payload, lesson_number: 4 });
export const updateSoulWinningRecord = (id: EntityId, payload: FoundationRecord) => updateRow(TABLES.soulWinning, id, payload);
export const approveSoulWinningRecord = (id: EntityId, payload: FoundationRecord = {}) => updateSoulWinningRecord(id, { ...payload, approved: true, approved_at: payload.approved_at || new Date().toISOString() });
export const getSoulWinningByStudent = (studentId: EntityId) => listRows(TABLES.soulWinning, { student_id: studentId });
export const getSoulWinningByClass = (classId: EntityId) => listRows(TABLES.soulWinning, { class_id: classId });

// Final exam and grade (tests 40%, final exam 60%).
export const listFinalExams = () => listRows(TABLES.finalExams, {}, "exam_date");
export const createFinalExam = (payload: FoundationRecord) => createRow(TABLES.finalExams, withExamScore(payload));
export const updateFinalExam = (id: EntityId, payload: FoundationRecord) => updateRow(TABLES.finalExams, id, withExamScore(payload));
function withExamScore(payload: FoundationRecord) {
  const score = Number(payload.exam_score || 0);
  const maxScore = Number(payload.max_score || 100);
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 10000) / 100 : 0;
  return { ...payload, percentage, passed: percentage >= 50 };
}
export async function gradeFinalExam(id: EntityId, payload: FoundationRecord) {
  const result = await updateFinalExam(id, { ...payload, graded_at: payload.graded_at || new Date().toISOString() });
  if (result.ok && result.data.student_id) await recalculateStudentFinalGrade(result.data.student_id as EntityId);
  return result;
}
export const getFinalExamByStudent = (studentId: EntityId) => oneBy(TABLES.finalExams, { student_id: studentId });

/** Private document metadata only; upload/scan remains an explicit optional workflow. */
export const getFoundationDocumentsByStudent = (studentId: EntityId) => documents.getDocumentsByEntity("foundation_school_student", studentId);
export const createFoundationDocumentMetadata = (payload: FoundationRecord) => documents.createDocumentMetadata({
  module: "foundation_school",
  entity_type: String(payload.entity_type || "foundation_school_student"),
  entity_id: payload.entity_id ? String(payload.entity_id) : null,
  document_type: String(payload.document_type || "final_exam_scan"),
  document_title: payload.document_title ? String(payload.document_title) : null,
  file_name: payload.file_name ? String(payload.file_name) : null,
  file_url: payload.file_url ? String(payload.file_url) : null,
  storage_bucket: "foundation-exams",
  storage_path: payload.storage_path ? String(payload.storage_path) : null,
  status: String(payload.status || "Pending Review"),
  uploaded_by_name: payload.uploaded_by_name ? String(payload.uploaded_by_name) : null,
  is_sensitive: true,
});
export async function recalculateStudentFinalGrade(studentId: EntityId) {
  const student = await getFoundationStudentById(studentId);
  const exam = await getFinalExamByStudent(studentId);
  if (!student.ok) return student;
  if (!exam.ok) return exam;
  if (!student.data || !exam.data || !Number.isFinite(Number(student.data.tests_average)) || !Number.isFinite(Number(exam.data.percentage))) {
    return fail<FoundationRecord>("Não foi possível calcular a nota final porque faltam dados.", "MISSING_GRADE_DATA");
  }
  const testsAverage = Number(student.data.tests_average);
  const examPercentage = Number(exam.data.percentage);
  const finalGrade = Math.round((testsAverage * 0.4 + examPercentage * 0.6) * 100) / 100;
  return updateFoundationStudent(studentId, {
    final_exam_score: examPercentage,
    final_grade: finalGrade,
    passed: finalGrade >= 50,
    status: finalGrade >= 50 ? "Passed" : "Failed",
  });
}

// Graduation is always explicit. No member or certificate is created here.
export const listGraduations = () => listRows(TABLES.graduations, {}, "graduation_date");
export const getGraduationById = (id: EntityId) => getRow(TABLES.graduations, id);
export const createGraduation = (payload: FoundationRecord) => createRow(TABLES.graduations, {
  ...payload,
  status: payload.status || "Planned",
  certificate_document_ids: payload.certificate_document_ids || [],
  metadata: { certificates_generated: false, automatic_member_creation: false, ...((payload.metadata as object) || {}) },
});
export const updateGraduation = (id: EntityId, payload: FoundationRecord) => updateRow(TABLES.graduations, id, payload);
export const approveGraduation = (id: EntityId, payload: FoundationRecord = {}) => updateGraduation(id, { ...payload, status: "Approved", approved_at: payload.approved_at || new Date().toISOString() });
export const completeGraduation = (id: EntityId, payload: FoundationRecord = {}) => updateGraduation(id, { ...payload, status: "Completed" });
export async function addStudentToGraduation(graduationId: EntityId, studentId: EntityId, payload: FoundationRecord = {}) {
  const graduation = await getGraduationById(graduationId);
  if (!graduation.ok || !graduation.data) return graduation;
  const ids = Array.isArray(graduation.data.student_ids) ? graduation.data.student_ids.map(String) : [];
  if (!ids.includes(String(studentId))) ids.push(String(studentId));
  return updateGraduation(graduationId, { ...payload, student_ids: ids, student_count: ids.length });
}
export async function markStudentGraduated(studentId: EntityId, graduationId: EntityId, payload: FoundationRecord = {}) {
  const added = await addStudentToGraduation(graduationId, studentId, payload);
  if (!added.ok) return added;
  return updateFoundationStudent(studentId, { ...payload, graduation_id: graduationId, graduated: true, status: "Graduated" });
}

// Reports
export async function getFoundationOverviewStats(filters: Filters = {}) {
  const [students, classes, teachers, graduations] = await Promise.all([
    listRows(TABLES.students, filters), listRows(TABLES.classes, filters), listRows(TABLES.teachers, filters), listRows(TABLES.graduations, filters),
  ]);
  const failed = [students, classes, teachers, graduations].find((result) => !result.ok);
  if (failed && !failed.ok) return failed;
  const studentRows = students.ok ? students.data : [];
  return ok({ students: studentRows.length, active_students: studentRows.filter((row) => row.status === "Active").length, graduated_students: studentRows.filter((row) => row.graduated === true).length, classes: classes.ok ? classes.data.length : 0, teachers: teachers.ok ? teachers.data.length : 0, graduations: graduations.ok ? graduations.data.length : 0 });
}
export async function getFoundationClassStats(classId: EntityId) {
  const [students, attendance, progress] = await Promise.all([getStudentsByClass(classId), getAttendanceByClass(classId), getLessonProgressByClass(classId)]);
  const failed = [students, attendance, progress].find((result) => !result.ok);
  if (failed && !failed.ok) return failed;
  const attendanceRows = attendance.ok ? attendance.data : [];
  return ok({ class_id: classId, students: students.ok ? students.data.length : 0, attendance_records: attendanceRows.length, present_records: attendanceRows.filter((row) => row.status === "Present").length, completed_lessons: progress.ok ? progress.data.filter((row) => row.completed === true).length : 0 });
}
export async function getGraduationReadinessReport(filters: Filters = {}) {
  const students = await listRows(TABLES.students, filters);
  if (!students.ok) return students;
  return ok(students.data.filter((row) => row.passed === true && row.graduated !== true));
}
export async function getTeacherActivityReport(filters: Filters = {}) {
  const progress = await listRows(TABLES.progress, filters);
  if (!progress.ok) return progress;
  const counts: Record<string, { teacher_id: unknown; teacher_name: unknown; lessons_recorded: number }> = {};
  for (const row of progress.data) {
    const key = String(row.teacher_id || row.teacher_name || "unknown");
    counts[key] ||= { teacher_id: row.teacher_id, teacher_name: row.teacher_name, lessons_recorded: 0 };
    counts[key].lessons_recorded += 1;
  }
  return ok(Object.values(counts));
}

export function getFoundationSchoolSupabaseInfo() {
  return { source: "supabase", ready: !!getSupabaseFoundationClient(), migration: "0008_foundation_school_pilot.sql", tables: Object.values(TABLES), externalForms: "metadata-only", automaticMemberCreation: false, automaticCertificateCreation: false };
}
