# RLS Production Readiness Plan

Phase 13 documents production policy intent; it does not enable policies automatically. Every policy must be tested with real Auth identities, church scope and denied-path tests in staging.

| Group | Read | Create | Edit / approve | Sensitive controls and risks |
|---|---|---|---|---|
| Public safe forms | Public insert only into narrow submission surfaces | Anonymous insert with validation/rate limit | Authenticated reviewers only | Never public select; abuse/spam risk; prefer Edge Function |
| Churches/Members | Authenticated users within scope; national roles by permission | Authorized admin/pastoral roles | Scoped managers | PII and cross-church leakage |
| First Timers/Follow-Up | Assigned/scoped pastoral roles | Authorized intake/public safe form | Assigned follow-up roles | Contact/consent exposure |
| Finance/Public Giving/Documents | Finance roles and authorized summaries | Controlled forms/finance users | Explicit verify/reject roles | Amounts and private proofs; no public bucket |
| Requisitions/Inventory | Requester/scoped departments | Authenticated scoped users | Approval chain/inventory roles | Approval bypass and stock races |
| Staff/RH/Salaries/Documents | HR scope; salary via separate permission | HR only | HR/authorized leadership | Payroll and identity documents require narrow policies |
| Foundation School | Teachers/admin by church/class | Authorized enrollment | Assigned teachers/exam roles | Student/contact/test integrity |
| Programs/Media | Department/church scope | Authorized module roles | Coordinators/approvers | Public media metadata separated from private files |
| Counseling/Sacraments | Assigned pastoral roles; aggregates for executives | Authorized intake | Special confidential permission | Notes and documents must be field/bucket protected |
| F.E.V.O./Prison/Materials | Department/church scope | Coordinators | Validators/stock roles | Prison aggregate only; internal funds separate from Finance |
| Reports/Notifications/Audit | Report permission; own/role notifications; audit for compliance/admin | Metadata jobs/in-app events | Template/admin/system roles | Sensitive exports and audit visibility require special permission |

## Suggested policy shape

```sql
-- Pseudocode only
USING (has_module_permission(module_key, 'view') AND church_scope_allows(church_id))
WITH CHECK (has_module_permission(module_key, 'create') AND church_scope_allows(church_id))
```

Public insertion should target a dedicated validated surface and never grant public `SELECT`, `UPDATE` or `DELETE`. Sensitive-document access should be authorized immediately before issuing a short-lived signed URL. Salary, confidential counseling, financial proof and sensitive export access must also create a reference-only sensitive-access event.

## Production checklist

- [ ] RLS enabled on every exposed table
- [ ] Explicit policies applied and version-controlled
- [ ] Anonymous insertion limited to approved public forms
- [ ] No anonymous readback of submissions
- [ ] Sensitive documents private and signed
- [ ] Salary rows protected by explicit permission
- [ ] Confidential counseling protected and audited
- [ ] Finance proofs private and audited
- [ ] Audit and sensitive-access tables restricted
- [ ] Denied-path, cross-church and inactive-user tests passed

