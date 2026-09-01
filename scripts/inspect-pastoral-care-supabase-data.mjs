import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const [ft, fu, fs, coun, bap, mar, baby] = await Promise.all([
    client.from("first_timers").select("*"),
    client.from("follow_ups").select("*"),
    client.from("foundation_students").select("*"),
    client.from("counseling_requests").select("*"),
    client.from("baptisms").select("*"),
    client.from("marriages").select("*"),
    client.from("baby_dedications").select("*")
  ]);

  console.log("First Timers:", { count: ft.data?.length, sample: ft.data?.[0], error: ft.error });
  console.log("Follow Ups:", { count: fu.data?.length, sample: fu.data?.[0], error: fu.error });
  console.log("Foundation Students:", { count: fs.data?.length, sample: fs.data?.[0], error: fs.error });
  console.log("Counseling Requests:", { count: coun.data?.length, sample: coun.data?.[0], error: coun.error });
  console.log("Baptisms:", { count: bap.data?.length, sample: bap.data?.[0], error: bap.error });
  console.log("Marriages:", { count: mar.data?.length, sample: mar.data?.[0], error: mar.error });
  console.log("Baby Dedications:", { count: baby.data?.length, sample: baby.data?.[0], error: baby.error });
}

main().catch(console.error);
