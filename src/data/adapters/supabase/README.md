# Supabase adapter foundation

Phase 1 only — **does not** replace domain repositories.

| File | Role |
|------|------|
| `supabaseConfig.ts` | Env flags + validation (anon key only) |
| `supabaseClient.ts` | Lazy public client or null |
| `supabaseRepositoryBase.ts` | Generic list/get/create/update/delete |
| `supabaseTypes.ts` | Base types |

## Rules

- `VITE_ENABLE_SUPABASE=true` required to initialize
- Only `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- **Never** import service role
- Domain modules stay on mock/local until explicit pilots

## Related

- Legacy finance client: `src/lib/supabaseClient.ts`
- Provider surface: `src/data/adapters/supabaseProvider.ts`
