# Changelog

All notable changes to this project. Dates are in `YYYY-MM-DD`.

## [2.1.0] — 2026-10-02 · Themes & polish
- **Seven selectable themes** — Midnight (new default, dark), Pure Black, Graphite, Plum Night, Ocean Deep, Daylight, Sand — plus *Match my device*; picker in Settings and in the top bar.
- **Fixed icons overlapping input text** (and inputs ignoring their sizes) across 15 fields on 9 screens: component classes now live in Tailwind’s `components` layer so utilities win.
- Stat rows no longer overflow on phones; category tiles show full labels.
- Settling up records **one** net payment (new `settle_pair` SQL function) instead of one row per direction.
- Demo mirrors the database’s default columns (goal contributor, tax-proof owner, trip payer) — fixes contributions with no contributor.
- Status bar on Android follows the selected theme.
- Production fixes: app icons/favicon were excluded from the Vercel upload; install manifest now uses the Midnight colours; Dependabot branches no longer create Vercel preview links.

## [2.0.0] — 2026-10-02 · ManaKhata becomes **Kinfold**

### Product
- New name, logo and identity: **Kinfold** — *your family’s money, folded into one place*.
- New landing page with two clear paths: **Try the demo** (no sign-up) or **Create an account / Sign in**.
- Real accounts: email sign-up with confirmation, sign-in, forgot/reset password, household onboarding (create or join with an invite code).
- Demo household (the Sharma family, 6+ months of realistic data) kept entirely in the browser, with persona switching and reset.
- Rebuilt every screen on one calculation engine so every number is derived from real entries:
  Home, Transactions (+ income), Budgets (+ suggestions), **Bills** (new), Split & settle (+ fewest-payments plan), Reimbursements,
  Pocket money, Chores (auto-paid rewards), Groceries (checkout to expense), Family chat (realtime), Savings goals,
  Trips (multi-currency), Vehicles (km/l, cost per km), Investments (CAGR), **Insurance** (cover check), Tax saver (legal limits),
  **Insights** (health score, 50/30/20, forecast), **Reports** (12-month trends, CSV, print), Household, Achievements, Settings.
- Terms of Service and Privacy Policy (DPDP Act 2023-aware), accepted at sign-up; data export (CSV/JSON) and account deletion.
- **Indigo & Saffron** design system with distinct light and dark themes; phone bottom bar with a central quick-add button.
- Android app renamed to Kinfold (`app.kinfold.mobile`) with new icon and splash.

### Platform
- New Supabase backend (Postgres 17, Auth, Realtime) with Row Level Security on all 24 tables and role-checked SQL functions.
- Money stored as `numeric(14,2)` and summed in integer paise.
- 30 unit tests (calculation engine + demo business rules); live database verified with signed-in test users.
- ESLint now runs with all Next.js/TypeScript/React Hooks rules enabled.
- v1 Spring Boot API, Python AI service and docker-compose moved to `legacy/` (unused, still tested in CI).
- Removed 12 unused dependencies (axios, STOMP, jsPDF, framer-motion, …); added Dependabot.

## [1.1.0] — 2026-10-02 · Audit fixes (ManaKhata)
- Restored the Vercel demo link; fixed backend HTTP 500s, refresh logout, off-screen dialogs and light theme; added the first Android build and CI. See `AUDIT.md` history.

## [1.0.0] — 2026-05-22 · Initial ManaKhata release
