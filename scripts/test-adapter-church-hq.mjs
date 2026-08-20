import { listMembersPage } from "../src/data/adapters/supabase/membersSupabaseAdapter.ts";

async function testListMembersWithChurchHq() {
  console.log("=== Testing listMembersPage with churchId = 'church-hq' ===");
  const res1 = await listMembersPage({ churchId: "church-hq", page: 1, pageSize: 50 });
  console.log("Result for church-hq:", res1.ok, "totalCount:", res1.data?.totalCount, "items length:", res1.data?.items?.length, "error:", res1.error);

  console.log("=== Testing listMembersPage with churchId = 'a1111111-1111-4111-8111-111111111101' ===");
  const res2 = await listMembersPage({ churchId: "a1111111-1111-4111-8111-111111111101", page: 1, pageSize: 50 });
  console.log("Result for UUID:", res2.ok, "totalCount:", res2.data?.totalCount, "items length:", res2.data?.items?.length, "error:", res2.error);

  console.log("=== Testing listMembersPage with empty query ===");
  const res3 = await listMembersPage({});
  console.log("Result for empty query:", res3.ok, "totalCount:", res3.data?.totalCount, "items length:", res3.data?.items?.length, "error:", res3.error);
}

testListMembersWithChurchHq();
