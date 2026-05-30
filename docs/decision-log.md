# Decision Log

Each entry records a design decision that is not self-evident from reading the code alone. Entries are derived from commit history, code comments, and CLAUDE.md. Inferred rationale is labeled **[INFERRED]**.

---

## DL-001 — HashRouter instead of BrowserRouter

**Decision:** The router was switched from `BrowserRouter` to `HashRouter`.

**Evidence:** Git commit message `b6cebb5`: "Switch BrowserRouter to HashRouter to fix refresh white screen". `render.yaml` also contains a `/*` → `/index.html` rewrite rule, which was added in a separate commit (`0336743`).

**Effect:** All client-side routes are hash-based (e.g., `/#/dashboard`). The SPA rewrite rule in `render.yaml` remains in place as a safety net but is not required for hash-based routing to work.

**Source:** [src/App.jsx:49](../src/App.jsx); [render.yaml](../render.yaml)

---

## DL-002 — Realtime: re-fetch on INSERT/UPDATE rather than use payload

**Decision:** When the realtime channel receives an `INSERT` or `UPDATE` event, the application re-fetches the affected row from Supabase with `select('*, categories(*)')` rather than using `payload.new` directly.

**Rationale:** `payload.new` contains the raw `expenses` row but does not include the joined `categories` object. Re-fetching ensures the locally stored record has the same shape as a row fetched via `fetchExpenses`, which includes the embedded category. Using `payload.new` would require a separate category lookup or a fallback to the categories array.

**Source:** [src/context/AppContext.jsx:103](../src/context/AppContext.jsx)

---

## DL-003 — Optimistic updates with snapshot rollback

**Decision:** `updateCategory`, `deleteCategory`, `updateExpense`, and `deleteExpense` all apply an optimistic state update before the Supabase write completes. If the write fails, the pre-mutation state snapshot (captured before the optimistic update) is restored via `setExpenses` / `setCategories`. If the write succeeds, `updateExpense` and `updateCategory` apply a second state update with the server-returned row.

**Rationale:** Snapshot rollback is unconditionally correct: it restores the item immediately with no network dependency, so failed offline mutations are corrected in the same event loop tick rather than remaining wrong until the next successful fetch. A full re-fetch rollback (the previous behavior) fails silently when offline, leaving the UI in a state that contradicts the database and writing that wrong state to localStorage before any correction occurs. Snapshot rollback also corrects the cache within the same error-handling cycle.

The accepted tradeoff: if a realtime event from another device arrives between snapshot capture and rollback, restoring the snapshot reverts that event. The window is bounded by the mutation attempt duration (~0–2 s online, near-zero offline) and is self-correcting via the next realtime event or fetch.

**Source:** [src/context/AppContext.jsx:174](../src/context/AppContext.jsx); [src/context/AppContext.jsx:224](../src/context/AppContext.jsx)

---

## DL-004 — localStorage cache keyed by user ID

**Decision:** Cache keys include the user's UUID (`expense_tracker_${uid}_categories`, `expense_tracker_${uid}_expenses`).

**Effect:** Multiple Supabase accounts on the same browser each maintain independent cache entries. Switching between accounts does not contaminate the cache.

**Source:** [src/context/AppContext.jsx:74](../src/context/AppContext.jsx)

---

## DL-005 — Category seeding uses a localStorage flag to skip DB query

**Decision:** `seedDefaultCategories` stores a flag (`expense_tracker_${uid}_seeded`) after the first check. Subsequent calls return immediately without querying Supabase.

**Rationale [INFERRED]:** Avoids a `SELECT id LIMIT 1` query on every dashboard and categories page load for users who have already been seeded. The tradeoff is that the flag never expires, so users who delete all their own categories do not get re-seeded automatically.

**Source:** [src/context/AppContext.jsx:141](../src/context/AppContext.jsx)

---

## DL-006 — fetchExpenses limit of 500

**Decision:** `fetchExpenses` applies `.limit(500)` to the Supabase query.

**Rationale [INFERRED]:** Prevents unbounded data transfer as transaction history grows. Client-side filtering and chart calculations operate on the in-memory set; loading all records would increase initial load time proportionally.

**Effect:** Transactions beyond the 500-row limit are invisible to all client-side operations.

**Source:** [src/context/AppContext.jsx:199](../src/context/AppContext.jsx)

---

## DL-007 — Week period starts on Monday (ISO week)

