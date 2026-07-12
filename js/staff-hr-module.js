/**
 * Staff & Recursos Humanos — helpers (frontend-first).
 */
(function () {
  "use strict";

  const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Voluntário", "Contratado", "Prestação de Serviço"];
  const PAYMENT_FREQUENCIES = ["Mensal", "Semanal", "Por Serviço", "Nenhum"];
  const PAYMENT_METHODS = ["M-Pesa", "E-Mola", "Banco", "Dinheiro"];
  const STAFF_STATUSES = ["Activo", "Inactivo", "Suspenso", "Transferido"];
  const ATTENDANCE_STATUSES = ["Presente", "Ausente", "Atrasado", "Justificado", "Licença"];
  const PAYMENT_STATUSES = ["Pendente", "Aprovado", "Pago", "Retido"];
  const DOCUMENT_TYPES = ["BI", "Contrato", "Carta", "Certificado", "Outro"];

  function accessApi() {
    return window.CEAccessControl || null;
  }

  function resolveAccess(user) {
    const lib = accessApi();
    return lib?.resolveModuleAccess?.(user, "staffHr") || { can_view: false };
  }

  function canViewSalary(user) {
    const lib = accessApi();
    return lib?.canViewSalary?.(user) || false;
  }

  function scopeFilterStaff(list, user, access) {
    if (!Array.isArray(list)) return [];
    const scope = access.scope || "own";
    if (scope === "all") return list;
    if (scope === "church") return list.filter((s) => s.church_id === user.church_id);
    if (scope === "department") {
      const dept = user.assigned_department || "";
      return list.filter((s) => s.department_name === dept || s.church_id === user.church_id);
    }
    return list.filter((s) => s.user_id === user.id || s.email === user.email || s.full_name === user.assigned_staff_name);
  }

  function getStaffEquipment(staff, venueInventory) {
    const equipment = venueInventory?.staffEquipment || [];
    const name = String(staff?.full_name || "").trim().toLowerCase();
    return equipment.filter((eq) => String(eq.nome_do_funcionario || "").trim().toLowerCase() === name);
  }

  function birthdaysThisMonth(list) {
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    return list.filter((s) => {
      const dob = s.date_of_birth || s.data_de_aniversario || "";
      return dob && dob.slice(5, 7) === month;
    });
  }

  function computeStats(list, salaries, performance, equipment) {
    const active = list.filter((s) => s.status === "Activo").length;
    const volunteers = list.filter((s) => s.employment_type === "Voluntário").length;
    const withPay = list.filter((s) => Number(s.salary_or_allowance || 0) > 0).length;
    const pendingEval = (performance || []).filter((p) => !p.evaluated_at).length;
    const pendingPay = (salaries || []).filter((s) => s.payment_status === "Pendente").length;
    const assignedEq = (equipment || []).filter((e) => e.status === "Activo").length;
    const birthdays = birthdaysThisMonth(list).length;
    return {
      total: list.length,
      active,
      volunteers,
      withPay,
      pendingEval,
      pendingPay,
      assignedEq,
      birthdays
    };
  }

  function maskSalary(value, user) {
    if (canViewSalary(user)) return value;
    return "•••••";
  }

  function filterSalaries(salaries, staffList, user) {
    const access = resolveAccess(user);
    const scopedStaff = scopeFilterStaff(staffList, user, access);
    const ids = new Set(scopedStaff.map((s) => s.id));
    return (salaries || []).filter((s) => ids.has(s.staff_id));
  }

  window.CEStaffHr = {
    EMPLOYMENT_TYPES,
    PAYMENT_FREQUENCIES,
    PAYMENT_METHODS,
    STAFF_STATUSES,
    ATTENDANCE_STATUSES,
    PAYMENT_STATUSES,
    DOCUMENT_TYPES,
    resolveAccess,
    canViewSalary,
    scopeFilterStaff,
    getStaffEquipment,
    birthdaysThisMonth,
    computeStats,
    maskSalary,
    filterSalaries
  };
})();