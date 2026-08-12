# System Architecture Overview

## Members legacy-data boundary

The HQ workbook parser is read-only preparation: it creates a dry-run preview only and never invokes a write repository. Current Foundation, Sacraments and Finance data remains authoritative over historical spreadsheet values.

## Layers

1. **UI** — static HTML + `js/dashboard.js` + module bridges  
2. **Data bridges** — dual-write / pure-JS fallback (`js/*-data-bridge.js`)  
3. **Data layer** — TypeScript under `src/data/` (repositories, seeds, providers)  
4. **Bundle** — `js/supabase-bundle.js` (Vite IIFE, installs globals)  
5. **Backend** — future Supabase/API (not browser → Postgres)

## Data provider switch

```
VITE_DATA_SOURCE=
  mock      → in-memory seeds
  local     → localStorage ce-data-layer:*
  api       → HTTP placeholder
  supabase  → client placeholder
```

## Security / privacy principles

- RBAC central (`CEAccessControl`)
- Audit log soft dual-write
- No secrets/stream keys/passwords in localStorage
- Sensitive domains: aggregate reports by default; confidential notes restricted
- Finance: no auto-verified income/expense from other modules without explicit action

## Global helpers

- `window.CENotifications.notify(eventType, payload)`
- `window.createSystemNotification(eventType, payload)`
- `window.recordAuditLog(action, payload)`

## Next technical phase

Phase 12 adds a transversal read-only Reports adapter, in-app Notification adapter, and hardened Audit/System adapter. All use the existing provider switch and public Supabase client. Reports cannot write to operational repositories; sensitive exports are metadata jobs for a future trusted backend/private-storage workflow.

Phase 13 is the production-readiness layer: no new domain migration and no automatic remote SQL. It validates migration/seed inventory, frontend configuration safety, provider switching and operational documentation. A future Spring Boot/API layer remains an incremental option for privileged workflows.

- Supabase schema + RLS  
- Auth (replace demo login)  
- Real notifications channels (optional)  
- Public forms secured insert policies

## Phase 14 — staging validation boundary

Phase 14 adds an operational validation layer around the existing architecture. The frontend can be pointed intentionally at a staging Supabase project through ignored environment configuration, while anon-client smoke checks validate connectivity and the minimum schema. Schema application, seeds, private buckets and RLS changes remain manual control-plane steps. Local/mock fallback and all Phase 1–13 module boundaries remain unchanged.
