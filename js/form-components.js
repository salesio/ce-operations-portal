/**
 * Reusable relational form components for churches and Mozambique locations.
 * Expects mozambique-locations.js to be loaded first.
 */

function getChurchOptions(churches = []) {
  return churches.map((church) => {
    const normalized = typeof normalizeLocationValues === "function"
      ? normalizeLocationValues(church.province, church.city)
      : { province: church.province, city: church.city };
    return {
      id: church.id || church.church_id,
      church_name: church.church_name || "",
      public_name: church.public_name || church.church_name || "",
      province: normalized.province || church.province || "",
      city: normalized.city || church.city || "",
      district_or_area: church.district_or_area || "",
      status: church.status || "",
      service_times: church.service_times || []
    };
  });
}

function churchOptionLabel(church) {
  const name = church.public_name || church.church_name || church.id;
  const city = church.city || "-";
  const province = church.province || "-";
  return `${name} — ${city} / ${province}`;
}

function provinceSelect(name, label, record = {}, options = {}) {
  const t = options.translate || ((key) => key);
  const colClass = options.colClass || "col-md-6";
  const normalized = normalizeLocationValues(record.province, record.city);
  const value = normalized.province || record.province || "";
  const provinces = getProvinceList();
  const placeholder = t("selectProvince");
  const disabled = options.disabled ? "disabled" : "";
  const extraAttrs = options.attrs || "";
  return `
    <div class="${colClass}">
      <label class="form-label" for="${name}">${label}</label>
      <select id="${name}" name="${name}" class="form-select relational-province-select" data-province-select data-city-target="${options.cityTarget || ""}" ${disabled} ${extraAttrs}>
        <option value="">${placeholder}</option>
        ${provinces.map((province) => `<option value="${province}" ${value === province ? "selected" : ""}>${province}</option>`).join("")}
      </select>
    </div>`;
}

function citySelect(name, label, record = {}, options = {}) {
  const t = options.translate || ((key) => key);
  const colClass = options.colClass || "col-md-6";
  const normalized = normalizeLocationValues(record.province, record.city);
  const province = normalized.province || record.province || "";
  const value = normalized.city || record.city || "";
  const cities = province ? getCitiesForProvince(province) : [];
  const placeholder = t("selectCity");
  const disabled = !province || options.disabled ? "disabled" : "";
  const extraAttrs = options.attrs || "";
  return `
    <div class="${colClass}">
      <label class="form-label" for="${name}">${label}</label>
      <select id="${name}" name="${name}" class="form-select relational-city-select" data-city-select data-province-source="${options.provinceSource || ""}" ${disabled} ${extraAttrs}>
        <option value="">${placeholder}</option>
        ${cities.map((city) => `<option value="${city}" ${value === city ? "selected" : ""}>${city}</option>`).join("")}
      </select>
    </div>`;
}

function churchSelect(name, label, record = {}, options = {}) {
  const t = options.translate || ((key) => key);
  const colClass = options.colClass || (options.showInfoCard ? "col-12" : "col-md-6");
  const churches = getChurchOptions(options.churches || []);
  const value = record[name] || record.church_id || "";
  const placeholder = t("selectChurch");
  const readonly = options.readonly ? "disabled" : "";
  const showAddLink = options.canAddChurch && !options.readonly;
  const infoCardId = options.infoCardId || `church-info-${name}`;
  const autofill = (options.autofillFields || []).join(",");
  const noChurches = !churches.length;

  let addChurchHtml = "";
  if (showAddLink) {
    addChurchHtml = `<button type="button" class="btn btn-sm btn-outline-light church-select-add-btn" data-open-church-form>${t("addNewChurch")}</button>`;
  }

  return `
    <div class="${options.fullWidth ? "col-12" : colClass} church-select-wrap" data-church-select-wrap>
      <label class="form-label" for="${name}">${label}</label>
      <select id="${name}" name="${name}" class="form-select relational-church-select" data-church-select data-autofill="${autofill}" data-info-card="${infoCardId}" data-igreja-field="${options.igrejaField || ""}" ${options.selectAttrs || ""} ${readonly || (noChurches && !showAddLink ? "disabled" : "")}>
        <option value="">${noChurches ? t("noChurchRegistered") : placeholder}</option>
        ${churches.map((church) => `<option value="${church.id}" ${value === church.id ? "selected" : ""}>${churchOptionLabel(church)}</option>`).join("")}
      </select>
      ${noChurches ? `<small class="text-white-50 d-block mt-1">${t("noChurchRegistered")}</small>` : ""}
      ${addChurchHtml}
      ${options.showInfoCard ? `<div id="${infoCardId}" class="church-info-card mt-2" data-church-info-card></div>` : ""}
      ${options.igrejaField ? `<input type="hidden" name="${options.igrejaField}" value="${record[options.igrejaField] || ""}">` : ""}
      ${(options.autofillFields || []).filter((field) => field !== name).map((field) => `<input type="hidden" name="${field}" data-church-autofill="${field}" value="${record[field] || ""}">`).join("")}
    </div>`;
}

