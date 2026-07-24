# Ministry Materials / Materiais Ministeriais — Module Plan

**Owner:** Sister Janet Marquele  
**Status:** Pilot on data layer (`VITE_DATA_SOURCE=mock|local|api|supabase`)  
**Cache buster:** `?v=20260723-ministry-materials-data-v1`

## Purpose

Migrate Ministry Materials onto the progressive data layer: catalogue, stock, sales, distributions, requests (including Prison Ministry), internal funds, and reports — without creating finance records automatically and without breaking Prison Ministry, Finance, Venue & Inventory, or Access Control.

## Domain collections

| Collection | Storage key | UI state key |
|------------|-------------|--------------|
| Catalog | `ce-data-layer:ministry-materials-catalog` | `state.ministryMaterials.catalogue` |
| Stock | `ce-data-layer:ministry-materials-stock` | `state.ministryMaterials.weeklyStock` |
| Stock movements | `ce-data-layer:ministry-materials-stock-movements` | (extended) |
| Sales | `ce-data-layer:ministry-materials-sales` | `state.ministryMaterials.sales` |
| Distributions | `ce-data-layer:ministry-materials-distributions` | `state.ministryMaterials.distributions` |
| Requests | `ce-data-layer:ministry-materials-requests` | `state.ministryMaterials.requests` |
| Funds | `ce-data-layer:ministry-materials-funds` | `state.ministryMaterials.freeFunds` |
| Reports | `ce-data-layer:ministry-materials-reports` | `state.ministryMaterials.reports` |

## Critical rules

1. **No automatic `financeRecord`** on sales or funds.  
   - `finance_record_id` stays `null` until a future Finance verification flow.
2. **Sales create internal `materialFund` only** (`status: Recorded Internally`).
3. **Stock is Ministry Materials own stock** — not Venue & Inventory (optional `storage_space_id` for future link).
4. **Prison Ministry requests** keep `source_id` pointing to `prison_materials_requests`.
5. Dual-map EN + PT UI fields preserved (`titulo_do_material`, `quantidade`, `valor`, etc.).

## Known weekly numbers (seeds)

| Week | Units | Amount (MTn) |
|------|-------|--------------|
| 22–28 Jun 2026 | 18 | 3 440 |
| 29 Jun–05 Jul 2026 | 17 | 6 960 |

## Code map

| Piece | Role |
|-------|------|
| `src/data/repositories/ministryMaterialsRepository.ts` | Aggregator CRUD + stock adjust + fulfill + analytics |
| Seeds under `src/data/seeds/ministryMaterials*.ts` | Realistic Janet / Maputo data |
| `js/ministry-materials-data-bridge.js` | Dual-write + pure-JS fallback (`CEMinistryMaterials`) |
| Dashboard | `dualWriteMinistryMaterialsRecord` + hydrate |
| Providers | mock / local / api stub / supabase stub |

## Modal dual-write types

- `materialCatalogue`
- `materialSale`
- `materialDistribution`
- `materialStock`
- `materialFund`
- `materialReport`

## Soft integrations

| Module | Link |
|--------|------|
| Prison Ministry | `source_id` / `syncPrisonMaterialRequests` / fulfill → optional prison request update |
| Finance | `finance_record_id` placeholder only |
| Venue & Inventory | optional `storage_space_id` |
| Access Control | soft audit on sale, fund, fulfill, approve, adjust stock |

## RBAC

- Module key: `ministryMaterials`
- Coordinator: Sister Janet Marquele
- Protect stock, sales, funds, export

## Roadmap

1. ~~Data layer pilot (this)~~  
2. Full Requests / Prison tab UI  
3. Finance verification of internal funds  
4. Supabase tables + RLS  
5. Optional Venue space storage link  

## How to test

```bash
npm run build
npm run test:ministry-materials-data
npm run test:prison-ministry-data
npm run test:finance-data
npm run test:access-control-data
# Manual: Materials → catalog → sale → fund internal (no finance) → distribution → prison request fulfill
# VITE_DATA_SOURCE=local + F5
```
