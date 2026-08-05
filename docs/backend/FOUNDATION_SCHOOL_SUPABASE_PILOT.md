# Foundation School Supabase/API Pilot

Backend Phase 8 adds an optional Supabase/API pilot for Foundation School while preserving the existing mock and localStorage flows.

## Scope

The pilot covers enrollments, classes, students, teachers, seven lessons, lesson progress, attendance, external online-test metadata, manually recorded test results, the Lesson 4 soul-winning practical, final exams, and explicit graduations.

It does **not** migrate Programs, Media, Counseling, Sacraments or payroll. It does not call Google Forms APIs, implement a scan application, create Members/First Timers automatically, or generate certificates automatically.

## Activation

Mock and local remain available:

```env
VITE_DATA_SOURCE=mock
# or
VITE_DATA_SOURCE=local
```

Supabase activates only when all public browser settings are present:

```env
VITE_DATA_SOURCE=supabase
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=https://PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=PUBLIC_ANON_KEY
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to Vite or browser code. Missing configuration returns a controlled error and does not break the build.

## Database setup

Apply migrations in dependency order, including Churches/Members (`0003`), First Timers/Follow-Up (`0004`), Staff/RH (`0007`) and then:

```text
supabase/migrations/0008_foundation_school_pilot.sql
```

Optionally apply demo data:

```text
supabase/seeds/foundation_school_seed.sql
```

The migration is additive and creates twelve `foundation_school_*` tables. The optional seed contains synthetic records only.

## Workflow

```text
Enrollment → class assignment → lessons 1–7 → tests → final exam → explicit graduation
```

- A First Timer or Member can be enrolled through an explicit adapter action. The source ID is retained and duplicates are checked.
- Staff can be linked to teachers through `staff_id`; staff records are never created or modified automatically.
- Completing seven unique lessons recalculates `lessons_completed` and progress, then moves an ungraded student to `Awaiting Final Exam`. It never graduates the student.
- Tests store external form URLs/configuration and accept manual results. There is no Google Forms API integration.
- Lesson 4 stores exact soul-winning and invitation counts. It never creates First Timers.
- Test average is the mean of recorded percentages. Final grade is `tests_average × 40% + final_exam_percentage × 60%`; pass mark is 50.
- Graduation, adding a student to a graduation, and marking the student graduated are explicit actions. Certificate document IDs remain metadata until an explicit document workflow exists.
- Final-exam scans may reference private `documents` metadata. No upload is required. With Storage disabled, local/mock metadata remains valid.

## Adapter and compatibility

- `foundationSchoolSupabaseAdapter.ts` provides the complete Phase 8 operations and reports.
- `foundationSchoolApiAdapter.ts` is an inactive REST placeholder using `VITE_API_BASE_URL`.
- The existing Foundation repository surface and `window.CEFoundationSchool` remain intact. In Supabase mode, its students/classes/teachers repositories route to the new tables. Mock/local continue using their current seeds and persistence.

## RLS and storage risks

RLS policy intent is documented in `database/rls.sql` but complex policies are not enabled by this pilot. Production must test church scoping, rector/coordinator access, assigned-teacher access, and protection of results/exams.

Student exam documents belong in a private bucket (proposed `foundation-exams`) and should use signed URLs. Never put student documents in a public bucket.

## Verification

```bash
npm run build
npm run test:data-layer-all
npm run test:foundation-school-supabase
npm run test:foundation-school-data
npm run db:schema:check
```

Cloud testing is optional. The Phase 8 smoke test does not require a Supabase project.

## Next steps

- Apply and validate production RLS with real authenticated roles.
- Add private signed-upload workflows for final-exam scans/certificates.
- Add an explicit follow-up timeline event after enrollment if product policy approves it.
- Consider external test-result imports behind a server-side integration.

