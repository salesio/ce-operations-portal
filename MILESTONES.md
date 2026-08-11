# Data Layer Migration — Milestones

## Cell Leader Portal — Independent Cell Dashboard

- Rota `cellPortal` e landing automático para Cell Leader/Assistant.
- Contexto por igreja, grupo, célula, utilizador e staff.
- Membros, perfis saneados, relatório, actividades, crescimento, Fundação, sacramentos, ganhar almas, programas, histórico e alertas.
- Gráficos responsivos, filtros e exportação sem dados sensíveis.
- Finance apenas agregado/Verified; sem edição, comprovativos ou criação de `financeRecord`.
- Teste: `npm run test:cell-leader-portal`.

Frontend progressive migration under `VITE_DATA_SOURCE=mock|local|api|supabase`.  
Browser does **not** connect to PostgreSQL directly. Supabase/API = future phase.

| Milestone | Domain | Status |
|-----------|--------|--------|
| cell-report-flow-v1 | Public cell report + Cell Ministry | Done |
| partnerships-analytics-v1 | Partnerships analytics on finance | Done |
| requisitions-finance-flow-v1 | Requisitions → Finance disbursement | Done |
| venue-inventory-flow-v1 | Venue & Inventory | Done |
| staff-hr-flow-v1 | Staff & RH | Done |
| access-control-audit-flow-v1 | Users / Roles / Audit | Done |
| media-department-flow-v1 | Media Department | Done |
| counseling-flow-v1 | Counseling | Done |
| sacraments-flow-v1 | Sacraments | Done |
| fevo-flow-v1 | F.E.V.O | Done |
| prison-ministry-flow-v1 | Prison Ministry | Done |
| ministry-materials-flow-v1 | Ministry Materials | Done |
| programs-events-flow-v1 | Programs & Events | Done |
| settings-notifications-v1 | Settings + Notification Center | Done |
| backend-foundation-v1 | Backend Phase 1 — schema, adapters, docs, env | Done |
| auth-users-roles-v1 | Backend Phase 2 — optional Supabase Auth + Users/Roles | Done |
| churches-members-supabase-v1 | Backend Phase 3 — Churches + Members Supabase pilot | Done |
| first-timers-followups-supabase-v1 | Backend Phase 4 — First Timers + Follow-Up Supabase pilot | Done |
| finance-public-giving-storage-v1 | Backend Phase 5 — Finance + Public Giving + Storage pilot | Done |

## Storage model

Phase 12 (`backend-phase-12-reports-notifications-audit-v1`) completed the Reports + Notifications + Audit hardening pilot.

## Backend milestones — Phases 1–13

- `backend-foundation-v1`
- `backend-auth-users-roles-v1`
- `backend-churches-members-supabase-v1`
- `backend-first-timers-followups-supabase-v1`
- `backend-finance-public-giving-storage-v1`
- `backend-phase-6-requisitions-inventory-v1`
- `backend-phase-7-staff-hr-documents-v1`
- `backend-phase-8-foundation-school-v1`
- `backend-phase-9-programs-media-v1`
- `backend-phase-10-counseling-sacraments-v1`
- `backend-phase-11-fevo-prison-materials-v1`
- `backend-phase-12-reports-notifications-audit-v1`
- `backend-phase-13-production-readiness-v1` — planned after the future milestone commit

- Isolated keys: `ce-data-layer:*`
- Dual-write bridges keep UI state + data layer in sync
- localStorage is **pilot/dev only**
- PostgreSQL / Supabase schema prepared under `database/` (not live for UI modules yet)

## Phase 14 — Supabase staging dry run and manual QA

- Staging env template and step-by-step dry-run guide.
- Ordered schema/migration, synthetic seed, private storage and incremental RLS checklists.
- Safe anon-client connection/schema checks with default skip behavior.
- Module manual QA, report template and local/mock rollback readiness.
- No operational module, automatic migration or real credential added.
- Future milestone after commit: `backend-phase-14-supabase-staging-dry-run-v1`.
# Security Fix — Authenticated Cell Report Submission

- Anonymous cell-report submission disabled by default.
- Authenticated Cell Leader/Assistant portal with assignment-based cell guard.
- Reviewer/head validation, rejection reasons, audit events, and in-app notifications.
- No new operational module and no automatic finance record from offerings.

## Pastoral Care — First Timers Intake & Approval Workflow Refactor

- Additive migration `0013_first_timers_intake_workflow.sql` introduces intake batches and explicit workflow/audit references.
- The First Timers screen captures visitor data plus interests only; no automatic cell, ESF, member or Follow-Up creation is permitted.
- Explicit Rector review, Follow-Up handoff and Excel-compatible CSV preview/template controls are prepared.

## Pastoral Supabase Access

- Additive migration `0014_pastoral_care_access.sql` prepares authenticated server-side roles for the Reitor and Responsável de Acompanhamento.
- The Reitor reads pastoral data and reviews First Timers; the Follow-Up Coordinator reads First Timers and manages Follow-Ups.
- The migration is deliberately manual: it must be reviewed and applied in Supabase SQL Editor, first in staging. No service-role credential is exposed to the browser.
