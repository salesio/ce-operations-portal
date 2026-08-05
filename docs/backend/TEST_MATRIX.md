# Test Matrix

Run the complete matrix before a milestone commit, before deployment, after provider/environment changes, and after editing migrations/seeds/RLS/storage plans.

```bash
npm run build
npm run test:data-layer-all
npm run test:backend-foundation
npm run test:auth-foundation
npm run test:churches-members-supabase
npm run test:first-timers-followups-supabase
npm run test:finance-public-giving-supabase
npm run test:requisitions-inventory-supabase
npm run test:staff-hr-supabase
npm run test:foundation-school-supabase
npm run test:programs-media-supabase
npm run test:counseling-sacraments-supabase
npm run test:fevo-prison-materials-supabase
npm run test:reports-notifications-audit-supabase
npm run test:validate-seeds-safety
npm run test:migrations-readiness
npm run test:data-source-readiness
npm run test:production-readiness
npm run test:phase-13-production-readiness
npm run db:schema:check
npm run test:settings-notifications-data
npm run test:access-control-data
npm run test:finance-data
```

Static readiness scripts do not replace staging RLS/Auth/Storage/manual QA. Record command, commit, environment, time and result in deployment evidence.
