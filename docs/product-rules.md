# Product Rules

This document records the business rules enforced by the application. Rules are organized by domain. Source references point to the file and line where each rule is implemented.

---

## Financial Calculations

### Summary Computation

`calculateSummary` in [src/lib/filters.js:62](../src/lib/filters.js) iterates a list of (already filtered) expenses and produces three values: `income`, `expense`, `balance`.

**Type resolution per transaction:**
1. Use `expense.categories?.type` if the joined category object is present on the row.
2. Otherwise look up `categories.find((c) => c.id === expense.category_id)?.type` from the local categories array.
3. If neither resolves, default to `'expense'`.

**Accumulation:**
- If type is `'income'`: `summary.income += Number(expense.amount || 0)`
- All other types: `summary.expense += Number(expense.amount || 0)`
- `summary.balance = summary.income - summary.expense` (recomputed on every iteration)

### Balance Card vs. Period Cards

The SummaryCards component computes two separate summaries:

| Card | Input | Description |
| --- | --- | --- |
| Total Balance | All loaded expenses (up to 500, unfiltered by period) | Running balance across all time |
| Period Income | Current period-filtered expenses | Income within the selected period |
| Period Expenses | Current period-filtered expenses | Expenses within the selected period |
| Savings | Current period-filtered expenses | `income - expense` within the period |

Source: [src/components/SummaryCards.jsx](../src/components/SummaryCards.jsx) lines 11–13

### Savings Rate

`Math.max(0, Math.round((balance / income) * 100))`

- If `income` is 0, the rate is 0 (division guarded).
- Rate is floored at 0 — never shown as negative even when expenses exceed income.
- Rounded to the nearest integer percent.

Source: [src/components/SummaryCards.jsx:14](../src/components/SummaryCards.jsx); [src/lib/share.js:13](../src/lib/share.js)

### Currency

The currency selector changes the display format only. No foreign-exchange conversion is performed. All amounts are stored and summed as their raw numeric values. The selected currency code is passed to `Intl.NumberFormat` to format the symbol and locale separators.

Exception: JPY is formatted with `maximumFractionDigits: 0` (no decimal places). All other currencies use `maximumFractionDigits: 2`.

Source: [src/lib/utils.js:1](../src/lib/utils.js)

---

## Date Handling

### Local-Time Parsing

`expense_date` is a SQL `date` column stored as `YYYY-MM-DD`. When parsed into a JavaScript `Date` object, the string is always suffixed with `T00:00:00` to force local-time interpretation and prevent UTC offset from shifting the day. Both `filteredExpenses` and `formatDate` use this pattern.

Source: [src/lib/filters.js:2](../src/lib/filters.js); [src/lib/utils.js:9](../src/lib/utils.js)

### Week Boundaries

The week period runs Monday through Sunday (ISO week convention).

`startOfWeek(date)`:
- `getDay()` returns 0 for Sunday. The expression `getDay() || 7` maps Sunday to 7.
- `setDate(date - day + 1)` shifts back to Monday.

Source: [src/lib/filters.js:5](../src/lib/filters.js)

### Month Boundaries

Start: `new Date(year, month - 1, 1)` — first day, midnight local time.
End: `endOfDay(new Date(year, month, 0))` — day 0 of the next month resolves to the last day of the current month, at 23:59:59.999 local time.

### Year Boundaries

Start: `new Date(year, 0, 1)` — January 1.
End: `endOfDay(new Date(year, 11, 31))` — December 31.

### Custom Range

If `customStart > customEnd`, the values are automatically swapped before computing the range. The range is inclusive on both ends.

Source: [src/lib/filters.js:42](../src/lib/filters.js)

### Year Selector Range

The year dropdown in FiltersBar offers 7 years: `currentYear - 5` through `currentYear + 1`. Transactions outside this range are not accessible via the year or month period — they are accessible via "All time".

Source: [src/components/FiltersBar.jsx:11](../src/components/FiltersBar.jsx)

---

## Trend Chart Bucketing

`buildTrendBuckets` in [src/lib/filters.js:79](../src/lib/filters.js) determines how the line chart is segmented:

