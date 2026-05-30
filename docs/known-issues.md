# Known Issues

Each entry is classified as a **Bug** (incorrect behavior), **Limitation** (intentional or structural constraint), or **Inconsistency** (mismatch between two parts of the system). Source references point to the relevant code.

Entries marked **[FIXED]** have been resolved and are kept for audit history.

---

## KI-000 — INSERT duplication via realtime handler [FIXED]

**Classification:** Bug
**Status:** Fixed in [src/context/AppContext.jsx](../src/context/AppContext.jsx) — commit resolving this issue.

`createExpense` and the realtime INSERT handler both called `setExpenses((prev) => [data, ...prev])` unconditionally for the same database row. Because Supabase Realtime fires for all `expenses` changes regardless of which client originated the write, and because both paths completed without checking for an existing id, the new expense was prepended twice.

**Effect:** After creating a transaction, the item appeared twice in the list, both summary cards doubled the amount, and CSV/JSON exports contained a duplicate row. The duplication persisted until `fetchExpenses()` was called (manual refresh or page reload).

**Fix applied:** Added `upsertExpense(prev, item)` at line 194 of `AppContext.jsx`. The function prepends the item if its id is not already present, or replaces it in place if it is. Both `createExpense` (line 218) and the realtime INSERT handler (line 112) now call `upsertExpense` instead of unconditionally prepending. The fix is correct for both event orderings (HTTP response before WebSocket and the reverse).

**Source:** [src/context/AppContext.jsx:194](../src/context/AppContext.jsx)
**Found by:** Financial Correctness Review

---

## KI-014 — Offline optimistic rollback never executed [FIXED]

**Classification:** Bug
**Status:** Fixed in [src/context/AppContext.jsx](../src/context/AppContext.jsx).

`updateExpense`, `deleteExpense`, `updateCategory`, and `deleteCategory` applied an optimistic state mutation before the Supabase write, then called `fetchExpenses()` or `fetchCategories()` (without `await`) in the error handler to restore state. When the device was offline, the mutation failed and the rollback fetch also failed silently. The optimistic state (deleted item missing, edited item showing wrong values) persisted in React state and was written to localStorage by the auto-save effect, surviving page reloads until a successful Supabase fetch occurred.

**Effect:** After a failed delete while offline, the item was absent from the UI and from the localStorage cache even though it still existed in the database. The error toast contradicted the visible state: the toast said the operation failed, but the item remained gone.

**Fix applied:** Each of the four functions now captures a snapshot of the current array (`const previousExpenses = expenses` / `const previousCategories = categories`) before applying the optimistic update. On error, `setExpenses(previousExpenses)` or `setCategories(previousCategories)` restores the pre-mutation state synchronously, with no network dependency. The auto-save effect then writes the correct state back to localStorage within the same cycle.

**Source:** [src/context/AppContext.jsx:175](../src/context/AppContext.jsx)
**Found by:** Offline Cache Correctness Review

---

## KI-001 — Note field length mismatch

**Classification:** Inconsistency

The database allows up to 500 characters in the `note` column (`check (note is null or char_length(note) <= 500)`). The `TransactionModal` textarea enforces `maxLength={240}`. A note longer than 240 characters can exist in the database (e.g., inserted via direct API call or a previous version) but cannot be reproduced through the UI.

**Database:** [supabase-schema.sql:21](../supabase-schema.sql)
**UI:** [src/components/TransactionModal.jsx:109](../src/components/TransactionModal.jsx)

---

## KI-002 — TransactionList renders at most 30 items

**Classification:** Limitation

`TransactionList` renders `filtered.slice(0, 30)`. If the active filters match more than 30 transactions, the excess are not visible in the list. All summary calculations (balance, income, expenses, charts) operate on the full `filtered` array and are not affected by this display cap.

**Source:** [src/components/TransactionList.jsx:44](../src/components/TransactionList.jsx)

---

## KI-003 — Expense fetch limited to 500 rows

**Classification:** Limitation

`fetchExpenses` appends `.limit(500)`. Only the 500 most recent expenses (by `expense_date DESC, created_at DESC`) are loaded into client state. Transactions beyond this limit are excluded from all calculations, charts, and exports until a fetch is performed with a different scope (which is not currently possible through the UI).

**Source:** [src/context/AppContext.jsx:199](../src/context/AppContext.jsx)

---

## KI-004 — Currency is display-only; no conversion

**Classification:** Limitation

The currency selector changes how amounts are formatted (`Intl.NumberFormat` with the selected currency code) but does not convert amounts. All stored amounts are in the currency the user entered them in. Selecting EUR after recording amounts in USD produces correctly formatted EUR symbols on USD-denominated values.

