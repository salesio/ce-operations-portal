import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const [ft, fu, fsStudents, fsClasses, fsTeachers, counReq, counCases, bap, mar, baby] = await Promise.all([
    client.from("first_timers").select("*").order("created_at", { ascending: false }),
    client.from("follow_ups").select("*").order("created_at", { ascending: false }),
    client.from("foundation_school_students").select("*").order("created_at", { ascending: false }),
    client.from("foundation_school_classes").select("*").order("created_at", { ascending: false }),
    client.from("foundation_school_teachers").select("*").order("created_at", { ascending: false }),
    client.from("counseling_requests").select("*").order("created_at", { ascending: false }),
    client.from("counseling_cases").select("*").order("created_at", { ascending: false }),
    client.from("baptisms").select("*").order("created_at", { ascending: false }),
    client.from("marriages").select("*").order("created_at", { ascending: false }),
    client.from("baby_dedications").select("*").order("created_at", { ascending: false })
  ]);

  console.log("Supabase Pastoral Care Tables Query Results:");
  console.log("1. first_timers:", { count: ft.data?.length, error: ft.error });
  console.log("2. follow_ups:", { count: fu.data?.length, error: fu.error });
  console.log("3. foundation_school_students:", { count: fsStudents.data?.length, error: fsStudents.error });
  console.log("4. foundation_school_classes:", { count: fsClasses.data?.length, error: fsClasses.error });
  console.log("5. foundation_school_teachers:", { count: fsTeachers.data?.length, error: fsTeachers.error });
  console.log("6. counseling_requests:", { count: counReq.data?.length, error: counReq.error });
  console.log("7. counseling_cases:", { count: counCases.data?.length, error: counCases.error });
  console.log("8. baptisms:", { count: bap.data?.length, error: bap.error });
  console.log("9. marriages:", { count: mar.data?.length, error: mar.error });
  console.log("10. baby_dedications:", { count: baby.data?.length, error: baby.error });
}

main().catch(console.error);
