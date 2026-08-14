# HQ Members Pilot Import Report

Status: **Pending live pilot execution**

## Safety conditions

- Batch: `HQ-PILOT-2026-001`
- Source workbook: `DATA BASE NOVEMBER.xlsx` (read-only)
- Maximum new official members: 10
- Full HQ import: not started
- Automatic duplicate merge: prohibited
- External domain records: prohibited (Finance, Foundation, Sacraments, Cells and Cell Groups)

## Execution record

Record the terminal pre-import report and the post-import validation here after a human-approved live run. Do not place keys, tokens, database URLs, or other credentials in this report.

| Field | Result |
| --- | --- |
| Timestamp | Pending |
| Commit/tag | Pending |
| Staging project identifier | Pending |
| Members before / after | Pending |
| Selected / inserted / skipped | Pending |
| Duplicate review count | Pending |
| Phone-null count | Pending |
| Matched groups / cells | Pending |
| Profile QA | Pending |
| Unexpected side effects | Pending |
| Rollback reference | `DELETE FROM public.members WHERE legacy_import_batch_id = :pilot_batch_id;` |
| Decision | Pending |
