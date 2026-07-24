# API adapter foundation

Phase 1 placeholder for a future HTTP backend (Node/Express, Edge, etc.).

| File | Role |
|------|------|
| `apiConfig.ts` | `VITE_API_BASE_URL` |
| `apiClient.ts` | get/post/put/patch/delete |
| `apiRepositoryBase.ts` | resource helpers |

When `VITE_API_BASE_URL` is empty, all calls return `NOT_CONFIGURED` without throwing.