| Period | Buckets |
| --- | --- |
| Week | 7 daily buckets, Mon–Sun |
| Month | 6 monthly buckets ending at the selected month |
| Year | 12 monthly buckets for the selected year |
| All time | 6 monthly buckets ending at the most recent transaction's month (or current month if no transactions) |
| Custom ≤ 31 days | One bucket per day |
| Custom > 31 days | One bucket per calendar month spanning the range |

The trend chart plots expense-only amounts (income transactions are excluded). The trend chart uses `expenses` (all loaded transactions), not the period-filtered `filtered` set. The category filter does not apply to the trend chart.

Source: [src/components/Charts.jsx:46](../src/components/Charts.jsx)

---

## Transaction Constraints

### Amount

- DB: `numeric(12,2)`, CHECK `amount > 0`. Negative and zero amounts are rejected by the database.
- UI: `type="number"`, `min="0.01"`, `step="0.01"`. The HTML input does not enforce uniqueness or maximum.

### Note

- DB: `char_length(note) <= 500` or NULL.
- UI: `maxLength={240}`. The UI enforces a stricter limit than the database.

### Payment Method

Accepted values (enforced by both the database CHECK and the UI select options): `Card`, `Cash`, `Bank Transfer`, `Wallet`, `Other`. Default is `Card`.

### Category Deletion

A category cannot be deleted if any expense references it. The UI checks this before presenting the confirmation dialog by querying `expenses` for a matching `category_id`. If transactions are found, deletion is blocked with a toast. The database enforces the same constraint via `ON DELETE RESTRICT`.

Source: [src/pages/CategoriesPage.jsx:40](../src/pages/CategoriesPage.jsx)

---

## Transaction Display

`TransactionList` renders at most 30 items from the current `filtered` array (`filtered.slice(0, 30)`). If more than 30 transactions match the active filters, the remainder are not shown but are included in all summary calculations and chart data.

Source: [src/components/TransactionList.jsx:44](../src/components/TransactionList.jsx)

### Transaction Primary Label

The primary label shown for a transaction is:
1. `expense.note` if non-empty.
2. `category?.name` if note is empty.
3. The string `'Transaction'` if both are absent.

Source: [src/components/TransactionList.jsx:54](../src/components/TransactionList.jsx)

---

## Category Rules

### Ordering

Categories are ordered `type ASC, name ASC` in the database query. In `createCategory`, newly created categories are inserted into local state and immediately sorted with the same comparator so the UI reflects the correct order without a re-fetch.

Source: [src/context/AppContext.jsx:158](../src/context/AppContext.jsx); [src/context/AppContext.jsx:169](../src/context/AppContext.jsx)

### Seeding

Default categories are seeded once per user per browser. The seeding flag (`expense_tracker_${uid}_seeded`) is written to localStorage after the first check, regardless of whether categories were inserted. If the user deletes all their categories after seeding, no re-seeding occurs.

Source: [src/context/AppContext.jsx:135](../src/context/AppContext.jsx)

### Name Length

Maximum 40 characters, enforced by both the database (`char_length(name) between 1 and 40`) and the UI (`maxLength={40}`).

### Icon Resolver

`CategoryIcon` maps icon name strings to Lucide components. If the icon name is not in the map, it defaults to `CircleDollarSign`. The component also accepts `bolt` as an alias for `Zap` and `briefcase-business` as an alias for `Briefcase`.

Source: [src/components/CategoryIcon.jsx](../src/components/CategoryIcon.jsx)

---

## Optimistic Updates

`updateCategory`, `deleteCategory`, `updateExpense`, and `deleteExpense` all apply an optimistic local state update before the Supabase call resolves. Before the optimistic update is applied, the current array is captured as a snapshot. If the Supabase call fails, the snapshot is restored synchronously via `setExpenses` / `setCategories` — no network round-trip is required. This ensures rollback is immediate and correct regardless of connectivity.

`updateExpense` and `updateCategory` additionally apply a second state update on success using the server-returned row (with its category join), replacing the optimistic snapshot with authoritative data.

