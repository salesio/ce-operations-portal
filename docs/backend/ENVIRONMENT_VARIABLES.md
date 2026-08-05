# Environment Variables

Never commit real `.env` files. Use `.env.example` as names-only documentation and the deployment platform's encrypted secret/configuration store for actual values.

## Frontend-safe configuration

| Mode | Values |
|---|---|
| Local mock | `VITE_DATA_SOURCE=mock` |
| Local persistence | `VITE_DATA_SOURCE=local` |
| Supabase pilot | `VITE_DATA_SOURCE=supabase`, `VITE_ENABLE_SUPABASE=true`, optional `VITE_ENABLE_STORAGE=true`, project URL and anon credential |
| Future API | `VITE_DATA_SOURCE=api`, public `VITE_API_BASE_URL` |

Only variables intentionally prefixed with `VITE_` are available to browser code. Supabase mode must fail with a friendly configuration error when URL/anon values are absent.

## Backend-only future values

Database connection values, elevated Supabase server credentials, JWT signing secrets, SMTP passwords, API secrets, private keys and S3 secret access values belong only in server/admin environments. Never prefix them with `VITE_`, render them in Settings, send them to browser logs, or embed them in static builds.

Development placeholders must be visibly non-production. Rotate any value suspected of exposure and rebuild/deploy after removing it.

