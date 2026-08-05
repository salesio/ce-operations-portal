# Reports, Notifications and Audit Supabase/API Pilot

Backend Phase 12 adds an optional Supabase/API pilot for transversal report metadata, saved views, sanitized snapshots, export jobs, in-app notifications, hardened audit events, sensitive-access references, system events, and data-source health checks.

## Activation

Mock/local behavior remains unchanged. Supabase routing requires:

```env
VITE_DATA_SOURCE=supabase
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=https://project.example.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-value
```

Apply `supabase/migrations/0012_reports_notifications_audit_hardening.sql`. Optionally apply the synthetic `supabase/seeds/reports_notifications_audit_seed.sql`. The browser client uses only the public anon credential; elevated server credentials are prohibited in frontend code.

## Reports Hub

Reports read existing repositories/providers and never update operational modules or create Finance records. Definitions describe permissions and sensitivity. Saved views persist filters/columns. Snapshots store sanitized aggregates and short previews. Export records are metadata jobs; generated files are future backend work and sensitive output must use private storage.

Sanitization removes confidential counseling notes and configuration credentials. Salary values are masked without `can_view_salary`; proof/document locations are removed without explicit permission. Sensitive exports require `can_export_sensitive_reports` and should record a `sensitive_access_event`.

## Notifications

Phase 12 delivery is in-app only. Templates and preferences prepare future channels, but email, SMS, WhatsApp and push flags are forced off by the adapter. No external delivery service is called. Notification metadata may carry an idempotency key for prepared internal triggers.

## Audit hardening

Audit payloads are recursively sanitized before insertion. Sensitive access records store only references, reason, outcome and affected field names—not counseling content, payroll values, proofs, or document content. Health checks store boolean readiness and sanitized messages, never environment values.

## Compatibility and errors

Existing `notifications` and `audit_logs` are expanded with `ADD COLUMN IF NOT EXISTS`. Mock/local remain intact; API remains optional. Missing configuration or Phase 12 tables returns controlled errors from the shared foundation instead of crashing.

## Not production-ready yet

- Production RLS policies are planned but not enabled by this pilot.
- Auth role/permission claims need production validation.
- Export generation, queues, expiry and signed downloads need a trusted backend.
- Private Storage policies, backups, monitoring, retention and incident procedures remain required.
- Notification delivery beyond in-app is not implemented.

A future Java Spring Boot or equivalent API should execute privileged aggregation/export jobs, validate permissions server-side, issue private signed URLs, and centralize audit retention. VPS deployment also needs TLS, backup/restore drills, secrets management, health monitoring and database migrations in CI/CD.

Run `npm run test:reports-notifications-audit-supabase` without a real Supabase project.

