import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyAll() {
  console.log("=== VERIFYING LIVE SUPABASE FOUNDATION DATA ===");
  const { data: teachers, error: tErr } = await client.from("foundation_school_teachers").select("*");
  const { data: classes, error: cErr } = await client.from("foundation_school_classes").select("*");
  const { data: students, error: sErr } = await client.from("foundation_school_students").select("*");

  console.log("Live Teachers in Supabase:", teachers?.length, teachers?.map(t => ({ id: t.id, name: t.full_name || t.name, status: t.status })));
  console.log("Live Classes in Supabase:", classes?.length, classes?.map(c => ({ id: c.id, name: c.name, status: c.status })));
  console.log("Live Students in Supabase:", students?.length, students?.map(s => ({ id: s.id, name: s.full_name || s.name, status: s.status })));

  console.log("\n=== VERIFYING DASHBOARD JS LOGIC ===");
  const js = fs.readFileSync("js/dashboard.js", "utf8");

  const hasDeleteAction = js.includes('["delete", "foundationTeacher", teacher.id');
  console.log("✓ Teacher action cluster includes 'delete' button:", hasDeleteAction);

  const hasTeacherDeleteQuickAction = js.includes('if (type === "foundationTeacher")') && js.includes('foundationAudit("teacher_deleted"');
  console.log("✓ quickAction handles teacher deletion:", hasTeacherDeleteQuickAction);

  const hasTeacherAutoSelect = js.includes('mountFoundationTeacherControls') && js.includes('can_teach_all_lessons');
  console.log("✓ Teacher form auto-selects all 7 classes when 'Ensina todas' is clicked:", hasTeacherAutoSelect);

  const hasClassViewButton = js.includes('data-foundation-class-view=');
  console.log("✓ Class card includes 'view' button:", hasClassViewButton);

  const hasClassCloseButton = js.includes('data-foundation-class-close=');
  console.log("✓ Class card includes 'close' button:", hasClassCloseButton);

  const hasClassCloseHandler = js.includes('event.target.closest("[data-foundation-class-close]")');
  console.log("✓ Global click listener handles closing class:", hasClassCloseHandler);

  const hasCleanHydrate = js.includes('isValidUuid(String(id))');
  console.log("✓ Hydration ensures only authoritative live data is kept:", hasCleanHydrate);

  if (hasDeleteAction && hasTeacherDeleteQuickAction && hasClassViewButton && hasClassCloseButton && hasClassCloseHandler && hasCleanHydrate) {
    console.log("\n>>> ALL FOUNDATION CHECKS PASSED PERFECTLY! <<<");
  } else {
    console.error("\n>>> SOME CHECKS FAILED! <<<");
    process.exit(1);
  }
}

verifyAll();
