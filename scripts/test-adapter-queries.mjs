import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

const supabase = createClient(url, anonKey);

const MEMBER_LIST_COLUMNS = [
  "id", "member_code", "full_name", "first_name", "last_name", "title",
  "primary_phone", "secondary_phone", "phone", "email", "church_id", "church_name",
  "cell_group_id", "cell_group_name", "cell_id", "cell_name", "department_id",
  "department_name", "status", "membership_status", "entry_date", "source",
  "cell_role", "created_at", "updated_at"
].join(",");

const MOCK_CHURCH_UUID_MAP = {
  "church-hq": "a1111111-1111-4111-8111-111111111101",
  "church-matola": "a1111111-1111-4111-8111-111111111102",
  "church-khongolote": "a1111111-1111-4111-8111-111111111103",
  "church-beira": "a1111111-1111-4111-8111-111111111104",
  "church-nampula": "a1111111-1111-4111-8111-111111111105",
  "church-choupal": "a1111111-1111-4111-8111-111111111106",
  "church-virtual": "a1111111-1111-4111-8111-111111111107",
};

function isValidUuid(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ""));
}

async function listMembersPage(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = 50;
  const from = (page - 1) * pageSize;
  const search = String(query.search || "").trim();

  let request = supabase.from("members").select(MEMBER_LIST_COLUMNS, { count: "exact" });

  if (query.churchId) {
    const mappedId = MOCK_CHURCH_UUID_MAP[query.churchId] || query.churchId;
    if (isValidUuid(mappedId)) {
      request = request.eq("church_id", mappedId);
    } else {
      request = request.ilike("church_name", `%${query.churchId}%`);
    }
  }

  if (query.cellGroupId || query.cellGroupName) {
    const safeGroup = String(query.cellGroupName || query.cellGroupId).replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
    if (safeGroup) {
      request = request.or(`cell_group_name.ilike.%${safeGroup}%,cell_name.ilike.%${safeGroup}%`);
    }
  }

  if (query.status) {
    const statusKey = String(query.status).toLowerCase();
    const statusValues = {
      active: ["Active", "Activo", "Ativa", "Activa"],
      inprogress: ["In Progress", "Em Curso", "InProgress"],
      transferred: ["Transferred", "Transferido", "TransferredOut"],
    };
    request = request.in("status", statusValues[statusKey] || [query.status]);
  }

  if (search.length >= 2) {
    const safe = search.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
    if (safe) {
      request = request.or([
        `full_name.ilike.%${safe}%`, `first_name.ilike.%${safe}%`, `last_name.ilike.%${safe}%`,
        `primary_phone.ilike.%${safe}%`, `secondary_phone.ilike.%${safe}%`, `phone.ilike.%${safe}%`,
        `email.ilike.%${safe}%`, `member_code.ilike.%${safe}%`,
        `church_name.ilike.%${safe}%`, `cell_group_name.ilike.%${safe}%`, `cell_name.ilike.%${safe}%`
      ].join(","));
    }
  }

  const { data, error, count } = await request.order("full_name", { ascending: true }).range(from, from + pageSize - 1);
  return { count, error, length: data?.length };
}

async function run() {
  console.log("1. churchId = a1111111-1111-4111-8111-111111111101 (Maputo Sede):", await listMembersPage({ churchId: "a1111111-1111-4111-8111-111111111101" }));
  console.log("2. churchId = church-hq (Maputo Sede alias):", await listMembersPage({ churchId: "church-hq" }));
  console.log("3. status = active:", await listMembersPage({ status: "active" }));
  console.log("4. cellGroupName = QOG:", await listMembersPage({ cellGroupName: "QOG" }));
  console.log("5. cellGroupName = Vanguard:", await listMembersPage({ cellGroupName: "Vanguard" }));
  console.log("6. search = Abel:", await listMembersPage({ search: "Abel" }));
  console.log("7. search = Maputo:", await listMembersPage({ search: "Maputo" }));
  console.log("8. search = Sede:", await listMembersPage({ search: "Sede" }));
}

run();
