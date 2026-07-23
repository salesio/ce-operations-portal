import type { FoundationTeacher } from "../types/entities";

const HQ = "church-hq";
const HQ_NAME = "National HQ - Christ Embassy Mozambique";

const HQ_NAMES = [
  "Professor João",
  "Professora Ana",
  "Professora Marta",
  "Professor Edson",
  "Professora Helena",
  "Professor Samuel",
  "Professora Rosa",
  "Professor David",
  "Professora Celina",
  "Professor Mateus",
  "Professora Sofia",
  "Professor Miguel",
  "Professora Alda",
  "Professor Nelson",
  "Professora Paula",
  "Professor Tito",
  "Professora Elisa",
  "Professor Pedro",
  "Professora Lúcia",
  "Professor Daniel",
  "Professora Fátima",
  "Professor Rui",
];

function hqTeacher(
  index: number,
  overrides: Partial<FoundationTeacher> = {},
): FoundationTeacher {
  const n = index + 1;
  const modeSet: string[] =
    n % 7 === 0
      ? ["prison_ministry"]
      : n % 5 === 0
        ? ["home_visit"]
        : n % 4 === 0
          ? ["online"]
          : n % 3 === 0
            ? ["in_person", "online"]
            : ["in_person"];
  const allLessons = n % 6 === 0;
  const lessonFocus = allLessons ? [1, 2, 3, 4, 5, 6, 7] : [((n - 1) % 7) + 1];
  const name = HQ_NAMES[(n - 1) % HQ_NAMES.length];
  return {
    id: `ftch-${n}`,
    full_name: name,
    title: n % 11 === 0 ? "Professor Assistente" : "Professor",
    role_type: n % 11 === 0 ? "Assistant Teacher" : "Teacher",
    phone: `84600${String(n).padStart(4, "0")}`,
    whatsapp: `84600${String(n).padStart(4, "0")}`,
    email: `foundation.teacher${n}@ce-mozambique.org`,
    church_id: HQ,
    church_name: HQ_NAME,
    status: n % 13 === 0 ? "Em Treinamento" : "Activo",
    subjects_or_lessons_allowed: lessonFocus,
    can_teach_lessons: lessonFocus,
    can_teach_all_lessons: allLessons,
    delivery_modes_allowed: modeSet,
    assigned_locations: [
      modeSet.includes("prison_ministry")
        ? "fsloc-prison-1"
        : modeSet.includes("online")
          ? "fsloc-online-zoom"
          : modeSet.includes("home_visit")
            ? "fsloc-home-visit"
            : "fsloc-hq-room-1",
    ],
    availability: n % 2 ? "Domingo 1º Culto" : "Quarta-feira 18:00",
    max_classes_per_week: n % 3 === 0 ? 4 : 2,
    is_prison_ministry_teacher: modeSet.includes("prison_ministry"),
    can_teach_online: modeSet.includes("online"),
    can_teach_home_visit: modeSet.includes("home_visit"),
    can_teach_in_person: modeSet.includes("in_person"),
    notes: "",
    created_at: "2026-07-01",
    updated_at: "2026-07-20",
    ...overrides,
  };
}

const hqTeachers: FoundationTeacher[] = HQ_NAMES.map((_, i) => hqTeacher(i));

export const FOUNDATION_TEACHERS_SEED: FoundationTeacher[] = [
  {
    id: "ftch-rector",
    user_id: "u-foundation-rector",
    full_name: "Pastor Coordenador",
    title: "Reitor",
    role_type: "Rector",
    phone: "862270000",
    whatsapp: "862270000",
    email: "foundation.rector@ce-mozambique.org",
    church_id: HQ,
    church_name: HQ_NAME,
    status: "Activo",
    subjects_or_lessons_allowed: [1, 2, 3, 4, 5, 6, 7],
    can_teach_lessons: [1, 2, 3, 4, 5, 6, 7],
    can_teach_all_lessons: true,
    delivery_modes_allowed: ["in_person", "online", "hybrid"],
    assigned_locations: ["fsloc-hq-main", "fsloc-online-zoom"],
    availability: "Domingo e Quarta",
    max_classes_per_week: 4,
    is_prison_ministry_teacher: false,
    can_teach_online: true,
    can_teach_home_visit: false,
    can_teach_in_person: true,
    notes: "Reitor da Escola de Fundação",
    created_at: "2026-07-01",
    updated_at: "2026-07-20",
  },
  {
    id: "ftch-coordinator",
    user_id: "u-foundation-coordinator",
    full_name: "Irmã Coordenadora",
    title: "Coordenador",
    role_type: "Coordinator",
    phone: "866220111",
    whatsapp: "866220111",
    email: "foundation.coord@ce-mozambique.org",
    church_id: HQ,
    church_name: HQ_NAME,
    status: "Activo",
    subjects_or_lessons_allowed: [1, 2, 3, 4, 5, 6, 7],
    can_teach_lessons: [1, 2, 3, 4, 5, 6, 7],
    can_teach_all_lessons: true,
    delivery_modes_allowed: ["in_person", "online", "home_visit", "hybrid"],
    assigned_locations: ["fsloc-hq-main", "fsloc-home-visit", "fsloc-online-zoom"],
    availability: "Todos os cultos",
    max_classes_per_week: 5,
    is_prison_ministry_teacher: false,
    can_teach_online: true,
    can_teach_home_visit: true,
    can_teach_in_person: true,
    notes: "Coordena inscrições, turmas e exames.",
    created_at: "2026-07-01",
    updated_at: "2026-07-20",
  },
  ...hqTeachers,
  {
    id: "ftch-matola-1",
    full_name: "Professor Carlos",
    title: "Professor",
    role_type: "Teacher",
    phone: "846009901",
    email: "foundation.matola@ce-mozambique.org",
    church_id: "church-matola",
    church_name: "Igreja Embaixada de Cristo Matola",
    status: "Activo",
    subjects_or_lessons_allowed: [1, 2, 3, 4],
    can_teach_lessons: [1, 2, 3, 4],
    delivery_modes_allowed: ["in_person"],
    can_teach_in_person: true,
    max_classes_per_week: 3,
    created_at: "2026-07-01",
    updated_at: "2026-07-20",
  },
  {
    id: "ftch-beira-1",
    full_name: "Professora Beatriz",
    title: "Professor",
    role_type: "Teacher",
    phone: "846009902",
    church_id: "church-beira",
    church_name: "Igreja Embaixada de Cristo Beira",
    status: "Activo",
    subjects_or_lessons_allowed: [1, 2, 3, 4, 5, 6, 7],
    can_teach_all_lessons: true,
    delivery_modes_allowed: ["in_person", "online"],
    can_teach_online: true,
    can_teach_in_person: true,
    max_classes_per_week: 3,
    created_at: "2026-07-01",
    updated_at: "2026-07-20",
  },
  {
    id: "ftch-prison-lead",
    full_name: "Professora Janet Marquele",
    title: "Professor",
    role_type: "Teacher",
    phone: "846009903",
    email: "foundation.prison@ce-mozambique.org",
    church_id: HQ,
    church_name: HQ_NAME,
    status: "Activo",
    subjects_or_lessons_allowed: [1, 2, 3, 4, 5, 6, 7],
    can_teach_all_lessons: true,
    delivery_modes_allowed: ["prison_ministry", "in_person"],
    assigned_locations: ["fsloc-prison-1"],
    is_prison_ministry_teacher: true,
    can_teach_in_person: true,
    max_classes_per_week: 3,
    notes: "Lidera turmas do Ministério Prisional.",
    created_at: "2026-07-01",
    updated_at: "2026-07-20",
  },
];
