# Expense Tracker

A production-ready static expense tracker built with vanilla JavaScript modules, HTML5, CSS3, Supabase Auth/Database, Chart.js, Lucide Icons, and ToastifyJS.

## Features

- Supabase email/password login, registration, logout, persistent sessions, and protected dashboard routes
- User-scoped expenses and categories with Row Level Security
- Automatic default category seeding per user
- Add, edit, delete, filter, and cache transactions
- Income and expense categories with colors, icons, and type selector
- Total balance, period-based income, period-based expenses, savings summary, recent transactions, category pie chart, and adaptive trend chart
- Flexible reporting periods: this week, this month, this year, all time, or custom date range
- Mobile-first UI with dark/light theme, sticky bottom navigation, floating action button, full-screen mobile modals, loading skeletons, empty states, and toast notifications

## Folder Structure

```text
expense-tracker/
├── index.html
├── dashboard.html
├── categories.html
├── .env.example
├── config.sample.js
├── supabase-schema.sql
├── scripts/
│   └── render-build.sh
├── css/
│   ├── style.css
│   ├── mobile.css
│   └── variables.css
├── js/
│   ├── app.js
│   ├── supabase.js
│   ├── auth.js
│   ├── expenses.js
│   ├── categories.js
│   ├── charts.js
│   ├── ui.js
│   └── state.js
├── assets/
└── README.md
```

## Supabase Setup

1. Create a free Supabase project.
2. Open `SQL Editor` and run the full contents of `supabase-schema.sql`.
3. In `Authentication > Providers`, enable Email.
4. In `Project Settings > API`, copy your Project URL and anon public key.
5. Create an untracked `config.js` from `config.sample.js`:

```js
window.EXPENSE_TRACKER_SUPABASE_URL = "https://your-project.supabase.co";
window.EXPENSE_TRACKER_SUPABASE_ANON_KEY = "your-anon-public-key";
```

`config.js` is intentionally ignored by Git. Do not commit Supabase keys, database URLs, service role keys, JWT secrets, or generated local config files.

The anon public key is expected to be visible in browser apps. Security depends on Supabase Auth plus Row Level Security policies, not on hiding the anon key. Never expose the `service_role` key, database password, JWT secret, or access tokens in this static app.

## Render Static Deployment

1. Push this folder to a Git repository.
2. In Render, create a `Static Site`.
3. In `Environment`, add these variables:

```text
EXPENSE_TRACKER_SUPABASE_URL=https://your-project.supabase.co
EXPENSE_TRACKER_SUPABASE_ANON_KEY=your-rotated-anon-public-key
```

4. Set `Build Command` to:

```bash
sh scripts/render-build.sh
```

5. Set `Publish Directory` to `.`.
6. Deploy.

Render will generate `config.js` during deployment from the environment variables. The generated file is not committed to Git.

## Credential Exposure Response

If these values were already deployed publicly:

1. In Supabase, rotate the exposed anon key from `Project Settings > API`.
2. Redeploy immediately with the new anon key in `config.js` or deployment environment variables.
3. Search the deployed site and repository history for any `service_role` key, database URL, JWT secret, or password. If any were exposed, rotate them immediately.
4. Keep RLS enabled on every table reachable from the browser and verify policies before trusting the new deployment.

## Local Development

Serve the folder with any static server:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Notes

- The app uses CDN-hosted Supabase, Chart.js, Lucide, ToastifyJS, and Google Fonts.
- Local storage is used as a cache fallback after successful authenticated fetches.
- Category deletion is restricted by the database while expenses reference that category.
