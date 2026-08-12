# HQ Legacy Members Import Readiness

The importer is a dry-run only workflow for the historical HQ workbook. It resolves the church by existing church data, treats sheets as candidate cell groups, detects internal cell headings, normalizes fields and reports duplicate risk. It never creates members or related operational records.

Run the acceptance dry-run with:

```bash
npm run dry-run:hq-members-import
```

The supplied workbook is read only. The dry-run does not modify it, write to Supabase, or create Finance, Sacrament, Foundation School, Cell, Cell Group or user-permission records.

## Final controlled-import policy

- All 17 sheets have been reviewed. `Visionarios` and `Blossom` are accepted as-is even though no numbered member rows were detected.
- A phone number is optional. A blank or unusable phone becomes `NULL` and a data-quality warning; it never invalidates or blocks a candidate.
- Never invent phone numbers. A manual member requires only a name and church assignment.
- Duplicates are review-only. The importer keeps source sheet/row provenance and can flag **Possible Duplicate** or **Likely Duplicate**, but never automatically merges, links, deletes or overwrites a member.
- With no phone, duplicate signals are limited to exact normalized email, full name plus date of birth, full name plus church plus neighborhood, or first/last name plus birth year. A name alone is not a duplicate.

Before a future controlled import, review unmatched group/cell mappings, phone-less quality warnings, duplicate candidates and every row whose status is `NEEDS_REVIEW`. The approved dry-run baseline is 1,761 candidates, 1,460 normalized phones, 301 phone-less accepted candidates and 54 historical duplicate candidates requiring human review. Supabase imports remain 0.
