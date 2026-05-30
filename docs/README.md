# Documentation Index

This directory contains technical documentation for the Expense Tracker project. All documents describe the current state of the codebase as read from source. Inferred rationale is explicitly labeled **[INFERRED]**.

## Documents

| File | Contents |
| --- | --- |
| [architecture.md](./architecture.md) | Technology stack, routing, state management, Supabase initialization, build, deployment, theming, i18n, modal behavior, PWA, legacy vanilla-JS layer |
| [database.md](./database.md) | Table schemas, indexes, RLS policies, realtime subscription, fetch behavior, authentication, default categories, admin visibility |
| [product-rules.md](./product-rules.md) | Financial calculations, date handling, transaction and category constraints, export rules, admin access, offline cache behavior |
| [known-issues.md](./known-issues.md) | Bugs, limitations, and inconsistencies found in the codebase — each classified and sourced |
| [decision-log.md](./decision-log.md) | Design decisions not self-evident from the code — sourced from commits, comments, and CLAUDE.md |

## Documentation Audit

Findings from auditing the documentation against the source code after generation. Items marked **Resolved** have been addressed in the documents above.

### Errors

**DE-001: CLAUDE.md states "Realtime subscription on the dashboard"** — **Resolved in database.md and architecture.md**
The realtime subscription is established in `AppContext` (`AppProvider`), not in `DashboardPage`. It is active for the entire application session whenever a Supabase session exists — not only while the dashboard is mounted. Both database.md and architecture.md now state this explicitly.
Source: [src/context/AppContext.jsx:88](../src/context/AppContext.jsx); affected claim: [CLAUDE.md](../CLAUDE.md) Features section.

**DE-002: PWA manifest shortcuts use non-hash URLs** — **Documented in known-issues.md KI-012 and architecture.md**
`public/manifest.json` lists shortcut URLs as `/dashboard` and `/categories`. The application uses `HashRouter`, so valid deep-link URLs are `/#/dashboard` and `/#/categories`. The bare paths will not navigate to the intended route when the app is launched as a PWA from a shortcut.
Source: [public/manifest.json:20](../public/manifest.json)

**DE-003: CLAUDE.md phrasing reverses before/after on the z-index fix**
The audit note in CLAUDE.md reads "Fixed `z-[25]` (was invalid `z-25`)". The fix was from `z-25` (invalid) to `z-[25]` (valid) — the phrasing reverses the direction. The fix itself is confirmed correct in the current code. This error is in CLAUDE.md, not in the generated documentation.
Source: [src/components/Layout.jsx:122](../src/components/Layout.jsx)

---

### Missing Information

**DM-001: Legacy vanilla-JS layer** — **Resolved in architecture.md**
The repository root contains a parallel vanilla-JavaScript implementation (`index.html`, `dashboard.html`, `categories.html`, `js/`, `css/`). These files are not part of the Vite build. The architecture.md Legacy Vanilla-JS Layer section now inventories all files and notes their status.

**DM-002: `isConfigured` guard behavior** — **Resolved in architecture.md**
When `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing or malformed, `supabase` is `null`. The architecture.md Unconfigured State section now documents the resulting user experience.
Source: [src/lib/supabase.js](../src/lib/supabase.js); [src/pages/AuthPage.jsx:18](../src/pages/AuthPage.jsx)

**DM-003: No password reset or email confirmation flow** — **Resolved in database.md**
The auth page handles login and registration only. The database.md Authentication section now explicitly documents the absence of password reset and account deletion flows, and the conditional behavior of email confirmation.

**DM-004: `env.json` purpose is undocumented**
`env.json` is listed in `.gitignore` and contains production Supabase credentials in the Render variable naming format. It is not referenced by `vite.config.js`, the build script, or any source file. Its intended use (local secrets loader, manual export to shell, or other tooling) is not documented anywhere in the project.
File: `env.json` (gitignored, not committed)

**DM-005: `colorClass` utility CSS convention** — **Resolved in architecture.md**
`colorClass(color)` returns `tone-{hexcolor}`. The architecture.md colorClass Convention section now documents all 12 defined classes, their coverage relative to the default category colors and the color picker, and the consequence of using an unlisted hex value.
Source: [src/lib/utils.js:22](../src/lib/utils.js)

---

### Speculative Statements

None identified in the generated documentation. All rationale marked **[INFERRED]** in `decision-log.md` is based on observable code patterns and is labeled as inferred rather than stated as confirmed intent.
