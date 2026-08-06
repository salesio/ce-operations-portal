# Staging Manual QA Checklist

Record evidence and failures in `STAGING_TEST_REPORT_TEMPLATE.md`. Use demo data only.

## Global and fallback

- [ ] Open the app and complete demo/real-auth login according to the flag.
- [ ] Settings shows Supabase configured and data source `supabase`, without secrets.
- [ ] Switch to `VITE_DATA_SOURCE=local`; rebuild and confirm normal operation.
- [ ] Switch to mock; rebuild and confirm normal operation.

## Core

- [ ] Churches: list, create and edit.
- [ ] Members: list, create and edit.
- [ ] First Timer: create and update.
- [ ] Follow-Up: status and timeline transitions.

## Finance

- [ ] Public Giving starts pending.
- [ ] Verify creates one `financeRecord`; reverify does not duplicate it.
- [ ] Rejected submission creates no finance record.
- [ ] Partnerships includes only verified records.

## Operations

- [ ] Requisition approval does not create an expense.
- [ ] Finance disbursement release creates the expense according to the flow.
- [ ] Inventory registration remains pending until its explicit action.
- [ ] Inventory never creates a finance record.

## Staff

- [ ] Staff create/update works.
- [ ] Salary is masked without permission.
- [ ] Sensitive documents remain protected.

## Foundation School

- [ ] Enrollment, student and class flows work.
- [ ] Lesson progress and test results persist.
- [ ] Final grade applies the 40/60 rule.
- [ ] Graduation requires an explicit action.

## Programs and Media

- [ ] Program budget does not create an expense.
- [ ] Media channel exposes no stream key.
- [ ] Media scheduling works.

## Counseling and Sacraments

- [ ] Confidential counseling content is denied or masked appropriately.
- [ ] Counseling follow-up is created only explicitly.
- [ ] Certificates are created only explicitly.
- [ ] Sacrament documents remain sensitive.

## F.E.V.O, Prison Ministry and Materials

- [ ] F.E.V.O reports pass domain validation.
- [ ] Prison ministry stores no criminal-record data.
- [ ] Internal material sale/fund does not create a finance record.

## Reports, Notifications and Audit

- [ ] Reports remain read-only.
- [ ] Sensitive export is blocked without permission.
- [ ] In-app notification works.
- [ ] Audit entries contain no secrets.
- [ ] Sensitive-access event contains no sensitive content.