function churchInfoCard(church, options = {}) {
  const t = options.translate || ((key) => key);
  if (!church) {
    return `<div class="church-info-card church-info-card--empty"><span>${t("selectChurch")}</span></div>`;
  }
  const normalized = normalizeLocationValues(church.province, church.city);
  const name = church.public_name || church.church_name || "-";
  const serviceTimesHtml = typeof options.renderServiceTimes === "function"
    ? options.renderServiceTimes(church.service_times)
    : (church.service_times || []).filter((item) => item.is_active !== false).map((item) => {
      const line = [item.day_of_week, item.service_name, item.time].filter(Boolean).join(" · ");
      return line ? `<li>${line}</li>` : "";
    }).filter(Boolean).join("");

  return `
    <div class="church-info-card">
      <div class="church-info-card-row"><span>${t("church")}</span><strong>${name}</strong></div>
      <div class="church-info-card-row"><span>${t("province")}</span><strong>${normalized.province || church.province || "-"}</strong></div>
      <div class="church-info-card-row"><span>${t("cityDistrict")}</span><strong>${normalized.city || church.city || "-"}</strong></div>
      ${church.district_or_area ? `<div class="church-info-card-row"><span>${t("areaNeighborhood")}</span><strong>${church.district_or_area}</strong></div>` : ""}
      <div class="church-info-card-row church-info-card-row--times">
        <span>${t("serviceTimesShort")}</span>
        ${serviceTimesHtml ? `<ul class="church-info-card-times">${serviceTimesHtml}</ul>` : `<strong>${t("toBeConfirmed")}</strong>`}
      </div>
    </div>`;
}

function populateCitySelect(citySelectEl, province, selectedCity = "") {
  if (!citySelectEl) return;
  const t = citySelectEl.closest("form")?.__translate || ((key) => {
    if (key === "selectCity") return citySelectEl.querySelector("option")?.textContent || "Select city";
    return key;
  });
  const cities = province ? getCitiesForProvince(province) : [];
  citySelectEl.innerHTML = `<option value="">${typeof window !== "undefined" && typeof L === "function" ? L("selectCity") : "Select city"}</option>${cities.map((city) => `<option value="${city}" ${selectedCity === city ? "selected" : ""}>${city}</option>`).join("")}`;
  citySelectEl.disabled = !province;
  if (selectedCity) citySelectEl.value = selectedCity;
}

function findChurchById(churches, id) {
  return (churches || []).find((item) => item.id === id || item.church_id === id) || null;
}

function applyChurchSelection(selectEl, churches, options = {}) {
  if (!selectEl) return;
  const churchId = selectEl.value;
  const church = findChurchById(churches, churchId);
  const wrap = selectEl.closest("[data-church-select-wrap]") || selectEl.closest("form");
  const autofillFields = (selectEl.dataset.autofill || "").split(",").filter(Boolean);

  autofillFields.forEach((field) => {
    const input = wrap?.querySelector(`[data-church-autofill="${field}"]`) || wrap?.querySelector(`[name="${field}"]`);
    if (!input) return;
    if (field === "province") input.value = church?.province || "";
    else if (field === "city") input.value = church?.city || "";
    else if (field === "district_or_area") input.value = church?.district_or_area || "";
    else if (field === "church_id") input.value = churchId;
  });

  const igrejaField = selectEl.dataset.igrejaField;
  if (igrejaField) {
    const igrejaInput = wrap?.querySelector(`[name="${igrejaField}"]`);
    if (igrejaInput) {
      igrejaInput.value = church ? (church.public_name || church.church_name || "") : "";
    }
  }

  const infoCardEl = document.getElementById(selectEl.dataset.infoCard || "");
  if (infoCardEl) {
    infoCardEl.innerHTML = churchInfoCard(church, {
      translate: options.translate,
      renderServiceTimes: options.renderServiceTimes
    });
  }
}

function initRelationalFormControls(form, options = {}) {
  if (!form) return;
  const churches = options.churches || [];
  const translate = options.translate || ((key) => key);

  form.querySelectorAll("[data-province-select]").forEach((provinceSelectEl) => {
    const cityName = provinceSelectEl.dataset.cityTarget;
    const citySelectEl = cityName ? form.querySelector(`[name="${cityName}"]`) : form.querySelector("[data-city-select]");
    const refresh = () => {
      const province = provinceSelectEl.value;
      const currentCity = citySelectEl?.value || "";
      populateCitySelect(citySelectEl, province, province ? currentCity : "");
      if (!province && citySelectEl) citySelectEl.value = "";
    };
    provinceSelectEl.addEventListener("change", () => {
      populateCitySelect(citySelectEl, provinceSelectEl.value, "");
    });
    refresh();
  });

  form.querySelectorAll("[data-church-select]").forEach((selectEl) => {
    const update = () => applyChurchSelection(selectEl, churches, options);
    selectEl.addEventListener("change", update);
    if (selectEl.value) update();
  });
}

const ProvinceSelect = provinceSelect;
const CitySelect = citySelect;
const ChurchSelect = churchSelect;
const ChurchInfoCard = churchInfoCard;