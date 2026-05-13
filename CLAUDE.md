# Expense Tracker

A personal expense and income tracker built with React, Vite, DaisyUI, and Supabase.

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS v3 + DaisyUI v3 (all 29 built-in themes) |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Charts | Chart.js via react-chartjs-2 |
| Icons | lucide-react |
| Routing | react-router-dom v6 |
| Toasts | react-hot-toast |
| i18n | Custom `useT()` hook (English · Español · Nederlands) |

## Running Locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## Project Structure

```
src/
├── App.jsx                    # Router, auth guards, admin route
├── main.jsx
├── index.css                  # Tailwind directives + tone-* color utilities
├── i18n/
│   └── index.js               # useT() hook + ES / NL translation dicts
├── lib/
│   ├── supabase.js            # Supabase client (VITE_ env vars)
│   ├── constants.js           # defaultCategories, categoryColors, categoryIcons, currencies
│   ├── utils.js               # formatCurrency, formatDate, colorClass
│   ├── filters.js             # getPeriodRange, filteredExpenses, calculateSummary, buildTrendBuckets
│   └── share.js               # buildShareText, shareNative, copyToClipboard, downloadCSV, downloadJSON
├── hooks/
│   └── usePageTitle.js        # Sets document.title; restores on unmount
├── context/
│   └── AppContext.jsx         # session, categories, expenses, filters, theme, language + CRUD
├── pages/
│   ├── AuthPage.jsx           # Login / Register
│   ├── DashboardPage.jsx      # Dashboard + realtime subscription
│   ├── CategoriesPage.jsx     # Categories CRUD
│   └── AdminPage.jsx          # Admin panel (restricted to ADMIN_EMAILS)
└── components/
    ├── Layout.jsx             # Topbar (theme/lang pickers, share, logout) + bottom nav + FAB
    ├── SummaryCards.jsx       # Balance, income, expenses, savings stat cards
    ├── FiltersBar.jsx         # Period / category / currency filters
    ├── TransactionList.jsx    # Scrollable transaction items with edit/delete
    ├── CategoryList.jsx       # Category items with edit/delete
    ├── Charts.jsx             # Category doughnut + period trend line
    ├── CategoryIcon.jsx       # Lucide icon resolver for category icon names
    ├── TransactionModal.jsx   # Add / edit transaction dialog
    ├── CategoryModal.jsx      # Add / edit category + color/icon pickers
    ├── ShareModal.jsx         # Share & Export dialog (Web Share API / clipboard / CSV / JSON)
    └── ConfirmModal.jsx       # Delete confirmation dialog
```

## Features

- **29 DaisyUI themes** — theme picker in topbar (persisted to localStorage)
- **3 languages** — English, Español, Nederlands (persisted to localStorage)
- **Admin panel** — accessible only to `ADMIN_EMAILS` (`arias.ivan@gmail.com`); shows per-user transaction/category stats; admin nav item appears automatically for admin users
- **Realtime** — Supabase Postgres changes subscription on the dashboard
- **Offline cache** — categories + expenses cached in localStorage per user
- **Animations** — `animate-modalIn` keyframe defined in `tailwind.config.js`
- **Share & Export** — ShareModal (Share2 icon in topbar): Web Share API with clipboard fallback, CSV export (UTF-8 BOM, Excel-friendly), JSON export, preview of top spending categories
- **SEO** — Open Graph, Twitter Card, JSON-LD WebApplication schema, PWA manifest, dynamic page titles per route
- **PWA** — `public/manifest.json`, `favicon.svg`, `apple-touch-icon.svg`, `og-image.svg` (1200×630 static), `robots.txt`

## Admin Setup

The admin page (`/admin`) is email-gated via `ADMIN_EMAILS` in [src/context/AppContext.jsx](src/context/AppContext.jsx).

With the default anon key + RLS, the admin sees **only their own data** aggregated. To enable cross-user visibility:

1. In Supabase SQL editor, create a view:
   ```sql
   create or replace view admin_expense_stats as
   select user_id, count(*) as expense_count, sum(amount) as total
   from expenses group by user_id;
   ```
2. Grant SELECT to `authenticated` with a policy checking `auth.jwt() ->> 'email' = 'arias.ivan@gmail.com'`.
3. Or create a Supabase Edge Function using the service role key.

## i18n — Adding a New Language

1. Add a translation dict to [src/i18n/index.js](src/i18n/index.js):
   ```js
   const fr = { "Expense Tracker": "Suivi des dépenses", ... }
   ```
2. Register it in the `translations` map and `LANGUAGES` array.
3. Missing keys fall back to the English key string automatically.

## Supabase Schema

### `categories`
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | auth.users FK |
| name | text | |
| type | text | `expense` / `income` |
| color | text | hex string |
| icon | text | lucide icon name |

### `expenses`
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | auth.users FK |
| category_id | uuid | categories FK |
| amount | numeric | |
| payment_method | text | Card / Cash / Bank Transfer / Wallet / Other |
| expense_date | date | |
| note | text | optional |
| created_at | timestamp | |

## Audit Fixes Applied (2026-05-13)

- Removed unused `useRef` import from Charts.jsx
- Fixed `z-[25]` (was invalid `z-25`) on bottom nav
- Added `animate-modalIn` keyframe to `tailwind.config.js` (was referencing undefined animation)
- Added body `overflow: hidden` scroll-lock when any modal is open
- Tightened `useCallback` deps to `session?.user?.id` across AppContext
- Sorted newly created categories alphabetically
- Fixed `useEffect` deps in DashboardPage and CategoriesPage (suppressed with lint comment — intentional one-shot on userId change)
