# Performance Manual QA

1. Open Members with 2,000+ records and confirm the first request returns only the selected page size.
2. Change 25 / 50 / 100 and confirm total, page and next/previous controls are correct.
3. Search by full name, member code, email, primary phone and secondary phone.
4. Select a church, then a cell group; confirm only cells in that group appear and only matching members return.
5. Quickly change filters/pages and confirm an older response never overwrites the latest choice.
6. Log in on another route and confirm no all-members request is made.
7. Leave the dashboard open for five minutes and confirm the current screen refreshes without a full Members download.
8. Test an empty result, error/RLS denial and retry through a normal page/filter action.
