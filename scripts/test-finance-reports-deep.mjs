import fs from "fs";
import path from "path";
import vm from "vm";

console.log("=== RUNNING DEEP FINANCE REPORTS TEST SUITE ===");

const code = fs.readFileSync(path.resolve("./js/finance-module.js"), "utf8");

// Set up mock window and environment
const mockWindow = {
  paymentMethods: ["M-Pesa", "E-Mola", "Banco", "Dinheiro", "POS"],
  financeStatuses: ["Verificado", "Pendente de Verificação", "Rejeitado", "Incluído no Relatório"],
  CECellOptions: {
    groups: () => [{ group_name: "Grupo Vitória" }, { group_name: "Grupo Graça" }],
    cells: () => [{ cell_name: "Célula Alpha" }, { cell_name: "Célula Betel" }]
  },
  XLSX: {
    utils: {
      book_new: () => ({ Sheets: {}, SheetNames: [] }),
      aoa_to_sheet: (data) => ({ data }),
      book_append_sheet: (wb, ws, name) => {
        wb.Sheets[name] = ws;
        wb.SheetNames.push(name);
      }
    },
    writeFile: (wb, filename) => {
      console.log(`[Mock XLSX] Successfully wrote workbook with sheets: ${wb.SheetNames.join(", ")} to ${filename}`);
      return true;
    }
  }
};

const context = vm.createContext({
  window: mockWindow,
  console,
  setTimeout,
  clearTimeout,
  Date,
  Math,
  Number,
  String,
  Array,
  Object,
  Set,
  Map,
  alert: (msg) => console.log("[Mock Alert]", msg)
});

vm.runInContext(code, context);

// Test Sample Data
const sampleRecords = [
  {
    id: "f1",
    data: "2026-09-15",
    contributor_name: "João Silva",
    telefone: "841234567",
    categoria_da_contribuicao: "Dízimo",
    metodo_de_pagamento: "M-Pesa",
    valor: 5000,
    estado: "Verificado",
    church_id: "c1",
    church_name: "Sede Maputo",
    grupo_de_celula: "Grupo Vitória",
    celula: "Célula Alpha"
  },
  {
    id: "f2",
    data: "2026-09-18",
    contributor_name: "Maria Santos",
    telefone: "829876543",
    categoria_da_contribuicao: "Rapsódia de Realidades",
    metodo_de_pagamento: "Banco",
    valor: 12000,
    estado: "Verificado",
    church_id: "c1",
    church_name: "Sede Maputo",
    grupo_de_celula: "Grupo Vitória",
    celula: "Célula Betel"
  },
  {
    id: "f3",
    data: "2026-09-20",
    contributor_name: "Carlos Alves",
    telefone: "847778899",
    categoria_da_contribuicao: "Escola de Cura",
    metodo_de_pagamento: "E-Mola",
    valor: 3500,
    estado: "Pendente de Verificação",
    church_id: "c2",
    church_name: "Matola",
    grupo_de_celula: "Grupo Graça",
    celula: "Célula Sinai"
  },
  {
    id: "f4",
    data: "2026-08-10",
    contributor_name: "João Silva",
    telefone: "841234567",
    categoria_da_contribuicao: "Dízimo",
    metodo_de_pagamento: "M-Pesa",
    valor: 4500,
    estado: "Verificado",
    church_id: "c1",
    church_name: "Sede Maputo"
  },
  {
    id: "f5",
    data: "2026-08-14",
    contributor_name: "Maria Santos",
    telefone: "829876543",
    categoria_da_contribuicao: "Rapsódia de Realidades",
    metodo_de_pagamento: "Banco",
    valor: 10000,
    estado: "Verificado",
    church_id: "c1",
    church_name: "Sede Maputo"
  }
].map(context.enrichFinanceRecord);

console.log("1. Testing record enrichment & taxonomy categorization...");
if (sampleRecords[0].contribution_group !== "Geral" || sampleRecords[1].contribution_group !== "Parceria") {
  throw new Error("Taxonomy categorization failed!");
}
console.log("✓ Record enrichment & taxonomy passed.");

console.log("2. Testing filtering across dimensions...");
const filteredByChurch = context.filterFinanceRecords(sampleRecords, { churchId: "c1" });
if (filteredByChurch.length !== 4) throw new Error(`Expected 4 records for church c1, got ${filteredByChurch.length}`);

const filteredByArm = context.filterFinanceRecords(sampleRecords, { partnershipArm: "Rapsódia" });
if (filteredByArm.length !== 2) throw new Error(`Expected 2 records for Rapsódia, got ${filteredByArm.length}`);

