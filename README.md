# Expense Tracker

A production-ready static expense tracker built with vanilla JavaScript modules, HTML5, CSS3, Supabase Auth/Database, Chart.js, Lucide Icons, and ToastifyJS.

## Features

- Supabase email/password login, registration, logout, persistent sessions, and protected dashboard routes
- User-scoped expenses and categories with Row Level Security
- Automatic default category seeding per user
- Add, edit, delete, filter, and cache transactions
- Income and expense categories with colors, icons, and type selector
- Total balance, monthly income, monthly expenses, savings summary, recent transactions, category pie chart, and monthly trend chart
- Mobile-first UI with dark/light theme, sticky bottom navigation, floating action button, full-screen mobile modals, loading skeletons, empty states, and toast notifications

## Folder Structure

```text
expense-tracker/
├── index.html
├── dashboard.html
├── categories.html
├── supabase-schema.sql
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
5. Update [js/supabase.js](/home/hcoco1/code/expense_tracker/js/supabase.js:1):

```js
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-public-key";
```

For a runtime config approach, set these before the module loads:

```html
<script>
  window.EXPENSE_TRACKER_SUPABASE_URL = "https://your-project.supabase.co";
  window.EXPENSE_TRACKER_SUPABASE_ANON_KEY = "your-anon-public-key";
</script>
```

Plain static sites on Render do not inject environment variables into browser JavaScript without a build step. Because this project intentionally has no build step, use one of the two approaches above.

## Render Static Deployment

1. Push this folder to a Git repository.
2. In Render, create a `Static Site`.
3. Set `Build Command` to blank or `echo "static site"`.
4. Set `Publish Directory` to `.`.
5. Deploy.

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
