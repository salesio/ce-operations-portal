/** Thin re-export — student methods live in foundationSchoolRepository. */
export {
  listFoundationStudents,
  getFoundationStudentById,
  createFoundationStudent,
  updateFoundationStudent,
  deleteFoundationStudent,
  searchFoundationStudents,
  getFoundationStudentsByChurch,
  getFoundationStudentsByClassGroup,
  getFoundationStudentsByStatus,
  getFoundationStudentsByQuarter,
  getReadyForExamStudents,
  getReadyForGraduationStudents,
  getGraduatedStudents,
  normalizeFoundationStudent,
} from "./foundationSchoolRepository";
