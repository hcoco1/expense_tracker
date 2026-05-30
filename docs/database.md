# Database

## Backend

Supabase (managed PostgreSQL). The complete schema is in [supabase-schema.sql](../supabase-schema.sql).

## Tables

### `public.categories`

| Column | Type | Constraints | Default |
| --- | --- | --- | --- |
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` |
| `user_id` | uuid | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | — |
| `name` | text | NOT NULL, `char_length` 1–40 | — |
| `color` | text | NOT NULL | `'#3b82f6'` |
| `icon` | text | NOT NULL | `'circle-dollar-sign'` |
| `type` | text | NOT NULL, CHECK `IN ('income', 'expense')` | — |
| `created_at` | timestamptz | NOT NULL | `now()` |

### `public.expenses`

| Column | Type | Constraints | Default |
| --- | --- | --- | --- |
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` |
| `user_id` | uuid | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | — |
| `category_id` | uuid | NOT NULL, FK → `public.categories(id)` ON DELETE RESTRICT | — |
| `amount` | numeric(12,2) | NOT NULL, CHECK `amount > 0` | — |
| `note` | text | CHECK `char_length <= 500` or NULL | NULL |
| `payment_method` | text | NOT NULL, CHECK `IN ('Card', 'Cash', 'Bank Transfer', 'Wallet', 'Other')` | `'Card'` |
| `expense_date` | date | NOT NULL | `current_date` |
| `created_at` | timestamptz | NOT NULL | `now()` |

## Indexes

| Index | Table | Columns |
| --- | --- | --- |
| `categories_user_id_idx` | categories | `user_id` |
| `expenses_user_date_idx` | expenses | `(user_id, expense_date DESC)` |
| `expenses_category_id_idx` | expenses | `category_id` |

## Referential Integrity

- Deleting an auth user cascades and deletes all their categories and expenses.
- Deleting a category is restricted (`ON DELETE RESTRICT`) if any expense references it. The application enforces this first in the UI: CategoriesPage queries `expenses` for the category before showing the confirm dialog. The database constraint is the authoritative enforcement.

## Row Level Security

RLS is enabled on both tables. All four operations (SELECT, INSERT, UPDATE, DELETE) have policies. All policies bind `auth.uid() = user_id`.

The INSERT and UPDATE policies on `expenses` additionally verify that the referenced `category_id` belongs to the same authenticated user:

```sql
and exists (
  select 1 from public.categories
  where categories.id = expenses.category_id
  and categories.user_id = auth.uid()
)
```

With the standard anon key, no user can read or modify another user's data.

Source: [supabase-schema.sql](../supabase-schema.sql) lines 36–87

## Realtime

The `expenses` table is published to `supabase_realtime`:

```sql
alter publication supabase_realtime add table public.expenses;
```

`categories` is not published to realtime.

In the application, `AppContext` subscribes to all events (`*`) on `expenses` filtered to the current user via `user_id=eq.${uid}`. The channel name is `expense-tracker-realtime`. The subscription is established in `AppContext` (not in `DashboardPage`) and is active for the entire session whenever a Supabase session exists.

**Realtime event handling:**

| Event | Action |
| --- | --- |
| `DELETE` | Removes the row from local `expenses` state using `payload.old.id` |
| `INSERT` | Re-fetches the single new row with `select('*, categories(*)')` and prepends it to local state |
| `UPDATE` | Re-fetches the single updated row with `select('*, categories(*)')` and replaces the matching item in local state |

INSERT and UPDATE re-fetch from the database rather than using `payload.new` directly, so the locally stored record always includes the joined category object.

Source: [src/context/AppContext.jsx](../src/context/AppContext.jsx) lines 88–122

## Fetch Behavior

`fetchExpenses` orders by `expense_date DESC, created_at DESC` and applies `.limit(500)`. Only the 500 most recent expenses are loaded into client state. Older records are not accessible in the UI.

`fetchCategories` orders by `type ASC, name ASC` (alphabetical within each type group).

When `createExpense` succeeds, the returned row from Supabase includes `select('*, categories(*)')` — the category join is embedded in the response.

## Client-Side Query (expenses fetch)

```sql
SELECT *, categories(*)
FROM expenses
WHERE user_id = <uid>
ORDER BY expense_date DESC, created_at DESC
LIMIT 500
```

Filtering by period, category, and date range is done entirely client-side in `filteredExpenses()` ([src/lib/filters.js](../src/lib/filters.js)).

## Authentication

Supabase email/password authentication only. No OAuth providers are configured in the application code.

**Password:** Minimum length of 6 characters is enforced by the HTML input `minLength={6}`. Supabase enforces its own server-side minimum independently.

**Email confirmation:** Behavior depends on the Supabase project's auth settings, which are external to this codebase. The success toast on registration reads: "Account created. Check your inbox if email confirmation is enabled." If the Supabase project requires email confirmation and the user does not confirm, their session will not be established and they will not be redirected to the dashboard.

**Password reset:** There is no forgot-password or password-reset flow in the application. The only way to recover access to an account is to use Supabase's admin tools or a separately configured email reset link outside the app.

**Account deletion:** There is no account deletion flow in the application. Deleting an auth user in Supabase cascades and removes all their categories and expenses via the `ON DELETE CASCADE` constraint on both tables.

Source: [src/pages/AuthPage.jsx](../src/pages/AuthPage.jsx)

## Default Categories

On first login, `seedDefaultCategories` inserts 12 default categories if the user has none. The seeding check uses a per-user localStorage flag (`expense_tracker_${uid}_seeded`). If the flag is present, no database query is made. If the flag is absent, a `SELECT id LIMIT 1` query runs; categories are only inserted if the result is empty.

Default categories defined in [src/lib/constants.js](../src/lib/constants.js):

| Name | Type | Color | Icon |
| --- | --- | --- | --- |
| Food | expense | #f97316 | utensils |
| Transport | expense | #06b6d4 | bus |
| Rent | expense | #8b5cf6 | home |
| Utilities | expense | #eab308 | zap |
| Entertainment | expense | #ec4899 | popcorn |
| Health | expense | #ef4444 | heart-pulse |
| Gym | expense | #22c55e | dumbbell |
| Shopping | expense | #a855f7 | shopping-bag |
| Travel | expense | #14b8a6 | plane |
| Salary | income | #22c55e | briefcase |
| Freelance | income | #3b82f6 | laptop |
| Other | expense | #64748b | circle-dollar-sign |

## Admin Cross-User Visibility

With the default anon key and the RLS policies above, the admin user sees only their own data. To expose cross-user data, one of the following must be set up separately (not present in the current schema):

1. A view (`admin_expense_stats`) with a policy that checks `auth.jwt() ->> 'email'` against the admin email.
2. A Supabase Edge Function using the service role key.

The `AdminPage` component queries `expenses` and `categories` without a `user_id` filter, but RLS restricts the result to the authenticated user's own rows unless additional policies are present.

Source: [CLAUDE.md](../CLAUDE.md) Admin Setup section; [src/pages/AdminPage.jsx](../src/pages/AdminPage.jsx) lines 45–48
