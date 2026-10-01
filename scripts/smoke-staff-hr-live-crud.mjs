import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

console.log("=== Testing Staff & HR Supabase Live CRUD Operations ===");
console.log(`Connecting to: ${url}`);

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

async function runLiveTests() {
  const testId = `test-${Date.now()}`;
  const churchId = "a1111111-1111-4111-8111-111111111101"; // E.C. Maputo Central - Sede

  let deptId = null;
  let roleId = null;
  let staffId = null;
  let salaryId = null;
  let perfId = null;
  let docId = null;
  let attId = null;

  try {
    // 1. Department CRUD
    console.log("\n1. Testing staff_departments CRUD...");
    const { data: deptData, error: deptErr } = await supabase
      .from("staff_departments")
      .insert({
        name: `Live Test Dept ${testId}`,
        slug: `test-dept-${testId}`,
        department_type: "Admin",
        church_id: churchId,
        status: "Active",
        metadata: { live_test: true, testId }
      })
      .select()
      .single();

    assert(!deptErr && deptData?.id, `Create department: ${deptErr?.message || deptData?.id}`);
    if (deptData) {
      deptId = deptData.id;
      const { data: deptFetch } = await supabase.from("staff_departments").select("*").eq("id", deptId).single();
      assert(deptFetch?.name === `Live Test Dept ${testId}`, "Read department matches created name");

      const { data: deptUpd, error: deptUpdErr } = await supabase
        .from("staff_departments")
        .update({ name: `Updated Dept ${testId}` })
        .eq("id", deptId)
        .select()
        .single();
      assert(!deptUpdErr && deptUpd?.name === `Updated Dept ${testId}`, "Update department name");
    }

    // 2. Role CRUD
    console.log("\n2. Testing staff_roles CRUD...");
    const { data: roleData, error: roleErr } = await supabase
      .from("staff_roles")
      .insert({
        name: `Live Test Role ${testId}`,
        title: `Live Test Role ${testId}`,
        slug: `test-role-${testId}`,
        department_id: deptId,
        employment_type: "Full Time",
        role_level: "Officer",
        status: "Active",
        metadata: { live_test: true, testId }
      })
      .select()
      .single();

    assert(!roleErr && roleData?.id, `Create staff role: ${roleErr?.message || roleData?.id}`);
    if (roleData) {
      roleId = roleData.id;
      const { data: roleFetch } = await supabase.from("staff_roles").select("*").eq("id", roleId).single();
      assert(roleFetch?.title === `Live Test Role ${testId}`, "Read staff role matches title");
    }

    // 3. Staff Member CRUD
    console.log("\n3. Testing staff_members CRUD...");
    const { data: staffData, error: staffErr } = await supabase
      .from("staff_members")
      .insert({
        staff_number: `STF-${testId.slice(-4)}`,
        staff_code: `STF-${testId.slice(-4)}`,
        first_name: "Test",
        last_name: "Operacional",
        full_name: "Test Operacional Staff",
        gender: "Masculino",
        date_of_birth: "1994-08-15",
        phone: "+258849998888",
        whatsapp: "+258849998888",
        email: `staff.${testId}@ce-mozambique.org`,
        church_id: churchId,
        church_name: "E.C. Maputo Central - Sede",
        department_id: deptId,
        department_name: `Updated Dept ${testId}`,
        role_id: roleId,
        role_name: `Live Test Role ${testId}`,
        employment_type: "Full Time",
        employment_status: "Active",
        status: "Active",
        has_dashboard_access: true,
        can_access_dashboard: true,
        salary_enabled: true,
        salary_visibility: "HR Only",
        metadata: { live_test: true, testId }
      })
      .select()
      .single();

    assert(!staffErr && staffData?.id, `Create staff member: ${staffErr?.message || staffData?.id}`);
    if (staffData) {
      staffId = staffData.id;
      const { data: staffFetch } = await supabase.from("staff_members").select("*").eq("id", staffId).single();
      assert(staffFetch?.full_name === "Test Operacional Staff", "Read staff member full name");
      assert(staffFetch?.date_of_birth === "1994-08-15", "Read staff member date_of_birth");

      const { data: staffUpd, error: staffUpdErr } = await supabase
        .from("staff_members")
        .update({ phone: "+258871112222", notes: "Live test note" })
        .eq("id", staffId)
        .select()
        .single();
      assert(!staffUpdErr && staffUpd?.phone === "+258871112222", "Update staff member phone and notes");
    }

    // 4. Staff Salary CRUD
    console.log("\n4. Testing staff_salaries CRUD...");
    const { data: salData, error: salErr } = await supabase
      .from("staff_salaries")
      .insert({
        staff_id: staffId,
        staff_number: `STF-${testId.slice(-4)}`,
        staff_name: "Test Operacional Staff",
        church_id: churchId,
        department_id: deptId,
        salary_or_allowance: "Salary",
        base_amount: 35000,
        base_salary: 35000,
        allowances: 5000,
        deductions: 0,
        net_amount: 40000,
        net_salary: 40000,
        currency: "MTn",
        effective_from: "2026-10-01",
        payment_method: "Banco",
        verification_status: "Pending Verification",
        status: "Active",
        metadata: { live_test: true, testId, no_finance_record_created: true }
      })
      .select()
      .single();

    assert(!salErr && salData?.id, `Create staff salary: ${salErr?.message || salData?.id}`);
    if (salData) {
      salaryId = salData.id;
      const { data: salFetch } = await supabase.from("staff_salaries").select("*").eq("id", salaryId).single();
      assert(Number(salFetch?.net_amount) === 40000, "Read staff salary net amount is 40000");
    }

    // 5. Staff Performance Review CRUD
    console.log("\n5. Testing staff_performance_reviews CRUD...");
    const { data: perfData, error: perfErr } = await supabase
      .from("staff_performance_reviews")
      .insert({
        staff_id: staffId,
        staff_number: `STF-${testId.slice(-4)}`,
        staff_name: "Test Operacional Staff",
        church_id: churchId,
        department_id: deptId,
        review_period: "2026-Q3",
        review_date: "2026-10-01",
        evaluator_name: "Gestor RH Test",
        score: 92,
        spiritual_commitment_score: 95,
        punctuality_score: 90,
        teamwork_score: 92,
        excellence_score: 90,
        improvement_areas: "Expansão de liderança.",
        goals: "Liderar nova célula.",
        progress: "On Track",
        review_notes: "Excelente desempenho em teste operacional.",
        status: "Pending Verification",
        metadata: { live_test: true, testId }
      })
      .select()
      .single();

    assert(!perfErr && perfData?.id, `Create performance review: ${perfErr?.message || perfData?.id}`);
    if (perfData) {
      perfId = perfData.id;
      const { data: perfFetch } = await supabase.from("staff_performance_reviews").select("*").eq("id", perfId).single();
      assert(perfFetch?.score === 92, "Read performance review score");
    }

    // 6. Staff Document CRUD
    console.log("\n6. Testing staff_documents CRUD...");
    const { data: docData, error: docErr } = await supabase
      .from("staff_documents")
      .insert({
        staff_id: staffId,
        staff_number: `STF-${testId.slice(-4)}`,
        staff_name: "Test Operacional Staff",
        church_id: churchId,
        document_type: "ID",
        document_title: "Bilhete de Identidade Teste",
        file_name: `bi-${testId}.pdf`,
        storage_bucket: "staff-documents",
        storage_path: `mock://staff-documents/bi-${testId}.pdf`,
        is_sensitive: true,
        expiry_date: "2030-01-01",
        uploaded_by_name: "Admin Principal",
        status: "Pending Review",
        notes: "Documento de teste operacional.",
        metadata: { live_test: true, testId }
      })
      .select()
      .single();

    assert(!docErr && docData?.id, `Create staff document: ${docErr?.message || docData?.id}`);
    if (docData) {
      docId = docData.id;
      const { data: docFetch } = await supabase.from("staff_documents").select("*").eq("id", docId).single();
      assert(docFetch?.document_title === "Bilhete de Identidade Teste", "Read staff document title");
    }

    // 7. Staff Attendance CRUD
    console.log("\n7. Testing staff_attendance CRUD...");
    const { data: attData, error: attErr } = await supabase
      .from("staff_attendance")
      .insert({
        staff_id: staffId,
        staff_number: `STF-${testId.slice(-4)}`,
        staff_name: "Test Operacional Staff",
        church_id: churchId,
        department_id: deptId,
        attendance_date: "2026-10-01",
        attendance_type: "Workday",
        check_in: "08:00",
        check_out: "17:00",
        hours_worked: 8.0,
        status: "Present",
        notes: "Presença confirmada.",
        metadata: { live_test: true, testId }
      })
      .select()
      .single();

    assert(!attErr && attData?.id, `Create staff attendance: ${attErr?.message || attData?.id}`);
    if (attData) {
      attId = attData.id;
      const { data: attFetch } = await supabase.from("staff_attendance").select("*").eq("id", attId).single();
      assert(attFetch?.status === "Present", "Read staff attendance status");
    }

    // 8. Cleanup test data
    console.log("\n8. Cleaning up live test records...");
    if (attId) {
      const { error } = await supabase.from("staff_attendance").delete().eq("id", attId);
      assert(!error, `Deleted test staff_attendance (${attId})`);
    }
    if (docId) {
      const { error } = await supabase.from("staff_documents").delete().eq("id", docId);
      assert(!error, `Deleted test staff_documents (${docId})`);
    }
    if (perfId) {
      const { error } = await supabase.from("staff_performance_reviews").delete().eq("id", perfId);
      assert(!error, `Deleted test staff_performance_reviews (${perfId})`);
    }
    if (salaryId) {
      const { error } = await supabase.from("staff_salaries").delete().eq("id", salaryId);
      assert(!error, `Deleted test staff_salaries (${salaryId})`);
    }
    if (staffId) {
      const { error } = await supabase.from("staff_members").delete().eq("id", staffId);
      assert(!error, `Deleted test staff_members (${staffId})`);
    }
    if (roleId) {
      const { error } = await supabase.from("staff_roles").delete().eq("id", roleId);
      assert(!error, `Deleted test staff_roles (${roleId})`);
    }
    if (deptId) {
      const { error } = await supabase.from("staff_departments").delete().eq("id", deptId);
      assert(!error, `Deleted test staff_departments (${deptId})`);
    }

  } catch (err) {
    console.error("Exception during live test:", err);
    failed++;
  }

  console.log("\n==========================================");
  console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runLiveTests();
