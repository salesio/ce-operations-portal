-- ============================================================================
-- CE Mozambique Operations Dashboard — local development seed (placeholder)
-- ============================================================================
-- Runs after schema.sql on first Postgres container initialization only.
-- Safe, minimal sample rows for connectivity checks — not production data.
-- ============================================================================

INSERT INTO public.schema_meta (key, value)
VALUES ('seeded_at', now()::text)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

INSERT INTO public.churches (name, province, city)
SELECT 'CE Maputo Central', 'Maputo Cidade', 'Maputo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.churches WHERE name = 'CE Maputo Central'
);

INSERT INTO public.users (email, full_name, role)
SELECT 'admin@ce.local', 'Admin Local', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'admin@ce.local'
);
