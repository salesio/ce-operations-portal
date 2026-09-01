import { createClient } from "@supabase/supabase-js";
import assert from "node:assert";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("------------------------------------------------------------");
console.log("RUNNING TEST: test-sacraments-supabase-live-sync");
console.log("------------------------------------------------------------");

async function run() {
  // 1. Test inserting marriage
  console.log("1. Testing Marriage Insertion in Supabase...");
  const marriageId = "f1111111-2222-4333-8444-555555555555";
  const { data: marData, error: marErr } = await client.from("marriages").upsert({
    id: marriageId,
    groom_name: "Alberto Mondlane",
    groom_phone: "+258841112233",
    bride_name: "Júlia Cossa",
    bride_phone: "+258849998877",
    marriage_date: "2026-11-20",
    officiating_minister_name: "Pastor Daniel",
    pre_marital_counseling_completed: true,
    status: "Agendado",
    notes: "Casamento agendado com aconselhamento concluído"
  }).select().single();

  assert(!marErr, `Marriage insert error: ${marErr?.message}`);
  assert.strictEqual(marData.groom_name, "Alberto Mondlane");
  console.log("  [PASS] Marriage inserted successfully:", marData.id);

  // 2. Test inserting baptism
  console.log("2. Testing Baptism Insertion in Supabase...");
  const baptismId = "f2222222-3333-4444-8555-666666666666";
  const { data: bapData, error: bapErr } = await client.from("baptisms").upsert({
    id: baptismId,
    full_name: "Eusébio Maposse",
    phone: "+258872223344",
    baptism_date: "2026-10-15",
    baptism_location: "Piscina Central",
    minister_name: "Pastor Valdemiro Machava",
    status: "Agendado",
    notes: "Candidato ao santo baptismo"
  }).select().single();

  assert(!bapErr, `Baptism insert error: ${bapErr?.message}`);
  assert.strictEqual(bapData.full_name, "Eusébio Maposse");
  console.log("  [PASS] Baptism inserted successfully:", bapData.id);

  // 3. Test inserting baby dedication
  console.log("3. Testing Baby Dedication Insertion in Supabase...");
  const babyId = "f3333333-4444-4555-8666-777777777777";
  const { data: babyData, error: babyErr } = await client.from("baby_dedications").upsert({
    id: babyId,
    child_name: "Emmanuel Salésio Machava",
    child_date_of_birth: "2026-05-10",
    parent_name: "Salésio Machava",
    second_parent_name: "Neima Tamele",
    parent_phone: "+258841234567",
    dedication_date: "2026-10-25",
    minister_name: "Pastor Principal",
    status: "Agendado",
    notes: "Apresentação e dedicação ao Senhor"
  }).select().single();

  assert(!babyErr, `Baby Dedication insert error: ${babyErr?.message}`);
  assert.strictEqual(babyData.child_name, "Emmanuel Salésio Machava");
  console.log("  [PASS] Baby Dedication inserted successfully:", babyData.id);

  // 4. Test reading and field mapping
  console.log("4. Testing Live Retrieval of All Sacraments from Supabase...");
  const [bapList, marList, babyList] = await Promise.all([
    client.from("baptisms").select("*"),
    client.from("marriages").select("*"),
    client.from("baby_dedications").select("*")
  ]);

  assert(bapList.data.some((b) => b.id === baptismId), "Baptism record found in Supabase list");
  assert(marList.data.some((m) => m.id === marriageId), "Marriage record found in Supabase list");
  assert(babyList.data.some((d) => d.id === babyId), "Baby dedication record found in Supabase list");
  console.log(`  [PASS] All sacraments verified in Supabase: ${bapList.data.length} Baptisms, ${marList.data.length} Marriages, ${babyList.data.length} Baby Dedications.`);

  // 5. Test updating status
  console.log("5. Testing Status Update in Supabase...");
  const { data: updatedMar, error: upErr } = await client.from("marriages").update({
    status: "Realizado",
    notes: "Casamento realizado com bênção pastoral"
  }).eq("id", marriageId).select().single();

  assert(!upErr, `Update error: ${upErr?.message}`);
  assert.strictEqual(updatedMar.status, "Realizado");
  console.log("  [PASS] Marriage status updated to Realizado successfully.");

  // 6. Test delete cleanup
  console.log("6. Testing Deletion in Supabase...");
  const { error: delMarErr } = await client.from("marriages").delete().eq("id", marriageId);
  const { error: delBapErr } = await client.from("baptisms").delete().eq("id", baptismId);
  const { error: delBabyErr } = await client.from("baby_dedications").delete().eq("id", babyId);

  assert(!delMarErr && !delBapErr && !delBabyErr, "Delete executed cleanly");
  console.log("  [PASS] Test records deleted cleanly.");

  console.log("------------------------------------------------------------");
  console.log("ALL test-sacraments-supabase-live-sync TESTS PASSED (100% SUCCESS)");
  console.log("------------------------------------------------------------");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
