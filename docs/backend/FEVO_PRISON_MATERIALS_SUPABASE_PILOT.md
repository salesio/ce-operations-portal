# F.E.V.O + Prison Ministry + Ministry Materials Supabase/API Pilot

Backend Phase 11 is an optional, additive Supabase/API pilot. Existing mock and localStorage paths remain available and are still the safe default.

## Activation and SQL

```env
VITE_DATA_SOURCE=supabase
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

Apply `supabase/migrations/0011_fevo_prison_materials_pilot.sql` after the foundation and referenced domain migrations. The optional `supabase/seeds/fevo_prison_materials_seed.sql` contains synthetic aggregates and non-sensitive pastoral codes only; it is never injected automatically. Keep `VITE_DATA_SOURCE=mock` or `local` to retain existing offline behavior. API mode remains a controlled placeholder using `VITE_API_BASE_URL`.

## F.E.V.O workflow

`weekly config -> Team A-D activities -> typed report -> validation/correction -> missing-report detection`

- Activating a config closes another active config in the same church and creates only missing Team A-D activities. A database uniqueness constraint prevents duplicates.
- Report submission links the activity and creates the applicable Evangelism, Visitation, or Prayer typed record.
- Validation/correction updates the activity. Rejection requires a reason.
- Missing-report detection is explicit, deduplicated, and prepares notification metadata without sending notifications.
- `created_first_timer_ids` and `follow_up_ids` are soft-links. First Timers and Follow-Ups are never created automatically.

## Prison Ministry workflow and data prohibition

`operational location -> service -> separated prison class/student -> agenda -> aggregate report`

Only operational location contacts, staff assignments, aggregate counts, non-sensitive pastoral display codes, schedules, and summaries are allowed. Criminal or judicial records, offences, sentences, court/case/process numbers, cell identifiers, and inmate identities are prohibited. The adapter rejects credential-like field names for this prohibited data.

Prison Foundation classes/students remain separate from the general Foundation School. There is no automatic synchronization and no automatic creation of Members or First Timers. Service material distributions are metadata/soft-links and reports never create Finance records.

## Ministry Materials workflow

`catalog -> separate module stock -> request/sale/distribution -> internal fund -> internal report`

- Stock is owned by Ministry Materials and is not Venue/Inventory stock.
- Stock reservation, adjustment, distribution deduction, and request fulfillment are explicit operations.
- Requests never create Requisitions automatically.
- Sales and Funds are internal module records. `finance_record_id` remains null and totals never enter verified Finance automatically.
- A confirmed sale creates an internal Fund only when explicitly requested.
- Prison Ministry and F.E.V.O integrations use `source_module`/`source_id` soft-links.

## Documents, RLS, and risks

The adapters can create private `documents` metadata for F.E.V.O reports, aggregate Prison reports, and Materials reports. No upload is required. Public buckets are not used; production requires private Storage policies and signed URLs. Prison documents must never contain inmate identity, criminal, or judicial data.

RLS intent is documented but deliberately not enabled by migration 0011. Before production, test church, team, assignment, department, internal-fund, and aggregate-report policies with authenticated roles. Client validation is defense in depth, not a substitute for server-side validation/RLS.

## Verification

```bash
npm run build
npm run test:fevo-prison-materials-supabase
npm run test:fevo-data
npm run test:prison-ministry-data
npm run test:ministry-materials-data
npm run test:finance-data
npm run test:access-control-data
npm run test:data-layer-all
npm run db:schema:check
```

For a configured real project, apply prerequisites and migration 0011, use only synthetic test data, verify that `finance_records`, Members, First Timers, Follow-Ups, Foundation School, and Venue/Inventory are unchanged, then return to local mode.

## Next steps

- Production RLS and trusted server validation.
- Private Storage policies and signed URLs.
- Explicit, audited cross-domain integration helpers only when approved.
- Monitoring for duplicate reports, stock concurrency, and internal-fund reconciliation.
