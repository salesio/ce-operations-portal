import type { EntityId } from "../../types/entities";
import type { DataResult } from "../../types/repository";
import { apiClient, type ApiResult } from "./apiClient";
import type { FoundationRecord } from "../supabase/foundationSchoolSupabaseAdapter";

const ROOT = "/foundation-school";

function result<T>(response: ApiResult<T>): DataResult<T> {
  return response.ok ? { ok: true, data: response.data } : { ok: false, error: response.error, code: response.code || "API_ERROR" };
}
const query = (values: Record<string, unknown>) => {
  const params = new URLSearchParams(Object.entries(values).filter(([, value]) => value !== undefined && value !== null).map(([key, value]) => [key, String(value)]));
  return params.size ? `?${params}` : "";
};
const list = async (path: string, filters: Record<string, unknown> = {}) => result(await apiClient.get<FoundationRecord[]>(`${ROOT}/${path}${query(filters)}`));
const get = async (path: string, id: EntityId) => result(await apiClient.get<FoundationRecord | null>(`${ROOT}/${path}/${id}`));
const create = async (path: string, payload: FoundationRecord) => result(await apiClient.post<FoundationRecord>(`${ROOT}/${path}`, payload));
const update = async (path: string, id: EntityId, payload: FoundationRecord) => result(await apiClient.patch<FoundationRecord>(`${ROOT}/${path}/${id}`, payload));
const remove = async (path: string, id: EntityId) => result(await apiClient.delete<boolean>(`${ROOT}/${path}/${id}`));
const action = async (path: string, payload: FoundationRecord = {}) => result(await apiClient.post<FoundationRecord>(`${ROOT}/${path}`, payload));

export const listFoundationEnrollments = () => list("enrollments");
export const getFoundationEnrollmentById = (id: EntityId) => get("enrollments", id);
export const createFoundationEnrollment = (payload: FoundationRecord) => create("enrollments", payload);
export const updateFoundationEnrollment = (id: EntityId, payload: FoundationRecord) => update("enrollments", id, payload);
export const deleteFoundationEnrollment = (id: EntityId) => remove("enrollments", id);
export const getEnrollmentsByChurch = (churchId: EntityId) => list("enrollments", { church_id: churchId });
export const getEnrollmentsByStatus = (status: string) => list("enrollments", { status });
export const getEnrollmentsByModality = (modality: string) => list("enrollments", { modality });
export const getEnrollmentsByFirstTimer = (firstTimerId: EntityId) => list("enrollments", { first_timer_id: firstTimerId });
export const getEnrollmentsByMember = (memberId: EntityId) => list("enrollments", { member_id: memberId });

export const listFoundationClasses = () => list("classes");
export const getFoundationClassById = (id: EntityId) => get("classes", id);
export const createFoundationClass = (payload: FoundationRecord) => create("classes", payload);
export const updateFoundationClass = (id: EntityId, payload: FoundationRecord) => update("classes", id, payload);
export const deleteFoundationClass = (id: EntityId) => remove("classes", id);
export const getClassesByChurch = (churchId: EntityId) => list("classes", { church_id: churchId });
export const getClassesByTeacher = (teacherId: EntityId) => list("classes", { teacher_id: teacherId });
export const getActiveClasses = () => list("classes", { status: "Active" });
export const assignTeacherToClass = (classId: EntityId, teacherId: EntityId, payload: FoundationRecord = {}) => action(`classes/${classId}/assign-teacher`, { ...payload, teacher_id: teacherId });

export const listFoundationStudents = () => list("students");
export const getFoundationStudentById = (id: EntityId) => get("students", id);
export const createFoundationStudent = (payload: FoundationRecord) => create("students", payload);
export const updateFoundationStudent = (id: EntityId, payload: FoundationRecord) => update("students", id, payload);
export const deleteFoundationStudent = (id: EntityId) => remove("students", id);
export const getStudentsByClass = (classId: EntityId) => list("students", { class_id: classId });
export const getStudentsByChurch = (churchId: EntityId) => list("students", { church_id: churchId });
export const getStudentsByStatus = (status: string) => list("students", { status });
export const getStudentsAwaitingFinalExam = () => list("students", { status: "Awaiting Final Exam" });
export const getStudentsReadyForGraduation = () => list("students", { ready_for_graduation: true });
export const enrollFirstTimer = (firstTimerId: EntityId, payload: FoundationRecord = {}) => action(`enroll/first-timer/${firstTimerId}`, payload);
export const enrollMember = (memberId: EntityId, payload: FoundationRecord = {}) => action(`enroll/member/${memberId}`, payload);
export const assignStudentToClass = (studentId: EntityId, classId: EntityId, payload: FoundationRecord = {}) => action(`students/${studentId}/assign-class`, { ...payload, class_id: classId });

export const listFoundationTeachers = () => list("teachers");
export const getFoundationTeacherById = (id: EntityId) => get("teachers", id);
export const createFoundationTeacher = (payload: FoundationRecord) => create("teachers", payload);
export const updateFoundationTeacher = (id: EntityId, payload: FoundationRecord) => update("teachers", id, payload);
export const deleteFoundationTeacher = (id: EntityId) => remove("teachers", id);
export const getTeachersByChurch = (churchId: EntityId) => list("teachers", { church_id: churchId });
export const getTeachersByStaff = (staffId: EntityId) => list("teachers", { staff_id: staffId });
export const getActiveTeachers = () => list("teachers", { status: "Active" });