Source: [src/context/AppContext.jsx:174](../src/context/AppContext.jsx); [src/context/AppContext.jsx:224](../src/context/AppContext.jsx)

---

## Admin Access

### Authorization Check

`isAdminUser(session)` returns `true` if either condition holds:

1. `session?.user?.app_metadata?.role === 'admin'` (set server-side via Supabase service role).
2. `session?.user?.email` is in the `ADMIN_EMAILS` hardcoded array.

`ADMIN_EMAILS` contains `['arias.ivan@gmail.com']`.

Source: [src/context/AppContext.jsx:12](../src/context/AppContext.jsx)

### Route Protection

`AdminRoute` in [src/App.jsx:33](../src/App.jsx) redirects authenticated non-admin users to `/dashboard`. The `isAdminUser` check is also repeated inside `AdminPage` itself, which redirects to `/dashboard` if it renders for a non-admin (defense in depth).

### Navigation Visibility

The Admin nav item in the bottom navigation bar is rendered only when `isAdmin` is true.

Source: [src/components/Layout.jsx:131](../src/components/Layout.jsx)

---

## Export Rules

### CSV Export

- Applies `filteredExpenses()` fresh using current filter state (does not reuse the memoized `filtered` from context).
- Columns: `Date`, `Category`, `Type`, `Amount`, `Currency`, `Payment Method`, `Notes`.
- `Amount` is the raw numeric value (no currency conversion).
- `Currency` column contains the selected currency code string (e.g., `'USD'`).
- UTF-8 BOM (`﻿`) is prepended for Excel compatibility.
- Values starting with `=`, `+`, `-`, `@`, tab, or carriage return are prefixed with `'` to prevent spreadsheet formula injection.
- Newlines within note text are replaced with a space.
- Filename format: `expenses-{period}-{YYYY-MM-DD}.csv` where the date is the current local date at download time.

Source: [src/lib/share.js:66](../src/lib/share.js)

### JSON Export

- Applies `filteredExpenses()` fresh.
- Output wrapper: `{ exported_at, period, currency, count, transactions[] }`.
- `exported_at` is an ISO 8601 timestamp (`new Date().toISOString()`).
- Each transaction: `{ date, category, type, amount, currency, payment_method, note }`.
- `amount` is cast to `Number`.
- Filename format: `expenses-{period}-{YYYY-MM-DD}.json`.

Source: [src/lib/share.js:99](../src/lib/share.js)

### Share Text

- Computed from already-filtered expenses (reuses context's memoized `filtered`).
- Shows: period label, balance, income, expenses, savings rate (only if > 0), top 3 expense categories by amount.
- Only expense-type transactions are included in the top categories list.
- Savings rate in share text uses the same formula as the UI: `Math.max(0, Math.round((balance / income) * 100))`.

Source: [src/lib/share.js:9](../src/lib/share.js)

---

## Offline Cache

### Cache Keys (per user)

| Key | Contents |
| --- | --- |
| `expense_tracker_{uid}_categories` | JSON-serialized categories array |
| `expense_tracker_{uid}_expenses` | JSON-serialized expenses array |
| `expense_tracker_{uid}_seeded` | `'1'` once default categories have been checked |

### Persistent Preferences (not user-scoped)

| Key | Contents |
| --- | --- |
| `expense_tracker_theme` | Active theme name |
| `expense_tracker_lang` | Active language code |
| `expense_tracker_period` | Active period filter |
| `expense_tracker_currency` | Active currency code |

### Cache Lifecycle

- **On login**: localStorage is read for the user's cache keys. If present, categories and expenses are populated into React state immediately, before the Supabase fetch completes.
- **On every state change**: Both arrays are serialized back to localStorage.
- **On Supabase fetch success**: State is overwritten with server data, which triggers another cache save.
- **On logout**: React state is cleared (`setCategories([])`, `setExpenses([])`), but localStorage is **not** cleared. The cache persists in the browser until overwritten by a subsequent login of the same user.

Source: [src/context/AppContext.jsx:71](../src/context/AppContext.jsx)
