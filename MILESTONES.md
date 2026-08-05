# Data Layer Migration — Milestones

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
