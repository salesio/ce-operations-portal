import type { MaterialReport } from "../types/entities";

export const MINISTRY_MATERIALS_REPORTS_SEED: MaterialReport[] = [
  {
    id: "mat-report-1",
    report_number: "MREP-2026-0001",
    name: "Relatório Semanal de Materiais",
    category: "22 Junho - 05 Julho 2026",
    period_start: "2026-06-22",
    period_end: "2026-07-05",
    quantity: 35,
    amount: 10400,
    currency: "MTn",
    church_id: "church-hq",
    status: "Completed",
    estado: "Concluído",
    notes: "35 unidades vendidas; fundos internos 10.400 MTn (não financeRecord).",
    created_at: "2026-07-05",
    updated_at: "2026-07-05",
  },
];
