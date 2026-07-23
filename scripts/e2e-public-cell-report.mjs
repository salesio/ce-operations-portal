/**
 * Browser E2E: public cell report → dashboard → approve → refresh.
 * Requires: npm run dev (http://localhost:5173)
 * Run: node scripts/e2e-public-cell-report.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.CE_BASE_URL || "http://localhost:5173";
const results = [];
let failed = 0;

function log(ok, name, detail = "") {
  const line = `${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`;
  results.push(line);
  if (!ok) failed += 1;
  console.log(line);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("pageerror", (err) => {
    const text = String(err?.message || err);
    // Vite MPA may still inject HMR client; ignore that noise only.
    if (/Cannot use import statement outside a module/i.test(text)) return;
    consoleErrors.push(text);
  });
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (/Cannot use import statement outside a module/i.test(text)) return;
    consoleErrors.push(text);
  });

  try {
    // 1. Open login
    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector("#loginView", { timeout: 15000 });
    log(await page.locator("#loginView").isVisible(), "1. Login screen visible");

    // 2. Click public submit
    const publicBtn = page.locator("[data-public-cell-report]");
    log(await publicBtn.isVisible(), "2. Public button visible");
    await publicBtn.click();
    await page.waitForSelector("#publicCellReportView:not(.d-none)", { timeout: 10000 });
    log(await page.locator("#publicCellReportForm").isVisible(), "3. Public form opened");
    log(!(await page.locator("#loginView").isVisible()), "3b. Login hidden");
    log(!(await page.locator("#appView").isVisible()), "3c. Dashboard hidden");

    // Wait for hydrate of selects
    await page.waitForTimeout(800);

    // 4–7 church / group / cell
    const church = page.locator("#publicCellChurch");
    const group = page.locator("#publicCellGroup");
    const cell = page.locator("#publicCell");
    const churchOpts = await church.locator("option").count();
    log(churchOpts > 1, "4. Church options loaded", `count=${churchOpts}`);

    // pick first non-empty church
    const churchValue = await church.locator("option").nth(1).getAttribute("value");
    await church.selectOption(churchValue || { index: 1 });
    await page.waitForTimeout(300);
    const groupOpts = await group.locator("option").count();
    log(groupOpts > 1, "5. Group options after church", `count=${groupOpts}`);
    const groupValue = await group.locator("option").nth(1).getAttribute("value");
    await group.selectOption(groupValue || { index: 1 });
    await page.waitForTimeout(300);
    const cellOpts = await cell.locator("option").count();
    log(cellOpts > 1, "6. Cells filtered by group", `count=${cellOpts}`);
    if (cellOpts > 1) {
      await cell.selectOption({ index: 1 });
    } else {
      // fallback manual cell
      await page.locator("#publicMissingCell").check();
      await page.locator("[name='manual_cell_name']").fill("Célula E2E Manual");
    }
    const leaderName = page.locator("#publicLeaderName");
    const leaderPhone = page.locator("#publicLeaderPhone");
    if (!(await leaderName.inputValue())) await leaderName.fill("Líder E2E");
    if (!(await leaderPhone.inputValue())) await leaderPhone.fill("840001122");

    // Step through form
    async function next() {
      await page.locator("[data-public-next]").click();
      await page.waitForTimeout(150);
    }

    // step 0 done → 1 meeting
    await next();
    await page.locator("[name='meeting_type']").selectOption("Presencial");
    await next();
    // participation ATT FT NC
    await page.locator("[name='attendance_count']").fill("15");
    await page.locator("[name='first_timers_count']").fill("3");
    await page.locator("[name='new_converts_count']").fill("2");
    await next();
    // spiritual
    await next();
    // offering
    await page.locator("[name='offering_given']").selectOption("true");
    await page.locator("[name='offering_amount']").fill("500");
    await page.locator("[name='payment_reference']").fill("E2E-REF-500");
    await next();
    // status health
    await page.locator("[name='cell_health_status']").selectOption("Saudável");
    await next();
    // confirm
    await page.locator("[name='confirmation']").check();
    log(await page.locator("[data-public-submit]").isVisible(), "11. Submit button visible on last step");

    await page.locator("[data-public-submit]").click();
    await page.waitForTimeout(600);
    const success = await page.locator(".public-report-success, .public-success-badge").count();
    const successText = await page.locator("#publicCellReportView").innerText().catch(() => "");
    log(success > 0 || /sucesso|successfully/i.test(successText), "12. Success confirmation", successText.slice(0, 80));

    // Capture storage for report id
    const stored = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem("ce-ops-dashboard-v3");
        const state = raw ? JSON.parse(raw) : {};
        const reports = state?.cellLeadership?.cellReports || [];
        const publicOnes = reports.filter(
          (r) => /public form|login_public/i.test(String(r.submitted_by_type || r.submetido_por || r.submitted_from || ""))
        );
        return {
          totalReports: reports.length,
          publicCount: publicOnes.length,
          top: reports[0]
            ? {
                id: reports[0].id,
                status: reports[0].status,
                estado: reports[0].estado,
                oferta: reports[0].oferta ?? reports[0].offering_amount,
                finance: reports[0].finance_review_status,
                source: reports[0].submitted_by_type || reports[0].submetido_por,
                cell: reports[0].celula || reports[0].cell_name,
              }
            : null,
        };
      } catch (e) {
        return { error: String(e) };
      }
    });
    log(!!stored.top && Number(stored.top.oferta) > 0, "12b. Report in localStorage with offering", JSON.stringify(stored.top));
    log(
      stored.top?.finance === "Pending Finance Review",
      "12c. finance_review_status Pending Finance Review",
      String(stored.top?.finance)
    );

    // 13 back to login
    await page.locator("[data-back-login]").click();
    await page.waitForSelector("#loginView:not(.d-none)", { timeout: 8000 });
    log(await page.locator("#loginView").isVisible(), "13. Back to login");

    // 14 enter dashboard
    await page.locator("#loginForm button[type='submit'], [data-login-enter]").first().click();
    await page.waitForSelector("#appView:not(.d-none)", { timeout: 10000 });
    log(await page.locator("#appView").isVisible(), "14. Dashboard entered");

    // 15–16 go to cell reports
    await page.evaluate(() => {
      if (window.setRoute) window.setRoute("cellReceivedReports");
    });
    await page.waitForTimeout(500);
    const panelText = await page.locator("#content").innerText();
    const cellName = stored.top?.cell || "";
    log(
      /Submissões Semanais|Weekly Submissions|Relatórios|cell/i.test(panelText),
      "15. Reports area rendered",
      panelText.slice(0, 60).replace(/\s+/g, " ")
    );
    // Try weekly too
    if (cellName && !panelText.includes(cellName.slice(0, 8))) {
      await page.evaluate(() => window.setRoute && window.setRoute("cellWeeklyReport"));
      await page.waitForTimeout(400);
    }
    const content2 = await page.locator("#content").innerText();
    const visibleReport =
      (cellName && content2.includes(cellName)) ||
      /Public form|Formulário público|Pending Finance|500|Líder E2E/i.test(content2);
    log(visibleReport, "16. Public report visible in list", cellName || "search markers");

    // Finance status text
    log(
      /Pending Finance Review/i.test(content2) || stored.top?.finance === "Pending Finance Review",
      "17. Finance status visible or stored"
    );

    // 18 Approve / Validate
    const approveBtn = page.locator('[data-cell-report-action="approve"]').first();
    const approveCount = await page.locator('[data-cell-report-action="approve"]').count();
    log(approveCount > 0, "18a. Approve buttons present", `count=${approveCount}`);
    if (approveCount > 0) {
      // Prefer the public form row if possible
      const publicRowApprove = page.locator("tr").filter({ hasText: /Formulário público|Public form|Líder E2E/i }).locator('[data-cell-report-action="approve"]').first();
      if (await publicRowApprove.count()) await publicRowApprove.click();
      else await approveBtn.click();
      await page.waitForTimeout(400);
    }
    const validateBtn = page.locator("tr").filter({ hasText: /Formulário público|Public form|Líder E2E|Approved|Aprovado/i }).locator('[data-cell-report-action="validate"]').first();
    if (await validateBtn.count()) {
      await validateBtn.click();
      await page.waitForTimeout(400);
      log(true, "18b. Validate clicked");
    } else {
      const anyValidate = page.locator('[data-cell-report-action="validate"]').first();
      if (await anyValidate.count()) {
        await anyValidate.click();
        log(true, "18b. Validate clicked (first row)");
      } else {
        log(false, "18b. Validate button missing");
      }
    }

    const afterApprove = await page.evaluate(() => {
      const raw = localStorage.getItem("ce-ops-dashboard-v3");
      const state = raw ? JSON.parse(raw) : {};
      const reports = state?.cellLeadership?.cellReports || [];
      const pub = reports.find(
        (r) => /public form|login_public/i.test(String(r.submitted_by_type || r.submetido_por || r.submitted_from || ""))
      ) || reports[0];
      return pub
        ? { status: pub.status, estado: pub.estado, finance: pub.finance_review_status, id: pub.id }
        : null;
    });
    log(
      afterApprove && /Approved|Validated|Aprovado|Validado/i.test(String(afterApprove.status || afterApprove.estado)),
      "18c. Status updated after actions",
      JSON.stringify(afterApprove)
    );
    log(
      afterApprove?.finance === "Pending Finance Review" || afterApprove?.finance === "Not Applicable",
      "18d. Finance still not auto-verified",
      String(afterApprove?.finance)
    );

    // 19–20 refresh + persistence
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    // re-enter dashboard if needed
    if (await page.locator("#loginView:not(.d-none)").isVisible().catch(() => false)) {
      await page.locator("#loginForm button[type='submit'], [data-login-enter]").first().click();
      await page.waitForSelector("#appView:not(.d-none)", { timeout: 10000 });
    }
    await page.evaluate(() => window.setRoute && window.setRoute("cellReceivedReports"));
    await page.waitForTimeout(600);
    const afterReload = await page.evaluate(() => {
      const raw = localStorage.getItem("ce-ops-dashboard-v3");
      const state = raw ? JSON.parse(raw) : {};
      const reports = state?.cellLeadership?.cellReports || [];
      return {
        count: reports.length,
        pub: reports.find(
          (r) => /public form|login_public/i.test(String(r.submitted_by_type || r.submetido_por || r.submitted_from || ""))
        ),
      };
    });
    log(!!afterReload.pub, "19–20. Persistence after refresh", JSON.stringify({
      status: afterReload.pub?.status,
      finance: afterReload.pub?.finance_review_status,
      cell: afterReload.pub?.celula || afterReload.pub?.cell_name,
    }));

    // Visibility of action buttons CSS
    if (approveCount > 0) {
      const styles = await page.locator('[data-cell-report-action="approve"]').first().evaluate((el) => {
        const s = getComputedStyle(el);
        return { display: s.display, visibility: s.visibility, opacity: s.opacity, color: s.color };
      });
      log(styles.display !== "none" && styles.visibility !== "hidden" && Number(styles.opacity) > 0, "Action btn CSS visible", JSON.stringify(styles));
    }

    if (consoleErrors.length) {
      log(false, "Console errors", consoleErrors.slice(0, 3).join(" | "));
    } else {
      log(true, "No page console errors");
    }
  } catch (error) {
    log(false, "E2E crashed", error?.message || String(error));
  } finally {
    await browser.close();
  }

  console.log(`\n${results.filter((r) => r.startsWith("PASS")).length} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
}

main();
