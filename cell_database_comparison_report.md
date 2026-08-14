# Cell Groups & Active Cells Comparison Audit Report

**Source Database Workbook**: `DATA BASE NOVEMBER (1).xlsx`
**Live Supabase Endpoint**: `https://kmurqbgpybrolrrumiue.supabase.co`

## 1. High-Level Summary

| Metric | Excel Active List (Nov) | Live Supabase DB | Status / Variance |
| :--- | :---: | :---: | :--- |
| **Active Cell Groups** | **17** | **15** | ⚠️ 2 Groups (`Blossom`, `Visionarios`) missing in DB |
| **Total Active Cells** | **150** | **137** | ⚠️ 13 cells in `Blossom` sheet missing in DB |
| **Total Registered Members** | **1,913** | **1,761** | ⚠️ 152 total member gap (147 unimported recovery rows) |

## 2. Cell Group Detailed Comparison Table

| Cell Group Name | Active Cells in Excel | Excel Members | Supabase DB Members | Status in Supabase |
| :--- | :---: | :---: | :---: | :--- |
| **Diplomatas** | 7 | 67 | 67 | ✅ In Sync |
| **Estrelas de Siao** | 9 | 66 | 65 | ⚠️ Partial (Missing Members) |
| **QOG** | 4 | 148 | 148 | ✅ In Sync |
| **Royal Sister** | 25 | 410 | 409 | ⚠️ Partial (Missing Members) |
| **Visionarios** | 1 | 14 | 0 | ❌ Missing in DB |
| **Wealth Nation** | 10 | 86 | 86 | ✅ In Sync |
| **Pais da Fé** | 2 | 68 | 68 | ✅ In Sync |
| **Perolas do Reino** | 6 | 66 | 66 | ✅ In Sync |
| **Vanguard** | 4 | 195 | 172 | ⚠️ Partial (Missing Members) |
| **MWV** | 10 | 154 | 154 | ✅ In Sync |
| **Zion Nation** | 12 | 103 | 103 | ✅ In Sync |
| **Dominio** | 1 | 18 | 18 | ✅ In Sync |
| **Transformada** | 1 | 50 | 50 | ✅ In Sync |
| **Agathos** | 8 | 59 | 58 | ⚠️ Partial (Missing Members) |
| **Pioneiro** | 15 | 172 | 154 | ⚠️ Partial (Missing Members) |
| **Blossom** | 13 | 94 | 0 | ❌ Missing in DB |
| **Phronesis** | 22 | 143 | 143 | ✅ In Sync |

## 3. Discrepancies & Action Items

### 🔴 Missing Cell Groups in Supabase DB:
1. **`Blossom`**: Contains **13 cells** and **94 members** in Excel, but **0 members / 0 cells** exist in Supabase DB.
2. **`Visionarios`**: Contains **1 cell** (`Visionarios`) and **14 members** in Excel, but **0 members** exist in Supabase DB.

### ⚠️ Cell Groups with Partial Member Imports:
- **`Pioneiro`**: 172 in Excel vs 154 in Supabase (18 members missing)
- **`Vanguard`**: 195 in Excel vs 172 in Supabase (23 members missing)
- **`Estrelas de Siao`**, **`Royal Sister`**, **`Agathos`**: 1 member missing each.

### 🧹 Obsolete / Inactive Groups in Legacy Portal Seed:
The portal seed (`CELL_GROUP_DEFINITIONS`) previously contained 8 inactive groups not in the active November workbook:
`Geração Eleita`, `Coroa Real`, `Nação Santa`, `Men of Vision`, `Elevadas`, `Destemidas`, `Genesis`, `Ambassadors`.

