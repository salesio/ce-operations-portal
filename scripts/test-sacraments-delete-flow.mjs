import { createClient } from "@supabase/supabase-js";
import assert from "node:assert";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("------------------------------------------------------------");
console.log("RUNNING TEST: test-sacraments-delete-flow");
console.log("------------------------------------------------------------");

async function run() {
  // 1. Insert a baptism
  const testBapId = "a1112222-3333-4444-8555-666677778888";
  console.log("1. Creating baptism record in Supabase:", testBapId);
  const { data: inserted, error: inErr } = await client.from("baptisms").upsert({
    id: testBapId,
    full_name: "Test Candidate for Deletion",
    phone: "+258840001122",
    status: "Pending"
  }).select().single();

  assert(!inErr, "Insertion failed");
  assert.strictEqual(inserted.id, testBapId);
  console.log("  [PASS] Inserted baptism:", inserted.id);

  // 2. Perform delete via Supabase client (simulating persistSacramentViaRepository delete mode)
  console.log("2. Performing deletion in Supabase...");
  const { error: delErr } = await client.from("baptisms").delete().eq("id", testBapId);
  assert(!delErr, "Delete failed");
  console.log("  [PASS] Deleted from Supabase.");

  // 3. Verify it is gone from Supabase
  console.log("3. Verifying record no longer exists in Supabase...");
  const { data: after } = await client.from("baptisms").select("*").eq("id", testBapId);
  assert.strictEqual(after.length, 0, "Record must be 0 after delete");
  console.log("  [PASS] Confirmed 0 records found in Supabase.");

  console.log("------------------------------------------------------------");
  console.log("ALL test-sacraments-delete-flow TESTS PASSED (100% SUCCESS)");
  console.log("------------------------------------------------------------");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
