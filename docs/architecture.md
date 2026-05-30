# Architecture

## Overview

Expense Tracker is a single-page application (SPA) deployed as a static site. The client runs entirely in the browser; Supabase provides the database, authentication, and realtime layer. There is no custom server-side runtime.

## Technology Stack

| Layer | Library | Version |
| --- | --- | --- |
| Framework | React | ^18.3.1 |
| Build tool | Vite | ^5.4.8 |
| Styling | Tailwind CSS | ^3.4.13 |
| Component library | DaisyUI | ^3.9.4 |
| Routing | react-router-dom | ^6.26.0 |
| Backend / Auth | @supabase/supabase-js | ^2.49.0 |
| Charts | chart.js + react-chartjs-2 | ^4.4.0 / ^5.2.0 |
| Icons | lucide-react | ^0.400.0 |
| Toasts | react-hot-toast | ^2.4.1 |

Source: [package.json](../package.json)

## Routing

Uses `HashRouter` from react-router-dom. Routes are hash-based (`/#/dashboard`, `/#/categories`, `/#/admin`).

| Path | Component | Guard |
| --- | --- | --- |
| `/` | `AuthPage` | `PublicRoute` — redirects authenticated users to `/dashboard` |
| `/dashboard` | `DashboardPage` | `PrivateRoute` — redirects unauthenticated users to `/` |
| `/categories` | `CategoriesPage` | `PrivateRoute` |
| `/admin` | `AdminPage` | `AdminRoute` — redirects non-admin to `/dashboard` |
| `*` | — | Redirects to `/` |

Source: [src/App.jsx](../src/App.jsx)

All three guard components render a full-screen spinner while `authLoading` is `true` to prevent redirect flicker before the Supabase session is resolved.

## State Management

There is no external state management library. All application state lives in a single React context (`AppContext`) created in [src/context/AppContext.jsx](../src/context/AppContext.jsx). State is provided to the entire tree via `AppProvider`.

**State slices held in context:**

| State key | Type | Description |
| --- | --- | --- |
| `session` | object \| null | Supabase auth session |
| `authLoading` | boolean | True while initial session check is in flight |
| `categories` | array | All categories for the current user |
| `expenses` | array | Up to 500 most-recent expenses for the current user |
| `filtered` | array | Memoized result of applying current filters to `expenses` |
| `filters` | object | Current filter values (period, month, year, category, currency, custom dates) |
| `theme` | string | Active DaisyUI theme name |
| `language` | string | Active locale code (`en`, `es`, `nl`) |

`filtered` is computed by `useMemo` and shared across all consumers. It is not re-computed unless `expenses`, `filters`, or `categories` changes.

## Supabase Client Initialization

[src/lib/supabase.js](../src/lib/supabase.js) exports two values:

- `isConfigured` — `true` only if `VITE_SUPABASE_URL` starts with `https://` and `VITE_SUPABASE_ANON_KEY` is longer than 30 characters.
- `supabase` — a `SupabaseClient` instance, or `null` if `isConfigured` is `false`.

All code that calls Supabase first guards on `supabase` being non-null. If Supabase is not configured, CRUD operations throw immediately and the app falls back to cached localStorage data where possible. Auth options: `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`.

### Unconfigured State

When `supabase` is `null` (missing or malformed env vars):

- The auth form renders and accepts input, but submitting shows a toast: "Supabase is not configured. Check your .env file."
- No login or registration can occur.
- If stale localStorage cache exists from a previous session, React state is hydrated from it on startup, but no further Supabase calls are made.
- The app renders as if it has data but cannot save, edit, or delete anything.

Source: [src/pages/AuthPage.jsx:18](../src/pages/AuthPage.jsx); [src/context/AppContext.jsx:58](../src/context/AppContext.jsx)

## Data Flow

```text
User action
  → AppContext mutation (createExpense / updateExpense / deleteExpense)
    → Optimistic local state update
    → Supabase write
      → On success: local state updated with server-returned row (with category join)
      → On error: full re-fetch from Supabase; localStorage cache updated
  → localStorage auto-save (triggered by the state change useEffect)
```