**Source:** [src/lib/utils.js:1](../src/lib/utils.js)

---

## KI-005 — No realtime subscription on categories

**Classification:** Limitation

Only the `expenses` table is published to Supabase Realtime and subscribed to in the application. Changes to categories (from another session or device) are not received in real time. The category list updates only when `fetchCategories` is called explicitly (on page load or manual refresh).

**Source:** [src/context/AppContext.jsx:88](../src/context/AppContext.jsx); [supabase-schema.sql:91](../supabase-schema.sql)

---

## KI-006 — Seeding flag never resets

**Classification:** Limitation

Once `expense_tracker_${uid}_seeded` is written to localStorage, `seedDefaultCategories` never queries the database again for that user in that browser. If the user deletes all their categories, no re-seeding occurs until the localStorage flag is manually cleared.

**Source:** [src/context/AppContext.jsx:141](../src/context/AppContext.jsx)

---

## KI-007 — Admin panel shows only own data without custom RLS

**Classification:** Limitation

The admin page queries `expenses` and `categories` without a `user_id` filter, relying on RLS to broaden visibility. With the default per-user RLS policies, the result is restricted to the admin's own rows. The "Total Users" stat shows 1, and the per-user table shows only the admin's account. Cross-user visibility requires additional database setup not included in the current schema.

The admin page displays an alert informing the admin of this limitation.

**Source:** [src/pages/AdminPage.jsx:43](../src/pages/AdminPage.jsx); [CLAUDE.md](../CLAUDE.md) Admin Setup section

---

## KI-008 — Logout does not clear localStorage cache

**Classification:** Limitation

On `onAuthStateChange` receiving a null session, `setCategories([])` and `setExpenses([])` are called to clear React state. The localStorage cache keys (`expense_tracker_${uid}_categories`, `expense_tracker_${uid}_expenses`) are not deleted. The cached data remains in the browser until the same user logs in again (at which point the cache is hydrated and then overwritten by a fresh Supabase fetch).

**Source:** [src/context/AppContext.jsx:64](../src/context/AppContext.jsx)

---

## KI-009 — Year filter range is fixed relative to today

**Classification:** Limitation

The FiltersBar year selector offers `currentYear - 5` through `currentYear + 1` (7 years). The range is computed at component render using `new Date().getFullYear()`. Transactions with `expense_date` outside this window are not accessible via the month or year period — they appear only under "All time".

**Source:** [src/components/FiltersBar.jsx:10](../src/components/FiltersBar.jsx)

---

## KI-010 — Trend chart excludes category filter

**Classification:** Inconsistency

The trend line chart in `Charts` uses `expenses` (all loaded expenses) as its data source and aggregates by date bucket. The category filter in `FiltersBar` applies to `filtered`, which drives the doughnut chart, transaction list, and summary cards — but not the trend buckets. Selecting a specific category changes the doughnut and summary cards but does not change the trend line.

**Source:** [src/components/Charts.jsx:45](../src/components/Charts.jsx)

---

## KI-011 — Theme picker applies data-theme twice on change

**Classification:** Inconsistency

When the user selects a theme from the theme picker in `Layout`, the click handler calls `document.documentElement.setAttribute('data-theme', name)` directly, and then calls `setTheme(name)`. The `AppContext` `useEffect` also calls `document.documentElement.setAttribute('data-theme', theme)` when `theme` changes. This results in the attribute being set twice on every theme change — once inline and once via the effect. There is no observable side effect from the duplication.

**Source:** [src/components/Layout.jsx:52](../src/components/Layout.jsx); [src/context/AppContext.jsx:46](../src/context/AppContext.jsx)

---

## KI-012 — PWA manifest shortcuts link to non-hash URLs

**Classification:** Bug

`public/manifest.json` defines shortcuts with `"url": "/dashboard"` and `"url": "/categories"`. The application uses `HashRouter`, so the correct URLs are `/#/dashboard` and `/#/categories`. Launching the app from a PWA shortcut will load the root URL, which redirects to the login page for unauthenticated users or to `/dashboard` for authenticated users via `PublicRoute`.

**Source:** [public/manifest.json:20](../public/manifest.json); [src/App.jsx:49](../src/App.jsx)

---

## KI-013 — Share button label does not differentiate Web Share vs. clipboard

**Classification:** Inconsistency

Both branches of the Share button in `ShareModal` display the same label (`t('Share')`). When the Web Share API is available (`canShareNatively` is true), clicking the button invokes the native share sheet. When it is not available, clicking falls back to copying text to the clipboard. The button label does not communicate which behavior will occur.

**Source:** [src/components/ShareModal.jsx:150](../src/components/ShareModal.jsx)
