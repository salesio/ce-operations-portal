# Deployment Plan

## Current target

The frontend can be deployed as static assets (for example GitHub Pages) with Supabase providing database/Auth/Storage services. Use separate staging and production Supabase projects and separate frontend deployments.

## Deployment checklist

1. Confirm approved commit/tag and green `TEST_MATRIX.md`.
2. Configure frontend-safe variables in the deployment platform; never bake backend-only values into the build.
3. Run `npm ci` and `npm run build`.
4. Deploy staging, test HTTPS, routes, Auth redirects, provider switching and private signed URLs.
5. Confirm migrations/RLS/buckets/backups before production promotion.
6. Deploy production static assets, smoke-test and monitor errors, latency, Auth failures and denied access.
7. Keep the previous static release and documented database restore point available.

Use a public-site domain separately from the authenticated app subdomain. Enforce HTTPS, secure headers, cache/version strategy and basic uptime/error monitoring.

## Future option

A VPS with Docker, Nginx or Coolify may host a trusted API, workers and scheduled jobs. It should use an app subdomain, private network/database connectivity, managed TLS, server-only secrets, structured logs, monitoring and automated encrypted backups. Storage CDN use must preserve signed/private access for sensitive files.

