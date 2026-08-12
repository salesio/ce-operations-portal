# Members Master Data Model

Members retain the existing dashboard fields and now support additive master data: personal contacts, address/neighbourhood, membership state, participation in cells and services, plus reconciliation metadata.

## Contact and duplicate policy

`primary_phone` is optional throughout the Member model. The manual Member form requires a name and church only. If phone is absent, local, mock, API and Supabase providers preserve `null` rather than inventing a number; the record may be marked `NeedsReview` only as a data-quality signal.

Duplicate candidates remain review evidence, not a data mutation. Source sheet and source row stay attached to each legacy candidate. Only weighted signals can flag a possible or likely duplicate; a matching name by itself is never a definitive duplicate and never triggers an automatic merge, link or deletion.

Historical values are deliberately separate from current operational truth. `legacy_foundation_*`, `legacy_baptism_*`, `legacy_alec_*` and `legacy_partner_*` describe imported evidence only. They do not create Foundation School, Sacraments, Finance, Partnership, Cell or user-permission records.

The source of truth remains the owning module whenever a linked current record exists. Historical source, sheet and row metadata support review without exposing raw values to ordinary users.
