# Staging RLS Checklist

## Dev-safe baseline

- [ ] RLS design is documented and prepared.
- [ ] Existing policies are non-destructive and reviewable.
- [ ] Manual anonymous-key tests are defined.
- [ ] No service-role key is used by frontend tests.

## Staging hardening

Do not activate all complex policies at once. Activate by module and keep a manual rollback for every change.

- [ ] Public forms: intended anonymous create only; no unintended reads.
- [ ] Finance: authorized roles only; public giving transition rules preserved.
- [ ] Staff salary: sensitive fields denied or masked without permission.
- [ ] Counseling: confidential records denied or masked.
- [ ] Documents: private metadata and objects scoped correctly.
- [ ] Report exports: sensitive exports denied without permission.
- [ ] Audit: append/read rules preserve confidentiality and integrity.

For each module, test read, create and edit for every relevant role, plus an unauthorized/anon negative case. Record the policy set, evidence and exact manual rollback before advancing.