export const listFoundationLessons = () => list("lessons");
export const getFoundationLessonByNumber = async (lessonNumber: number) => result(await apiClient.get<FoundationRecord | null>(`${ROOT}/lessons/by-number/${lessonNumber}`));
export const listLessonProgress = () => list("lesson-progress");
export const getLessonProgressByStudent = (studentId: EntityId) => list("lesson-progress", { student_id: studentId });
export const getLessonProgressByClass = (classId: EntityId) => list("lesson-progress", { class_id: classId });
export const markLessonCompleted = (studentId: EntityId, lessonNumber: number, payload: FoundationRecord = {}) => action(`students/${studentId}/lessons/${lessonNumber}/complete`, payload);
export const updateLessonProgress = (id: EntityId, payload: FoundationRecord) => update("lesson-progress", id, payload);
export const recalculateStudentLessonProgress = (studentId: EntityId) => action(`students/${studentId}/recalculate-progress`);

export const listFoundationAttendance = () => list("attendance");
export const createFoundationAttendance = (payload: FoundationRecord) => create("attendance", payload);
export const updateFoundationAttendance = (id: EntityId, payload: FoundationRecord) => update("attendance", id, payload);
export const getAttendanceByClass = (classId: EntityId) => list("attendance", { class_id: classId });
export const getAttendanceByStudent = (studentId: EntityId) => list("attendance", { student_id: studentId });
export const getAttendanceByDate = (date: string) => list("attendance", { date });
export const getAttendanceByLesson = (classId: EntityId, lessonNumber: number) => list("attendance", { class_id: classId, lesson_number: lessonNumber });

export const listOnlineTests = () => list("online-tests");
export const getOnlineTestByLesson = async (lessonNumber: number) => result(await apiClient.get<FoundationRecord | null>(`${ROOT}/online-tests/by-lesson/${lessonNumber}`));
export const createOnlineTest = (payload: FoundationRecord) => create("online-tests", payload);
export const updateOnlineTest = (id: EntityId, payload: FoundationRecord) => update("online-tests", id, payload);
export const deactivateOnlineTest = (id: EntityId, payload: FoundationRecord = {}) => action(`online-tests/${id}/deactivate`, payload);
export const listTestResults = () => list("test-results");
export const createTestResult = (payload: FoundationRecord) => create("test-results", payload);
export const updateTestResult = (id: EntityId, payload: FoundationRecord) => update("test-results", id, payload);
export const getTestResultsByStudent = (studentId: EntityId) => list("test-results", { student_id: studentId });
export const getTestResultsByClass = (classId: EntityId) => list("test-results", { class_id: classId });
export const getTestResultsByLesson = (lessonNumber: number) => list("test-results", { lesson_number: lessonNumber });
export const recalculateStudentTestsAverage = (studentId: EntityId) => action(`students/${studentId}/recalculate-tests-average`);

export const listSoulWinningRecords = () => list("soul-winning");
export const createSoulWinningRecord = (payload: FoundationRecord) => create("soul-winning", payload);
export const updateSoulWinningRecord = (id: EntityId, payload: FoundationRecord) => update("soul-winning", id, payload);
export const approveSoulWinningRecord = (id: EntityId, payload: FoundationRecord = {}) => action(`soul-winning/${id}/approve`, payload);
export const getSoulWinningByStudent = (studentId: EntityId) => list("soul-winning", { student_id: studentId });
export const getSoulWinningByClass = (classId: EntityId) => list("soul-winning", { class_id: classId });

export const listFinalExams = () => list("final-exams");
export const createFinalExam = (payload: FoundationRecord) => create("final-exams", payload);
export const updateFinalExam = (id: EntityId, payload: FoundationRecord) => update("final-exams", id, payload);
export const gradeFinalExam = (id: EntityId, payload: FoundationRecord) => action(`final-exams/${id}/grade`, payload);
export const getFinalExamByStudent = async (studentId: EntityId) => result(await apiClient.get<FoundationRecord | null>(`${ROOT}/final-exams/by-student/${studentId}`));
export const recalculateStudentFinalGrade = (studentId: EntityId) => action(`students/${studentId}/recalculate-final-grade`);

export const listGraduations = () => list("graduations");
export const getGraduationById = (id: EntityId) => get("graduations", id);
export const createGraduation = (payload: FoundationRecord) => create("graduations", payload);
export const updateGraduation = (id: EntityId, payload: FoundationRecord) => update("graduations", id, payload);
export const approveGraduation = (id: EntityId, payload: FoundationRecord = {}) => action(`graduations/${id}/approve`, payload);
export const completeGraduation = (id: EntityId, payload: FoundationRecord = {}) => action(`graduations/${id}/complete`, payload);
export const addStudentToGraduation = (graduationId: EntityId, studentId: EntityId, payload: FoundationRecord = {}) => action(`graduations/${graduationId}/students/${studentId}`, payload);
export const markStudentGraduated = (studentId: EntityId, graduationId: EntityId, payload: FoundationRecord = {}) => action(`students/${studentId}/graduate`, { ...payload, graduation_id: graduationId });

export const getFoundationOverviewStats = (filters: FoundationRecord = {}) => action("reports/overview", filters);
export const getFoundationClassStats = (classId: EntityId) => action(`reports/classes/${classId}`);
export const getGraduationReadinessReport = (filters: FoundationRecord = {}) => action("reports/graduation-readiness", filters);
export const getTeacherActivityReport = (filters: FoundationRecord = {}) => action("reports/teacher-activity", filters);

export function getFoundationSchoolApiInfo() {
  return { source: "api", ready: false, root: ROOT, note: "Placeholder; requires VITE_API_BASE_URL." };
}
