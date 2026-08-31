import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// 1. Add users to seedData.users
const newUsersCode = `    { id: "u-dv-leader", auth_user_id: "47df0cce-9701-492c-90aa-b3cb205bbd4b", name: "Líder Diplomatas Victory", email: "d.v.lider@embaixadadecristo.org", role: "Cell Leader", church_id: "a1111111-1111-4111-8111-111111111101", cell_id: "2b3a5652-b8be-4c76-8b64-b84200c8bcd4", cell_group_id: "a62f461e-e574-4052-8ef3-a4d0ee0c77c4", assigned_cells: ["2b3a5652-b8be-4c76-8b64-b84200c8bcd4"], department_permissions: ["cellReports"], permissions: ["cell_reports.view_own", "cell_reports.create_own", "cell_reports.edit_own_until_validated", "cell_portal.view", "cell_portal.edit", "cell_portal.view_members", "cell_portal.view_member_profile", "cell_portal.submit_report", "cell_portal.view_finance_summary", "cell_portal.view_partnership_summary", "cell_portal.view_soul_winning", "cell_portal.view_programs", "cell_portal.view_charts", "cell_portal.export_summary"], can_view_all_churches: false },
    { id: "u-dv-assistant", auth_user_id: "9820f162-430c-4573-86db-b001097fa6dc", name: "Assistente Diplomatas Victory", email: "d.v.assistente@embaixadadecristo.org", role: "Cell Assistant", church_id: "a1111111-1111-4111-8111-111111111101", cell_id: "2b3a5652-b8be-4c76-8b64-b84200c8bcd4", cell_group_id: "a62f461e-e574-4052-8ef3-a4d0ee0c77c4", assigned_cells: ["2b3a5652-b8be-4c76-8b64-b84200c8bcd4"], department_permissions: ["cellReports"], permissions: ["cell_reports.view_own", "cell_reports.create_own", "cell_reports.edit_own_until_validated", "cell_portal.view", "cell_portal.edit", "cell_portal.view_members", "cell_portal.view_member_profile", "cell_portal.submit_report", "cell_portal.view_finance_summary", "cell_portal.view_partnership_summary", "cell_portal.view_soul_winning", "cell_portal.view_programs", "cell_portal.view_charts", "cell_portal.export_summary"], can_view_all_churches: false },`;

if (!code.includes("d.v.lider@embaixadadecristo.org")) {
  code = code.replace(
    /\{ id: "u-7", name: "Cell Leader Demo"/m,
    newUsersCode + '\n    { id: "u-7", name: "Cell Leader Demo"'
  );
}

// 2. Add leaders to seedData.cellLeadership.leaders
const newLeadersCode = `      { id: "leader-dv-1", user_id: "u-dv-leader", staff_id: null, role_type: "Leader", cell_id: "2b3a5652-b8be-4c76-8b64-b84200c8bcd4", cell_group_id: "a62f461e-e574-4052-8ef3-a4d0ee0c77c4", church_id: "a1111111-1111-4111-8111-111111111101", created_by: "Sister Angelica", updated_by: "Pastora Flavia", created_at: "2026-08-31", updated_at: "2026-08-31", status: "Activo", nome_completo: "Líder Diplomatas Victory", email: "d.v.lider@embaixadadecristo.org", contacto: "+258840000001", titulo: "Líder", igreja: "a1111111-1111-4111-8111-111111111101", celula: "Diplomatas Victory", e_lider_actual: true, veio_do_alec: true, alec_concluido: true, faixa_certificado_pago: true, estado: "Activo", supervisor: "Pastora Flavia", observacoes: "Líder da célula Diplomatas Victory com acesso ao Portal por Célula." },
      { id: "leader-dv-assistant-1", user_id: "u-dv-assistant", staff_id: null, role_type: "Assistant", cell_id: "2b3a5652-b8be-4c76-8b64-b84200c8bcd4", cell_group_id: "a62f461e-e574-4052-8ef3-a4d0ee0c77c4", church_id: "a1111111-1111-4111-8111-111111111101", created_by: "Pastora Flavia", updated_by: "Pastora Flavia", created_at: "2026-08-31", updated_at: "2026-08-31", status: "Activo", nome_completo: "Assistente Diplomatas Victory", email: "d.v.assistente@embaixadadecristo.org", contacto: "+258840000002", titulo: "Assistente", igreja: "a1111111-1111-4111-8111-111111111101", celula: "Diplomatas Victory", e_lider_actual: false, veio_do_alec: true, alec_concluido: true, faixa_certificado_pago: false, estado: "Activo", supervisor: "Pastora Flavia", observacoes: "Assistente da célula Diplomatas Victory com acesso ao Portal por Célula." },`;

if (!code.includes("leader-dv-1")) {
  code = code.replace(
    /\{ id: "leader-1", user_id: "u-7"/m,
    newLeadersCode + '\n      { id: "leader-1", user_id: "u-7"'
  );
}

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully added Diplomatas Victory users to dashboard.js!");
