# Performance Baseline

No fabricated timing values are recorded. Capture the baseline in the browser Network panel before and after applying this change.

| Scenario | Old behaviour | New target |
| --- | --- | --- |
| Members initial load | All rows, in 1,000-row requests | 50 rows plus exact count |
| Page change | Full client list already retained | One ranged Supabase request |
| Search/filter | Client-side after full transfer | Server-side query plus range |
| Login | Broad module hydration, including Members | No global Members hydration |

Record: timestamp, data source, member total, request count, transferred bytes and visible render time. Test at 2,000 and 10,000 seeded rows before production rollout.
