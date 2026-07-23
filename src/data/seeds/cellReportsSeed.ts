import type { CellReportSubmission } from "../types/entities";
import { CELLS_SEED } from "./cellsSeed";

const HQ = "church-hq";
const HQ_NAME = "National HQ - Christ Embassy Mozambique";

/** Sample weekly reports for first N seeded cells. */
export const CELL_REPORTS_SEED: CellReportSubmission[] = CELLS_SEED.slice(0, 24).map(
  (cell, index) => {
    const att = Number(cell.attendance || 10 + (index % 8));
    const ft = Number(cell.first_timers || index % 4);
    const nc = Number(cell.new_converts || index % 3);
    const offering = Number(cell.offering || 500 + att * 50);
    const health =
      att >= 18
        ? "Pronta para Multiplicar"
        : att < 8
          ? "Precisa de Acompanhamento"
          : "Saudável";
    const status =
      index % 5 === 0
        ? "Pending Review"
        : index % 4 === 0
          ? "Validated"
          : index % 3 === 0
            ? "Approved"
            : "Submitted";
    return {
      id: `cell-report-${index + 1}`,
      report_week: "2026-07-W1",
      meeting_date: "2026-07-05",
      weekOf: "2026-07-05",
      church_id: cell.church_id || HQ,
      church_name: cell.church_name || HQ_NAME,
      cell_group_id: cell.cell_group_id || cell.group_id || "",
      cell_group_name: cell.cell_group_name || cell.group_name || "",
      group_name: cell.group_name || cell.cell_group_name || "",
      cell_id: cell.id,
      cellId: cell.id,
      cell_name: cell.cell_name || cell.name || "",
      celula: cell.cell_name || cell.name || "",
      leader_id: cell.leader_id || "",
      leader_name: cell.leader_name || "",
      nome_do_lider: cell.leader_name || "",
      leader_phone: cell.leader_phone || "",
      meeting_type: cell.meeting_type || "Presencial",
      meeting_location: cell.meeting_location || "",
      start_time: cell.meeting_time || "18:00",
      end_time: "19:30",
      topic: "Crescimento espiritual",
      lesson_shared: "Estudo semanal",
      meeting_notes: "",
      attendance_count: att,
      attendance: att,
      att,
      first_timers_count: ft,
      ft,
      new_converts_count: nc,
      nc,
      contacted_people_count: ft + 2,
      absent_members_count: index % 3,
      children_youth_count: index % 5,
      souls_won_count: Math.max(1, nc),
      rs: Math.max(1, nc),
      people_prayed_for_count: att,
      testimonies: index % 2 ? "Testemunho de restauração." : "",
      referred_to_follow_up_count: ft > 0 ? 1 : 0,
      interested_in_foundation_school_count: nc,
      needs_pastoral_visit_count: health.includes("Acompanhamento") ? 1 : 0,
      prayer_requests: "",
      offering_given: offering > 0,
      offering_amount: offering,
      oferta: offering,
      currency: "MZN",
      payment_method: offering > 0 ? "M-Pesa" : "",
      payment_reference: offering > 0 ? `MP-${1000 + index}` : "",
      proof_file_url: "",
      finance_review_status: offering > 0 ? "Pending Finance Review" : "Not Applicable",
      cell_health_status: health,
      challenges: "",
      needs: health.includes("Acompanhamento") ? "Visita pastoral" : "",
      leader_comments: cell.observation || "",
      observacoes: cell.observation || "",
      submitted_by_type: "Cell Leader",
      submitted_from: "admin",
      status,
      estado:
        status === "Validated"
          ? "Validado"
          : status === "Approved"
            ? "Aprovado"
            : status === "Pending Review"
              ? "Em Avaliação"
              : "Submetido",
      needs_review: status === "Pending Review",
      possible_duplicate: false,
      reviewed_by: status === "Approved" || status === "Validated" ? "Pastora Flavia" : "",
      reviewed_at:
        status === "Approved" || status === "Validated" ? "2026-07-06T10:00:00.000Z" : "",
      validated_by: status === "Validated" ? "Sister Eduarda" : "",
      validated_at: status === "Validated" ? "2026-07-06T16:00:00.000Z" : "",
      avaliado_por: status === "Approved" || status === "Validated" ? "Pastora Flavia" : "",
      validado_por: status === "Validated" ? "Sister Eduarda" : "",
      submetido_por: "Cell Leader Demo",
      created_by: "Cell Leader Demo",
      updated_by: status === "Validated" ? "Sister Eduarda" : "Pastora Flavia",
      created_at: "2026-07-05",
      updated_at: "2026-07-06",
    };
  },
);
