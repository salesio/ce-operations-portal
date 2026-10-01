/**
 * Global Summary Card navigation — tab switching, filters, modals.
 */
(function () {
  "use strict";

  function t(key, fallback) {
    return typeof L === "function" ? L(key) : fallback;
  }

  function safeJsonParse(value, fallback = {}) {
    if (!value) return fallback;
    try {
      return JSON.parse(decodeURIComponent(value));
    } catch {
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    }
  }

  function buildOptions(module, config = {}) {
    const hasAction = Boolean(
      config.targetTab || config.route || config.modalType || config.scrollTo ||
      (config.filterPayload && Object.keys(config.filterPayload).length)
    );
    const isClickable = config.isClickable !== false && config.disabled !== true && hasAction;
    const label = config.label || "";
    return {
      isClickable,
      clickable: isClickable,
      disabled: Boolean(config.disabled),
      module: module || "",
      targetTab: config.targetTab || "",
      route: config.route || "",
      modalType: config.modalType || "",
      scrollTo: config.scrollTo || "",
      filterPayload: config.filterPayload || null,
      tooltip: config.tooltip || label,
      ariaLabel: config.ariaLabel || label,
      hint: config.hint ?? (isClickable ? t("clickToView", "Click to view") : "")
    };
  }

  function getFilterStore(module) {
    const stores = {
      staffHr: () => window.staffHrPageState,
      finance: () => window.financePageState,
      partnership: () => window.partnershipPageState,
      churches: () => window.churchPageState,
      foundation: () => window.foundationPageState,
      firstTimers: () => window.firstTimersPageState,
      followUp: () => window.followUpPageState,
      members: () => window.modulePageState?.members,
      counseling: () => window.counselingPageState,
      fevo: () => window.fevoPageState,
      requisitions: () => window.requisitionsPageState,
      venue: () => window.venuePageState,
      venueInventory: () => window.venuePageState,
      sacraments: () => window.sacramentsPageState,
      media: () => window.mediaPageState,
      alec: () => window.alecRegistrationFilterState,
      attendance: () => window.attendancePageState,
      programs: () => window.programsPageState,
      prisonMinistry: () => window.prisonMinistryPageState,
      ministryMaterials: () => window.ministryMaterialsPageState,
      reports: () => window.reportsPageState
    };
    return stores[module]?.() || null;
  }

  function clearModuleFilters(module) {
    const store = getFilterStore(module);
    if (!store) return;
    if (module === "staffHr") {
      store.cardFilters = { staff: {}, salaries: {}, performance: {}, equipment: {} };
      store.birthdayFilters = { month: "", churchId: "", department: "", status: "", search: "" };
      return;
    }
    if (module === "finance") {
      Object.keys(store.reportFilters || {}).forEach((key) => { store.reportFilters[key] = ""; });
      Object.keys(store.approvedReqFilters || {}).forEach((key) => { store.approvedReqFilters[key] = ""; });
      Object.keys(store.requisitionReportFilters || {}).forEach((key) => { store.requisitionReportFilters[key] = ""; });
      store.approvedReqFilters.period = "month";
      store.requisitionReportFilters.period = "month";
      store.sourceFilter = "";
      return;
    }
    if (module === "churches") {
      store.filters = { search: "", province: "", city: "", type: "", status: "", information_status: "" };
      return;
    }
    if (module === "foundation") {
      store.panel = "";
      store.filter = {};
      return;
    }
    if (module === "firstTimers" || module === "followUp") {
      store.filter = {};
      return;
    }
    if (module === "members") {
      store.filter = {};
      store.page = 1;
      store.loaded = false;
      if (typeof window.loadMembersPage === "function") void window.loadMembersPage({ force: true });
      return;
    }
    if (module === "counseling") {
      store.tab = "overview";
      store.filter = {};
      return;
    }
    if (module === "fevo") {
      store.filter = {};
      return;
    }
    if (module === "requisitions") {
      store.cardFilter = {};
      Object.keys(store.reportFilters || {}).forEach((key) => { store.reportFilters[key] = ""; });
      store.reportFilters.period = "month";
      return;
    }
    if (module === "venue") {
      store.filter = {};
      return;
    }
    if (module === "sacraments") {
      store.panel = "";
      store.filter = {};
    }
    if (module === "media") {
      store.tab = "overview";
      store.filter = {};
      return;
    }
    if (module === "alec") {
      window.alecRegistrationFilterState = {};
      return;
    }
    if (module === "attendance") {
      store.dailyFilter = "all";
      store.searchQuery = "";
      store.selectedDepartment = "all";
      store.cardFilters = {};
      return;
    }
    if (module === "programs" || module === "prisonMinistry" || module === "ministryMaterials") {
      store.filter = {};
      return;
    }
    if (module === "reports") {
      store.domain = "";
      if (window.domainReportFilters) {
        Object.keys(window.domainReportFilters).forEach((key) => {
          window.domainReportFilters[key] = { period: "month", dateFrom: "", dateTo: "", churchId: "", department: "", status: "", card_filter: "", search: "" };
        });
      }
    }
  }

  function formatFilterChip(module, key, value) {
    const labels = {
      status: t("status", "Status"),
      employment_type: t("staffEmploymentType", "Employment Type"),
      payment_status: t("status", "Status"),
      has_salary: t("staffWithSalary", "Salary"),
      hasChurch: t("membersByChurch", "By Church"),
      pending_eval: t("staffPendingEval", "Pending Evaluations"),
      assigned: t("staffAssignedEq", "Assigned Equipment"),
      birthday_month: t("staffFilterBirthdayMonth", "Birthday Month"),
      upcoming: t("staffUpcomingBirthdays", "Upcoming"),
      period: t("thisMonth", "This month"),
      date: t("date", "Date"),
      source: t("sourceType", "Source"),
      information_status: t("informationStatus", "Information Status"),
      type: t("Type", "Type"),
      province: t("Province", "Province"),
      graduated: t("graduations", "Graduated"),
      certificate_issued: t("certificates", "Certificates"),
      followup: t("followupState", "Follow-up"),
      quer_escola_de_fundacao: t("wantFoundation", "Foundation School"),
      fez_escola_de_fundacao: t("didFoundationSchool", "Escola de Fundação"),
      e_lider: t("alreadyLeaders", "Já Líderes"),
      terminou: t("alecCompleted", "Concluídos"),
      estado: t("estado", "Status"),
      estado_do_seguimento: t("followupState", "Follow-up"),
      souls_contacted: t("soulsContacted", "Souls Contacted"),
      estado_filter: t("estado", "Status"),
      inventory_status: t("status", "Status"),
      pending_value: t("reqPendingValue", "Pending Value"),
      card_filter: t("appliedFilter", "Filter"),
      finance_status: t("finFinanceStatus", "Finance Status"),
      requisition_type: t("reqType", "Requisition Type"),
      requisition_status: t("reqRequisitionStatus", "Requisition Status"),
      approved_by: t("finApprovedBy", "Approved by"),
      released_by: t("reqReleasedBy", "Released by"),
      requester: t("reqRequester", "Requester"),
      cell_assignment: t("cellAssignment", "Atribuição de Célula"),
      assigned_to_cell: t("assignedToCell", "Atribuído à Célula"),
      not_assigned_to_cell: t("notAssignedToCell", "Não Atribuído à Célula"),
      cell_received: t("cellReceived", "Recebido na Célula"),
      origin: t("origin", "Origem")
    };
    const label = labels[key] || key.replaceAll("_", " ");
    if (value === true || value === "true") return `${label}`;
    if (value === "assigned") return "Atribuídos à Célula";
    if (value === "not_assigned") return "Não Atribuídos à Célula";
    if (value === "received") return "Recebidos na Célula";
    return `${label} = ${value}`;
  }

  function collectActiveFilters(module) {
    const store = getFilterStore(module);
    if (!store && module !== "alec") return [];
    const chips = [];
    if (module === "staffHr") {
      Object.entries(store.cardFilters?.staff || {}).forEach(([k, v]) => { if (v) chips.push([k, v]); });
      Object.entries(store.cardFilters?.salaries || {}).forEach(([k, v]) => { if (v) chips.push([k, v]); });
      Object.entries(store.cardFilters?.performance || {}).forEach(([k, v]) => { if (v) chips.push([k, v]); });
      Object.entries(store.cardFilters?.equipment || {}).forEach(([k, v]) => { if (v) chips.push([k, v]); });
      Object.entries(store.birthdayFilters || {}).forEach(([k, v]) => { if (v && k !== "search") chips.push([k === "month" ? "birthday_month" : k, v]); });
      if (store.birthdayFilters?.search) chips.push(["search", store.birthdayFilters.search]);
      if (store.birthdayFilters?.upcoming) chips.push(["upcoming", true]);
    } else if (module === "finance") {
      if (store.tab === "reports") {
        Object.entries(store.requisitionReportFilters || {}).forEach(([k, v]) => { if (v) chips.push([k, v]); });
      } else if (store.tab === "approvedRequisitions") {
        Object.entries(store.approvedReqFilters || {}).forEach(([k, v]) => { if (v) chips.push([k, v]); });
      } else {
        Object.entries(store.reportFilters || {}).forEach(([k, v]) => { if (v) chips.push([k, v]); });
      }
      if (store.sourceFilter) chips.push(["source", store.sourceFilter]);
    } else if (module === "churches") {
      Object.entries(store.filters || {}).forEach(([k, v]) => { if (v) chips.push([k, v]); });
    } else if (module === "alec") {
      Object.entries(window.alecRegistrationFilterState || {}).forEach(([k, v]) => { if (v !== "" && v != null) chips.push([k, v]); });
    } else if (module === "foundation" || module === "members" || module === "firstTimers" || module === "followUp" || module === "counseling" || module === "fevo" || module === "venue" || module === "sacraments" || module === "media" || module === "programs" || module === "prisonMinistry" || module === "ministryMaterials") {
      Object.entries(store.filter || {}).forEach(([k, v]) => { if (v !== "" && v != null) chips.push([k, v]); });
    } else if (module === "requisitions") {
      if (store.tab === "reports") {
        Object.entries(store.reportFilters || {}).forEach(([k, v]) => { if (v) chips.push([k, v]); });
      } else if (store.cardFilter) {
        Object.entries(store.cardFilter).forEach(([k, v]) => { if (v) chips.push([k, v]); });
      }
    } else if (module === "reports") {
      if (store.domain && window.domainReportFilters?.[store.domain]) {
        Object.entries(window.domainReportFilters[store.domain]).forEach(([k, v]) => { if (v) chips.push([k, v]); });
      }
    }
    return chips;
  }

  function renderFilterChips(module) {
    const chips = collectActiveFilters(module);
    if (!chips.length || typeof L !== "function") return "";
    return `
      <div class="summary-filter-chips light-surface" role="status" aria-live="polite">
        <span class="summary-filter-chips-label">${L("appliedFilter")}:</span>
        ${chips.map(([key, value]) => `<span class="summary-filter-chip">${formatFilterChip(module, key, value)}</span>`).join("")}
        <button type="button" class="btn btn-sm btn-outline-cyan summary-filter-clear" data-summary-clear-filters="${module}">${L("clearFilters")}</button>
      </div>`;
  }

  function scrollToPanel(id, attempt = 0) {
    if (!id) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(id) || document.querySelector(`[id="${id}"]`);
      if (!el) {
        if (attempt < 8) setTimeout(() => scrollToPanel(id, attempt + 1), 60);
        return;
      }
      const content = document.getElementById("content");
      if (content && content.contains(el)) {
        const stickyNav = content.querySelector(".module-nav-sticky");
        const offset = (stickyNav?.offsetHeight || 0) + 12;
        const top = el.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop - offset;
        content.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function rerenderModule(module, route) {
    if (module === "finance") {
      const store = window.financePageState;
      const tabToRoute = {
        overview: "financeOverviewRoute",
        entries: "financeEntriesRoute",
        public: "financePublicSubmissionsRoute",
        verification: "financeVerificationRoute",
        approvedRequisitions: "financeApprovedRequisitionsRoute",
        reports: "financeReportsRoute",
        partners: "financePartnersRoute",
        exports: "financeExportsRoute"
      };
      const targetRoute = route || (store?.tab ? tabToRoute[store.tab] : "financeOverviewRoute") || "finance";
      if (typeof setRoute === "function" && targetRoute) {
        setRoute(targetRoute);
      } else if (typeof renderFinance === "function") {
        renderFinance();
      }
      return;
    }
    if (module === "sacraments") {
      const store = window.sacramentsPageState;
      const targetRoute = route || (store?.panel === "panel-marriage" ? "sacramentsMarriagesRoute" : (store?.panel === "panel-baby" ? "sacramentsBabyDedicationsRoute" : "sacraments"));
      if (typeof setRoute === "function" && targetRoute) {
        setRoute(targetRoute);
      } else if (typeof renderSacraments === "function") {
        renderSacraments();
      }
      return;
    }
    const targetRoute = route || {
      staffHr: "staffHr",
      finance: "finance",
      churches: "churches",
      foundation: "foundation",
      firstTimers: "firstTimers",
      followUp: "followUp",
      counseling: "counseling",
      fevo: "fevo",
      requisitions: "requisitions",
      venue: window.venuePageState?.route || "venueInventory",
      members: "members",
      sacraments: "sacraments",
      media: "media",
      programs: "programs",
      prisonMinistry: "prisonMinistry",
      ministryMaterials: "ministryMaterials",
      reports: "reports"
    }[module];
    if (typeof setRoute === "function" && targetRoute) setRoute(targetRoute);
    else if (typeof renderStaffHr === "function" && module === "staffHr") renderStaffHr();
  }

  function applyStaffHr(payload) {
    const store = window.staffHrPageState;
    if (!store) return;
    if (!store.cardFilters) store.cardFilters = { staff: {}, salaries: {}, performance: {}, equipment: {} };
    const filters = payload.filterPayload || {};
    if (payload.targetTab) store.tab = payload.targetTab;
    if (payload.targetTab === "birthdays" || filters.birthday_month || filters.upcoming) {
      if (filters.birthday_month) store.birthdayFilters.month = filters.birthday_month;
      if (filters.upcoming) {
        store.birthdayFilters.month = "";
        store.birthdayFilters.upcoming = true;
      } else {
        delete store.birthdayFilters.upcoming;
      }
    }
    if (payload.targetTab === "staff") store.cardFilters.staff = { ...store.cardFilters.staff, ...filters };
    if (payload.targetTab === "salaries") store.cardFilters.salaries = { ...store.cardFilters.salaries, ...filters };
    if (payload.targetTab === "performance") store.cardFilters.performance = { ...store.cardFilters.performance, ...filters };
    if (payload.targetTab === "equipment") store.cardFilters.equipment = { ...store.cardFilters.equipment, ...filters };
    if (payload.modalType && typeof openStaffBirthdaysModal === "function") {
      openStaffBirthdaysModal(payload.modalType);
      return false;
    }
    return true;
  }

  function applyFinance(payload) {
    const store = window.financePageState;
    if (!store) return;
    const filters = payload.filterPayload || {};
    if (payload.targetTab) store.tab = payload.targetTab;

    // Reset old single-card filter state so click targets exact clicked data cleanly
    store.reportFilters = {
      period: "",
      dateFrom: "",
      dateTo: "",
      churchId: "",
      category: "",
      contributionType: "",
      partnershipArm: "",
      method: "",
      status: "",
      source: "",
      minValue: "",
      search: ""
    };
    store.sourceFilter = "";
    store.approvedReqFilters = {
      period: "month",
      department: "",
      status: "",
      churchId: "",
      finance_status: "",
      search: ""
    };

    if (filters.period) store.reportFilters.period = filters.period;
    if (filters.date) {
      store.reportFilters.dateFrom = filters.date;
      store.reportFilters.dateTo = filters.date;
    }
    if (filters.dateFrom) store.reportFilters.dateFrom = filters.dateFrom;
    if (filters.dateTo) store.reportFilters.dateTo = filters.dateTo;
    if (filters.status) store.reportFilters.status = filters.status;
    if (filters.source) {
      store.sourceFilter = filters.source;
      store.reportFilters.source = filters.source;
    }
    if (payload.targetTab === "public") {
      store.tab = "public";
      if (filters.source) store.sourceFilter = filters.source;
    }
    if (payload.targetTab === "verification") {
      store.tab = "verification";
    }
    if (payload.targetTab === "approvedRequisitions" || filters.finance_status) {
      store.tab = "approvedRequisitions";
      if (filters.finance_status) store.approvedReqFilters.finance_status = filters.finance_status;
      if (filters.period) store.approvedReqFilters.period = filters.period;
      Object.assign(store.approvedReqFilters, filters);
    }
    if (payload.targetTab === "reports" || filters.card_filter) {
      store.tab = payload.targetTab || "reports";
      store.requisitionReportFilters = store.requisitionReportFilters || {};
      if (filters.period) store.requisitionReportFilters.period = filters.period;
      Object.assign(store.requisitionReportFilters, filters);
    }
    return true;
  }

  function applyChurches(payload) {
    const store = window.churchPageState;
    if (!store) return;
    const filters = payload.filterPayload || {};
    if (!Object.keys(filters).length) store.filters = { search: "", province: "", city: "", type: "", status: "", information_status: "" };
    else Object.assign(store.filters, filters);
    return true;
  }

  function applyFoundation(payload) {
    const store = window.foundationPageState;
    if (!store) return;
    if (payload.tab) store.tab = payload.tab;
    if (payload.scrollTo) store.panel = payload.scrollTo;
    store.filter = { ...store.filter, ...(payload.filterPayload || {}) };
    if (payload.tab || payload.scrollTo) {
      rerenderModule("foundation");
      if (payload.scrollTo) scrollToPanel(payload.scrollTo);
      return false;
    }
    return true;
  }

  function applyFirstTimers(payload) {
    const store = window.firstTimersPageState;
    if (!store) return;
    // Summary cards represent one complete view. Replacing, instead of merging,
    // prevents a previous card (for example "Pending") from being combined with
    // a later, incompatible card filter (for example "Sent to Cell").
    store.filter = { ...(payload.filterPayload || {}) };
    return true;
  }

  function applyFollowUp(payload) {
    const store = window.followUpPageState;
    if (!store) return;
    store.filter = { ...(payload.filterPayload || {}) };
    return true;
  }

  function applyFevo(payload) {
    const store = window.fevoPageState;
    if (!store) return;
    store.filter = { ...store.filter, ...(payload.filterPayload || {}) };
    if (payload.route) {
      if (typeof setRoute === "function") setRoute(payload.route);
      return false;
    }
    return true;
  }

  function applyRequisitions(payload) {
    const store = window.requisitionsPageState;
    if (!store) return;
    const filters = payload.filterPayload || {};
    if (payload.targetTab) store.tab = payload.targetTab;
    if (payload.targetTab === "reports" || filters.card_filter) {
      store.tab = payload.targetTab || store.tab || "reports";
      store.reportFilters = { ...store.reportFilters, ...filters };
    }
    if (filters.status_group === "pending" && !payload.targetTab) store.tab = "received";
    store.cardFilter = { ...store.cardFilter, ...filters };
    return true;
  }

  function applyVenue(payload) {
    const store = window.venuePageState;
    if (!store) return;
    store.filter = { ...store.filter, ...(payload.filterPayload || {}) };
    if (payload.route) {
      store.route = payload.route;
      if (typeof setRoute === "function") setRoute(payload.route);
      return false;
    }
    return true;
  }

  function applyReports(payload) {
    const store = window.reportsPageState;
    if (!store) return;
    const filters = payload.filterPayload || {};
    if (filters.domain) {
      store.domain = filters.domain;
      if (window.domainReportFilters?.[filters.domain]) {
        Object.assign(window.domainReportFilters[filters.domain], filters);
      }
    }
    const targetRoute = payload.route || (filters.domain ? "reports" : "");
    if (targetRoute && typeof setRoute === "function") {
      setRoute(targetRoute);
      scrollToPanel(payload.scrollTo || (filters.domain ? `report-domain-${filters.domain}` : ""));
      return false;
    }
    return true;
  }

  function applyMembers(payload) {
    const store = window.modulePageState?.members;
    if (!store) return;
    store.filter = { ...(payload.filterPayload || {}) };
    store.page = 1;
    store.loaded = false;
    if (typeof window.loadMembersPage === "function") void window.loadMembersPage({ force: true });
    return true;
  }

  function applySacraments(payload) {
    const store = window.sacramentsPageState;
    if (!store) return;
    if (payload.scrollTo) store.panel = payload.scrollTo;
    store.filter = { ...store.filter, ...(payload.filterPayload || {}) };
    if (payload.scrollTo) {
      rerenderModule("sacraments");
      scrollToPanel(payload.scrollTo);
      return false;
    }
    return true;
  }

  function applyCounseling(payload) {
    const store = window.counselingPageState;
    if (!store) return;
    const filters = payload.filterPayload || {};
    if (payload.targetTab) store.tab = payload.targetTab;
    if (filters.tab) store.tab = filters.tab;
    store.filter = { ...store.filter, ...filters };
    return true;
  }

  function applyMedia(payload) {
    const store = window.mediaPageState;
    if (!store) return;
    const filters = payload.filterPayload || {};
    if (payload.targetTab) store.tab = payload.targetTab;
    if (filters.tab) store.tab = filters.tab;
    store.filter = { ...store.filter, ...filters };
    return true;
  }

  function applyDop(module, payload) {
    const store = getFilterStore(module);
    if (!store) return;
    store.filter = { ...(payload.filterPayload || {}) };
    const route = payload.route || {
      programs: "programs",
      prisonMinistry: "prisonMinistry",
      ministryMaterials: "ministryMaterials"
    }[module];
    if (typeof setRoute === "function" && route) {
      setRoute(route);
      if (payload.scrollTo) scrollToPanel(payload.scrollTo);
      return false;
    }
    return true;
  }

  function applyAlec(payload) {
    const filters = payload.filterPayload || {};
    const targetRoute = payload.route || "cellAlecRegistration";
    if (targetRoute === "cellAlecScores") {
      window.alecScoresPageState = window.alecScoresPageState || {};
      Object.assign(window.alecScoresPageState, filters);
    } else {
      window.alecRegistrationFilterState = window.alecRegistrationFilterState || {};
      Object.assign(window.alecRegistrationFilterState, filters);
    }
    if (typeof setRoute === "function" && targetRoute) {
      setRoute(targetRoute);
      if (payload.scrollTo) scrollToPanel(payload.scrollTo);
      return false;
    }
    return true;
  }

  function applyCell(payload) {
    const filters = payload.filterPayload || {};
    if (window.cellMinistryFilterState && payload.tab) {
      window.cellMinistryFilterState[payload.tab] = {
        ...(window.cellMinistryFilterState[payload.tab] || {}),
        ...filters
      };
    }
    const targetRoute = payload.route || (payload.tab ? payload.tab : "");
    if (targetRoute && typeof setRoute === "function") {
      setRoute(targetRoute);
      if (payload.scrollTo) scrollToPanel(payload.scrollTo);
      return false;
    }
    return true;
  }

  function applyNotifications(payload) {
    const filters = payload.filterPayload || {};
    if (filters.filter) {
      window.notificationPageFilter = filters.filter;
    }
    const targetRoute = payload.route || "notifications";
    if (typeof setRoute === "function" && targetRoute) {
      setRoute(targetRoute);
      if (payload.scrollTo) scrollToPanel(payload.scrollTo);
      return false;
    }
    if (typeof renderNotifications === "function") {
      renderNotifications();
      return false;
    }
    return true;
  }

  function applyPartnership(payload) {
    const store = window.partnershipPageState;
    const tabToRoute = {
      overview: "partnership",
      arms: "partnershipArmsRoute",
      partners: "partnershipPartnersRoute",
      contributions: "partnershipContributionsRoute",
      highlights: "partnershipHighlightsRoute",
      analytics: "partnershipAnalyticsRoute",
      reports: "partnershipReportsRoute",
      exports: "partnershipExportsRoute"
    };
    if (store && payload.targetTab) store.tab = payload.targetTab;
    if (store && payload.armId) store.armId = payload.armId;
    const targetRoute = payload.route || (payload.targetTab ? tabToRoute[payload.targetTab] : "partnership");
    if (typeof setRoute === "function" && targetRoute) {
      setRoute(targetRoute);
      if (payload.scrollTo) scrollToPanel(payload.scrollTo);
      return false;
    }
    return true;
  }

  function applyAttendance(payload = {}) {
    const store = window.attendancePageState;
    if (store) {
      if (payload.targetTab) store.tab = payload.targetTab;
      if (payload.filterPayload) {
        if (payload.filterPayload.dailyFilter) store.dailyFilter = payload.filterPayload.dailyFilter;
        if (payload.filterPayload.status) store.dailyFilter = payload.filterPayload.status;
        if (payload.filterPayload.date) store.selectedDate = payload.filterPayload.date;
        if (payload.filterPayload.department) store.selectedDepartment = payload.filterPayload.department;
      }
    }
    if (typeof setRoute === "function" && payload.route) {
      setRoute(payload.route);
      return false;
    }
    if (typeof renderAttendance === "function") {
      renderAttendance(store?.tab || "daily");
      return false;
    }
    return true;
  }

  function applyAction(module, payload = {}) {
    const handlers = {
      staffHr: applyStaffHr,
      attendance: applyAttendance,
      finance: applyFinance,
      partnership: applyPartnership,
      churches: applyChurches,
      foundation: applyFoundation,
      firstTimers: applyFirstTimers,
      followUp: applyFollowUp,
      counseling: applyCounseling,
      fevo: applyFevo,
      requisitions: applyRequisitions,
      venue: applyVenue,
      venueInventory: applyVenue,
      sacraments: applySacraments,
      media: applyMedia,
      alec: applyAlec,
      cell: applyCell,
      cellMinistry: applyCell,
      cellMinistryOverview: applyCell,
      cellReports: applyCell,
      notifications: applyNotifications,
      programs: (payload) => applyDop("programs", payload),
      prisonMinistry: (payload) => applyDop("prisonMinistry", payload),
      ministryMaterials: (payload) => applyDop("ministryMaterials", payload),
      members: applyMembers,
      reports: applyReports
    };
    const handler = handlers[module];
    if (!handler) return;
    const shouldRerender = handler(payload);
    if (shouldRerender === false) return;
    if (payload.route && typeof setRoute === "function") {
      setRoute(payload.route);
      if (payload.scrollTo) scrollToPanel(payload.scrollTo);
      return;
    }
    rerenderModule(module, payload.route);
    if (payload.scrollTo) scrollToPanel(payload.scrollTo);
  }

  function handleCardClick(el) {
    if (!el || el.dataset.summaryDisabled === "true") return;
    const module = el.dataset.summaryModule;
    if (!module) return;
    const payload = {
      targetTab: el.dataset.summaryTargetTab || "",
      route: el.dataset.summaryRoute || "",
      modalType: el.dataset.summaryModal || "",
      scrollTo: el.dataset.summaryScroll || "",
      filterPayload: safeJsonParse(el.dataset.summaryFilters)
    };
    applyAction(module, payload);
  }

  function initGlobalHandlers() {
    document.addEventListener("click", (event) => {
      const card = event.target.closest("[data-summary-card]");
      if (card) {
        event.preventDefault();
        handleCardClick(card);
        return;
      }
      const clearBtn = event.target.closest("[data-summary-clear-filters]");
      if (clearBtn) {
        clearModuleFilters(clearBtn.dataset.summaryClearFilters);
        rerenderModule(clearBtn.dataset.summaryClearFilters);
      }
    });
    document.addEventListener("keydown", (event) => {
      const card = event.target.closest("[data-summary-card]");
      if (!card || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      handleCardClick(card);
    });
  }

  window.CESummaryCardNav = {
    buildOptions,
    applyAction,
    clearModuleFilters,
    renderFilterChips,
    collectActiveFilters,
    handleCardClick,
    initGlobalHandlers
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGlobalHandlers);
  } else {
    initGlobalHandlers();
  }
})();
