# Member Candidate Registration and Approval

Cell Leaders and Cell Assistants register a **candidate**, not an official member.
The candidate is locked to the authorised church, cell group and cell of the
signed-in user. Phone numbers are optional and are stored as `null` when absent.

## Approval path

1. Register candidate as Draft.
2. Cell Leader or Assistant submits it for review.
3. Membership Officer, Church Admin, Cell Ministry Head or Super Admin reviews it.
4. The reviewer may request correction, reject, approve a new Member, or explicitly
   link it to an existing Member after duplicate review.

No candidate automatically creates a Member, finance record, sacrament,
Foundation School record, cell report or assignment change.

## Duplicate safeguards

Likely duplicates use exact normalized phone, email, or full name plus date of
birth. Possible duplicates use full name plus church plus neighbourhood. A name
alone never identifies a duplicate. Duplicates are kept for human review and are
never automatically merged, deleted, rejected, or used to overwrite a cell assignment.

## Audit and notifications

The workflow records metadata-only audit events such as
`member_candidate.created`, `member_candidate.submitted`,
`member_candidate.approved`, and `member_candidate.linked_existing_member`.
In-app notifications contain no sensitive form content.

Migration `0015_members_master_data_legacy_import_readiness.sql` is still an
unapplied staging-readiness migration and includes the candidate table. It does
not run an import or create members.
