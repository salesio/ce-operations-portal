# Counseling + Sacraments Supabase/API Pilot

Backend Phase 10 is an optional, additive pilot for Counseling and Sacraments. It preserves the existing mock and localStorage providers and does not migrate F.E.V.O, Prison Ministry, or Ministry Materials.

## Activation

The Supabase provider is selected only when all public client settings are present:

```env
VITE_DATA_SOURCE=supabase
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

Keep `VITE_DATA_SOURCE=local` or `mock` for the existing offline paths. Missing configuration returns a controlled error and must not crash the dashboard. API mode remains a placeholder controlled by `VITE_DATA_SOURCE=api` and `VITE_API_BASE_URL`.

Apply `supabase/migrations/0010_counseling_sacraments_pilot.sql` after the foundation, Churches/Members, First Timers/Follow-Up, and Staff/RH migrations. The optional `supabase/seeds/counseling_sacraments_seed.sql` contains synthetic records only and is never injected automatically.

## Counseling flow and confidentiality

The controlled flow is `request -> explicit case conversion -> appointment -> feedback/referral`.

- Requests may link to a Church, Member, First Timer, and assigned Counselor.
- Case conversion is explicit; no background conversion occurs.
- Counselors may soft-link to Staff/Users; no Staff record is created or changed.
- Feedback may set `needs_follow_up=true`, but a Follow-Up is created only through an explicit safe action. The resulting `follow_up_id` may then be stored.
- Referrals are explicit and may target pastoral, Follow-Up, Foundation School, Sacraments, or external workflows.

`confidential_notes`, `private_assessment`, `pastoral_guidance`, `confidential_session_notes`, and `confidential_feedback` are separated from general summaries. Normal lists, searches, and aggregate reports mask these fields. Explicit confidential access requires a suitable permission and creates a soft audit event when the audit bridge is available.

The RLS plan is documented but not enabled by migration 0010. Before production, enforce church scope, counselor assignment, field-level confidential permission, and audit coverage in database policies or a trusted API. Frontend masking is defense in depth, not a substitute for RLS.

## Sacraments flow and documents

The controlled flow is `baptism/marriage/baby dedication -> appointment -> private document metadata -> explicit certificate creation -> explicit approval/issuance`.

- Completing a sacrament never creates or issues a certificate.
- Certificate creation, approval, and issuance are separate explicit operations.
- `payment_status` is internal metadata only and never creates a Finance record.
- Marriage may explicitly link to `counseling_case_id`; neither module creates the other automatically.
- Pre-marital counseling completion is updated only by an explicit action.
- Ministers are linked by identifiers only; Staff salary/performance is untouched.

Sacrament documents default to `is_sensitive=true`. The adapter rejects public-looking buckets and creates an optional soft link in the existing `documents` table. No real upload is required. With Storage enabled, use a private bucket and future signed URLs; never publish sensitive file URLs.

## Tables

Counseling: `counseling_requests`, `counseling_cases`, `counseling_appointments`, `counselors`, `counseling_feedback`, `counseling_referrals`.

Sacraments: `baptisms`, `marriages`, `baby_dedications`, `sacrament_certificates`, `sacrament_documents`, `sacrament_appointments`.

## Verification

```bash
npm run build
npm run test:counseling-sacraments-supabase
npm run test:counseling-data
npm run test:sacraments-data
npm run test:access-control-data
npm run test:data-layer-all
npm run db:schema:check
```

For a real project, apply prerequisite migrations and 0010, configure only the public URL/anon key, and use synthetic records. Return to `VITE_DATA_SOURCE=local` afterward to confirm the local path remains intact.

## Risks and next steps

- Enforce production RLS before using real counseling or sacrament data.
- Add trusted field-level confidential reads rather than broad table selects.
- Add private Storage policies and signed URLs.
- Validate soft-audit completeness and retention.
- Keep F.E.V.O, Prison Ministry, and Ministry Materials local/mock until separately approved.
