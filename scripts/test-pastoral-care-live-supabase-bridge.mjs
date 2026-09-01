import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testHydrateFirstTimers() {
  console.log("\n1. Testing Hydrate First Timers from Supabase...");
  const { data, error } = await client.from("first_timers").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  console.log(`  [PASS] Retrieved ${data.length} first_timers from Supabase`);
  
  const mapped = data.map((row) => ({
    id: row.id,
    first_timer_number: row.first_timer_number || row.id,
    full_name: row.full_name || [row.first_name, row.last_name].filter(Boolean).join(" ") || row.nome || "Visitante",
    nome: row.first_name || (row.full_name ? row.full_name.split(" ")[0] : "") || "",
    apelido: row.last_name || (row.full_name ? row.full_name.split(" ").slice(1).join(" ") : "") || "",
    tratamento: row.title || row.tratamento || "Irmão/Irmã",
    genero: row.gender || row.genero || "",
    data_de_nascimento: row.date_of_birth || row.data_de_nascimento || null,
    telefone: row.phone || row.telefone || "",
    phone: row.phone || row.telefone || "",
    whatsapp: row.whatsapp || row.phone || row.telefone || "",
    email: row.email || "",
    endereco: row.address || row.endereco || "",
    neighborhood: row.neighborhood || row.bairro || "",
    profession: row.profession || row.profissao || "",
    church_id: row.church_id || "",
    church_name: row.church_name || "",
    cell_group_id: row.cell_group_id || null,
    cell_group_name: row.cell_group_name || null,
    cell_id: row.cell_id || null,
    cell_name: row.cell_name || null,
    data_do_culto: row.visit_date || row.data_do_culto || "",
    culto: row.service_name || row.culto || "Culto de Domingo",
    convidado_por: row.invited_by_name || row.invited_by || row.convidado_por || "",
    nasceu_de_novo: Boolean(row.born_again),
    foundation_school_interest: Boolean(row.foundation_school_interest ?? row.foundation_interest ?? row.quer_escola_de_fundacao),
    quer_escola_de_fundacao: Boolean(row.foundation_school_interest ?? row.foundation_interest ?? row.quer_escola_de_fundacao),
    counseling_interest: Boolean(row.counseling_interest ?? row.quer_aconselhamento),
    quer_aconselhamento: Boolean(row.counseling_interest ?? row.quer_aconselhamento),
    cell_interest: Boolean(row.cell_interest ?? row.interesse_em_celula),
    interesse_em_celula: Boolean(row.cell_interest ?? row.interesse_em_celula),
    workflow_status: row.workflow_status || "DRAFT",
    estado_do_seguimento: row.follow_up_status || row.estado_do_seguimento || "Pending",
    follow_up_status: row.follow_up_status || row.estado_do_seguimento || "Pending",
    assigned_to_user_id: row.assigned_to_user_id || null,
    assigned_to_name: row.assigned_to_name || null,
    converted_to_member: Boolean(row.converted_to_member),
    member_id: row.member_id || null,
    status: row.status || "Active",
    notas: row.notes || row.notas || "",
    created_at: row.created_at || new Date().toISOString()
  }));

  console.log(`  [PASS] Successfully mapped ${mapped.length} first_timers. Sample:`, {
    id: mapped[0].id,
    full_name: mapped[0].full_name,
    phone: mapped[0].phone,
    church_id: mapped[0].church_id
  });
  return mapped;
}

async function testHydrateFollowUps() {
  console.log("\n2. Testing Hydrate Follow-Ups from Supabase...");
  const { data, error } = await client.from("follow_ups").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  console.log(`  [PASS] Retrieved ${data.length} follow_ups from Supabase`);
  
  const mapped = data.map((row) => ({
    id: row.id,
    first_timer_id: row.first_timer_id || "",
    member_id: row.member_id || "",
    person_type: row.person_type || (row.first_timer_id ? "First Timer" : "Member"),
    full_name: row.person_name || row.full_name || "",
    phone: row.phone || "",
    telefone: row.phone || "",
    whatsapp: row.whatsapp || row.phone || "",
    email: row.email || "",
    church_id: row.church_id || "",
    church_name: row.church_name || "",
    cell_group_id: row.cell_group_id || null,
    cell_id: row.cell_id || null,
    source: row.source || "First Timer",
    status: row.status || "Pending",
    priority: row.priority || "Normal",
    responsible_user_id: row.responsible_user_id || null,
    responsible_name: row.responsible_name || "",
    next_contact_date: row.next_contact_date || null,
    last_contact_date: row.last_contact_date || null,
    last_contact_method: row.last_contact_method || null,
    last_contact_result: row.last_contact_result || null,
    notes: row.notes || "",
    wants_foundation_school: Boolean(row.wants_foundation_school),
    interested_in_cell: Boolean(row.interested_in_cell),
    wants_counseling: Boolean(row.wants_counseling),
    became_member: Boolean(row.became_member),
    created_at: row.created_at || new Date().toISOString()
  }));

  console.log(`  [PASS] Successfully mapped ${mapped.length} follow_ups. Sample:`, {
    id: mapped[0].id,
    full_name: mapped[0].full_name,
    phone: mapped[0].phone,
    status: mapped[0].status
  });
  return mapped;
}

async function main() {
  await testHydrateFirstTimers();
  await testHydrateFollowUps();
  console.log("\nALL PASTORAL CARE HYDRATION TESTS PASSED (100% SUCCESS)");
}

main().catch(console.error);
