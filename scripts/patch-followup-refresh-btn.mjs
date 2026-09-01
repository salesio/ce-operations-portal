import fs from "node:fs";

let dashCode = fs.readFileSync("js/dashboard.js", "utf8");
dashCode = dashCode.replace(/\r\n/g, "\n");

// 1. Add top actions with "Actualizar Acompanhamento" button to renderFollowUp
const oldArticle = `    <article id="follow-up-results" class="panel glass-panel">
      \${filterBar({`;

const newArticle = `    <article id="follow-up-results" class="panel glass-panel">
      <div class="d-flex gap-2 flex-wrap mb-3 align-items-center justify-content-between">
        <div class="d-flex gap-2 flex-wrap align-items-center">
          <button class="btn btn-ce-gold btn-touch shadow-sm" type="button" data-followup-refresh title="Actualizar e sincronizar todos os contactos de acompanhamento com o Supabase">
            <i class="bi bi-arrow-clockwise me-1"></i>Actualizar Acompanhamento
          </button>
          <button class="btn btn-outline-cyan btn-touch" type="button" data-first-timer-new-entry title="Registar novo visitante/primeira vez">
            <i class="bi bi-person-plus me-1"></i>Novo Registo de Visitante
          </button>
        </div>
        <span class="small text-secondary align-self-center"><i class="bi bi-shield-check text-success me-1"></i>Sincronizado ao vivo com o Supabase</span>
      </div>
      \${filterBar({`;

if (dashCode.includes(oldArticle)) {
  dashCode = dashCode.replace(oldArticle, newArticle);
  console.log("Added Actualizar Acompanhamento button to renderFollowUp in dashboard.js");
} else {
  console.warn("oldArticle not found!");
}

// 2. Add click handler for data-followup-refresh
const oldHandlerTarget = `  if (event.target.closest("[data-first-timer-new-entry]")) {
    return openForm("firstTimer");
  }`;

const newHandlerTarget = `  if (event.target.closest("[data-followup-refresh]")) {
    const btn = event.target.closest("[data-followup-refresh]");
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>A sincronizar...';
    Promise.all([
      typeof hydrateFirstTimersFromRepository === "function" ? hydrateFirstTimersFromRepository() : Promise.resolve(),
      typeof hydrateFollowUpsFromRepository === "function" ? hydrateFollowUpsFromRepository() : Promise.resolve()
    ]).then(() => {
      state.firstTimersHydrated = true;
      if (typeof showToast === "function") showToast("Acompanhamento actualizado com sucesso!");
      renderFollowUp();
    }).catch((err) => {
      console.error("Error refreshing follow-up:", err);
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    });
    return;
  }
  if (event.target.closest("[data-first-timer-new-entry]")) {
    return openForm("firstTimer");
  }`;

if (dashCode.includes(oldHandlerTarget)) {
  dashCode = dashCode.replace(oldHandlerTarget, newHandlerTarget);
  console.log("Added data-followup-refresh handler in dashboard.js");
} else {
  console.warn("oldHandlerTarget not found!");
}

fs.writeFileSync("js/dashboard.js", dashCode, "utf8");
console.log("Patched dashboard.js successfully!");
