import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

console.log("Original size:", code.length);

// 1. Clean prisonMinistry.foundationStudents in seedData
code = code.replace(
  /prisonMinistry:\s*\{\s*prisons:\s*\[[\s\S]*?services:\s*\[[\s\S]*?\],\s*foundationStudents:\s*\[[\s\S]*?\],\s*weeklyAgenda:/m,
  (match) => {
    return match.replace(/foundationStudents:\s*\[[\s\S]*?\],/, "foundationStudents: [],");
  }
);

// If still has pfs-2 in services, fix it:
code = code.replace(
  /services:\s*\[[\s\S]*?\{ id: "pfs-2"[\s\S]*?\}\s*\]/m,
  `services: [
      { id: "ps-1", church_id: "church-hq", created_by: "Sister Janet Marquele", updated_by: "Sister Janet Marquele", created_at: "2026-07-02", updated_at: "2026-07-02", status: "Relatório Submetido", data: "2026-07-02", dia_da_semana: "Quinta", prisao: "prison-1", igreja_responsavel: "church-hq", lider_responsavel: "Sister Janet Marquele", membros_que_foram: "Janet Marquele, Equipa de Células", numero_de_internos_presentes: 46, novos_convertidos: 12, interessados_em_escola_de_fundacao: 9, aula_de_fundacao_dada: true, tema_ou_mensagem: "Nova Vida em Cristo", observacoes: "Relatório e lista entregues.", estado: "Relatório Submetido" }
    ],
    foundationStudents: []`
);

// 2. In normalizeState, purge any mock Foundation records
const mockPurgeTarget = `  // Purge legacy mock data
  const isLegacyMockId = (id) => /^m-[123]$|^ft-[123]$|^fu-[123456]$|^fs-[123]$|^cr-[123]$|^ca-[12]$|^fin-[12345678]$|^disb-req-[489]$|^req-[123456789]$/.test(String(id || ""));
  merged.members = (merged.members || []).filter((m) => !isLegacyMockId(m?.id));
  merged.firstTimers = (merged.firstTimers || []).filter((ft) => !isLegacyMockId(ft?.id));
  merged.followUps = (merged.followUps || []).filter((fu) => !isLegacyMockId(fu?.id));
  merged.foundationStudents = (merged.foundationStudents || []).filter((fs) => !isLegacyMockId(fs?.id));`;

const mockPurgeReplacement = `  // Purge legacy mock data and demo artifacts
  const isLegacyMockId = (id) => /^m-[123]$|^ft-[123]$|^fu-[123456]$|^fs-[123]$|^cr-[123]$|^ca-[12]$|^fin-[12345678]$|^disb-req-[489]$|^req-[123456789]$/.test(String(id || ""));
  const isFoundationMock = (item) => {
    if (!item) return false;
    const id = String(item.id || "");
    if (/^fs-mock-|^pfs-|^fs-[123]$|^ftch-auto-|^ftch-[123]$|^fcg-|^flts-|^fls-|^fla-|^flp-|^fsw-|^ffe-/.test(id)) return true;
    if (item.metadata?.demo || item.metadata?.is_demo) return true;
    const name = String(item.full_name || item.name || item.student_name || item.nome_do_participante || "");
    if (/Aluno Demo|Professor Demo|Turma.*Demo|Aminata Chivinda|João Nhaca|Maria Zitha|Carlos Mucavele|Elisa Macamo|Pedro Ndlovu|Helena Cossa|Marta Bila|Samuel Dlamini|Rosa Manjate|Edson Tembe|Celina Mabunda|David Sithole|Ana Muianga|Mateus Zandamela/i.test(name)) return true;
    return false;
  };
  merged.members = (merged.members || []).filter((m) => !isLegacyMockId(m?.id));
  merged.firstTimers = (merged.firstTimers || []).filter((ft) => !isLegacyMockId(ft?.id));
  merged.followUps = (merged.followUps || []).filter((fu) => !isLegacyMockId(fu?.id));
  merged.foundationStudents = (merged.foundationStudents || []).filter((fs) => !isLegacyMockId(fs?.id) && !isFoundationMock(fs));
  merged.foundationTeachers = (merged.foundationTeachers || []).filter((t) => !isFoundationMock(t));
  merged.foundationClassGroups = (merged.foundationClassGroups || []).filter((c) => !isFoundationMock(c));
  merged.foundationLessonSessions = (merged.foundationLessonSessions || []).filter((s) => !isFoundationMock(s));
  merged.foundationLessonProgress = (merged.foundationLessonProgress || []).filter((p) => !isFoundationMock(p));
  merged.foundationLessonAttendance = (merged.foundationLessonAttendance || []).filter((a) => !isFoundationMock(a));
  merged.foundationLessonTestSubmissions = (merged.foundationLessonTestSubmissions || []).filter((sub) => !isFoundationMock(sub));
  merged.foundationSoulWinning = (merged.foundationSoulWinning || []).filter((sw) => !isFoundationMock(sw));
  merged.foundationFinalExams = (merged.foundationFinalExams || []).filter((fe) => !isFoundationMock(fe));`;

code = code.replace(mockPurgeTarget, mockPurgeReplacement);

// 3. Update submitFoundationClass, submitFoundationTeacher, submitFoundationStudent to use generateUuid()
code = code.replace(
  /id:\s*`fcg-\$\{Date\.now\(\)\}`/,
  "id: typeof generateUuid === 'function' ? generateUuid() : `fcg-${Date.now()}`"
);
code = code.replace(
  /id:\s*`ftch-\$\{Date\.now\(\)\}`/,
  "id: typeof generateUuid === 'function' ? generateUuid() : `ftch-${Date.now()}`"
);
code = code.replace(
  /id:\s*`fs-\$\{Date\.now\(\)\}`/,
  "id: typeof generateUuid === 'function' ? generateUuid() : `fs-${Date.now()}`"
);

// 4. Replace ensureFoundationTeacherScale and ensureFoundationClassGroupContexts to no longer inject fake teachers or classes
const cleanTeacherScale = `function ensureFoundationTeacherScale(hq, churchLabel) {
  state.foundationTeachers = (state.foundationTeachers || []).map((teacher) => foundationNormalizeTeacherCapabilities(teacher));
}`;
code = code.replace(/function ensureFoundationTeacherScale\(hq, churchLabel\) \{[\s\S]*?\n\}/m, cleanTeacherScale);

const cleanClassContexts = `function ensureFoundationClassGroupContexts(hq, churchLabel) {
  state.foundationClassGroups = (state.foundationClassGroups || []).map((group, index) => {
    const mode = group.delivery_mode || "in_person";
    const locationId = group.primary_location_id || (mode === "online" ? "fsloc-online-zoom" : mode === "prison_ministry" ? "fsloc-prison-1" : mode === "home_visit" ? "fsloc-home-visit" : "fsloc-hq-main");
    const loc = foundationLocationById(locationId);
    const assistantIds = Array.isArray(group.assistant_teacher_ids)
      ? group.assistant_teacher_ids
      : [group.assistant_teacher_id].filter(Boolean);
    return {
      ...group,
      delivery_mode: mode,
      primary_location_id: locationId,
      primary_location_name: group.primary_location_name || loc.name || "",
      location_type: group.location_type || loc.location_type || "Church",
      prison_center_id: group.prison_center_id || loc.prison_center_id || "",
      prison_center_name: group.prison_center_name || loc.prison_center_name || "",
      online_platform: group.online_platform || loc.online_platform || "",
      online_link: group.online_link || loc.online_link || "",
      assistant_teacher_ids: assistantIds,
      coordinator_id: group.coordinator_id || "",
      coordinator_name: group.coordinator_name || "",
      church_id: group.church_id || hq,
      church_name: group.church_name || churchLabel
    };
  });
}`;
code = code.replace(/function ensureFoundationClassGroupContexts\(hq, churchLabel\) \{[\s\S]*?\n\}/m, cleanClassContexts);

// 5. Clean ensureFoundationData
const cleanEnsureFoundationData = `function ensureFoundationData() {
  const today = new Date().toISOString().slice(0, 10);
  const hq = state.churches?.[0]?.id || "church-hq";
  const churchLabel = churchName(hq);
  if (!Array.isArray(state.foundationTeachers)) state.foundationTeachers = [];
  if (!Array.isArray(state.foundationClassGroups)) state.foundationClassGroups = [];
  if (!Array.isArray(state.foundationStudents)) state.foundationStudents = [];
  if (!Array.isArray(state.foundationLessonSessions)) state.foundationLessonSessions = [];
  if (!Array.isArray(state.foundationLessonProgress)) state.foundationLessonProgress = [];
  if (!Array.isArray(state.foundationLessonAttendance)) state.foundationLessonAttendance = [];
  if (!Array.isArray(state.foundationLessonTestSubmissions)) state.foundationLessonTestSubmissions = [];
  if (!Array.isArray(state.foundationSoulWinning)) state.foundationSoulWinning = [];
  if (!Array.isArray(state.foundationFinalExams)) state.foundationFinalExams = [];
  if (!Array.isArray(state.foundationAuditLogs)) state.foundationAuditLogs = [];

  if (!state.foundationSchoolSettings) {
    state.foundationSchoolSettings = {
      rector_user_id: "",
      rector_name: "",
      coordinator_user_id: "",
      coordinator_name: "",
      default_church_id: hq,
      passing_score_per_lesson: 50,
      lesson_test_max_score: 20,
      final_exam_max_score: 100,
      final_exam_passing_score: 50,
      require_all_7_lessons: true,
      require_lesson_tests: true,
      require_soul_winning_for_lesson_4: true,
      allow_lessons_in_random_order: true,
      created_at: today,
      updated_at: today
    };
  }
  state.foundationSchoolSettings.lesson_test_max_score = Number(state.foundationSchoolSettings.lesson_test_max_score || 20);
  state.foundationSchoolSettings.final_exam_max_score = Number(state.foundationSchoolSettings.final_exam_max_score || 100);
  if (!state.foundationGradingSettings) {
    state.foundationGradingSettings = {
      lesson_tests_total_max_score: 130,
      final_exam_max_score: 100,
      lesson_tests_weight_percent: 40,
      final_exam_weight_percent: 60,
      passing_percentage: 50,
      updated_at: today
    };
  }
  ensureFoundationLessonLocations(hq, churchLabel);
  ensureFoundationOnlineTests();
  state.foundationTeachers = state.foundationTeachers.map((teacher) => foundationNormalizeTeacherCapabilities(teacher));
  state.foundationClassGroups = state.foundationClassGroups.map((group) => ({ ...group }));
  state.foundationStudents = state.foundationStudents.map((student, index) => foundationNormalizeStudent(student, index));
}`;

code = code.replace(/function ensureFoundationData\(\) \{[\s\S]*?\n\}/m, cleanEnsureFoundationData);

// 6. Clean ensureFoundationLessonTestSubmissions, ensureFoundationLessonRecords, ensureFoundationLessonSessions, ensureFoundationSoulWinning, ensureFoundationFinalExams
code = code.replace(/function ensureFoundationLessonTestSubmissions\(\) \{[\s\S]*?\n\}/m, `function ensureFoundationLessonTestSubmissions() {
  if (!Array.isArray(state.foundationLessonTestSubmissions)) state.foundationLessonTestSubmissions = [];
  state.foundationLessonTestSubmissions = state.foundationLessonTestSubmissions.map((item) => normalizeFoundationSubmission(item));
}`);

code = code.replace(/function ensureFoundationLessonRecords\(\) \{[\s\S]*?\n\}/m, `function ensureFoundationLessonRecords() {
  if (!Array.isArray(state.foundationLessonProgress)) state.foundationLessonProgress = [];
  state.foundationLessonProgress = state.foundationLessonProgress.map((record) => foundationNormalizeLessonRecord(record));
}`);

code = code.replace(/function ensureFoundationLessonSessions\(\) \{[\s\S]*?\n\}/m, `function ensureFoundationLessonSessions() {
  if (!Array.isArray(state.foundationLessonSessions)) state.foundationLessonSessions = [];
  if (!Array.isArray(state.foundationLessonAttendance)) state.foundationLessonAttendance = [];
}`);

code = code.replace(/function ensureFoundationSoulWinning\(\) \{[\s\S]*?\n\}/m, `function ensureFoundationSoulWinning() {
  if (!Array.isArray(state.foundationSoulWinning)) state.foundationSoulWinning = [];
}`);

code = code.replace(/function ensureFoundationFinalExams\(\) \{[\s\S]*?\n\}/m, `function ensureFoundationFinalExams() {
  if (!Array.isArray(state.foundationFinalExams)) state.foundationFinalExams = [];
  state.foundationFinalExams = state.foundationFinalExams.map((exam) => ({
    ...exam,
    max_score: Number(exam.max_score || foundationGradingSettings().final_exam_max_score),
    percentage: exam.percentage || (exam.max_score ? Math.round((Number(exam.score || 0) / Number(exam.max_score || 100)) * 100) : 0)
  }));
}`);

// 7. Update renderFoundationStudents with empty state
const cleanRenderFoundationStudents = `function renderFoundationStudents(students) {
  const filtered = applyFoundationCardFilters(students, foundationPageState.filter);
  return \`
    <article class="panel" id="panel-foundation-students">
      <div class="panel-header-row mb-2">
        <div>
          <h3 class="panel-title mb-0">\${FS("foundationTabStudents")}</h3>
          <p class="text-secondary mb-0">\${lang === "pt" ? "Normalmente os alunos vêm do fluxo de Primeira Vez ou Inscrições." : "Students normally come from the First Timers flow or Enrolments."}</p>
        </div>
      </div>
      \${foundationActionBar([
        { label: lang === "pt" ? "Adicionar aluno" : "Add student", icon: "bi-person-plus", attrs: \`data-open-form="foundationStudent"\` }
      ])}
      \${filterBar({ filterScope: "foundation", statusOptions: foundationStatuses, searchValue: foundationPageState.filter.search || "", churchValue: foundationPageState.filter.churchId || "", statusValue: foundationPageState.filter.estado || "" })}
      \${filtered.length ? dataTable([FS("foundationTabStudents"), FS("classGroup"), L("church"), L("cell"), L("status"), L("progress"), FS("lessonTest"), FS("soulWinning"), L("actions")], filtered.map((s) => [
        fullName(s),
        s.class_group_name || foundationClassGroupById(s.class_group_id).name || "-",
        churchName(s.church_id),
        s.celula || s.cell_name || "-",
        badge(s.estado || s.status),
        foundationStudentCompactProgress(s),
        \`\${foundationLessonTestsSummary(s.id).submitted}/7<small class="d-block text-secondary">\${foundationLessonTestsSummary(s.id).lesson_tests_total_score}/\${foundationLessonTestsSummary(s.id).lesson_tests_max_score}</small>\`,
        badge(foundationSoulWinningForStudent(s.id).status || (s.pratica_evangelismo ? "Confirmado" : "Pendente")),
        actionButtons([["view", "foundationStudent", s.id, L("view")], ["edit", "foundationStudent", s.id, L("edit")], ["markClass", "foundationStudent", s.id, FS("markAttendance")], ["score", "foundationStudent", s.id, FS("enterScore")], ["graduate", "foundationStudent", s.id, L("graduate")]])
      ])) : EmptyState({ compact: true, title: L("empty") || "Sem alunos registados", description: lang === "pt" ? "Inscreva alunos através de Primeira Vez ou clique em Adicionar Aluno." : "Enrol students from First Timers or click Add Student." })}
    </article>
  \`;
}`;
code = code.replace(/function renderFoundationStudents\(students\) \{[\s\S]*?\n\}/m, cleanRenderFoundationStudents);

// 8. Update renderFoundationLessons with empty state
const cleanRenderFoundationLessons = `function renderFoundationLessons(students) {
  const ctx = foundationPageState.lesson;
  const groups = foundationScopedClassGroups();
  if (!ctx.classGroupId && groups.length) ctx.classGroupId = groups[0].id;
  const groupStudents = foundationStudentsForGroup(ctx.classGroupId);
  const lessonNumber = Number(ctx.lessonNumber || 1);
  const currentSession = foundationSessionByContext(ctx.classGroupId, lessonNumber);
  return \`
    <article class="panel" id="panel-foundation-lessons">
      <div class="panel-header-row mb-2">
        <div>
          <h3 class="panel-title mb-0">\${FS("attendanceClasses")}</h3>
          <p class="text-secondary mb-1">\${FS("recordedBy")}: \${activeUser?.name || "Admin Principal"} · \${currentSession?.id ? \`\${lang === "pt" ? "Sessão" : "Session"}: \${currentSession.lesson_date || "-"} · \${foundationDeliveryLabel(currentSession.delivery_mode)}\` : (lang === "pt" ? "Ainda sem registo desta aula." : "No lesson record yet.")}</p>
          <p class="text-secondary small mb-0">\${lang === "pt"
            ? "Fluxo: 1) escolha turma + aula + formato + local + professor + data · 2) clique «Registar esta aula» para guardar quando a aula foi dada · 3) marque Presente e «Guardar presenças». A sessão é o registo da aula (quem ensinou, onde, quando) — a presença é quem dos alunos veio."
            : "Flow: 1) pick class + lesson + format + location + teacher + date · 2) click «Register this lesson» to save when the lesson was held · 3) mark Present and save attendance. A session is the lesson event (who taught, where, when) — attendance is which students came."}</p>
        </div>
      </div>
      \${foundationActionBar([
        { label: lang === "pt" ? "Registar esta aula (sessão)" : "Register this lesson (session)", icon: "bi-calendar-plus", attrs: \`data-foundation-create-session\` },
        { label: lang === "pt" ? "Guardar presenças em massa" : "Save attendance (bulk)", icon: "bi-check2-circle", variant: "btn-outline-cyan", attrs: \`data-foundation-save-all\` }
      ])}
      <form class="filter-toolbar filter-bar mb-4" data-foundation-lesson-context>
        <select class="form-select" name="classGroupId" data-foundation-lesson-field><option value="">\${FS("classGroup")}</option>\${foundationSelectOptions(groups, "id", "name", ctx.classGroupId)}</select>
        <select class="form-select" name="lessonNumber" data-foundation-lesson-field>\${Array.from({ length: 7 }, (_, i) => \`<option value="\${i + 1}" \${String(ctx.lessonNumber) === String(i + 1) ? "selected" : ""}>\${FS("lesson")} \${i + 1} - \${FOUNDATION_LESSON_TITLES[i]}</option>\`).join("")}</select>
        <select class="form-select" name="deliveryMode" data-foundation-lesson-field>\${foundationDeliveryOptions(ctx.deliveryMode || foundationClassGroupById(ctx.classGroupId).delivery_mode || "in_person")}</select>
        <select class="form-select" name="locationId" data-foundation-lesson-field><option value="">\${FS("lessonLocation")}</option>\${foundationLocationOptions(ctx.locationId || foundationClassGroupById(ctx.classGroupId).primary_location_id || "")}</select>
        <select class="form-select" name="teacherId" data-foundation-lesson-field><option value="">\${FS("responsibleTeacher")}</option>\${foundationSelectOptions(state.foundationTeachers || [], "id", "full_name", ctx.teacherId)}</select>
        <input class="form-control" name="date" type="date" value="\${ctx.date || new Date().toISOString().slice(0, 10)}" data-foundation-lesson-field>
      </form>
      \${!groups.length
        ? EmptyState({ compact: true, title: lang === "pt" ? "Nenhuma turma criada" : "No classes created", description: lang === "pt" ? "Crie uma turma na aba Turmas para iniciar o registo de aulas." : "Create a class in the Classes tab to begin recording lessons." })
        : (groupStudents.length ? dataTable([FS("foundationTabStudents"), FS("attendance"), FS("deliveryMode"), FS("onlineTestResult"), FS("soulWinning"), L("status"), L("notes"), L("actions")], groupStudents.map((student) => {
          const lesson = foundationNormalizeLessonRecord(foundationLessonRecords(student.id).find((item) => Number(item.lesson_number) === lessonNumber) || {});
          const session = foundationSessionByContext(student.class_group_id, lessonNumber) || {};
          const submission = foundationBestLessonSubmission(student.id, lessonNumber);
          const passed = submission ? Number(submission.test_score || submission.percentage || 0) >= Number(state.foundationSchoolSettings?.passing_score_per_lesson || 50) : false;
          const soul = foundationSoulWinningForStudent(student.id);
          return [
            \`<strong>\${fullName(student)}</strong><small class="d-block text-secondary">\${student.class_group_name || ""}</small>\`,
            \`<label class="form-check mb-0"><input type="checkbox" class="form-check-input" data-foundation-row-field="attended" data-student-id="\${student.id}" \${lesson.attended ? "checked" : ""}> \${FS("present")}</label>\`,
            \`\${foundationDeliveryLabel(lesson.delivery_mode || session.delivery_mode || student.assigned_delivery_mode)}<small class="d-block text-secondary">\${lesson.location_name || session.location_name || student.assigned_location_name || ""}</small>\`,
            submission ? \`\${foundationLessonScoreLabel(submission)}<small class="d-block text-secondary">\${statusText(submission.review_status)} · \${submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : ""}</small>\` : \`<span class="text-secondary">\${FS("testNotSubmitted")}</span>\`,
            lessonNumber === 4 ? \`\${Number(soul.souls_won_count || student.numero_de_almas_ganhas || 0)}<small class="d-block text-secondary">\${statusText(soul.status || "Pendente")}</small>\` : "-",
            badge(lesson.attended ? (submission ? (passed ? FS("passed") : FS("failed")) : FS("lessonCompleted")) : FS("notStarted")),
            \`<input class="form-control form-control-sm" data-foundation-row-field="notes" data-student-id="\${student.id}" value="\${lesson.notes || ""}" placeholder="\${L("notes")}">\`,
            \`<button type="button" class="action-btn" data-foundation-save-row="\${student.id}">\${FS("saveProgress")}</button>\`
          ];
        })) : EmptyState({ compact: true, title: lang === "pt" ? "Sem alunos nesta turma" : "No students in this class", description: lang === "pt" ? "Inscreva alunos nesta turma para registar presenças." : "Enrol students into this class to record attendance." }))}
    </article>
  \`;
}`;
code = code.replace(/function renderFoundationLessons\(students\) \{[\s\S]*?\n\}/m, cleanRenderFoundationLessons);

// 9. Update renderFoundationFinalExam with empty state
const cleanRenderFoundationFinalExam = `function renderFoundationFinalExam() {
  const ready = foundationReadyForExamStudents();
  const exams = state.foundationFinalExams || [];
  const rows = [...ready, ...foundationStudentsForGroup().filter((s) => s.final_exam_passed || s.aprovado || Number(s.nota_exame || s.final_exam_score || 0) > 0)];
  const settings = foundationGradingSettings();
  return moduleSection(FS("physicalExam"), \`\${FS("finalExamHint")} \${FS("gradeFormulaHint")}\`, "bi-clipboard-check", "", \`
    <p class="text-secondary small mb-3">\${lang === "pt" ? "Use Lançar nota em cada linha. Anexe PDF/imagem no campo de anexo (único teste físico)." : "Use Enter score on each row. Attach PDF/image in the attachment field (only physical test)."}</p>
    \${rows.length ? dataTable([FS("foundationTabStudents"), FS("classGroup"), FS("lessonTestsTotal"), FS("score"), FS("attachmentStatus"), FS("correctedBy"), L("status"), L("actions")], rows.map((student) => {
      const exam = exams.find((item) => item.student_id === student.id) || {};
      const grade = foundationCourseGrade(student);
      const score = Number(exam.score || student.final_exam_score || student.nota_exame || 0);
      const hasAttachment = !!(exam.physical_exam_file_url || exam.exam_attachment_data_url);
      return [
        fullName(student),
        student.class_group_name || "-",
        \`\${grade.lesson_tests_total_score}/\${grade.lesson_tests_max_score}<small class="d-block text-secondary">\${grade.lesson_tests_percentage}%</small>\`,
        \`<div class="foundation-score-entry"><input type="number" min="0" max="\${settings.final_exam_max_score}" class="form-control form-control-sm" data-foundation-exam-score="\${student.id}" value="\${score || ""}" placeholder="\${FS("score")}"><span>/</span><input type="number" min="1" class="form-control form-control-sm" data-foundation-exam-max="\${student.id}" value="\${exam.max_score || settings.final_exam_max_score}"></div><small class="d-block text-secondary mt-1">\${grade.course_final_percentage}% \${FS("courseGrade")}</small>\`,
        \`<div class="foundation-attachment-field"><input type="file" class="form-control form-control-sm" data-foundation-exam-attachment="\${student.id}" accept="image/*,application/pdf">\${foundationExamAttachmentLink(exam) || \`<small class="d-block text-secondary mt-1">\${FS("noAttachment")}</small>\`}</div>\`,
        exam.corrected_by_name || exam.marked_by_name || "-",
        badge(hasAttachment ? FS("attached") : (score ? FS("examNeedsAttachment") : FS("studentsReadyForExam"))),
        \`<button type="button" class="action-btn" data-foundation-save-exam="\${student.id}">\${FS("enterScore")}</button>\`
      ];
    })) : EmptyState({ compact: true, title: lang === "pt" ? "Sem alunos prontos para exame" : "No students ready for exam", description: lang === "pt" ? "Os alunos aparecerão aqui após completarem as 7 aulas e testes." : "Students will appear here after completing all 7 lessons and tests." })}
  \`);
}`;
code = code.replace(/function renderFoundationFinalExam\(\) \{[\s\S]*?\n\}/m, cleanRenderFoundationFinalExam);

// 10. Update renderFoundationSoulWinning with empty state
const cleanRenderFoundationSoulWinning = `function renderFoundationSoulWinning() {
  const rows = state.foundationSoulWinning || [];
  return moduleSection(FS("soulWinning"), \`\${FS("lesson")} 4 — \${lang === "pt" ? "indique o número exacto de almas ganhas e confirme" : "enter the exact souls won count and confirm"}\`, "bi-stars", "", \`
    \${foundationActionBar([
      { label: lang === "pt" ? "Ir para Aula 4 (presenças)" : "Go to Lesson 4 (attendance)", icon: "bi-calendar-check", variant: "btn-outline-cyan", attrs: \`data-foundation-tab="lessons" data-foundation-goto-lesson="4"\` }
    ])}
    \${rows.length ? dataTable([FS("foundationTabStudents"), FS("classGroup"), L("date"), L("location"), FS("soulWinning"), FS("confirmedBy"), L("status"), L("actions")], rows.map((item) => {
      const student = (state.foundationStudents || []).find((s) => s.id === item.student_id) || {};
      return [
        fullName(student),
        foundationClassGroupById(item.class_group_id).name || "-",
        item.activity_date || "-",
        item.location || "-",
        \`<input type="number" min="0" class="form-control form-control-sm" style="max-width:5rem" data-foundation-souls-count="\${item.id}" value="\${Number(item.souls_won_count || 0)}">\`,
        item.confirmed_by_teacher_name || item.confirmed_by || "-",
        badge(item.status),
        \`<button type="button" class="action-btn" data-foundation-confirm-soul="\${item.id}">\${L("confirm") || "Confirmar"}</button>\`
      ];
    })) : EmptyState({ compact: true, title: lang === "pt" ? "Sem registos de ganhar almas" : "No soul winning records", description: lang === "pt" ? "Os registos são criados na Aula 4 prática da Escola de Fundação." : "Records are created during Lesson 4 practical." })}
  \`);
}`;
code = code.replace(/function renderFoundationSoulWinning\(\) \{[\s\S]*?\n\}/m, cleanRenderFoundationSoulWinning);

// 11. Update renderFoundationTeachers with empty state
const cleanRenderFoundationTeachers = `function renderFoundationTeachers() {
  const teachers = applyFoundationTeacherFilters((state.foundationTeachers || []).map((t) => foundationNormalizeTeacherCapabilities(t)));
  const tf = foundationPageState.teacherFilter || {};
  return moduleSection(FS("foundationTabTeachers"), \`\${FS("rector")}: \${state.foundationSchoolSettings?.rector_name || "-"} · \${FS("coordinator")}: \${state.foundationSchoolSettings?.coordinator_name || "-"} · \${teachers.length} \${lang === "pt" ? "professores" : "teachers"}\`, "bi-person-workspace", "", \`
    \${foundationActionBar([
      { label: lang === "pt" ? "Adicionar professor" : "Add teacher", icon: "bi-person-plus", attrs: \`data-foundation-teacher-add\` }
    ])}
    <form class="filter-toolbar filter-bar mb-3" data-foundation-teacher-filters>
      <input class="form-control" name="search" placeholder="\${L("search") || "Search"}" value="\${tf.search || ""}">
      <select class="form-select" name="churchId"><option value="">\${L("church")}</option>\${(state.churches || []).map((c) => \`<option value="\${c.id}" \${tf.churchId === c.id ? "selected" : ""}>\${c.church_name || c.public_name || c.id}</option>\`).join("")}</select>
      <select class="form-select" name="role_type"><option value="">\${FS("teacherRole")}</option>\${FOUNDATION_TEACHER_ROLES.map((r) => \`<option value="\${r.id}" \${tf.role_type === r.id ? "selected" : ""}>\${r[lang]}</option>\`).join("")}</select>
      <select class="form-select" name="status"><option value="">\${L("status")}</option>\${FOUNDATION_TEACHER_STATUSES.map((s) => \`<option value="\${s.id}" \${tf.status === s.id ? "selected" : ""}>\${s[lang]}</option>\`).join("")}</select>
      <select class="form-select" name="deliveryMode"><option value="">\${FS("deliveryMode")}</option>\${FOUNDATION_DELIVERY_MODES.map((m) => \`<option value="\${m.id}" \${tf.deliveryMode === m.id ? "selected" : ""}>\${m[lang]}</option>\`).join("")}</select>
      <select class="form-select" name="lesson"><option value="">\${FS("lesson")}</option>\${[1, 2, 3, 4, 5, 6, 7].map((n) => \`<option value="\${n}" \${String(tf.lesson) === String(n) ? "selected" : ""}>\${FS("lesson")} \${n}</option>\`).join("")}</select>
      <label class="form-check mb-0 align-self-center"><input type="checkbox" class="form-check-input" name="prisonOnly" \${tf.prisonOnly ? "checked" : ""}> <span class="form-check-label">\${foundationDeliveryLabel("prison_ministry")}</span></label>
      <button type="submit" class="btn btn-outline-cyan btn-touch">\${L("apply") || "Aplicar"}</button>
    </form>
    \${teachers.length ? dataTable([FS("foundationTabTeachers"), FS("teacherRole"), L("phone"), L("church"), FS("lessonsAllowed"), FS("deliveryModesAllowed"), FS("assignedClasses"), FS("testsEntered"), L("status"), L("actions")], teachers.map((teacher) => {
      const classes = (state.foundationClassGroups || []).filter((group) => group.main_teacher_id === teacher.id || group.assistant_teacher_id === teacher.id || (group.assistant_teacher_ids || []).includes(teacher.id));
      const lessonStudentIds = new Set((state.foundationLessonProgress || []).filter((item) => item.teacher_id === teacher.id).map((item) => item.student_id));
      const lessons = (state.foundationLessonTestSubmissions || []).filter((item) => lessonStudentIds.has(item.student_id));
      const roleLabel = (FOUNDATION_TEACHER_ROLES.find((r) => r.id === teacher.role_type) || {})[lang] || teacher.role_type || teacher.title || "";
      return [
        \`<strong>\${teacher.full_name}</strong><small class="d-block text-secondary">\${teacher.title || ""}</small>\`,
        badge(roleLabel),
        teacher.phone || "-",
        teacher.church_name || churchName(teacher.church_id),
        \`<div class="d-flex flex-wrap gap-1">\${(teacher.can_teach_all_lessons ? [1, 2, 3, 4, 5, 6, 7] : (teacher.can_teach_lessons || teacher.subjects_or_lessons_allowed || [])).map((n) => badge(\`\${FS("lesson")} \${n}\`)).join("")}</div>\`,
        \`<div class="d-flex flex-wrap gap-1">\${(teacher.delivery_modes_allowed || []).map((mode) => badge(foundationDeliveryLabel(mode))).join("")}\${teacher.is_prison_ministry_teacher ? badge(foundationDeliveryLabel("prison_ministry")) : ""}</div>\`,
        classes.length,
        lessons.length,
        badge(teacher.status),
        actionButtons([["view", "foundationTeacher", teacher.id, L("view")], ["edit", "foundationTeacher", teacher.id, L("edit")]])
      ];
    })) : EmptyState({ compact: true, title: lang === "pt" ? "Sem professores registados" : "No teachers registered", description: lang === "pt" ? "Adicione professores para ministrar turmas e aulas." : "Add teachers to assign to classes and lessons." })}
  \`);
}`;
code = code.replace(/function renderFoundationTeachers\(\) \{[\s\S]*?\n\}/m, cleanRenderFoundationTeachers);

// 12. Update renderFoundationGraduation with empty state
const cleanRenderFoundationGraduation = `function renderFoundationGraduation() {
  const ready = foundationReadyForGraduationStudents();
  const graduated = foundationStudentsForGroup().filter((s) => s.graduated || s.graduado);
  const rows = [...ready, ...graduated];
  return moduleSection(FS("foundationTabGraduation"), FS("graduationHint"), "bi-award", "", \`
    \${rows.length ? dataTable([FS("foundationTabStudents"), FS("classGroup"), FS("score"), FS("graduationBatch"), L("status"), L("actions")], rows.map((student) => [
      fullName(student),
      student.class_group_name || "-",
      student.final_exam_score || student.nota_exame || "-",
      student.graduation_batch || student.graduation_date || "-",
      badge(student.graduated || student.graduado ? L("graduated") : FS("readyForGraduation")),
      actionButtons([["graduate", "foundationStudent", student.id, L("graduate")], ["edit", "foundationStudent", student.id, FS("issueCertificate")]])
    ])) : EmptyState({ compact: true, title: lang === "pt" ? "Sem alunos para graduação" : "No graduation candidates", description: lang === "pt" ? "Os alunos aprovados no exame final aparecerão aqui para graduação e emissão de certificados." : "Passed students will appear here for graduation and certificates." })}
  \`);
}`;
code = code.replace(/function renderFoundationGraduation\(\) \{[\s\S]*?\n\}/m, cleanRenderFoundationGraduation);

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Updated size:", code.length);
console.log("Foundation School mock data purge script finished successfully!");
