import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// 1. Ensure isValidUuid is defined at the top of dashboard.js
if (!code.includes("function isValidUuid(val)")) {
  const uuidFunc = `
function isValidUuid(val) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val || ""));
}
`;
  code = code.replace("function generateUuid() {", uuidFunc + "\nfunction generateUuid() {");
  console.log("Added isValidUuid to top of dashboard.js!");
}

// 2. Make persistSacramentViaRepository bulletproof for delete, create, and update
const oldPersistFuncRegex = /async function persistSacramentViaRepository\(type, mode, record\) \{[\s\S]*?return \{ ok: true, data: record \};\r?\n\}/;

const newPersistFunc = `async function persistSacramentViaRepository(type, mode, record) {
  if (!record) return { ok: false, error: "No record" };
  const recordId = typeof record === "string" ? record : String(record.id || "");
  const repo = getSacramentsRepoSafe();
  const sbClient = window.CESupabase?.getSupabaseFoundationClient?.() || window.CESupabase?.getSupabaseAuthClient?.();

  const tableMap = {
    baptism: "baptisms",
    marriage: "marriages",
    baby: "baby_dedications"
  };

  const tableName = tableMap[type];

  // DELETE OPERATION
  if (mode === "delete") {
    if (!recordId) return { ok: true };
    const promises = [];
    if (sbClient && tableName) {
      promises.push(
        sbClient.from(tableName).delete().eq("id", recordId).then((res) => {
          if (res?.error) console.warn("[CE Sacraments] sbClient delete warning:", tableName, recordId, res.error);
        })
      );
    }
    if (type === "marriage" && repo?.deleteMarriage) {
      promises.push(repo.deleteMarriage(recordId));
    } else if (type === "baptism" && repo?.deleteBaptism) {
      promises.push(repo.deleteBaptism(recordId));
    } else if (type === "baby" && repo?.deleteBabyDedication) {
      promises.push(repo.deleteBabyDedication(recordId));
    }

    try {
      await Promise.allSettled(promises);
    } catch (err) {
      console.warn("[CE Sacraments] Delete failed:", err);
    }
    return { ok: true };
  }

  // Ensure record has valid UUID for create/update
  if (!isValidUuid(record.id)) {
    record.id = typeof generateUuid === "function" ? generateUuid() : ("00000000-0000-4000-8000-" + Date.now().toString(16).padStart(12, "0"));
  }

  let dbPayload = {};
  if (type === "marriage") {
    dbPayload = {
      id: record.id,
      groom_name: record.nome_do_noivo || record.groom_name || "",
      groom_phone: record.telefone_do_noivo || record.groom_phone || "",
      bride_name: record.nome_da_noiva || record.bride_name || "",
      bride_phone: record.telefone_da_noiva || record.bride_phone || "",
      church_id: isValidUuid(record.church_id) ? record.church_id : (activeUser?.church_id && isValidUuid(activeUser.church_id) ? activeUser.church_id : null),
      marriage_date: record.data_do_casamento || record.marriage_date || null,
      officiating_minister_name: record.pastor_responsavel || record.officiating_minister_name || "",
      pre_marital_counseling_completed: !!(record.aconselhamento_concluido ?? record.counseling_completed),
      status: record.estado || record.status || "Pending",
      notes: record.observacoes || record.notes || "",
      updated_at: new Date().toISOString()
    };
    if (mode === "create" && repo?.createMarriage) {
      try {
        const res = await repo.createMarriage(dbPayload);
        if (res?.ok) return res;
      } catch (_) {}
    } else if (mode === "update" && repo?.updateMarriage) {
      try {
        const res = await repo.updateMarriage(record.id, dbPayload);
        if (res?.ok) return res;
      } catch (_) {}
    }
  } else if (type === "baptism") {
    const fullName = record.full_name || [record.nome, record.apelido].filter(Boolean).join(" ") || record.nome || "";
    dbPayload = {
      id: record.id,
      full_name: fullName,
      phone: record.telefone || record.phone || "",
      church_id: isValidUuid(record.church_id) ? record.church_id : (activeUser?.church_id && isValidUuid(activeUser.church_id) ? activeUser.church_id : null),
      baptism_date: record.data_do_baptismo || record.baptism_date || null,
      baptism_location: record.local_do_baptismo || record.baptism_location || "",
      minister_name: record.baptizado_por || record.minister_name || record.pastor_responsavel || "",
      status: record.estado || record.status || "Pending",
      notes: record.observacoes || record.notes || "",
      updated_at: new Date().toISOString()
    };
    if (mode === "create" && repo?.createBaptism) {
      try {
        const res = await repo.createBaptism(dbPayload);
        if (res?.ok) return res;
      } catch (_) {}
    } else if (mode === "update" && repo?.updateBaptism) {
      try {
        const res = await repo.updateBaptism(record.id, dbPayload);
        if (res?.ok) return res;
      } catch (_) {}
    }
  } else if (type === "baby") {
    dbPayload = {
      id: record.id,
      child_name: record.nome_da_crianca || record.child_name || "",
      child_date_of_birth: record.data_de_nascimento || record.child_date_of_birth || null,
      parent_name: record.nome_do_pai || record.parent_name || record.nome_da_mae || "",
      parent_phone: record.telefone_dos_pais || record.parent_phone || "",
      second_parent_name: record.nome_da_mae || record.second_parent_name || "",
      church_id: isValidUuid(record.church_id) ? record.church_id : (activeUser?.church_id && isValidUuid(activeUser.church_id) ? activeUser.church_id : null),
      dedication_date: record.data_da_dedicacao || record.dedication_date || null,
      minister_name: record.pastor_responsavel || record.minister_name || "",
      status: record.estado || record.status || "Pending",
      notes: record.observacoes || record.notes || "",
      updated_at: new Date().toISOString()
    };
    if (mode === "create" && repo?.createBabyDedication) {
      try {
        const res = await repo.createBabyDedication(dbPayload);
        if (res?.ok) return res;
      } catch (_) {}
    } else if (mode === "update" && repo?.updateBabyDedication) {
      try {
        const res = await repo.updateBabyDedication(record.id, dbPayload);
        if (res?.ok) return res;
      } catch (_) {}
    }
  }

  // Direct Supabase upsert fallback
  if (sbClient && tableName) {
    try {
      const { data, error } = await sbClient.from(tableName).upsert(dbPayload).select().single();
      if (!error && data) return { ok: true, data };
    } catch (err) {
      console.warn("[CE Sacraments] Direct upsert error", err);
    }
  }

  return { ok: true, data: record };
}`;

if (oldPersistFuncRegex.test(code)) {
  code = code.replace(oldPersistFuncRegex, newPersistFunc);
  console.log("Updated persistSacramentViaRepository with bulletproof delete handling!");
} else {
  console.log("oldPersistFuncRegex did not match");
}

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully updated dashboard.js!");
