import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// Enhance #cell-portal-growth with the Peak & Low Chart for the leader's specific cell
const oldGrowthSection = `<section id="cell-portal-growth" class="cell-portal-section">
        \${cellPortalSectionTitle("bi-graph-up-arrow", "Crescimento & Progresso", "Indicadores agregados e responsivos")}
        <div class="cell-portal-chart-grid">`;

const newGrowthSection = `<section id="cell-portal-growth" class="cell-portal-section">
        \${cellPortalSectionTitle("bi-graph-up-arrow", "Crescimento & Progresso", "Indicadores agregados e curva de tendência com picos/baixas da sua célula")}
        <div class="panel glass-panel mb-4 p-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h4 class="panel-title mb-0 fs-6"><i class="bi bi-graph-up-arrow me-2 text-info"></i>Curva de Presença da Célula (Picos & Baixas)</h4>
            <span class="badge bg-dark-subtle text-info">\${escapeAttr(context?.cell_name || "Célula")}</span>
          </div>
          \${(() => {
            const cellSpecificReports = (state.cellLeadership?.cellReports || []).filter((r) => String(r.cell_id) === String(context?.cell_id));
            const cellChartPoints = cellSpecificReports.map((r) => ({
              label: \`\${String(r.data_do_culto || r.data_inicio || "").slice(5)} (\${(r.culto || "Culto").split(" ")[0]})\`,
              value: Number(r.att || r.members_present_count || 0),
              date: r.data_do_culto || r.data_inicio || ""
            }));
            return renderPeakLowChartSvg(cellChartPoints.length ? cellChartPoints : (trends?.attendance || []).map((a) => ({ label: a[0], value: a[1] })));
          })()}
        </div>
        <div class="cell-portal-chart-grid">`;

code = code.replace(oldGrowthSection, newGrowthSection);

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully enhanced Cell Portal Growth with Peak & Low Chart!");