const filteredByMethod = context.filterFinanceRecords(sampleRecords, { method: "M-Pesa" });
if (filteredByMethod.length !== 2) throw new Error(`Expected 2 records for M-Pesa, got ${filteredByMethod.length}`);

const filteredByMinVal = context.filterFinanceRecords(sampleRecords, { minValue: 10000 });
if (filteredByMinVal.length !== 2) throw new Error(`Expected 2 records >= 10000, got ${filteredByMinVal.length}`);

const filteredByCellGroup = context.filterFinanceRecords(sampleRecords, { cellGroup: "Grupo Vitória" });
if (filteredByCellGroup.length !== 2) throw new Error(`Expected 2 records for Grupo Vitória, got ${filteredByCellGroup.length}`);

console.log("✓ All multi-dimensional filters passed.");

console.log("3. Testing period calculation and comparisons...");
const septRecords = sampleRecords.filter(r => r.data.startsWith("2026-09"));
const augRecords = sampleRecords.filter(r => r.data.startsWith("2026-08"));

const septStats = context.computeFinanceReportStats(septRecords);
const comp = context.computeFinanceComparison(septRecords, augRecords);

if (septStats.totalReceived !== 20500) throw new Error(`Expected 20500 total, got ${septStats.totalReceived}`);
if (septStats.totalVerified !== 17000) throw new Error(`Expected 17000 verified, got ${septStats.totalVerified}`);
if (septStats.totalPending !== 3500) throw new Error(`Expected 3500 pending, got ${septStats.totalPending}`);
if (septStats.uniqueContributors !== 3) throw new Error(`Expected 3 unique contributors, got ${septStats.uniqueContributors}`);

console.log(`✓ Stats computed: Total=${septStats.totalReceived}, Verified=${septStats.totalVerified}, Pending=${septStats.totalPending}`);
console.log(`✓ Comparison delta%: Growth Received=${comp.growthReceived}%, Growth Verified=${comp.growthVerified}%`);

console.log("4. Testing multi-sheet Excel export...");
context.exportFinanceExcel(septRecords, "test-relatorio.xlsx");

console.log("5. Testing A4 Print HTML Generation...");
const churchRows = context.groupFinanceByChurch(septRecords, (id) => id === "c1" ? "Sede Maputo" : "Matola");
const cellRows = context.groupFinanceByCell(septRecords);
const categoryRows = context.groupFinanceByBucket(septRecords);
const armDetails = context.computePartnershipArmDetails(septRecords, augRecords);
const methodRows = context.groupFinanceByMethod(septRecords);

const printHtml = context.buildFinanceA4PrintHtml(
  septRecords,
  septStats,
  comp,
  churchRows,
  cellRows,
  categoryRows,
  armDetails,
  methodRows,
  { userName: "Admin Test", filters: { period: "month" } }
);

if (!printHtml.includes("EMBAIXADA DE CRISTO MOÇAMBIQUE") || !printHtml.includes("a4-kpi-card") || !printHtml.includes("Rapsódia de Realidades")) {
  throw new Error("A4 Print template generation failed!");
}
console.log("✓ A4 Print HTML successfully generated with " + printHtml.length + " bytes.");

console.log("6. Testing filter bar HTML rendering in Portuguese & English...");
const filterBarPt = context.financeReportFilterBar(
  { period: "month" },
  [{ id: "c1", church_name: "Sede Maputo" }, { id: "c2", church_name: "Matola" }],
  { period: "Período", church: "Igreja", filterTitle: "Filtros de Pesquisa & Análise", clearFilters: "Limpar Filtros", lang: "pt" }
);
if (!filterBarPt.includes("Filtros de Pesquisa & Análise") || !filterBarPt.includes("Limpar Filtros") || !filterBarPt.includes("Dízimo")) {
  throw new Error("Portuguese Filter bar HTML missing translated strings!");
}

const filterBarEn = context.financeReportFilterBar(
  { period: "month" },
  [{ id: "c1", church_name: "Sede Maputo" }, { id: "c2", church_name: "Matola" }],
  { period: "Date", church: "Church", filterTitle: "Search & Analysis Filters", clearFilters: "Clear Filters", lang: "en" }
);
if (!filterBarEn.includes("Search & Analysis Filters") || !filterBarEn.includes("Clear Filters") || !filterBarEn.includes("Tithe") || !filterBarEn.includes("Healing School") || !filterBarEn.includes("This Month") || !filterBarEn.includes("Previous Month")) {
  throw new Error("English Filter bar HTML missing translated strings!");
}
console.log("✓ Filter bar HTML generated and verified in both English & Portuguese.");

console.log("\n==========================================");
console.log("🎉 ALL FINANCE REPORT & I18N TESTS PASSED 100%!");
console.log("==========================================");
