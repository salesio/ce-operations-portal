# Performance Improvements

- Members directory now requests server-side pages of 25, 50 or 100 rows (default 50).
- Supabase uses a narrow column projection, stable `full_name` ordering, `range()` pagination and exact count metadata.
- Search is server-side across name, member code, email and phone fields. One-character search is deliberately ignored to prevent broad scans.
- Church, cell group, cell and status filters are sent with the page request. The UI preserves the selected group and only sends a cell ID where a canonical ID is available.
- Newer requests win: stale page responses are ignored.
- The global five-minute refresh no longer hydrates the full Members table; entering the Members route triggers its own page load.

## Next measured step

Use the suggested indexes after an `EXPLAIN ANALYZE` review. Consider cached aggregate/RPC endpoints for summary cards rather than calculating totals from a page.
