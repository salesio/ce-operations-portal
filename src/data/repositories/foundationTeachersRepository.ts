/** Thin re-export — teacher methods live in foundationSchoolRepository. */
export {
  listFoundationTeachers,
  getFoundationTeacherById,
  createFoundationTeacher,
  updateFoundationTeacher,
  deleteFoundationTeacher,
  getActiveFoundationTeachers,
  getFoundationTeachersByChurch,
  normalizeFoundationTeacher,
} from "./foundationSchoolRepository";
