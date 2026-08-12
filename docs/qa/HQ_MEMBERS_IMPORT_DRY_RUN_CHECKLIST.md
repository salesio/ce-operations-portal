# HQ Members Import Dry-Run Checklist

- Confirm the selected workbook is `DATA BASE NOVEMBER.xlsx` and remains unchanged.
- Run the dry-run; confirm `supabase_writes: 0`.
- Confirm sheets are candidate groups, not automatic cells.
- Confirm `Visionarios` and `Blossom` remain recorded as manually reviewed/accepted, not blockers.
- Preserve phone-less members with `NULL` phone and a data-quality warning; do not create placeholder numbers.
- Review member rows, internal cell headings, unmatched mappings and duplicate candidates. Decide each duplicate manually; never auto-merge or delete.
- Confirm no Foundation, Sacrament, Finance, Partnership, Cell or permission records were created.
- Record the review decision; do not import until human approval in a later milestone.
