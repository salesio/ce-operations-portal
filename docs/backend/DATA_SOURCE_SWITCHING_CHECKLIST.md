# Data Source Switching Checklist

Use a fresh browser profile or clearly recorded storage state for each test.

1. Set `VITE_DATA_SOURCE=mock`; confirm seeded memory data and no remote requests.
2. Set `VITE_DATA_SOURCE=local`; create/update a test row, refresh and confirm persistence.
3. Set `VITE_DATA_SOURCE=supabase` with Supabase enabled but URL/anon absent; confirm friendly configuration errors and no crash.
4. In staging only, supply reviewed project URL/anon values; confirm pilot modules fetch scoped data and denied paths are handled.
5. Return to `local`; confirm local records were not deleted or overwritten.
6. Set `VITE_DATA_SOURCE=api` with no base URL; confirm controlled `NOT_CONFIGURED` behavior.
7. Restore the intended deployment mode and run the test matrix.

Settings must show current source, readiness, module list and configuration status without showing any configuration value. Run `npm run test:data-source-readiness` after changing provider logic or environment documentation.

