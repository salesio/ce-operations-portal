/**
 * WhatsApp Hub & Portal Announcements Module — Christ Embassy Mozambique Operations
 * Centralizes WhatsApp integration synced with Notifications Center, 
 * Service Schedules sharing, and Portal Posts/Announcements with Church WhatsApp Group integration.
 */
(function () {
  "use strict";

  const STORAGE_KEY_POSTS = "ce-data-layer:portal-posts";
  const DEFAULT_ADMIN_WHATSAPP_PHONE = "+258845942760";
  const DEFAULT_GATEWAY_SENDER_PHONE = "+258864232917";

  const whatsappHubState = {
    search: "",
    category: "all",
    churchId: "all"
  };

  function escapeHtml(str) {
    if (typeof window.escapeHtml === "function") return window.escapeHtml(str);
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(str) {
    if (typeof window.escapeAttr === "function") return window.escapeAttr(str);
    return escapeHtml(str);
  }

  function getLang() {
    try {
      if (typeof window !== "undefined") {
        if (typeof window.getLang === "function") return window.getLang();
        if (window.lang) return window.lang;
      }
    } catch (_) {}
    return "pt";
  }

  function cleanPhone(raw) {
    if (!raw) return "";
    let p = String(raw).replace(/\D/g, "");
    if (!p) return "";
    if (p.startsWith("258")) return p;
    if (
      p.length === 9 &&
      (p.startsWith("84") ||
        p.startsWith("82") ||
        p.startsWith("87") ||
        p.startsWith("86") ||
        p.startsWith("85") ||
        p.startsWith("83"))
    ) {
      return `258${p}`;
    }
    return p;
  }

  function buildWhatsAppUrl(phone, text) {
    const cleaned = cleanPhone(phone);
    const enc = encodeURIComponent(text || "");
    if (cleaned) {
      return `https://wa.me/${cleaned}?text=${enc}`;
    }
    return `https://api.whatsapp.com/send?text=${enc}`;
  }

  function buildWhatsAppGroupUrl(groupLink, text) {
    const enc = encodeURIComponent(text || "");
    if (groupLink && (groupLink.includes("chat.whatsapp.com") || groupLink.startsWith("http"))) {
      return groupLink;
    }
    return `https://api.whatsapp.com/send?text=${enc}`;
  }

  function getSupabaseClient() {
    return (
      (typeof window !== "undefined" &&
        (window.CESupabase?.getRawClient?.() ||
          window.CESupabase?.getSupabaseFoundationClient?.() ||
          window.CESupabase?.getSupabaseClient?.() ||
          window.CESupabase?.client ||
          window.CESupabase ||
          window.supabaseClient ||
          window.supabase)) ||
      null
    );
  }

  // --- Seed initial portal posts if storage is empty ---
  function getSeedPosts() {
    const isPt = getLang() === "pt";
    return [
      {
        id: "post-seed-1",
        title: isPt ? "Culto de Domingo & Ceia do Senhor" : "Sunday Service & Lord's Supper",
        category: "Programação de Culto",
        church_id: "a1111111-1111-4111-8111-111111111101",
        church_name: "E.C. Maputo Central - Sede",
        author_name: "Pastor Kene Ume",
        author_role: "Main Pastor / Group Pastor",
        content: isPt
          ? "A paz de Deus a toda a congregação! Neste domingo teremos o nosso Culto de Celebração e a Santa Ceia do Senhor às 08:30 e 10:30. Venha com a sua família e convide alguém novo!"
          : "Grace and peace to all! This Sunday we will have our Celebration Service and the Lord's Supper at 08:30 and 10:30. Come with your family and invite someone new!",
        created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        is_pinned: true,
        priority: "normal"
      },
      {
        id: "post-seed-2",
        title: isPt ? "Início do Novo Trimestre da Escola de Fundação" : "Foundation School New Quarter",
        category: "Comunicado Oficial",
        church_id: "all",
        church_name: isPt ? "Todas as Igrejas" : "All Churches",
        author_name: "Gabinete Pastoral",
        author_role: "Administração Nacional",
        content: isPt
          ? "Informamos a todos os líderes de célula e coordenadores que as inscrições para o novo ciclo da Escola de Fundação estão abertas no Portal. Certifiquem-se de registar todos os novos convertidos."
          : "We inform all cell leaders and coordinators that registrations for the new Foundation School cycle are now open on the Portal.",
        created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
        is_pinned: false,
        priority: "high"
      }
    ];
  }

  function getPortalPosts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_POSTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    const seeds = getSeedPosts();
    try {
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(seeds));
    } catch (_) {}
    return seeds;
  }

  function savePortalPosts(posts) {
    try {
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
    } catch (_) {}
  }

  // --- Formatters for WhatsApp ---

  function formatNotificationForWhatsApp(notification) {
    const isPt = getLang() === "pt";
    const title = notification.title || (isPt ? "Notificação Oficial" : "Official Notification");
    const msg = notification.message || "";
    const mod = notification.module ? `_${notification.module.toUpperCase()}_` : "";
    const priority = notification.priority === "urgent" ? "🚨 *URGENTE*" : notification.priority === "high" ? "⚡ *ALTA PRIORIDADE*" : "📌 *INFORMAÇÃO*";

    let text = `👑 *CHRIST EMBASSY MOZAMBIQUE*\n`;
    text += `🔔 *NOTIFICAÇÕES DO PORTAL DE OPERAÇÕES*\n`;
    text += `----------------------------------------\n`;
    text += `${priority}\n`;
    text += `*Assunto:* ${title}\n`;
    if (mod) text += `*Módulo:* ${mod}\n`;
    text += `\n${msg}\n`;

    if (notification.action_url) {
      text += `\n🔗 *Aceder ao Portal:* https://portal.embaixadadecristo.org/#${notification.action_url}\n`;
    } else {
      text += `\n🔗 *Portal:* https://portal.embaixadadecristo.org\n`;
    }
    text += `\n_Enviado via CE Portal Mozambique Operations_`;
    return text;
  }

  function formatServiceScheduleForWhatsApp(church) {
    const isPt = getLang() === "pt";
    const name = church.church_name || (isPt ? "Igreja Local" : "Local Church");
    const pastor = church.pastor_in_charge || (isPt ? "Pastor Responsável" : "Pastor in Charge");
    const address = [church.address, church.city, church.province].filter(Boolean).join(", ");
    const phone = church.phone_primary || church.phone || church.telefone || "";

    let serviceTimesText = "";
    if (Array.isArray(church.service_times) && church.service_times.length > 0) {
      serviceTimesText = church.service_times
        .map((s) => `  • *${s.day_of_week || s.day}:* ${s.start_time || s.time || ""} - ${s.service_name || s.name || (isPt ? "Culto Geral" : "General Service")}`)
        .join("\n");
    } else {
      serviceTimesText = isPt
        ? `  • *Domingo:* 08:30 - Culto de Celebração\n  • *Quarta-feira:* 17:30 - Culto de Ensino da Palavra`
        : `  • *Sunday:* 08:30 - Celebration Service\n  • *Wednesday:* 17:30 - Midweek Service`;
    }

    let text = `🏛️ *CHRIST EMBASSY MOZAMBIQUE*\n`;
    text += `📖 *PROGRAMAÇÃO OFICIAL DE CULTOS*\n`;
    text += `📍 *${name.toUpperCase()}*\n`;
    text += `----------------------------------------\n`;
    text += `👤 *Pastor Titular:* ${pastor}\n`;
    if (address) text += `📌 *Endereço:* ${address}\n`;
    if (phone) text += `📞 *Contacto:* ${phone}\n`;
    text += `\n⏰ *HORÁRIOS DOS CULTOS:*\n${serviceTimesText}\n\n`;
    text += `_“Não deixando a nossa congregação, como é costume de alguns...” (Hb 10:25)_\n\n`;
    text += `Venha receber uma palavra fresca da parte de Deus e transformar a sua vida!\n`;
    text += `Portal: https://portal.embaixadadecristo.org`;
    return text;
  }

  function formatPortalPostForWhatsApp(post) {
    const isPt = getLang() === "pt";
    const category = post.category || (isPt ? "Comunicado Oficial" : "Official Notice");
    const churchLabel = post.church_name ? `📍 *Igreja:* ${post.church_name}\n` : "";
    const author = post.author_name ? `✍️ *Por:* ${post.author_name} (${post.author_role || "Líder"})\n` : "";

    let icon = "📢";
    if (category.includes("Culto")) icon = "⛪";
    if (category.includes("Urgente")) icon = "🚨";
    if (category.includes("Pastoral")) icon = "🕊️";
    if (category.includes("Evento")) icon = "🗓️";

    let text = `${icon} *CHRIST EMBASSY MOZAMBIQUE*\n`;
    text += `*${category.toUpperCase()}*\n`;
    text += `----------------------------------------\n`;
    text += `📌 *${post.title}*\n`;
    if (churchLabel) text += churchLabel;
    if (author) text += author;
    text += `\n${post.content}\n\n`;
    if (post.whatsapp_group_link) {
      text += `💬 *Grupo WhatsApp:* ${post.whatsapp_group_link}\n`;
    }
    text += `🔗 *Ver no Portal:* https://portal.embaixadadecristo.org/#portalPosts\n`;
    text += `_Publicado em ${new Date(post.created_at || Date.now()).toLocaleDateString("pt-MZ")}_`;
    return text;
  }

  // --- Recipient Resolution ---

  function resolveContactsForTarget(targetType, targetId) {
    const list = [];
    const st = window.state || {};
    const users = st.users || [];
    const members = st.members || [];
    const churches = st.churches || [];

    // Find church if targetId is church
    let matchedChurch = null;
    if (targetType === "church" || targetId) {
      matchedChurch = churches.find(
        (c) => String(c.id) === String(targetId) || String(c.church_id) === String(targetId)
      );
    }

    // 0. Always include Admin Principal WhatsApp at the top
    const adminCfg = getAdminWhatsAppConfig();
    const adminPhone = adminCfg.phone || DEFAULT_ADMIN_WHATSAPP_PHONE;
    list.push({
      name: "Salésio Machava (Admin Principal)",
      role: "Super Admin",
      phone: adminPhone,
      church: "Administração Nacional",
      isAdminSelf: true
    });

    // 1. Church WhatsApp Group option
    if (matchedChurch) {
      const groupLink = matchedChurch.whatsapp_group_link || matchedChurch.whatsapp || "";
      list.push({
        name: `Grupo WhatsApp: ${matchedChurch.church_name}`,
        role: "Grupo Oficial da Igreja",
        phone: "",
        groupLink: groupLink,
        isGroup: true,
        church: matchedChurch.church_name
      });

      // Church pastor
      if (matchedChurch.pastor_in_charge) {
        const pastorUser = users.find(
          (u) =>
            (u.name && u.name.toLowerCase().includes(matchedChurch.pastor_in_charge.toLowerCase())) ||
            (u.full_name && u.full_name.toLowerCase().includes(matchedChurch.pastor_in_charge.toLowerCase()))
        );
        const pastorPhone = pastorUser?.phone || pastorUser?.telefone || matchedChurch.phone_primary || matchedChurch.phone;
        list.push({
          name: matchedChurch.pastor_in_charge,
          role: "Pastor Titular da Igreja",
          phone: pastorPhone || "",
          church: matchedChurch.church_name
        });
      }
    }

    // 2. Add Leaders from Users / Members
    users.forEach((u) => {
      const phone = u.phone || u.telefone || u.whatsapp;
      if (phone && cleanPhone(phone) !== cleanPhone(adminPhone)) {
        list.push({
          name: u.name || u.full_name || "Líder",
          role: u.role || "Líder",
          phone: String(phone).trim(),
          church: u.church_name || ""
        });
      }
    });

    // Fallback standard leaders if empty
    if (list.length <= 2) {
      list.push(
        { name: "Pastor Kene Ume (Gabinete Pastoral)", role: "Main Pastor", phone: "+258840001000", church: "Maputo HQ" },
        { name: "Pastor Valdemiro Machava", role: "Church Pastor", phone: "+258840001003", church: "E.C. Maxaquene" },
        { name: "Pastora Clarissa Ume", role: "Church Pastor", phone: "+258840001002", church: "E.C. Matola" },
        { name: "Pastora Reina Ume", role: "Church Pastor", phone: "+258840001006", church: "E.C. Choupal" }
      );
    }

    return list;
  }

  // --- WhatsApp Dispatch Modal ---

  function ensureWhatsAppDispatchModal() {
    let modal = document.getElementById("ceWhatsAppDispatchModal");
    if (modal) return modal;

    const div = document.createElement("div");
    div.id = "ceWhatsAppDispatchModal";
    div.className = "modal fade";
    div.tabIndex = -1;
    div.setAttribute("aria-hidden", "true");
    div.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content" style="background: #0d1527; border: 1px solid rgba(37, 211, 102, 0.4); box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85); color: #f8fafc; border-radius: 14px;">
          <div class="modal-header" style="border-bottom: 1px solid rgba(255, 255, 255, 0.1); background: rgba(37, 211, 102, 0.08);">
            <div class="d-flex align-items-center gap-2">
              <span class="d-inline-flex align-items-center justify-content-center" style="width: 36px; height: 36px; border-radius: 50%; background: #25D366; color: #ffffff; font-size: 1.25rem;">
                <i class="bi bi-whatsapp"></i>
              </span>
              <div>
                <h5 class="modal-title mb-0" id="ceWhatsAppDispatchTitle" style="font-weight: 700; color: #ffffff;">Partilhar no WhatsApp</h5>
                <small class="text-secondary" id="ceWhatsAppDispatchSubtitle">Sincronizado com os Grupos e Liderança da Igreja</small>
              </div>
            </div>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body p-4">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label text-warning small fw-bold text-uppercase"><i class="bi bi-people-fill me-1"></i> Seleccionar Destinatário / Grupo da Igreja</label>
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-secondary"><i class="bi bi-person-check"></i></span>
                  <select id="ceWhatsAppRecipientSelect" class="form-select bg-dark text-light border-secondary">
                    <!-- Populated dynamically -->
                  </select>
                </div>
              </div>
              <div class="col-12" id="ceWhatsAppCustomPhoneRow">
                <label class="form-label text-secondary small fw-bold">Número de Telefone / WhatsApp (Moçambique +258)</label>
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-success"><i class="bi bi-telephone"></i></span>
                  <input type="tel" id="ceWhatsAppCustomPhone" class="form-control bg-dark text-light border-secondary" placeholder="84... / 82... / 87... / 86..." />
                </div>
                <div class="form-text text-secondary" style="font-size: 0.78rem;">Pode deixar em branco se for partilhar para o Grupo da Igreja ou escolher da lista.</div>
              </div>
              <div class="col-12">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="form-label text-warning small fw-bold text-uppercase mb-0"><i class="bi bi-chat-text-fill me-1"></i> Mensagem Formatada para WhatsApp</label>
                  <button type="button" class="btn btn-sm btn-outline-secondary py-0" id="ceWhatsAppCopyBtn" style="font-size: 0.75rem;">
                    <i class="bi bi-clipboard me-1"></i> Copiar Texto
                  </button>
                </div>
                <textarea id="ceWhatsAppMessageText" class="form-control bg-dark text-light border-secondary" rows="8" style="font-family: monospace; font-size: 0.88rem; line-height: 1.45;"></textarea>
              </div>
              <div class="col-12" id="ceWhatsAppPdfOptionRow">
                <div class="p-3 rounded border border-secondary border-opacity-25 d-flex justify-content-between align-items-center flex-wrap gap-2" style="background: rgba(15, 23, 42, 0.65);">
                  <div class="d-flex align-items-center gap-2">
                    <span class="d-inline-flex align-items-center justify-content-center rounded-circle" style="width: 32px; height: 32px; background: rgba(239, 68, 68, 0.2); color: #ef4444;">
                      <i class="bi bi-file-earmark-pdf-fill"></i>
                    </span>
                    <div>
                      <div class="small fw-bold text-white mb-0" id="ceWhatsAppPdfLabel">Anexar Documento PDF / Imprimir A4</div>
                      <small class="text-secondary" id="ceWhatsAppPdfHint">Gerar e descarregar documento PDF oficial da escala/anúncios para anexar no WhatsApp.</small>
                    </div>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <button type="button" class="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1" id="ceWhatsAppGeneratePdfBtn">
                      <i class="bi bi-file-earmark-pdf"></i> <span id="ceWhatsAppGeneratePdfBtnText">Gerar / Descarregar PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer d-flex justify-content-between align-items-center flex-wrap gap-2" style="border-top: 1px solid rgba(255, 255, 255, 0.1); background: rgba(0, 0, 0, 0.2);">
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Fechar</button>
              <span class="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1" style="font-size: 0.74rem;">
                <i class="bi bi-shield-check"></i> Gateway Ativo (+258864232917)
              </span>
            </div>
            <div class="d-flex align-items-center flex-wrap gap-2">
              <button type="button" class="btn btn-outline-warning" id="ceWhatsAppCopyCloseBtn">
                <i class="bi bi-clipboard-check me-1"></i> Copiar & Fechar
              </button>
              <button type="button" class="btn btn-outline-light btn-sm d-inline-flex align-items-center gap-1" id="ceWhatsAppManualAppBtn" title="Abrir no aplicativo WhatsApp como alternativa">
                <i class="bi bi-box-arrow-up-right"></i> Abrir no App
              </button>
              <button type="button" class="btn btn-danger btn-sm d-none d-inline-flex align-items-center gap-1" id="ceWhatsAppPdfActionBtn" title="Descarregar e Enviar PDF">
                <i class="bi bi-file-earmark-pdf"></i> <span>Enviar PDF</span>
              </button>
              <button type="button" class="btn btn-success fw-bold d-inline-flex align-items-center gap-2" id="ceWhatsAppSendBtn" style="background: #25D366; border-color: #25D366; color: #000;">
                <i class="bi bi-send-fill" style="font-size: 1.05rem;"></i> <span id="ceWhatsAppSendBtnText">Enviar Texto</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    return div;
  }

  async function ensureHtml2Pdf() {
    if (typeof window.html2pdf === "function") return true;
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "js/vendor/html2pdf.bundle.min.js";
      script.onload = () => resolve(true);
      script.onerror = () => {
        const cdnScript = document.createElement("script");
        cdnScript.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        cdnScript.onload = () => resolve(true);
        cdnScript.onerror = () => resolve(false);
        document.head.appendChild(cdnScript);
      };
      document.head.appendChild(script);
    });
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result;
        if (typeof res === "string") {
          const parts = res.split(",");
          resolve(parts.length > 1 ? parts[1] : parts[0]);
        } else {
          resolve("");
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(blob);
    });
  }

  async function generateHtmlPdfBlob(htmlContent, fileName = "documento.pdf") {
    await ensureHtml2Pdf();
    if (typeof window.html2pdf !== "function") {
      throw new Error("html2pdf library is not available.");
    }

    const tempContainer = document.createElement("div");
    tempContainer.style.position = "fixed";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "0";
    tempContainer.style.width = "794px";
    tempContainer.style.background = "#ffffff";
    tempContainer.style.color = "#000000";
    tempContainer.innerHTML = htmlContent;

    // Clean screen buttons, navigation bars, and print scripts
    tempContainer.querySelectorAll(".screen-bar, .d-print-none, script").forEach((el) => el.remove());

    document.body.appendChild(tempContainer);

    try {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      };

      const worker = window.html2pdf().set(opt).from(tempContainer);
      const blob = await worker.outputPdf("blob");
      document.body.removeChild(tempContainer);

      if (!blob || blob.size === 0) {
        throw new Error("Falha ao gerar o arquivo PDF: ficheiro vazio.");
      }

      const base64 = await blobToBase64(blob);
      if (!base64 || base64.length < 50) {
        throw new Error("Falha ao converter PDF para base64.");
      }

      return { blob, base64, fileName };
    } catch (err) {
      if (tempContainer.parentNode) document.body.removeChild(tempContainer);
      throw err;
    }
  }

  function openWhatsAppDispatchModal({ title, subtitle, message, targetType, targetId, phone, groupLink, onGeneratePdf, pdfFileName, getPdfHtml }) {
    ensureWhatsAppDispatchModal();
    const modalEl = document.getElementById("ceWhatsAppDispatchModal");
    if (!modalEl) return;

    const titleEl = document.getElementById("ceWhatsAppDispatchTitle");
    const subtitleEl = document.getElementById("ceWhatsAppDispatchSubtitle");
    const selectEl = document.getElementById("ceWhatsAppRecipientSelect");
    const phoneEl = document.getElementById("ceWhatsAppCustomPhone");
    const messageEl = document.getElementById("ceWhatsAppMessageText");
    const sendBtn = document.getElementById("ceWhatsAppSendBtn");
    const copyBtn = document.getElementById("ceWhatsAppCopyBtn");
    const copyCloseBtn = document.getElementById("ceWhatsAppCopyCloseBtn");
    const pdfRow = document.getElementById("ceWhatsAppPdfOptionRow");
    const pdfGenBtn = document.getElementById("ceWhatsAppGeneratePdfBtn");
    const pdfActionBtn = document.getElementById("ceWhatsAppPdfActionBtn");

    if (titleEl) titleEl.textContent = title || "Partilhar no WhatsApp";
    if (subtitleEl) subtitleEl.textContent = subtitle || "Sincronizado com os Grupos e Liderança da Igreja";
    if (messageEl) messageEl.value = message || "";

    const hasPdfSupport = typeof onGeneratePdf === "function" || typeof getPdfHtml === "function";
    if (hasPdfSupport) {
      if (pdfRow) pdfRow.classList.remove("d-none");
      if (pdfActionBtn) pdfActionBtn.classList.remove("d-none");
    } else {
      if (pdfRow) pdfRow.classList.add("d-none");
      if (pdfActionBtn) pdfActionBtn.classList.add("d-none");
    }

    // Resolve contacts
    const contacts = resolveContactsForTarget(targetType, targetId);
    let selectOptionsHtml = `<option value="">-- Seleccione um contacto ou grupo (ou digite o número abaixo) --</option>`;

    let defaultPhone = phone || "";
    let defaultGroupLink = groupLink || "";

    contacts.forEach((c, idx) => {
      const label = `${c.name} — ${c.role}${c.church ? ` (${c.church})` : ""}`;
      const isSelected = (phone && c.phone === phone) || (groupLink && c.groupLink === groupLink);
      selectOptionsHtml += `<option value="${idx}" ${isSelected ? "selected" : ""}>${escapeHtml(label)}</option>`;
      if (isSelected) {
        if (c.phone) defaultPhone = c.phone;
        if (c.groupLink) defaultGroupLink = c.groupLink;
      }
    });

    if (selectEl) {
      selectEl.innerHTML = selectOptionsHtml;
      selectEl.onchange = function () {
        const val = selectEl.value;
        if (val !== "" && contacts[val]) {
          const chosen = contacts[val];
          if (chosen.isGroup) {
            phoneEl.value = "";
            phoneEl.placeholder = "Grupo de WhatsApp seleccionado";
            sendBtn.dataset.groupLink = chosen.groupLink || "";
            sendBtn.dataset.isGroup = "true";
          } else {
            phoneEl.value = chosen.phone || "";
            sendBtn.dataset.groupLink = "";
            sendBtn.dataset.isGroup = "false";
          }
        } else {
          sendBtn.dataset.groupLink = "";
          sendBtn.dataset.isGroup = "false";
        }
        updateButtonMode();
      };
    }

    if (phoneEl) {
      phoneEl.value = defaultPhone;
      phoneEl.oninput = updateButtonMode;
    }

    sendBtn.dataset.groupLink = defaultGroupLink;
    sendBtn.dataset.isGroup = defaultGroupLink ? "true" : "false";

    const manualAppBtn = document.getElementById("ceWhatsAppManualAppBtn");
    const sendBtnText = document.getElementById("ceWhatsAppSendBtnText");

    function updateButtonMode() {
      const isGrp = sendBtn.dataset.isGroup === "true";
      const grpLnk = sendBtn.dataset.groupLink || "";
      if (isGrp && grpLnk) {
        if (sendBtnText) sendBtnText.textContent = "Copiar & Abrir no Grupo";
        sendBtn.innerHTML = '<i class="bi bi-whatsapp" style="font-size: 1.05rem;"></i> <span>Copiar & Abrir no Grupo</span>';
        if (manualAppBtn) manualAppBtn.classList.add("d-none");
      } else {
        if (sendBtnText) sendBtnText.textContent = "Enviar Texto";
        sendBtn.innerHTML = '<i class="bi bi-send-fill" style="font-size: 1.05rem;"></i> <span>Enviar Texto</span>';
        if (manualAppBtn) manualAppBtn.classList.remove("d-none");
      }
    }

    updateButtonMode();

    // Setup Actions
    const doCopy = () => {
      const textToCopy = messageEl.value || "";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          if (typeof window.showToast === "function") window.showToast("Texto copiado para a área de transferência!");
        });
      } else {
        messageEl.select();
        document.execCommand("copy");
        if (typeof window.showToast === "function") window.showToast("Texto copiado para a área de transferência!");
      }
    };

    copyBtn.onclick = doCopy;
    copyCloseBtn.onclick = () => {
      doCopy();
      const bsModal = window.bootstrap?.Modal?.getInstance(modalEl);
      if (bsModal) bsModal.hide();
    };

    if (manualAppBtn) {
      manualAppBtn.onclick = () => {
        const currentMsg = messageEl.value || "";
        const currentPhone = phoneEl.value.trim() || "";
        const targetUrl = currentPhone ? buildWhatsAppUrl(currentPhone, currentMsg) : `https://api.whatsapp.com/send?text=${encodeURIComponent(currentMsg)}`;
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      };
    }

    sendBtn.onclick = async () => {
      const currentMsg = messageEl.value || "";
      const currentPhone = phoneEl.value.trim() || "";
      const isGrp = sendBtn.dataset.isGroup === "true";
      const grpLnk = sendBtn.dataset.groupLink || "";

      if (isGrp && grpLnk) {
        doCopy();
        if (typeof window.showToast === "function") {
          window.showToast("Texto copiado! A abrir o Grupo do WhatsApp para colar a mensagem...", "info");
        }
        window.open(grpLnk, "_blank", "noopener,noreferrer");
        return;
      }

      if (!currentPhone) {
        if (typeof window.showToast === "function") {
          window.showToast("Por favor, seleccione um destinatário ou digite um número de telefone.", "warning");
        }
        if (phoneEl) phoneEl.focus();
        return;
      }

      // Envio direto em segundo plano via Gateway Corporativo (+258864232917)
      const originalHtml = sendBtn.innerHTML;
      sendBtn.disabled = true;
      sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> A enviar...';

      try {
        const res = await sendDirectWhatsAppMessage(currentPhone, currentMsg);
        if (res && res.ok) {
          sendBtn.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> Enviado com Sucesso!';
          if (typeof window.showToast === "function") {
            window.showToast(`Mensagem enviada com sucesso direto pelo Portal para ${currentPhone}!`, "success");
          }
          setTimeout(() => {
            const bsModal = window.bootstrap?.Modal?.getInstance(modalEl);
            if (bsModal) bsModal.hide();
            sendBtn.disabled = false;
            sendBtn.innerHTML = originalHtml;
          }, 1400);
        } else {
          sendBtn.disabled = false;
          sendBtn.innerHTML = '<i class="bi bi-send-fill me-1"></i> Tentar Enviar Novamente';
          if (typeof window.showToast === "function") {
            window.showToast(`Não foi possível enviar direto (${res?.error || "Verifique o Gateway"}). Pode usar a opção "Abrir no App".`, "warning");
          }
        }
      } catch (err) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalHtml;
        if (typeof window.showToast === "function") {
          window.showToast("Erro ao comunicar com o servidor para envio direto.", "error");
        }
      }
    };

    // Setup PDF Actions (Direct background processing & dispatching)
    if (pdfActionBtn && hasPdfSupport) {
      pdfActionBtn.onclick = async () => {
        const currentPhone = phoneEl ? phoneEl.value.trim() : "";
        const currentMsg = messageEl ? messageEl.value : "";
        const isGrp = sendBtn.dataset.isGroup === "true";
        const grpLnk = sendBtn.dataset.groupLink || "";

        if (!currentPhone && !isGrp) {
          if (typeof window.showToast === "function") {
            window.showToast("Por favor, seleccione um destinatário ou grupo para enviar o PDF.", "warning");
          }
          if (phoneEl) phoneEl.focus();
          return;
        }

        const originalBtnHtml = pdfActionBtn.innerHTML;
        pdfActionBtn.disabled = true;
        pdfActionBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> A processar PDF...';

        try {
          const activeFileName = pdfFileName || `Documento_${new Date().toISOString().slice(0, 10)}.pdf`;
          let htmlContent = typeof getPdfHtml === "function" ? getPdfHtml() : "";

          if (!htmlContent && typeof onGeneratePdf === "function") {
            onGeneratePdf();
            pdfActionBtn.disabled = false;
            pdfActionBtn.innerHTML = originalBtnHtml;
            return;
          }

          const pdfResult = await generateHtmlPdfBlob(htmlContent, activeFileName);
          pdfActionBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> A enviar PDF...';

          // 1. Direct Background Dispatch via Corporate Baileys Gateway (+258864232917)
          if (currentPhone && !isGrp) {
            const res = await sendDirectWhatsAppMessage(currentPhone, "", {
              documentBase64: pdfResult.base64,
              fileName: activeFileName,
              caption: `📄 ${activeFileName}`,
              mimetype: "application/pdf",
              isPdf: true
            });

            if (res && res.ok) {
              pdfActionBtn.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> PDF Enviado!';
              if (typeof window.showToast === "function") {
                window.showToast(`PDF "${activeFileName}" enviado com sucesso direto para ${currentPhone}!`, "success");
              }
              setTimeout(() => {
                const bsModal = window.bootstrap?.Modal?.getInstance(modalEl);
                if (bsModal) bsModal.hide();
                pdfActionBtn.disabled = false;
                pdfActionBtn.innerHTML = originalBtnHtml;
              }, 1400);
              return;
            } else {
              console.warn("[WhatsApp Hub] Direct gateway send failed or not connected:", res?.error);
            }
          }

          // 2. Native Web Share API (Direct WhatsApp attachment on mobile or supported desktop browsers)
          const pdfFile = new File([pdfResult.blob], activeFileName, { type: "application/pdf" });
          if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
            try {
              await navigator.share({
                files: [pdfFile],
                title: activeFileName,
                text: `📄 ${activeFileName}`
              });
              pdfActionBtn.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> PDF Partilhado!';
              if (typeof window.showToast === "function") {
                window.showToast(`PDF "${activeFileName}" pronto no WhatsApp!`, "success");
              }
              setTimeout(() => {
                const bsModal = window.bootstrap?.Modal?.getInstance(modalEl);
                if (bsModal) bsModal.hide();
                pdfActionBtn.disabled = false;
                pdfActionBtn.innerHTML = originalBtnHtml;
              }, 1400);
              return;
            } catch (shareErr) {
              // User canceled share sheet, continue to fallback
            }
          }

          // 3. Fallback: Auto-download named PDF file & open WhatsApp conversation/group
          // Do NOT send the text schedule in WhatsApp URL when user requested PDF!
          const downloadUrl = URL.createObjectURL(pdfResult.blob);
          const dlAnchor = document.createElement("a");
          dlAnchor.href = downloadUrl;
          dlAnchor.download = activeFileName;
          document.body.appendChild(dlAnchor);
          dlAnchor.click();
          document.body.removeChild(dlAnchor);
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 3000);

          if (typeof window.showToast === "function") {
            window.showToast(`PDF "${activeFileName}" baixado! No WhatsApp, anexe o ficheiro PDF baixado.`, "info");
          }

          setTimeout(() => {
            if (isGrp && grpLnk) {
              window.open(grpLnk, "_blank", "noopener,noreferrer");
            } else if (currentPhone) {
              const clean = cleanPhone(currentPhone);
              const targetUrl = `https://api.whatsapp.com/send?phone=${clean}`;
              window.open(targetUrl, "_blank", "noopener,noreferrer");
            }
            pdfActionBtn.disabled = false;
            pdfActionBtn.innerHTML = originalBtnHtml;
            const bsModal = window.bootstrap?.Modal?.getInstance(modalEl);
            if (bsModal) bsModal.hide();
          }, 800);

        } catch (err) {
          console.error("[WhatsApp Hub] Error generating/sending PDF:", err);
          pdfActionBtn.disabled = false;
          pdfActionBtn.innerHTML = originalBtnHtml;
          if (typeof window.showToast === "function") {
            window.showToast("Erro ao processar o PDF para envio.", "error");
          }
        }
      };
    }

    if (pdfGenBtn && hasPdfSupport) {
      pdfGenBtn.onclick = async () => {
        const originalGenHtml = pdfGenBtn.innerHTML;
        const activeFileName = pdfFileName || `Documento_${new Date().toISOString().slice(0, 10)}.pdf`;
        let htmlContent = typeof getPdfHtml === "function" ? getPdfHtml() : "";

        if (htmlContent) {
          pdfGenBtn.disabled = true;
          pdfGenBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> A descarregar...';
          try {
            const pdfResult = await generateHtmlPdfBlob(htmlContent, activeFileName);
            const downloadUrl = URL.createObjectURL(pdfResult.blob);
            const dlAnchor = document.createElement("a");
            dlAnchor.href = downloadUrl;
            dlAnchor.download = activeFileName;
            document.body.appendChild(dlAnchor);
            dlAnchor.click();
            document.body.removeChild(dlAnchor);
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 3000);

            if (typeof window.showToast === "function") {
              window.showToast(`PDF "${activeFileName}" descarregado com sucesso!`, "success");
            }
          } catch (e) {
            console.error("[WhatsApp Hub] Error generating download PDF:", e);
            if (typeof onGeneratePdf === "function") onGeneratePdf();
          } finally {
            pdfGenBtn.disabled = false;
            pdfGenBtn.innerHTML = originalGenHtml;
          }
        } else if (typeof onGeneratePdf === "function") {
          onGeneratePdf();
        }
      };
    }

    // Show modal using Bootstrap if available
    if (window.bootstrap?.Modal) {
      const modalObj = window.bootstrap.Modal.getOrCreateInstance(modalEl);
      modalObj.show();
    } else {
      modalEl.classList.add("show");
      modalEl.style.display = "block";
    }
  }

  // --- Dispatch Helpers ---

  function dispatchNotificationToWhatsApp(notificationId) {
    const st = window.state || {};
    const notifs = st.notifications || [];
    const notif = notifs.find((n) => String(n.id) === String(notificationId));
    if (!notif) {
      if (typeof window.showToast === "function") window.showToast("Notificação não encontrada.", "error");
      return;
    }

    const text = formatNotificationForWhatsApp(notif);
    let targetPhone = "";
    if (notif.recipient_user_id) {
      const user = (st.users || []).find((u) => String(u.id) === String(notif.recipient_user_id));
      targetPhone = user?.phone || user?.telefone || "";
    }
    if (!targetPhone) {
      const cfg = getAdminWhatsAppConfig();
      targetPhone = cfg.phone || DEFAULT_ADMIN_WHATSAPP_PHONE;
    }

    openWhatsAppDispatchModal({
      title: `Notificação: ${notif.title}`,
      subtitle: `Disparar para o WhatsApp do destinatário ou líder`,
      message: text,
      targetType: notif.recipient_church_id ? "church" : "user",
      targetId: notif.recipient_church_id || notif.recipient_user_id,
      phone: targetPhone
    });
  }

  function dispatchChurchScheduleToWhatsApp(churchId) {
    const st = window.state || {};
    const churches = st.churches || [];
    const church = churches.find((c) => String(c.id) === String(churchId) || String(c.church_id) === String(churchId));
    if (!church) {
      if (typeof window.showToast === "function") window.showToast("Igreja não encontrada.", "error");
      return;
    }

    const text = formatServiceScheduleForWhatsApp(church);
    openWhatsAppDispatchModal({
      title: `Programação de Cultos: ${church.church_name}`,
      subtitle: `Partilhar programação nos Grupos do WhatsApp ou com Membros`,
      message: text,
      targetType: "church",
      targetId: church.id,
      phone: church.phone_primary || church.phone || "",
      groupLink: church.whatsapp_group_link || church.whatsapp || ""
    });
  }

  function dispatchPostToWhatsApp(postId) {
    const posts = getPortalPosts();
    const post = posts.find((p) => String(p.id) === String(postId));
    if (!post) {
      if (typeof window.showToast === "function") window.showToast("Publicação não encontrada.", "error");
      return;
    }

    const text = formatPortalPostForWhatsApp(post);
    openWhatsAppDispatchModal({
      title: `Publicação: ${post.title}`,
      subtitle: `Partilhar no Grupo da Igreja ou Lista de Transmissão WhatsApp`,
      message: text,
      targetType: post.church_id && post.church_id !== "all" ? "church" : "all",
      targetId: post.church_id,
      groupLink: post.whatsapp_group_link || ""
    });
  }

  // --- Portal Posts UI & Management ---

  function openCreatePostModal() {
    let modal = document.getElementById("ceCreatePortalPostModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "ceCreatePortalPostModal";
      modal.className = "modal fade";
      modal.tabIndex = -1;
      modal.setAttribute("aria-hidden", "true");
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content" style="background: #0d1527; border: 1px solid rgba(245, 199, 85, 0.4); box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85); color: #f8fafc; border-radius: 14px;">
            <div class="modal-header" style="border-bottom: 1px solid rgba(255, 255, 255, 0.1); background: rgba(245, 199, 85, 0.08);">
              <div class="d-flex align-items-center gap-2">
                <span class="d-inline-flex align-items-center justify-content-center" style="width: 36px; height: 36px; border-radius: 50%; background: rgba(245, 199, 85, 0.2); color: #f5c755; font-size: 1.25rem;">
                  <i class="bi bi-megaphone-fill"></i>
                </span>
                <div>
                  <h5 class="modal-title mb-0" style="font-weight: 700; color: #ffffff;">Nova Publicação / Comunicado Oficial</h5>
                  <small class="text-secondary">Publicar no Portal e Sincronizar com Notificações e WhatsApp</small>
                </div>
              </div>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <form id="ceCreatePortalPostForm">
              <div class="modal-body p-4">
                <div class="row g-3">
                  <div class="col-md-8">
                    <label class="form-label text-warning small fw-bold">Título da Publicação *</label>
                    <input type="text" name="title" class="form-control bg-dark text-light border-secondary" placeholder="Ex: Programação Especial de Santa Ceia" required />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-warning small fw-bold">Categoria *</label>
                    <select name="category" class="form-select bg-dark text-light border-secondary">
                      <option value="Comunicado Oficial">Comunicado Oficial</option>
                      <option value="Programação de Culto">Programação de Culto</option>
                      <option value="Palavra Pastoral">Palavra Pastoral</option>
                      <option value="Aviso Urgente">Aviso Urgente</option>
                      <option value="Evento Especial">Evento Especial</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-bold">Igreja Destino *</label>
                    <select name="church_id" id="cePostChurchSelect" class="form-select bg-dark text-light border-secondary">
                      <option value="all">Todas as Igrejas (Âmbito Nacional)</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-bold">Prioridade</label>
                    <select name="priority" class="form-select bg-dark text-light border-secondary">
                      <option value="normal">Normal</option>
                      <option value="high">Alta Prioridade</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                  <div class="col-12">
                    <label class="form-label text-warning small fw-bold">Conteúdo da Mensagem *</label>
                    <textarea name="content" class="form-control bg-dark text-light border-secondary" rows="5" placeholder="Escreva aqui os detalhes, horários, instruções ou palavra de encorajamento..." required></textarea>
                  </div>
                  <div class="col-12">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="cePostSyncNotifications" name="sync_notifications" checked />
                      <label class="form-check-label text-light small" for="cePostSyncNotifications">
                        <strong>Sincronizar com a Central de Notificações</strong> (notificar os utilizadores e líderes relevantes no portal)
                      </label>
                    </div>
                    <div class="form-check mt-2">
                      <input class="form-check-input" type="checkbox" id="cePostShareWhatsApp" name="share_whatsapp" checked />
                      <label class="form-check-label text-light small" for="cePostShareWhatsApp">
                        <strong>Abrir modal de partilha para o WhatsApp</strong> imediatamente após publicar
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer d-flex justify-content-between" style="border-top: 1px solid rgba(255, 255, 255, 0.1); background: rgba(0, 0, 0, 0.2);">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-warning fw-bold d-inline-flex align-items-center gap-2" style="background: #f5c755; color: #000;">
                  <i class="bi bi-send-fill"></i> Publicar no Mural
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // Populate churches in select
    const churchSelect = document.getElementById("cePostChurchSelect");
    if (churchSelect) {
      const st = window.state || {};
      const churches = st.churches || [];
      let opts = `<option value="all">Todas as Igrejas (Âmbito Nacional)</option>`;
      churches.forEach((c) => {
        opts += `<option value="${escapeAttr(c.id)}">${escapeHtml(c.church_name)}</option>`;
      });
      churchSelect.innerHTML = opts;
    }

    // Handle form submit
    const form = document.getElementById("ceCreatePortalPostForm");
    form.onsubmit = function (e) {
      e.preventDefault();
      const fd = new FormData(form);
      const title = fd.get("title");
      const category = fd.get("category");
      const churchId = fd.get("church_id");
      const priority = fd.get("priority");
      const content = fd.get("content");
      const syncNotifications = fd.get("sync_notifications") === "on";
      const shareWhatsApp = fd.get("share_whatsapp") === "on";

      const user = window.activeUser || {};
      const st = window.state || {};
      let churchName = "Todas as Igrejas";
      let churchObj = null;
      if (churchId && churchId !== "all") {
        churchObj = (st.churches || []).find((c) => String(c.id) === String(churchId));
        if (churchObj) churchName = churchObj.church_name;
      }

      const newPost = {
        id: `post-${Date.now()}`,
        title,
        category,
        church_id: churchId,
        church_name: churchName,
        priority,
        content,
        author_name: user.name || user.full_name || "Pastor / Líder",
        author_role: user.role || "Liderança",
        created_at: new Date().toISOString(),
        is_pinned: priority === "urgent" || priority === "high",
        whatsapp_group_link: churchObj?.whatsapp_group_link || churchObj?.whatsapp || ""
      };

      const posts = getPortalPosts();
      posts.unshift(newPost);
      savePortalPosts(posts);

      // Sincronizar com Centro de Notificações
      if (syncNotifications && typeof window.createNotification === "function") {
        window.createNotification({
          title: `[${category}] ${title}`,
          message: content.length > 120 ? `${content.substring(0, 117)}...` : content,
          type: priority === "urgent" ? "urgent" : "info",
          priority: priority,
          module: "system",
          action_url: "portalPosts",
          action_label: "Ver Publicação",
          recipient_church_id: churchId === "all" ? "" : churchId,
          scope: churchId === "all" ? "national" : "church"
        });
      }

      // Close create modal
      if (window.bootstrap?.Modal) {
        const modalObj = window.bootstrap.Modal.getInstance(modal);
        if (modalObj) modalObj.hide();
      } else {
        modal.classList.remove("show");
        modal.style.display = "none";
      }

      if (typeof window.showToast === "function") {
        window.showToast("Publicação efectuada com sucesso!", "success");
      }

      // Re-render mural if currently on portalPosts route
      if (window.activeRoute === "portalPosts") {
        renderPortalPosts();
      }

      // Prompt WhatsApp share immediately if checked
      if (shareWhatsApp) {
        setTimeout(() => {
          dispatchPostToWhatsApp(newPost.id);
        }, 350);
      }
    };

    if (window.bootstrap?.Modal) {
      const modalObj = window.bootstrap.Modal.getOrCreateInstance(modal);
      modalObj.show();
    } else {
      modal.classList.add("show");
      modal.style.display = "block";
    }
  }

  function renderPortalPosts() {
    const isPt = getLang() === "pt";
    const posts = getPortalPosts();
    const st = window.state || {};
    const churches = st.churches || [];

    // Filter
    let filtered = posts.filter((p) => {
      if (whatsappHubState.category !== "all" && p.category !== whatsappHubState.category) return false;
      if (whatsappHubState.churchId !== "all" && p.church_id !== "all" && p.church_id !== whatsappHubState.churchId) return false;
      if (whatsappHubState.search) {
        const q = whatsappHubState.search.toLowerCase();
        const tMatch = (p.title || "").toLowerCase().includes(q);
        const cMatch = (p.content || "").toLowerCase().includes(q);
        const aMatch = (p.author_name || "").toLowerCase().includes(q);
        if (!tMatch && !cMatch && !aMatch) return false;
      }
      return true;
    });

    const categories = ["Comunicado Oficial", "Programação de Culto", "Palavra Pastoral", "Aviso Urgente", "Evento Especial"];

    const cardsHtml = filtered.length
      ? filtered
          .map((post) => {
            const dateStr = new Date(post.created_at).toLocaleDateString("pt-MZ", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });
            const badgeClass =
              post.category === "Aviso Urgente"
                ? "bg-danger"
                : post.category === "Programação de Culto"
                ? "bg-success"
                : post.category === "Palavra Pastoral"
                ? "bg-info text-dark"
                : "bg-warning text-dark";

            return `
        <div class="col-12 col-lg-6 mb-4">
          <div class="card h-100 data-card" style="border: 1px solid rgba(255, 255, 255, 0.12); background: #0f172a; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">
            <div class="card-header d-flex justify-content-between align-items-center py-3" style="background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.08);">
              <div class="d-flex align-items-center gap-2">
                <span class="badge ${badgeClass}" style="font-weight: 700; font-size: 0.75rem;">${escapeHtml(post.category)}</span>
                ${post.priority === "urgent" ? '<span class="badge bg-danger"><i class="bi bi-exclamation-triangle-fill me-1"></i>Urgente</span>' : ""}
              </div>
              <small class="text-secondary" style="font-size: 0.78rem;"><i class="bi bi-clock me-1"></i>${dateStr}</small>
            </div>
            <div class="card-body p-4">
              <h4 class="card-title text-light fw-bold mb-2">${escapeHtml(post.title)}</h4>
              <div class="d-flex align-items-center gap-2 mb-3 text-secondary small">
                <span><i class="bi bi-geo-alt text-warning me-1"></i>${escapeHtml(post.church_name || "Todas as Igrejas")}</span>
                <span>•</span>
                <span><i class="bi bi-person text-info me-1"></i>${escapeHtml(post.author_name || "Liderança")}</span>
              </div>
              <p class="card-text text-light" style="white-space: pre-wrap; line-height: 1.55; opacity: 0.92; font-size: 0.92rem;">${escapeHtml(post.content)}</p>
            </div>
            <div class="card-footer d-flex justify-content-between align-items-center p-3" style="background: rgba(0,0,0,0.25); border-top: 1px solid rgba(255,255,255,0.08);">
              <span class="text-secondary small"><i class="bi bi-whatsapp text-success me-1"></i> Pronto para Grupos</span>
              <button type="button" class="btn btn-sm btn-outline-success fw-bold d-inline-flex align-items-center gap-2" data-share-post-whatsapp="${post.id}">
                <i class="bi bi-whatsapp"></i> Partilhar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      `;
          })
          .join("")
      : `
      <div class="col-12">
        <div class="text-center py-5 text-secondary">
          <i class="bi bi-chat-square-quote text-warning" style="font-size: 3rem;"></i>
          <h4 class="mt-3 text-light">Nenhuma publicação encontrada</h4>
          <p>Seja o primeiro a publicar um comunicado oficial ou programação de culto para os grupos da Igreja.</p>
          <button type="button" class="btn btn-warning mt-2" onclick="window.CEWhatsAppHub.openCreatePostModal()">
            <i class="bi bi-plus-circle me-1"></i> Criar Publicação Agora
          </button>
        </div>
      </div>
    `;

    const html = `
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <span class="eyebrow text-warning"><i class="bi bi-megaphone-fill me-1"></i> Comunicação & Disparo Oficial</span>
          <h2 class="h3 fw-bold text-light mb-1">Mural de Publicações & Integração WhatsApp</h2>
          <p class="text-secondary mb-0">Partilhe comunicados, cultos e notícias diretamente com os grupos da Igreja no WhatsApp e na Central de Notificações.</p>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-success fw-bold d-inline-flex align-items-center gap-2" onclick="window.navigateTo('notifications')">
            <i class="bi bi-bell-fill"></i> Central de Notificações
          </button>
          <button type="button" class="btn btn-warning fw-bold d-inline-flex align-items-center gap-2" onclick="window.CEWhatsAppHub.openCreatePostModal()">
            <i class="bi bi-plus-lg"></i> Nova Publicação
          </button>
        </div>
      </div>

      <!-- Filters Row -->
      <div class="card glass-panel mb-4 p-3" style="border: 1px solid rgba(255, 255, 255, 0.1); background: #0b1324;">
        <div class="row g-2 align-items-center">
          <div class="col-md-5">
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-secondary"><i class="bi bi-search"></i></span>
              <input type="text" id="cePostsSearchInput" class="form-control bg-dark text-light border-secondary" placeholder="Pesquisar publicações por título, conteúdo ou autor..." value="${escapeAttr(whatsappHubState.search)}" />
            </div>
          </div>
          <div class="col-md-3">
            <select id="cePostsCategoryFilter" class="form-select bg-dark text-light border-secondary">
              <option value="all">Todas as Categorias</option>
              ${categories.map((c) => `<option value="${c}" ${whatsappHubState.category === c ? "selected" : ""}>${c}</option>`).join("")}
            </select>
          </div>
          <div class="col-md-4">
            <select id="cePostsChurchFilter" class="form-select bg-dark text-light border-secondary">
              <option value="all">Todas as Igrejas</option>
              ${churches.map((c) => `<option value="${escapeAttr(c.id)}" ${whatsappHubState.churchId === c.id ? "selected" : ""}>${escapeHtml(c.church_name)}</option>`).join("")}
            </select>
          </div>
        </div>
      </div>

      <!-- Posts Cards Grid -->
      <div class="row">
        ${cardsHtml}
      </div>
    `;

    if (typeof window.setPageContent === "function") {
      window.setPageContent(html);
    } else {
      const contentEl = document.getElementById("content");
      if (contentEl) contentEl.innerHTML = html;
    }

    // Attach filter listeners
    const searchInp = document.getElementById("cePostsSearchInput");
    if (searchInp) {
      searchInp.oninput = (e) => {
        whatsappHubState.search = e.target.value;
        if (window.__postsDebounce) clearTimeout(window.__postsDebounce);
        window.__postsDebounce = setTimeout(renderPortalPosts, 250);
      };
    }
    const catSel = document.getElementById("cePostsCategoryFilter");
    if (catSel) {
      catSel.onchange = (e) => {
        whatsappHubState.category = e.target.value;
        renderPortalPosts();
      };
    }
    const chSel = document.getElementById("cePostsChurchFilter");
    if (chSel) {
      chSel.onchange = (e) => {
        whatsappHubState.churchId = e.target.value;
        renderPortalPosts();
      };
    }
  }

  // --- Global Event Delegation for 1-Click WhatsApp buttons ---
  function initEventDelegation() {
    document.addEventListener("click", function (event) {
      // 1. Notification WhatsApp Share Button
      const notifBtn = event.target.closest("[data-share-notification-whatsapp]");
      if (notifBtn) {
        event.stopPropagation();
        event.preventDefault();
        const notifId = notifBtn.dataset.shareNotificationWhatsapp;
        dispatchNotificationToWhatsApp(notifId);
        return;
      }

      // 2. Church Service Schedule WhatsApp Share Button
      const churchScheduleBtn = event.target.closest("[data-share-church-schedule-whatsapp]");
      if (churchScheduleBtn) {
        event.stopPropagation();
        event.preventDefault();
        const churchId = churchScheduleBtn.dataset.shareChurchScheduleWhatsapp;
        dispatchChurchScheduleToWhatsApp(churchId);
        return;
      }

      // 3. Portal Post WhatsApp Share Button
      const postBtn = event.target.closest("[data-share-post-whatsapp]");
      if (postBtn) {
        event.stopPropagation();
        event.preventDefault();
        const postId = postBtn.dataset.sharePostWhatsapp;
        dispatchPostToWhatsApp(postId);
        return;
      }
    });
  }

  // --- Admin WhatsApp Real-Time Notification Engine ---

  function getAdminWhatsAppConfig() {
    let enabled = true;
    let phone = DEFAULT_ADMIN_WHATSAPP_PHONE;
    let senderPhone = DEFAULT_GATEWAY_SENDER_PHONE;
    let apiKey = "";
    let webhook = "";
    let cloudToken = "";
    let cloudPhoneId = "";
    let autoOpen = false;
    let allDepartments = true;

    try {
      const storedEnabled = typeof localStorage !== "undefined" ? localStorage.getItem("ce-admin-whatsapp-enabled") : null;
      const storedPhone = typeof localStorage !== "undefined" ? localStorage.getItem("ce-admin-whatsapp-phone") : null;
      const storedSenderPhone = typeof localStorage !== "undefined" ? localStorage.getItem("ce-admin-whatsapp-sender-phone") : null;
      const storedApiKey = typeof localStorage !== "undefined" ? localStorage.getItem("ce-admin-whatsapp-apikey") : null;
      const storedWebhook = typeof localStorage !== "undefined" ? localStorage.getItem("ce-admin-whatsapp-webhook") : null;
      const storedCloudToken = typeof localStorage !== "undefined" ? localStorage.getItem("ce-admin-whatsapp-cloud-token") : null;
      const storedCloudPhoneId = typeof localStorage !== "undefined" ? localStorage.getItem("ce-admin-whatsapp-cloud-phone-id") : null;
      const storedAutoOpen = typeof localStorage !== "undefined" ? localStorage.getItem("ce-admin-whatsapp-auto-open") : null;

      const user = (typeof window !== "undefined" && window.activeUser) || {};
      const isAdmin = user.role === "Super Admin" || user.role === "Admin" || (user.roles || []).includes("superadmin") || (user.department_permissions || []).includes("*");

      phone = storedPhone || (isAdmin && (user.phone || user.telefone || user.whatsapp)) || DEFAULT_ADMIN_WHATSAPP_PHONE;
      senderPhone = storedSenderPhone || DEFAULT_GATEWAY_SENDER_PHONE;
      if (storedEnabled !== null) {
        enabled = storedEnabled === "true";
      } else {
        enabled = true;
      }
      apiKey = storedApiKey || "";
      webhook = storedWebhook || "";
      cloudToken = storedCloudToken || "";
      cloudPhoneId = storedCloudPhoneId || "";
      autoOpen = storedAutoOpen === "true";
    } catch (_) {}

    const gwConnected = typeof localStorage !== "undefined" && localStorage.getItem("ce-admin-whatsapp-gateway-connected") === "true";

    return {
      enabled,
      phone,
      senderPhone,
      apiKey,
      webhook,
      cloudToken,
      cloudPhoneId,
      autoOpen,
      allDepartments,
      gatewayConnected: gwConnected,
      hasDirectGateway: Boolean(gwConnected || apiKey || webhook || (cloudToken && cloudPhoneId))
    };
  }

  function saveAdminWhatsAppConfig(cfg) {
    if (!cfg || typeof localStorage === "undefined") return false;
    try {
      if (cfg.enabled !== undefined) localStorage.setItem("ce-admin-whatsapp-enabled", String(cfg.enabled));
      if (cfg.phone !== undefined) localStorage.setItem("ce-admin-whatsapp-phone", String(cfg.phone).trim());
      if (cfg.senderPhone !== undefined) localStorage.setItem("ce-admin-whatsapp-sender-phone", String(cfg.senderPhone).trim());
      if (cfg.apiKey !== undefined) localStorage.setItem("ce-admin-whatsapp-apikey", String(cfg.apiKey).trim());
      if (cfg.webhook !== undefined) localStorage.setItem("ce-admin-whatsapp-webhook", String(cfg.webhook).trim());
      if (cfg.cloudToken !== undefined) localStorage.setItem("ce-admin-whatsapp-cloud-token", String(cfg.cloudToken).trim());
      if (cfg.cloudPhoneId !== undefined) localStorage.setItem("ce-admin-whatsapp-cloud-phone-id", String(cfg.cloudPhoneId).trim());
      if (cfg.autoOpen !== undefined) localStorage.setItem("ce-admin-whatsapp-auto-open", String(cfg.autoOpen));

      // Dual write to notification_preferences if user is available
      const user = typeof window !== "undefined" ? window.activeUser : null;
      if (user?.id) {
        const bridge = window.CENotifications || window.CEDataLayer?.notifications;
        if (bridge?.upsertNotificationPreference) {
          const current = getAdminWhatsAppConfig();
          void bridge.upsertNotificationPreference({
            user_id: user.id,
            module_key: "all",
            category: "admin_whatsapp",
            whatsapp_enabled: Boolean(current.enabled),
            metadata: {
              admin_whatsapp_phone: current.phone || DEFAULT_ADMIN_WHATSAPP_PHONE,
              admin_whatsapp_sender_phone: current.senderPhone || DEFAULT_GATEWAY_SENDER_PHONE,
              admin_whatsapp_apikey: current.apiKey || "",
              admin_whatsapp_webhook: current.webhook || "",
              admin_whatsapp_cloud_phone_id: current.cloudPhoneId || "",
              admin_whatsapp_auto_open: Boolean(current.autoOpen)
            }
          });
        }
      }
      return true;
    } catch (e) {
      console.warn("[Admin WhatsApp] Save config error:", e);
      return false;
    }
  }

  async function sendDirectWhatsAppMessage(phone, formattedText, docOptionsOrNotification) {
    const config = getAdminWhatsAppConfig();
    const cleaned = cleanPhone(phone || config.phone || DEFAULT_ADMIN_WHATSAPP_PHONE);
    if (typeof fetch !== "function") {
      return { ok: false, needsSetup: true };
    }

    const docBase64 = docOptionsOrNotification?.documentBase64 || docOptionsOrNotification?.pdfBase64 || null;
    const docFileName = docOptionsOrNotification?.fileName || docOptionsOrNotification?.pdfFileName || null;
    const docMimetype = docOptionsOrNotification?.mimetype || "application/pdf";
    const docCaption = docOptionsOrNotification?.caption || (docFileName ? `📄 ${docFileName}` : "");
    const isPdfRequest = Boolean(docBase64 || docOptionsOrNotification?.isPdf);
    const notif = isPdfRequest ? null : docOptionsOrNotification;

    // 1. Try Portal Server Endpoint (/api/whatsapp/send) first (uses Corporate Baileys Gateway -> Cloud API -> CallMeBot -> Webhook)
    try {
      const serverRes = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: cleaned,
          phone: `+${cleaned}`,
          message: isPdfRequest ? (docCaption || "Documento") : formattedText,
          apiKey: isPdfRequest ? "" : config.apiKey, // Never send text-only CallMeBot key when PDF requested
          webhook: isPdfRequest ? "" : config.webhook,
          cloudToken: config.cloudToken,
          cloudPhoneId: config.cloudPhoneId,
          notification: notif || null,
          documentBase64: docBase64,
          fileName: docFileName,
          mimetype: docMimetype,
          caption: docCaption,
          isPdf: isPdfRequest
        })
      });
      const contentType = serverRes.headers?.get?.("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await serverRes.json();
        if (data.ok) {
          try {
            if (data.provider === "baileys_corporate_gateway") {
              localStorage.setItem("ce-admin-whatsapp-gateway-connected", "true");
            }
          } catch (_) {}
          return data;
        }
        if (isPdfRequest) {
          return { ok: false, error: data.error || data.message || "Erro no envio do documento PDF" };
        }
        if (data.needsSetup) {
          return data;
        }
      }
    } catch (fetchErr) {
      if (isPdfRequest) {
        return { ok: false, error: `Erro de conexão ao gateway: ${fetchErr?.message || fetchErr}` };
      }
    }

    // If PDF document was requested, DO NOT fall back to text-only APIs (CallMeBot / Webhook)
    if (isPdfRequest) {
      return { ok: false, error: "Envio de PDF direto requer o Gateway WhatsApp Corporativo conectado." };
    }

    // 2. Direct client-side fallback if static deployment
    if (config.cloudToken && config.cloudPhoneId) {
      try {
        const metaRes = await fetch(`https://graph.facebook.com/v20.0/${encodeURIComponent(config.cloudPhoneId)}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.cloudToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: cleaned,
            type: "text",
            text: { body: formattedText }
          })
        });
        return { ok: metaRes.ok, provider: "meta_cloud" };
      } catch (err) {
        return { ok: false, provider: "meta_cloud", error: String(err) };
      }
    }

    if (config.apiKey) {
      try {
        const cmbUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleaned)}&text=${encodeURIComponent(formattedText)}&apikey=${encodeURIComponent(config.apiKey)}`;
        await fetch(cmbUrl, { method: "GET", mode: "no-cors" });
        return { ok: true, provider: "callmebot" };
      } catch (err) {
        return { ok: false, provider: "callmebot", error: String(err) };
      }
    }

    if (config.webhook) {
      try {
        const whRes = await fetch(config.webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: cleaned,
            phone: `+${cleaned}`,
            message: formattedText,
            notification: notification || null
          })
        });
        return { ok: whRes.ok, provider: "webhook" };
      } catch (err) {
        return { ok: false, provider: "webhook", error: String(err) };
      }
    }

    return { ok: false, needsSetup: true };
  }

  function openDirectWhatsAppSetupModal() {
    if (typeof document === "undefined" || !document.body) return;
    let existing = document.getElementById("ceDirectWhatsAppSetupModal");
    if (existing) existing.remove();

    const cfg = getAdminWhatsAppConfig();
    const targetPhone = cfg.phone || DEFAULT_ADMIN_WHATSAPP_PHONE;
    const senderPhone = cfg.senderPhone || DEFAULT_GATEWAY_SENDER_PHONE;

    const modal = document.createElement("div");
    modal.id = "ceDirectWhatsAppSetupModal";
    modal.style.cssText = "position: fixed; inset: 0; z-index: 1080; background: rgba(4, 9, 20, 0.85); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; padding: 16px; overflow-y: auto;";
    modal.innerHTML = `
      <div style="background: #0d1527; border: 1px solid #25D366; border-radius: 14px; max-width: 600px; width: 100%; color: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.85); overflow: hidden; margin: auto;">
        <div class="d-flex align-items-center justify-content-between px-4 py-3" style="background: rgba(37, 211, 102, 0.14); border-bottom: 1px solid rgba(37, 211, 102, 0.3);">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-whatsapp text-success fs-4"></i>
            <div>
              <h6 class="mb-0 fw-bold text-white">Gateway Corporativo WhatsApp — Envio Direto do Portal</h6>
              <small class="text-success">Remetente Portal: <strong>${escapeHtml(senderPhone)}</strong> &rarr; Destino Admin: <strong>${escapeHtml(targetPhone)}</strong></small>
            </div>
          </div>
          <button type="button" class="btn-close btn-close-white" id="btnCloseDirectWASetup"></button>
        </div>
        <div class="p-4">
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label small text-success fw-semibold mb-1" style="font-size: 0.76rem;"><i class="bi bi-broadcast me-1"></i>WhatsApp do Gateway (Envia pelo Portal)</label>
              <input type="tel" class="form-control form-control-sm bg-dark text-white border-secondary" id="inpGatewaySenderPhone" value="${escapeAttr(senderPhone)}">
            </div>
            <div class="col-6">
              <label class="form-label small text-warning fw-semibold mb-1" style="font-size: 0.76rem;"><i class="bi bi-person-check-fill me-1"></i>WhatsApp Admin (Recebe os Alertas)</label>
              <input type="tel" class="form-control form-control-sm bg-dark text-white border-secondary" id="inpGatewayTargetPhone" value="${escapeAttr(targetPhone)}">
            </div>
          </div>

          <!-- Opção Principal: Gateway Corporativo Integrado (Baileys QR Code / Código 8 Dígitos) -->
          <div class="p-3 rounded-3 mb-3" style="background: rgba(37, 211, 102, 0.08); border: 1px solid rgba(37, 211, 102, 0.4);">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="fw-bold text-success small"><i class="bi bi-qr-code-scan me-1"></i>Conectar Número Remetente (<span id="lblSenderPhone">${escapeHtml(senderPhone)}</span>)</span>
              <span class="badge bg-warning text-dark" id="gwStatusBadge">A verificar sessão...</span>
            </div>
            <p class="small text-light opacity-75 mb-2" style="font-size: 0.79rem; line-height: 1.4;">
              Leia o QR Code abaixo com o WhatsApp <strong>${escapeHtml(senderPhone)}</strong> (ou use o código de 8 dígitos). Assim que conectar, o <strong>${escapeHtml(senderPhone)}</strong> enviará automaticamente todas as notificações e escalas para o seu WhatsApp <strong>${escapeHtml(targetPhone)}</strong>!
            </p>

            <div id="gwQrContainer" class="text-center py-3 px-2 rounded-3 mb-2" style="background: rgba(0,0,0,0.35); min-height: 210px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <div class="spinner-border text-success mb-2" role="status"></div>
              <div class="small text-secondary">A iniciar Gateway Corporativo e a gerar QR Code...</div>
            </div>

            <div id="gwPairingBox" class="d-none text-center p-3 mb-2 rounded-2" style="background: rgba(16, 185, 129, 0.15); border: 1px dashed #25D366;">
              <div class="small text-light mb-1">No telemóvel do número <strong id="lblPairingPhone">${escapeHtml(senderPhone)}</strong> vá a <strong>WhatsApp &gt; Dispositivos Associados &gt; Associar com número de telefone</strong> e digite:</div>
              <div class="d-flex align-items-center justify-content-center gap-2 my-2">
                <div class="fs-2 fw-bold text-warning py-1 px-3 rounded" id="gwPairingCodeDisplay" style="letter-spacing: 5px; font-family: monospace; background: rgba(0,0,0,0.4); border: 1px solid rgba(245,158,11,0.5);">---- ----</div>
                <button type="button" class="btn btn-sm btn-outline-warning py-2 px-3" id="btnCopyPairingCode" title="Copiar código">
                  <i class="bi bi-clipboard me-1"></i>Copiar
                </button>
              </div>
              <div class="small text-secondary" style="font-size: 0.75rem;">O código expira em ~60s se não for introduzido no WhatsApp do telemóvel.</div>
            </div>

            <div class="d-flex flex-wrap gap-2 justify-content-center mt-2">
              <button type="button" class="btn btn-sm btn-outline-success" id="btnRefreshQrGateway">
                <i class="bi bi-arrow-clockwise me-1"></i>Gerar Novo QR Code
              </button>
              <button type="button" class="btn btn-sm btn-outline-warning" id="btnGetPairingCode">
                <i class="bi bi-123 me-1"></i>Gerar Código de 8 Dígitos p/ <span id="btnLblSenderPhone">${escapeHtml(senderPhone)}</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline-danger d-none" id="btnDisconnectGateway">
                <i class="bi bi-power me-1"></i>Desconectar Sessão
              </button>
            </div>
          </div>

          <!-- Opções Avançadas (Meta Cloud API / Webhook Externo / CallMeBot) -->
          <details class="mb-3">
            <summary class="small text-info fw-semibold" style="cursor: pointer;">
              <i class="bi bi-sliders me-1"></i>Opções Alternativas: Meta Cloud API Oficial / Webhook Externo / CallMeBot
            </summary>
            <div class="p-3 rounded-3 mt-2" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);">
              <div class="mb-2">
                <label class="form-label small text-secondary mb-1" style="font-size: 0.75rem;">URL de Webhook Externo / Evolution API / UltraMsg</label>
                <input type="url" class="form-control form-control-sm bg-dark text-white border-secondary" id="inpModalWhatsAppWebhook" placeholder="https://sua-api-whatsapp.com/send" value="${escapeAttr(cfg.webhook || "")}">
              </div>
              <div class="row g-2 mb-2">
                <div class="col-5">
                  <label class="form-label small text-secondary mb-1" style="font-size: 0.75rem;">Meta Phone ID</label>
                  <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary" id="inpModalCloudPhoneId" placeholder="Phone Number ID" value="${escapeAttr(cfg.cloudPhoneId || "")}">
                </div>
                <div class="col-7">
                  <label class="form-label small text-secondary mb-1" style="font-size: 0.75rem;">Meta Cloud API Bearer Token</label>
                  <input type="password" class="form-control form-control-sm bg-dark text-white border-secondary" id="inpModalCloudToken" placeholder="EAAG..." value="${escapeAttr(cfg.cloudToken || "")}">
                </div>
              </div>
              <div>
                <label class="form-label small text-secondary mb-1" style="font-size: 0.75rem;">CallMeBot API Key (Opcional)</label>
                <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary" id="inpModalWhatsAppApiKey" placeholder="Ex: 4829103" value="${escapeAttr(cfg.apiKey || "")}">
              </div>
            </div>
          </details>

          <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" id="btnCancelDirectWASetup">Fechar</button>
            <button type="button" class="btn btn-sm btn-success fw-bold px-3" id="btnSaveDirectWASetup" style="background: #25D366; border-color: #25D366; color: #000;">
              <i class="bi bi-send-check-fill me-1"></i> Guardar & Testar Envio Direto Agora
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    let pollInterval = null;
    const statusBadge = modal.querySelector("#gwStatusBadge");
    const qrContainer = modal.querySelector("#gwQrContainer");
    const pairingBox = modal.querySelector("#gwPairingBox");
    const pairingCodeDisplay = modal.querySelector("#gwPairingCodeDisplay");
    const disconnectBtn = modal.querySelector("#btnDisconnectGateway");
    const senderInput = modal.querySelector("#inpGatewaySenderPhone");
    const targetInput = modal.querySelector("#inpGatewayTargetPhone");

    if (senderInput) {
      senderInput.oninput = () => {
        const val = senderInput.value.trim() || DEFAULT_GATEWAY_SENDER_PHONE;
        const lbl1 = modal.querySelector("#lblSenderPhone");
        const lbl2 = modal.querySelector("#lblPairingPhone");
        const lbl3 = modal.querySelector("#btnLblSenderPhone");
        if (lbl1) lbl1.textContent = val;
        if (lbl2) lbl2.textContent = val;
        if (lbl3) lbl3.textContent = val;
      };
    }

    let lastRenderedQr = null;
    let rawPairingCode = null;

    function formatCode(c) {
      if (!c) return "";
      const s = String(c).trim().toUpperCase();
      if (s.length === 8 && !s.includes("-")) {
        return `${s.slice(0, 4)}-${s.slice(4)}`;
      }
      return s;
    }

    function renderGatewayStatus(data) {
      if (!data) return;
      const currentTarget = targetInput?.value.trim() || targetPhone;
      const currentSender = senderInput?.value.trim() || senderPhone;

      // Sincronizar Código de Emparelhamento instantaneamente quando disponível
      if (data.pairingCode || data.formattedPairingCode) {
        rawPairingCode = data.pairingCode || data.formattedPairingCode;
        if (pairingBox && pairingCodeDisplay) {
          pairingBox.classList.remove("d-none");
          pairingCodeDisplay.textContent = data.formattedPairingCode || formatCode(data.pairingCode);
        }
      }

      if (data.connected) {
        try { localStorage.setItem("ce-admin-whatsapp-gateway-connected", "true"); } catch (_) {}
        if (statusBadge) {
          statusBadge.className = "badge bg-success text-dark fw-bold";
          statusBadge.textContent = "🟢 CONECTADO & ATIVO";
        }
        if (disconnectBtn) disconnectBtn.classList.remove("d-none");
        if (pairingBox) pairingBox.classList.add("d-none");
        lastRenderedQr = null;
        if (qrContainer) {
          const connectedPhone = data.connectedUser?.phone || currentSender;
          const connectedName = data.connectedUser?.name || "Gateway Corporativo CE Portal";
          qrContainer.innerHTML = `
            <div class="d-flex align-items-center justify-content-center rounded-circle mb-2" style="width: 64px; height: 64px; background: rgba(37, 211, 102, 0.2); color: #25D366; font-size: 2rem;">
              <i class="bi bi-check-circle-fill"></i>
            </div>
            <h6 class="text-success fw-bold mb-1">Gateway Corporativo Conectado!</h6>
            <div class="small text-white mb-1">Remetente Ativo: <strong>${escapeHtml(connectedPhone)}</strong> (${escapeHtml(connectedName)})</div>
            <div class="small text-secondary">Envia automaticamente todas as notificações e escalas em 2.º plano para <strong>${escapeHtml(currentTarget)}</strong>.</div>
          `;
        }
      } else if (data.qrDataUrl) {
        if (statusBadge) {
          statusBadge.className = "badge bg-warning text-dark fw-bold";
          statusBadge.textContent = "📷 AGUARDANDO LEITURA / CÓDIGO";
        }
        if (disconnectBtn) disconnectBtn.classList.add("d-none");
        // Only update innerHTML if QR has actually changed (prevents flicker / infinite reload)
        if (qrContainer && lastRenderedQr !== data.qrDataUrl) {
          lastRenderedQr = data.qrDataUrl;
          qrContainer.innerHTML = `
            <div class="bg-white p-2 rounded-3 shadow-sm mb-2" style="display: inline-block;">
              <img src="${data.qrDataUrl}" alt="WhatsApp QR Code" style="width: 220px; height: 220px; display: block;">
            </div>
            <div class="small text-light fw-semibold">No WhatsApp do número <strong>${escapeHtml(currentSender)}</strong> &rarr; <strong>Dispositivos Associados</strong> &rarr; <strong>Associar um dispositivo</strong></div>
          `;
        }
      } else if (data.state === "connecting") {
        if (statusBadge) {
          statusBadge.className = "badge bg-info text-dark";
          statusBadge.textContent = "⏳ A GERAR QR CODE...";
        }
      } else {
        // Disconnected or error
        if (statusBadge) {
          statusBadge.className = "badge bg-secondary text-white";
          statusBadge.textContent = "⚪ DESCONECTADO";
        }
        if (qrContainer && !lastRenderedQr) {
          qrContainer.innerHTML = `
            <i class="bi bi-broadcast text-warning fs-3 mb-2"></i>
            <div class="small text-light mb-2">${escapeHtml(data.lastError || "Gateway pronto para conectar.")}</div>
            <button type="button" class="btn btn-sm btn-success" id="btnRetryGatewayConnect">
              <i class="bi bi-arrow-clockwise me-1"></i> Iniciar Conexão / Gerar QR Code
            </button>
          `;
          const retryBtn = qrContainer.querySelector("#btnRetryGatewayConnect");
          if (retryBtn) {
            retryBtn.onclick = () => {
              qrContainer.innerHTML = `<div class="spinner-border text-success mb-2" role="status"></div><div class="small text-secondary">A iniciar Gateway...</div>`;
              triggerGatewayConnect(true);
            };
          }
        }
      }
    }

    async function pollGatewayStatus() {
      try {
        const res = await fetch("/api/whatsapp/status");
        if (res.ok) {
          const data = await res.json();
          renderGatewayStatus(data);
        }
      } catch (_) {}
    }

    async function triggerGatewayConnect(forceNew = false) {
      try {
        const res = await fetch("/api/whatsapp/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            forceNew,
            pairingPhone: senderInput?.value?.trim() || senderPhone
          })
        });
        if (res.ok) {
          const data = await res.json();
          renderGatewayStatus(data);
        }
      } catch (_) {}
    }

    // Start connection & polling immediately
    triggerGatewayConnect(false);
    pollInterval = setInterval(pollGatewayStatus, 2000);

    const closeModal = () => {
      if (pollInterval) clearInterval(pollInterval);
      modal.remove();
    };

    modal.querySelector("#btnCloseDirectWASetup").onclick = closeModal;
    modal.querySelector("#btnCancelDirectWASetup").onclick = closeModal;

    const copyBtn = modal.querySelector("#btnCopyPairingCode");
    if (copyBtn) {
      copyBtn.onclick = () => {
        const textToCopy = rawPairingCode || pairingCodeDisplay?.textContent?.replace(/[-\s]+/g, "") || "";
        if (textToCopy && navigator.clipboard) {
          navigator.clipboard.writeText(textToCopy).then(() => {
            copyBtn.innerHTML = '<i class="bi bi-check2 text-success me-1"></i>Copiado!';
            setTimeout(() => {
              copyBtn.innerHTML = '<i class="bi bi-clipboard me-1"></i>Copiar';
            }, 2500);
          });
        }
      };
    }

    modal.querySelector("#btnRefreshQrGateway").onclick = () => {
      lastRenderedQr = null;
      if (qrContainer) {
        qrContainer.innerHTML = `<div class="spinner-border text-success mb-2" role="status"></div><div class="small text-secondary">A gerar novo QR Code...</div>`;
      }
      triggerGatewayConnect(true);
    };

    const btnGetPairingCode = modal.querySelector("#btnGetPairingCode");
    if (btnGetPairingCode) {
      btnGetPairingCode.onclick = async () => {
        const pairPhone = senderInput?.value.trim() || DEFAULT_GATEWAY_SENDER_PHONE;
        const originalText = btnGetPairingCode.innerHTML;
        btnGetPairingCode.disabled = true;
        btnGetPairingCode.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status"></span> A contactar WhatsApp...`;

        if (pairingBox && pairingCodeDisplay) {
          pairingBox.classList.remove("d-none");
          pairingCodeDisplay.textContent = "A GERAR...";
        }

        try {
          const res = await fetch("/api/whatsapp/pairing-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: pairPhone })
          });
          const data = await res.json();
          if (data.ok && data.pairingCode) {
            rawPairingCode = data.pairingCode;
            const formatted = data.formattedCode || formatCode(data.pairingCode);
            if (pairingCodeDisplay) pairingCodeDisplay.textContent = formatted;
            if (pairingBox) pairingBox.classList.remove("d-none");
          } else {
            if (pairingCodeDisplay) pairingCodeDisplay.textContent = data.error || "Tente novamente";
          }
        } catch (err) {
          if (pairingCodeDisplay) pairingCodeDisplay.textContent = "Erro ao contactar servidor";
        } finally {
          btnGetPairingCode.disabled = false;
          btnGetPairingCode.innerHTML = originalText;
        }
      };
    }

    if (disconnectBtn) {
      disconnectBtn.onclick = async () => {
        try { localStorage.removeItem("ce-admin-whatsapp-gateway-connected"); } catch (_) {}
        lastRenderedQr = null;
        rawPairingCode = null;
        await fetch("/api/whatsapp/logout", { method: "POST" });
        triggerGatewayConnect(true);
      };
    }

    modal.querySelector("#btnSaveDirectWASetup").onclick = () => {
      const updatedSender = senderInput?.value.trim() || DEFAULT_GATEWAY_SENDER_PHONE;
      const updatedTarget = targetInput?.value.trim() || DEFAULT_ADMIN_WHATSAPP_PHONE;
      const apiKey = modal.querySelector("#inpModalWhatsAppApiKey")?.value.trim() || "";
      const webhook = modal.querySelector("#inpModalWhatsAppWebhook")?.value.trim() || "";
      const cloudPhoneId = modal.querySelector("#inpModalCloudPhoneId")?.value.trim() || "";
      const cloudToken = modal.querySelector("#inpModalCloudToken")?.value.trim() || "";

      saveAdminWhatsAppConfig({
        phone: updatedTarget,
        senderPhone: updatedSender,
        enabled: true,
        apiKey,
        webhook,
        cloudPhoneId,
        cloudToken
      });

      const pagePhoneInput = document.getElementById("inpAdminWhatsAppPhone");
      if (pagePhoneInput) pagePhoneInput.value = updatedTarget;
      const pageApiKeyInput = document.getElementById("inpAdminWhatsAppApiKey");
      if (pageApiKeyInput) pageApiKeyInput.value = apiKey;
      const pageWebhookInput = document.getElementById("inpAdminWhatsAppWebhook");
      if (pageWebhookInput) pageWebhookInput.value = webhook;

      closeModal();
      testAdminWhatsAppNotification("media_schedule");
    };
  }

  function formatNotificationForAdminWhatsApp(notification) {
    const isPt = getLang() === "pt";
    const mod = String(notification.module || "system").toUpperCase();
    const isSchedule = notification.entity_type === "media_schedule" || notification.module === "media";
    const nowStr = new Date(notification.created_at || Date.now()).toLocaleString("pt-MZ");

    let text = `👑 *CHRIST EMBASSY MOZAMBIQUE*\n`;
    text += `🔔 *ALERTA OPERACIONAL — WHATSAPP ADMIN*\n`;
    text += `----------------------------------------\n`;

    if (isSchedule) {
      text += `🎬 *DEPARTAMENTO DE MÍDIA & ESCALAS TÉCNICAS*\n`;
      text += `📌 *${notification.title || (isPt ? "Nova Escala Registada" : "New Schedule Registered")}*\n`;
      text += `----------------------------------------\n`;
      text += `${notification.message}\n\n`;
      if (notification.metadata) {
        if (notification.metadata.service_name) text += `⛪ *Culto:* ${notification.metadata.service_name}\n`;
        if (notification.metadata.service_date) text += `🗓️ *Data:* ${notification.metadata.service_date}${notification.metadata.start_time ? ` às ${notification.metadata.start_time}` : ""}\n`;
        if (notification.metadata.supervisor) text += `👤 *Supervisor:* ${notification.metadata.supervisor}\n`;
        if (notification.metadata.assignments_count !== undefined) text += `👥 *Técnicos Alocados:* ${notification.metadata.assignments_count}\n`;
        if (Array.isArray(notification.metadata.assignments) && notification.metadata.assignments.length) {
          text += `\n📋 *Equipa Escalada:*\n`;
          notification.metadata.assignments.forEach((a) => {
            const rName = a.role_name || a.role_key || "Técnico";
            const tName = a.technician_name || "A designar";
            text += `  • *${rName}:* ${tName}\n`;
          });
        }
      }
    } else {
      let deptEmoji = "📁";
      if (mod.includes("FINANCE") || mod.includes("FINAN")) deptEmoji = "💰";
      else if (mod.includes("CELL") || mod.includes("CÉLULA")) deptEmoji = "🌱";
      else if (mod.includes("REQ")) deptEmoji = "📦";
      else if (mod.includes("COUNSEL") || mod.includes("ACONSELH")) deptEmoji = "🕊️";
      else if (mod.includes("STAFF") || mod.includes("HR")) deptEmoji = "👥";
      else if (mod.includes("FEVO") || mod.includes("EVANG")) deptEmoji = "🔥";
      else if (mod.includes("FIRST") || mod.includes("PRIMEIRA")) deptEmoji = "🌟";
      else if (mod.includes("SACRAMENT")) deptEmoji = "✝️";
      else if (mod.includes("FOUNDATION")) deptEmoji = "📖";

      text += `${deptEmoji} *Departamento:* _${mod}_\n`;
      text += `⚡ *Prioridade:* ${notification.priority === "urgent" ? "🚨 Urgente" : notification.priority === "high" ? "⚡ Alta" : "📌 Normal"}\n`;
      text += `📌 *Assunto:* ${notification.title}\n`;
      text += `----------------------------------------\n`;
      text += `${notification.message}\n`;
    }

    text += `\n🕒 *Horário:* ${nowStr}\n`;
    if (notification.action_url) {
      text += `🔗 *Aceder ao Portal:* https://portal.embaixadadecristo.org/#${notification.action_url}\n`;
    } else {
      text += `🔗 *Portal:* https://portal.embaixadadecristo.org\n`;
    }
    text += `\n_Notificação administrativa em tempo real — CE Portal Operations_`;
    return text;
  }

  function showAdminWhatsAppBanner(notification, phone, text, deliveryPromise) {
    if (typeof document === "undefined" || !document.body) return;
    let host = document.getElementById("ceAdminWhatsAppBannerHost");
    if (!host) {
      host = document.createElement("div");
      host.id = "ceAdminWhatsAppBannerHost";
      host.style.cssText = "position: fixed; bottom: 24px; right: 24px; z-index: 1060; max-width: 440px; width: 100%; pointer-events: none;";
      document.body.appendChild(host);
    }

    const isSchedule = notification.entity_type === "media_schedule" || notification.module === "media";
    const bannerId = `wa-banner-${Date.now()}`;
    const targetPhone = phone || DEFAULT_ADMIN_WHATSAPP_PHONE;
    const encUrl = buildWhatsAppUrl(targetPhone, text);
    const cfg = getAdminWhatsAppConfig();

    const banner = document.createElement("div");
    banner.id = bannerId;
    banner.style.cssText = "pointer-events: auto; margin-top: 10px; background: linear-gradient(135deg, #0d1527, #112240); border: 1px solid #25D366; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.7); color: #fff; padding: 14px 16px; animation: slideInUp 0.3s ease;";

    banner.innerHTML = `
      <div class="d-flex align-items-start gap-3">
        <div class="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style="width: 42px; height: 42px; background: rgba(37, 211, 102, 0.2); color: #25D366; font-size: 1.35rem;">
          <i class="bi ${isSchedule ? "bi-calendar2-check-fill" : "bi-whatsapp"}"></i>
        </div>
        <div class="flex-grow-1 min-w-0">
          <div class="d-flex align-items-center justify-content-between mb-1">
            <span class="badge bg-success text-dark fw-bold" data-wa-status-badge style="font-size: 0.72rem;">
              ${cfg.hasDirectGateway ? `⏳ A ENVIAR DIRETO P/ ${escapeHtml(targetPhone)}...` : `🔔 ALERTA ADMIN (${escapeHtml(targetPhone)})`}
            </span>
            <button type="button" class="btn-close btn-close-white btn-sm" aria-label="Fechar" style="font-size: 0.75rem;"></button>
          </div>
          <h6 class="mb-1 text-white fw-bold text-truncate" style="font-size: 0.92rem;">${escapeHtml(notification.title || "Novo Alerta")}</h6>
          <p class="mb-2 text-secondary text-truncate-2" style="font-size: 0.8rem; line-height: 1.3;">${escapeHtml(notification.message || "")}</p>
          <div class="small mb-2 px-2 py-1 rounded" data-wa-status-note style="background: rgba(37,211,102,0.1); border: 1px solid rgba(37,211,102,0.25); font-size: 0.76rem; color: #a7f3d0;">
            ${cfg.hasDirectGateway
              ? `<i class="bi bi-cloud-arrow-up-fill me-1"></i>A disparar diretamente do Portal para o WhatsApp <strong>${escapeHtml(targetPhone)}</strong> em segundo plano...`
              : `<i class="bi bi-lightning-charge-fill text-warning me-1"></i>Ative a <strong>API Direta Gratuita</strong> (1 clique) para o Portal enviar sozinho sem abrir o seu WhatsApp.`}
          </div>
          <div class="d-flex align-items-center flex-wrap gap-2">
            <button type="button" class="btn btn-sm btn-success fw-bold py-1 px-2 d-inline-flex align-items-center gap-1 btn-setup-direct-wa" style="background: #25D366; border-color: #25D366; color: #000; font-size: 0.78rem;">
              <i class="bi bi-lightning-charge-fill"></i> ${cfg.hasDirectGateway ? "Configurar Gateway Direto" : "Ativar Envio Direto (Sem abrir App)"}
            </button>
            <a href="${encUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-success py-1 px-2 d-inline-flex align-items-center gap-1" style="font-size: 0.76rem;" title="Abrir manualmente no WhatsApp Web/App">
              <i class="bi bi-box-arrow-up-right"></i> Abrir App
            </a>
            <button type="button" class="btn btn-sm btn-outline-light py-1 px-2 btn-dismiss-banner" style="font-size: 0.76rem;">
              Fechar
            </button>
          </div>
        </div>
      </div>
    `;

    const closeBtn = banner.querySelector(".btn-close");
    const dismissBtn = banner.querySelector(".btn-dismiss-banner");
    const setupBtn = banner.querySelector(".btn-setup-direct-wa");
    const statusBadge = banner.querySelector("[data-wa-status-badge]");
    const statusNote = banner.querySelector("[data-wa-status-note]");

    const removeBanner = () => {
      banner.style.opacity = "0";
      banner.style.transform = "translateY(10px)";
      banner.style.transition = "all 0.25s ease";
      setTimeout(() => banner.remove(), 250);
    };

    if (closeBtn) closeBtn.onclick = removeBanner;
    if (dismissBtn) dismissBtn.onclick = removeBanner;
    if (setupBtn) {
      setupBtn.onclick = () => {
        openDirectWhatsAppSetupModal();
      };
    }

    if (deliveryPromise && typeof deliveryPromise.then === "function") {
      deliveryPromise.then((res) => {
        if (!statusBadge || !statusNote) return;
        if (res && res.ok) {
          statusBadge.textContent = `✅ ENVIADO DIRETO P/ ${targetPhone}`;
          statusNote.innerHTML = `<i class="bi bi-check-circle-fill text-success me-1"></i><strong>Entregue diretamente do Portal</strong> para o WhatsApp <strong>${escapeHtml(targetPhone)}</strong> (via ${escapeHtml(res.provider || "API Direta")})!`;
        } else if (res && !res.needsSetup) {
          statusBadge.textContent = `⚠️ ERRO NA CHAVE API (${targetPhone})`;
          statusNote.innerHTML = `<i class="bi bi-exclamation-triangle-fill text-warning me-1"></i>Verifique a sua API Key / Webhook em <strong>Configurar Gateway Direto</strong>. ${escapeHtml(res.detail || res.error || "")}`;
        }
      }).catch(() => {});
    }

    // Auto-remove after 25 seconds
    setTimeout(() => {
      if (document.getElementById(bannerId)) removeBanner();
    }, 25000);

    host.appendChild(banner);
  }

  const waDispatchDebounceMap = new Map();

  function dispatchAdminWhatsAppNotification(notification, options = {}) {
    if (!notification) return;
    const config = getAdminWhatsAppConfig();
    if (!config.enabled) return;

    // Check if active user is Admin / Super Admin or phone is present
    const user = (typeof window !== "undefined" && window.activeUser) || {};
    const isAdmin = user.role === "Super Admin" || user.role === "Admin" || (user.roles || []).includes("superadmin") || (user.department_permissions || []).includes("*");
    if (!isAdmin && !config.phone) return;

    // Skip private personal notifications intended for other non-admin users
    const adminUserIds = ["9691d45a-e613-4fa3-8cb5-43955f39aa66", "f8d9954c-a17b-4870-98f6-a7d6f2576391", user && user.id].filter(Boolean);
    if (notification.recipient_user_id && notification.scope === "user" && !adminUserIds.includes(String(notification.recipient_user_id))) {
      return Promise.resolve({ ok: true, skippedNonAdminUser: true });
    }

    // Deduplication / Debounce: Prevent sending multiple WhatsApp messages for the same entity/event within 2 minutes
    const dedupeKey = (notification.entity_type && notification.entity_id)
      ? (notification.entity_type + ":" + notification.entity_id)
      : (String(notification.title || "") + ":" + String(notification.message || ""));
    const now = Date.now();
    if (waDispatchDebounceMap.has(dedupeKey) && (now - waDispatchDebounceMap.get(dedupeKey)) < 120000) {
      console.info("[WhatsApp Hub] Debounced duplicate notification for WhatsApp:", dedupeKey);
      return Promise.resolve({ ok: true, debounced: true });
    }
    waDispatchDebounceMap.set(dedupeKey, now);

    const phone = config.phone || user.phone || DEFAULT_ADMIN_WHATSAPP_PHONE;
    const formattedText = formatNotificationForAdminWhatsApp(notification);

    // 1. Send directly in the background from the Portal to WhatsApp (CallMeBot / Meta Cloud API / Webhook)
    const deliveryPromise = sendDirectWhatsAppMessage(phone, formattedText, notification);

    // 2. CRITICAL: NEVER show WhatsApp banner to regular users (Cell Leaders, Members, Staff)!
    // Regular users must only see standard clean in-app toasts.
    // The banner is only displayed for explicit manual tests or when options.showBanner is explicitly requested by an Admin.
    if (typeof options !== "undefined" && options && options.showBanner && isAdmin) {
      showAdminWhatsAppBanner(notification, phone, formattedText, deliveryPromise);
    }

    return deliveryPromise;
  }

  function testAdminWhatsAppNotification(sampleType = "media_schedule") {
    const isSchedule = sampleType === "media_schedule";
    const sampleNotif = {
      id: `test-wa-${Date.now()}`,
      title: isSchedule ? "🎬 Nova Escala de Mídia Criada: Culto de Celebração de Domingo" : "💰 Nova Entrada Financeira Registada",
      message: isSchedule
        ? "Foi registada uma nova escala técnica para o culto de Domingo às 08:30 (E.C. Maputo Central - Sede). 4 técnicos alocados."
        : "Foi registada uma nova contribuição de dízimo e ofertas no valor de 25.000 MTn para verificação.",
      module: isSchedule ? "media" : "finance",
      entity_type: isSchedule ? "media_schedule" : "finance_entry",
      entity_id: "sch-test-01",
      priority: "high",
      action_url: isSchedule ? "media" : "finance",
      created_at: new Date().toISOString(),
      metadata: isSchedule ? {
        service_name: "Culto de Celebração de Domingo",
        service_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
        start_time: "08:30",
        supervisor: "Coordenação de Mídia",
        assignments_count: 4,
        assignments: [
          { role_name: "Operador de Vídeo Principal", technician_name: "Carlos Muianga" },
          { role_name: "Operador de Áudio & Som", technician_name: "Nelson Sitoe" },
          { role_name: "Transmissão & Live Stream", technician_name: "João Cossa" },
          { role_name: "Projeção & Telão", technician_name: "Marta Guambe" }
        ]
      } : {}
    };

    // Dispatches directly in background from the portal (NEVER forces window.open to wa.me)
    dispatchAdminWhatsAppNotification(sampleNotif, { showBanner: true });
    return sampleNotif;
  }

  // Expose module globally
  window.CEWhatsAppHub = {
    DEFAULT_ADMIN_WHATSAPP_PHONE,
    cleanPhone,
    buildWhatsAppUrl,
    buildWhatsAppGroupUrl,
    formatNotificationForWhatsApp,
    formatServiceScheduleForWhatsApp,
    formatPortalPostForWhatsApp,
    resolveContactsForTarget,
    openWhatsAppDispatchModal,
    dispatchNotificationToWhatsApp,
    dispatchChurchScheduleToWhatsApp,
    dispatchPostToWhatsApp,
    getPortalPosts,
    savePortalPosts,
    openCreatePostModal,
    renderPortalPosts,
    // Admin WhatsApp Real-Time Notification Engine
    getAdminWhatsAppConfig,
    saveAdminWhatsAppConfig,
    sendDirectWhatsAppMessage,
    openDirectWhatsAppSetupModal,
    formatNotificationForAdminWhatsApp,
    showAdminWhatsAppBanner,
    dispatchAdminWhatsAppNotification,
    testAdminWhatsAppNotification,
    ensureHtml2Pdf,
    generateHtmlPdfBlob
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEventDelegation);
  } else {
    initEventDelegation();
  }

  if (typeof window !== "undefined") {
    window.addEventListener("ce:languageChanged", function () {
      if (window.activeRoute === "portalPosts" && typeof renderPortalPosts === "function") {
        renderPortalPosts();
      }
    });
  }
})();
