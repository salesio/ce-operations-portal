# Programs + Media Supabase/API Pilot

Backend Phase 9 adds optional Supabase/API persistence for Programs & Events and the Media Department. Existing mock and localStorage repositories and browser bridges remain supported.

## Activation

Keep the existing local modes with `VITE_DATA_SOURCE=mock` or `VITE_DATA_SOURCE=local`. The remote pilot activates only with:

```env
VITE_DATA_SOURCE=supabase
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=https://PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=PUBLIC_ANON_KEY
```

Missing configuration produces a controlled error. Browser code uses only the public anon key.

## Apply

After prerequisite migrations for Churches/Members, Requisitions/Inventory and Staff/RH, apply:

```text
supabase/migrations/0009_programs_media_pilot.sql
```

Optional synthetic demonstration data:

```text
supabase/seeds/programs_media_seed.sql
```

Remote seeds are explicit and are never injected automatically by the repositories.

## Programs workflow

```text
Program → sessions/team → participants/registrations → resources → budget → checklist → report
```

- Program resources can soft-link `inventory_item_id`, `venue_space_id`, or `requisition_id`.
- Reserving/returning a program resource changes only its program-resource status. It does not move inventory.
- Registrations can store payment planning metadata and an existing `finance_record_id`; they never create one.
- Budgets are planning records. They can explicitly link an existing Requisition or Finance Disbursement but never create an expense or verified Finance record.
- Reports aggregate financial/media/follow-up summaries and may reference private document metadata; they never alter verified financial records.

## Programs and Media

```text
Program requiring media → explicit Media Service → schedules → coverage → performance
```

`requires_media=true` only marks demand. A Media Service must be created explicitly and stores `program_id`; no service is generated automatically. Program `media_status` supports the planned/requested/scheduled/completed lifecycle.

## Media workflow and security

Media covers roles, team members, services, schedules, public channel metadata, performance records and awards.

- Team members may soft-link Staff through `staff_id`; Staff is never created or modified automatically.
- `assigned_equipment_ids` is a soft link only; no inventory movement occurs.
- Media Channels store public URLs/handles only. The adapter rejects credential-shaped properties and sensitive URL parameters.
- The pilot does not host or process heavy livestreams and does not create Finance records.
- Overall performance score is the mean of punctuality, technical, teamwork and communication scores.

## Documents and storage

Program report and internal media metadata can use `documentsSupabaseAdapter`. `program-files` and `media-assets` are treated as private proposals. Upload is optional, especially when `VITE_ENABLE_STORAGE=false`; large video hosting is outside this phase.

## Compatibility

`programsEventsRepository` and `mediaRepository` retain their APIs and normalizers. In Supabase mode, their provider collections route to the Phase 9 tables. The browser bridges remain:

- `window.CEPrograms`, `window.CEDataLayer.programs`, `window.CEDataLayer.programEvents`
- `window.CEMedia`, `window.CEDataLayer.media`, `window.CEDataLayer.mediaTeam`, `window.CEDataLayer.mediaServices`

The API adapters are placeholders and activate only through a future configured API backend.

## RLS and production risks

The role plan is documented in `database/rls.sql`, but complex policies remain disabled for the dev-safe pilot. Production must validate church/department scope, coordinator assignments, budget visibility, team schedule privacy and performance privacy.

## Out of scope

Counseling, Sacraments, F.E.V.O, Prison Ministry and Ministry Materials are not migrated in Phase 9. The phase does not create expenses, Finance records, Requisitions, inventory movements, Staff records, or automatic Media Services.

## Verification

```bash
npm run build
npm run test:programs-media-supabase
npm run test:programs-data
npm run test:media-data
npm run test:data-layer-all
npm run db:schema:check
```

## Next steps

- Production RLS tests with real authenticated roles.
- Explicit server-side attachment upload/signing workflows.
- Operational approval workflow for Program-to-Media requests.
- Server-side integrations for external streaming platforms, if later approved.