Realtime events from Supabase also flow into `setExpenses`, which in turn triggers the localStorage auto-save. See [docs/database.md](./database.md#realtime) for details.

## Build Configuration

Vite splits the output into four named vendor chunks:

| Chunk | Packages |
| --- | --- |
| `vendor-react` | react, react-dom, react-router-dom |
| `vendor-charts` | chart.js, react-chartjs-2 |
| `vendor-supabase` | @supabase/supabase-js |
| `vendor-ui` | lucide-react, react-hot-toast |

Source: [vite.config.js](../vite.config.js)

## Deployment

Deployed to Render as a static site. The build script ([scripts/render-build.sh](../scripts/render-build.sh)) maps Render environment variables to the Vite `VITE_` prefix at build time so the values are embedded in the compiled bundle.

Render configuration ([render.yaml](../render.yaml)) rewrites all paths to `/index.html` to support direct URL access. Because the app uses `HashRouter`, hash-based URLs resolve without needing the server-side rewrite — the rewrite exists as a safety net for bare paths.

**Required Render environment variables:**

| Render variable | Maps to |
| --- | --- |
| `EXPENSE_TRACKER_SUPABASE_URL` | `VITE_SUPABASE_URL` |
| `EXPENSE_TRACKER_SUPABASE_ANON_KEY` | `VITE_SUPABASE_ANON_KEY` |

## Theming

DaisyUI `themes: true` is set in [tailwind.config.js](../tailwind.config.js), enabling all 29 built-in themes. The default theme is `night`. The active theme is stored in `localStorage` under `expense_tracker_theme` and applied by setting `data-theme` on `document.documentElement`.

### colorClass Convention

`colorClass(color)` in [src/lib/utils.js:22](../src/lib/utils.js) converts a hex string to `tone-{hex}` (e.g., `#3b82f6` → `tone-3b82f6`). These class names are defined as fixed `background-color` utilities in [src/index.css:21](../src/index.css).

Exactly 12 `tone-*` classes are defined, matching the 12 colors in `categoryColors` in [src/lib/constants.js](../src/lib/constants.js):

| Class | Color |
| --- | --- |
| `tone-3b82f6` | #3b82f6 |
| `tone-22c55e` | #22c55e |
| `tone-ef4444` | #ef4444 |
| `tone-f97316` | #f97316 |
| `tone-8b5cf6` | #8b5cf6 |
| `tone-14b8a6` | #14b8a6 |
| `tone-eab308` | #eab308 |
| `tone-ec4899` | #ec4899 |
| `tone-64748b` | #64748b |
| `tone-06b6d4` | #06b6d4 |
| `tone-a855f7` | #a855f7 |
| `tone-10b981` | #10b981 |

All 12 default category colors use values from this list. The category color picker in `CategoryModal` is limited to these same 12 colors. A category stored in the database with any other hex value would produce no background color at runtime (no matching CSS class). The database does not enforce a color allowlist.

## Internationalization

[src/i18n/index.js](../src/i18n/index.js) provides a `useT()` hook that returns a translation function. English (`en`) has no translation dictionary — missing keys fall back to the raw English key string. Spanish (`es`) and Dutch (`nl`) each have complete dictionaries. The active language is stored in `localStorage` under `expense_tracker_lang`.

## Modal Behavior

All modals (TransactionModal, CategoryModal, ShareModal, ConfirmModal) share the same behavior:

- Set `document.body.style.overflow = 'hidden'` on open to prevent background scroll.
- Listen for `keydown` to close on `Escape`.
- Close on backdrop click (event target check).
- Enter with `animate-modalIn` keyframe (200 ms, translateY + scale).
- The `animate-modalIn` keyframe is defined in [tailwind.config.js](../tailwind.config.js).

## PWA

`public/manifest.json` declares the app as installable with `display: standalone`. Icons are SVG. Shortcuts are defined for Dashboard and Categories. There is no service worker in the source — offline capability comes from the localStorage cache, not a service worker cache.

Note: the shortcut URLs in `manifest.json` use `/dashboard` and `/categories` (non-hash paths). The application uses `HashRouter`, so the correct deep-link URLs are `/#/dashboard` and `/#/categories`. See [known-issues.md KI-012](./known-issues.md).

## Legacy Vanilla-JS Layer

The repository root contains a parallel vanilla-JavaScript implementation that predates the React/Vite build:

| Directory / File | Contents |
| --- | --- |
| `index.html` | Login page (vanilla) |
| `dashboard.html` | Dashboard page (vanilla) |
| `categories.html` | Categories page (vanilla) |
| `js/app.js` | Main dashboard logic |
| `js/auth.js` | Auth (login / register) |
| `js/categories.js` | Category CRUD |
| `js/charts.js` | Chart rendering + filter logic |
| `js/expenses.js` | Expense CRUD + realtime subscription |
| `js/state.js` | Shared state, localStorage cache, currency list |
| `js/supabase.js` | Supabase client initialization |
| `js/ui.js` | DOM helpers, formatters, modal handling |
| `css/style.css` | Base styles |
| `css/variables.css` | CSS custom properties |
| `css/mobile.css` | Mobile overrides |

These files are not referenced by `vite.config.js` or `index.html` (the Vite entry point) and are not included in the production build. They are not listed in `.gitignore` and are committed to the repository. Their maintenance status relative to the React application is undocumented.
