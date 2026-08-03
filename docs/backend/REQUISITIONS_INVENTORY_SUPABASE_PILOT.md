# Requisitions + Venue/Inventory Supabase Pilot - Backend Phase 6

**Status:** Optional (`VITE_DATA_SOURCE=supabase`)  
**Scope:** `requisitions`, `requisition_timeline_events`, `inventory_items`, `inventory_movements`, `inventory_maintenance_records`, `venue_spaces`, `service_checklists`

This phase prepares only the Requisitions & Approvals and Venue & Inventory backend pilot. The dashboard still runs with mock/local data by default.

## Activation

```env
VITE_DATA_SOURCE=supabase
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=https://YOUR_REF.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

Leave these off for GitHub Pages/demo mode:

```env
VITE_DATA_SOURCE=local
VITE_ENABLE_SUPABASE=false
```

## Rules

- Browser uses only the Supabase anon key.
- No PostgreSQL connection from the frontend.
- No service role key in Vite/client code.
- Requisition approval creates/prepares a `finance_disbursement` only when money is required.
- It does **not** create a `finance_record` expense.
- Inventory stores acquisition cost as asset metadata only.
- Inventory does **not** create finance records.
- Expense is created only later when Finance releases a disbursement.

## Apply Order

1. `supabase/migrations/0003_churches_members_pilot.sql`
2. `supabase/migrations/0005_finance_public_giving_storage_pilot.sql`
3. `supabase/migrations/0006_requisitions_inventory_pilot.sql`
4. Optional seeds:
   - `supabase/seeds/churches_members_seed.sql`
   - `supabase/seeds/finance_public_giving_seed.sql`
   - `supabase/seeds/requisitions_inventory_seed.sql`

## Code Map

| Piece | Path |
|-------|------|
| Requisitions Supabase adapter | `src/data/adapters/supabase/requisitionsSupabaseAdapter.ts` |
| Venue/Inventory Supabase adapter | `src/data/adapters/supabase/venueInventorySupabaseAdapter.ts` |
| Requisitions API adapter | `src/data/adapters/api/requisitionsApiAdapter.ts` |
| Venue/Inventory API adapter | `src/data/adapters/api/venueInventoryApiAdapter.ts` |
| Supabase provider routing | `src/data/adapters/supabaseProvider.ts` |
| API provider routing | `src/data/adapters/apiProvider.ts` |

## Not Migrated In This Phase

Staff/RH, Foundation School, Programs, Media, Counseling, Sacraments, F.E.V.O, Prison Ministry, Ministry Materials, Java/Spring Boot.

## Tests

```bash
npm run build
npm run test:requisitions-inventory-supabase
npm run test:requisitions-data
npm run test:venue-inventory-data
npm run test:finance-data
npm run test:finance-public-giving-supabase
npm run test:data-layer-all
```