**Decision:** `startOfWeek` maps Sunday (`getDay() === 0`) to day 7, then subtracts to reach the preceding Monday.

**Rationale [INFERRED]:** Follows ISO 8601 week convention (Monday = first day of week).

**Source:** [src/lib/filters.js:5](../src/lib/filters.js)

---

## DL-008 — Admin authorization uses both app_metadata role and email allowlist

**Decision:** `isAdminUser` checks `session.user.app_metadata.role === 'admin'` first, then falls back to checking `session.user.email` against `ADMIN_EMAILS`.

**Effect:** The `app_metadata.role` path supports a proper server-issued admin role set via Supabase service role. The email list provides a fallback that works with the standard anon key without requiring service role setup.

**Source:** [src/context/AppContext.jsx:15](../src/context/AppContext.jsx)

---

## DL-009 — No realtime subscription on categories

**Decision:** Only `expenses` is published to `supabase_realtime`. Categories are not subscribed to in the application.

**Rationale [INFERRED]:** Categories change infrequently. A full re-fetch is triggered on each page visit. Realtime on categories would require handling join invalidation (expenses reference categories) and add complexity for minimal benefit.

**Source:** [supabase-schema.sql:91](../supabase-schema.sql); [src/context/AppContext.jsx:88](../src/context/AppContext.jsx)

---

## DL-010 — Four manual Vite vendor chunks

**Decision:** `vite.config.js` splits output into four named vendor chunks: `vendor-react`, `vendor-charts`, `vendor-supabase`, `vendor-ui`.

**Rationale [INFERRED]:** Chart.js and Supabase are large libraries that change rarely. Splitting them into separate chunks allows browsers to cache them independently of application code changes, reducing cache invalidation on deploys.

**Source:** [vite.config.js](../vite.config.js)

---

## DL-011 — Render build script maps environment variable names

**Decision:** `scripts/render-build.sh` reads `EXPENSE_TRACKER_SUPABASE_URL` and `EXPENSE_TRACKER_SUPABASE_ANON_KEY` and re-exports them as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` before running `npm run build`.

**Rationale:** Vite embeds environment variables at build time using the `VITE_` prefix convention. Render does not namespace variables. The build script bridges the two naming conventions so neither the application code nor the Render dashboard needs to use the `VITE_` prefix in its variable names.

**Source:** [scripts/render-build.sh](../scripts/render-build.sh)

---

## DL-012 — Memoized `filtered` in AppContext, not computed per component

**Decision:** `filtered` is computed once via `useMemo` in `AppContext` and exposed to all consumers through the context value.

**Effect:** All components that need filtered expenses (SummaryCards, TransactionList, Charts, ShareModal) share the same computed array without re-running `filteredExpenses`. Any component that reads `filtered` from context gets the same reference as long as inputs have not changed.

**Source:** [src/context/AppContext.jsx:40](../src/context/AppContext.jsx)

---

## DL-013 — Custom date range > 31 days uses monthly buckets in trend chart

**Decision:** `buildTrendBuckets` switches from daily to monthly buckets when a custom range exceeds 31 days.

**Rationale [INFERRED]:** A daily bucket resolution over a multi-month range would produce too many data points for a readable line chart. Monthly buckets keep the chart legible regardless of range length.

**Source:** [src/lib/filters.js:99](../src/lib/filters.js)

---

## DL-014 — upsertExpense makes INSERT state mutations idempotent

**Decision:** A shared `upsertExpense(prev, item)` helper is used by both `createExpense` and the realtime INSERT handler. It prepends the item if its id is not already in state; otherwise it replaces in place.

**Evidence:** Financial Correctness Review confirmed that both paths called `setExpenses((prev) => [data, ...prev])` unconditionally, producing a duplicate entry whenever the realtime event fired after `createExpense` had already added the row (the common ordering). The reverse ordering (realtime before HTTP response) produced the same duplication when the unconditional prepend ran second.

**Effect:** Both orderings are now correct. `createExpense` still adds the row immediately on HTTP response. When the realtime event subsequently fires, `upsertExpense` finds the existing id and replaces in place rather than prepending again. Cross-device inserts (where the row is not yet in local state) still prepend correctly.

**Alternatives rejected:** Option A (deduplicate only in the realtime handler) did not protect against the reverse ordering. Option B (remove optimistic insert from `createExpense`) introduced a visible latency regression and made new-transaction display dependent on reliable WebSocket delivery.

**Source:** [src/context/AppContext.jsx:194](../src/context/AppContext.jsx)
