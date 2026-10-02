<p align="center">
  <img src="frontend/public/icon-192x192.png" width="88" alt="Kinfold logo" />
</p>

<h1 align="center">Kinfold</h1>
<p align="center"><b>Your family’s money, folded into one place.</b><br/>
A shared money app for households — on the web and on Android.</p>

<p align="center">
  <a href="https://frontend-phi-lemon-1hkzt9uj98.vercel.app"><b>Open Kinfold →</b></a> ·
  <a href="https://frontend-phi-lemon-1hkzt9uj98.vercel.app/demo">Try the demo</a> ·
  <a href="#android-app">Android app</a> ·
  <a href="AUDIT.md">Audit & roadmap</a> ·
  <a href="LICENSE">MIT licence</a>
</p>

---

Kinfold (formerly **ManaKhata**) lets a whole family record spending together, split costs fairly, stay ahead of
bills and budgets, give pocket money and chore rewards, save toward goals, and see where the money goes — with
every number calculated from the family’s own entries.

> **Two ways in:** anyone can **try the demo** (a sample family, stored only in your browser — no sign-up), or
> **create a free account** to run your real household, synced across every family member’s phone and laptop.

## Contents

1. [Features](#features) · 2. [How it works](#how-it-works) · 3. [Tech stack](#tech-stack) · 4. [Repository layout](#repository-layout)
5. [Run locally](#run-locally) · 6. [Configuration](#configuration) · 7. [Android app](#android-app) · 8. [Deployment](#deployment)
9. [Data model & security](#data-model--security) · 10. [How the numbers are calculated](#how-the-numbers-are-calculated)
11. [Design system](#design-system) · 12. [Testing](#testing) · 13. [Troubleshooting](#troubleshooting) · 14. [Contributing, security & licence](#contributing-security--licence)

---

## Features

| Area | What you can do |
|---|---|
| **Home** | Month-to-date household spending (with pace vs the same day last month), income, money left, your fair share, income-vs-spending chart, category donut, upcoming bills, budget status and personalised tips. Members without report access see a personal summary instead. |
| **Transactions** | Expenses and income in one list, grouped by day; filter by month, type, category, person; search; edit/delete; **CSV export**. |
| **Quick add** | One tap from anywhere (the **+** button): amount, category, who paid, payment method, private or shared, **split equally or by custom amounts**, reimbursable flag, notes. |
| **Budgets** | Household or personal monthly limits per category, alert threshold, month-end projection, and **suggested budgets** from your 3-month average. |
| **Bills** | Rent, EMIs, school fees, insurance and subscriptions (weekly → yearly); overdue/due-soon flags; **Mark paid** records the expense and rolls the due date forward; normalised monthly bill load. |
| **Split & settle** | Who owes whom (netted both ways), Splitwise-style **fewest-payments plan**, open splits, one-tap settle, settlement history. |
| **Reimbursements** | Request money back → head/parent approves or declines → marks paid. |
| **Pocket money** | A family wallet ledger for allowances, transfers and spending; balances can never go negative. |
| **Chores** | Assign chores with rewards; kids mark done; a parent approves and the reward is paid automatically from their wallet. |
| **Groceries** | Shared lists, live tick-off, estimated totals; **Done shopping** records the real amount as an expense. |
| **Family chat** | `#general`, `#expenses`, `#plans` channels with realtime delivery. |
| **Savings goals** | Targets, dates, contributions by person and the **monthly amount needed** to hit the date. |
| **Trips** | Trip budgets with expenses in **any currency**, converted at the rate you enter; per-day and per-person totals. |
| **Vehicles** | Fuel/service log with odometer; real **km/l** (full-tank method) and **cost per km**. |
| **Investments** | Holdings by type, invested vs current, gain, **CAGR** (≥ 1 year), allocation donut, liquid assets. |
| **Insurance** | Health/life/vehicle policies, annual premiums, renewal alerts, cover check (life 10× income, ₹10L health). |
| **Tax saver** | Old-regime deductions (80C, 80CCD(1B), 80D, 24(b), 80E, 80G, 80TTA, HRA) **capped at their legal limits**, headroom and tax saved at 20%/30% slabs. |
| **Insights** | Transparent **financial health score** (5 weighted components), **50/30/20** check, next-month forecast, tips. |
| **Reports** | 6/12-month income, spending and savings; category comparison; who paid vs fair share; CSV; print to PDF. |
| **Household** | Invite code (copy/share/regenerate), roles, monthly income, report permissions, hand over head role, remove/leave. |
| **Account** | Profile, **7 themes** (Midnight dark by default), password change, **download all your data (CSV/JSON)**, permanent **account deletion**. |
| **Legal** | [Terms of Service](frontend/src/app/terms/page.tsx) and [Privacy Policy](frontend/src/app/privacy/page.tsx) in the app (`/terms`, `/privacy`), accepted at sign-up. |

**Roles** — *Head* (one per household; full control), *Parent* (approvals, chores, budgets, reports), *Adult* and
*Student* (record and view; students don’t see household reports unless allowed).

## How it works

```
 ┌───────────────────────────┐      ┌───────────────────────────┐
 │ Web app (Vercel, PWA)     │      │ Android app (Capacitor)   │
 │ Next.js static export     │      │ same UI, bundled offline  │
 └─────────────┬─────────────┘      └─────────────┬─────────────┘
               │ HTTPS (supabase-js, publishable key)│
               ▼                                    ▼
      ┌────────────────────────────────────────────────────┐
      │ Supabase project “Kinfold” (Mumbai, ap-south-1)    │
      │  • Auth: email + password, confirmation, reset     │
      │  • Postgres 17: 24 tables, Row Level Security      │
      │  • SQL functions for approvals, wallet, settle-up  │
      │  • Realtime: family members see changes live       │
      └────────────────────────────────────────────────────┘

 Demo mode: the same UI runs against a sample family kept in the browser’s localStorage
 (src/lib/backend.ts → DemoBackend). No network calls, nothing leaves the device.
```

- **One calculation engine.** Every figure on screen is computed by [`src/lib/finance.ts`](frontend/src/lib/finance.ts) from raw rows, for demo and real households alike.
- **Two interchangeable backends** behind one interface ([`src/lib/backend.ts`](frontend/src/lib/backend.ts)): `LiveBackend` (Supabase) and `DemoBackend` (browser storage, enforcing the same rules as the SQL functions).
- **No custom server.** The website is a static Next.js export on Vercel; the Android app bundles the same files. The old Spring Boot API lives in [`legacy/`](legacy/README.md) and is not used.

## Tech stack

| Layer | Technology |
|---|---|
| UI | Next.js 16.3 (App Router, static export), React 19, TypeScript 5, Tailwind CSS 4, Recharts, Radix Dialog, lucide icons, next-themes |
| State | Zustand (session + household ledger) |
| Backend | Supabase: Postgres 17, Auth, Realtime, Row Level Security, PL/pgSQL functions |
| Android | Capacitor 8 (`app.kinfold.mobile`, minSdk 24, targetSdk 36) |
| Quality | Vitest (31 tests), ESLint (Next + TypeScript + React Hooks, strict), TypeScript strict, GitHub Actions, Dependabot |
| Hosting | Vercel (web), Supabase (data), GitHub Actions artifacts (APK) |

## Repository layout

```
ManaKhata/                       ← repository (product name: Kinfold)
├── frontend/                    ← the Kinfold app (web + Android)
│   ├── src/app/                 ← routes: / (landing), /demo, /auth/*, /onboarding, /terms, /privacy
│   │   └── (dashboard)/         ← signed-in app: dashboard, expenses, budget, bills, splits, …
│   ├── src/components/          ← UI kit (ui.tsx), shell nav, quick-add modal, logo, legal layout
│   ├── src/lib/
│   │   ├── finance.ts           ← calculation engine (+ finance.test.ts)
│   │   ├── backend.ts           ← LiveBackend (Supabase) and DemoBackend (+ backend.test.ts)
│   │   ├── demo-seed.ts         ← the demo family, generated relative to today
│   │   ├── model.ts             ← row types mirroring the database
│   │   ├── money.ts             ← paise-exact arithmetic, formatting, dates
│   │   └── categories.ts, config.ts, supabase.ts, download.ts
│   ├── src/store/               ← session.ts (auth/demo/onboarding), ledger.ts (data + realtime)
│   ├── android/                 ← Capacitor Android project (committed)
│   ├── assets/                  ← icon/splash sources for Android
│   └── scripts/build-android.mjs
├── supabase/migrations/         ← complete database schema, RLS and functions (apply in order)
├── legacy/                      ← v1 Spring Boot API, Python AI service, docker-compose (unused)
├── docs/archive/                ← v1 notes
├── .github/                     ← CI, Dependabot, issue/PR templates
├── AUDIT.md  CHANGELOG.md  CONTRIBUTING.md  SECURITY.md  CODE_OF_CONDUCT.md  LICENSE
```

## Run locally

**Requirements:** Node.js 20.9+ (22 recommended). Nothing else for the web app.

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000>:

- **Try the demo** works immediately (no account, no network).
- **Create account** uses the live Kinfold Supabase project. Confirmation emails link to `NEXT_PUBLIC_SITE_URL`; set it to `http://localhost:3000` in `frontend/.env.local` while developing (and add that URL in Supabase → Auth → URL configuration).

### Use your own Supabase project (optional)

1. Create a project at [supabase.com](https://supabase.com) (free tier is enough).
2. Apply the SQL files in [`supabase/migrations/`](supabase/migrations) **in order** (SQL editor, or `supabase db push` with the CLI).
3. Put your project URL and **publishable** key in `frontend/.env.local` (see [Configuration](#configuration)).
4. In Supabase → Authentication → URL configuration set **Site URL** and add your site to **Redirect URLs**.

## Configuration

All values are optional — defaults live in [`frontend/src/lib/config.ts`](frontend/src/lib/config.ts) and point to the official Kinfold project.

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Kinfold project | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Kinfold publishable key | Public client key (safe to ship; RLS protects data) |
| `NEXT_PUBLIC_SITE_URL` | `https://frontend-phi-lemon-1hkzt9uj98.vercel.app` | Where email confirmation / reset links send people |
| `BUILD_TARGET` | — | `android` = static export to `out/` (set by `npm run build:android`) |

**Supabase dashboard settings (one-time, by the project owner):**

| Setting | Value |
|---|---|
| Auth → URL configuration → Site URL | `https://frontend-phi-lemon-1hkzt9uj98.vercel.app` |
| Auth → URL configuration → Redirect URLs | `https://frontend-phi-lemon-1hkzt9uj98.vercel.app/**`, `http://localhost:3000/**` |
| Auth → Email → SMTP (recommended for launch) | A real SMTP provider (Resend, SES, Brevo…). The built-in sender is limited to a few emails per hour. |
| Auth → Emails → Templates (optional) | Kinfold-branded confirmation and reset emails |

## Android app

The Android app is the same UI packaged with Capacitor. It talks to the same Supabase project as the website, so a
family can mix phones and laptops freely.

**Get an APK without installing anything:** every push to `main` runs **Actions → CI → Android app** and uploads
**`kinfold-android-debug-apk`** as a downloadable artifact. Copy it to your phone and open it (allow “Install unknown apps”).

**Build it yourself** (needs JDK 21 + Android SDK, e.g. via Android Studio):

```bash
cd frontend
npm install
npm run build:android        # static export → out/ → copied into android/
npm run android:open         # opens Android Studio → Run ▶
# or: cd android && ./gradlew assembleDebug   → android/app/build/outputs/apk/debug/
```

Native touches: hardware back button (exits from Home), status bar follows light/dark, Kinfold icon and splash.
To refresh icons, edit `frontend/assets/*` and run `npx @capacitor/assets generate --android`.
Play Store release signing is not set up yet (see AUDIT.md).

**PWA:** on Android Chrome open the website → ⋮ → *Install app*.

## Deployment

| Piece | Where | How it updates |
|---|---|---|
| Website | Vercel project **`manakata`** → <https://frontend-phi-lemon-1hkzt9uj98.vercel.app> | Vercel Git integration on `main` (root directory `frontend`). Manual: `cd frontend && vercel deploy --prod`. |
| Database | Supabase project **Kinfold** (`lpqbtssvotkvogqmzohv`, ap-south-1) | Add a new file in `supabase/migrations/` and apply it (dashboard SQL editor or `supabase db push`). Never edit applied migrations. |
| Android | GitHub Actions artifact | Automatic on every push. |

> ⚠️ **Vercel Hobby plan:** Vercel only builds commits whose author can deploy to the project. If a Git deploy shows
> **Blocked**, either the commit author must be the Vercel account owner, or the project must move to a Pro team.

## Data model & security

The schema ([`supabase/migrations/20261002000000_kinfold_schema.sql`](supabase/migrations/20261002000000_kinfold_schema.sql)) has
`profiles`, `households`, `household_members` and 21 household-scoped tables (expenses, incomes, splits, settlements,
reimbursements, budgets, recurring bills, wallet transactions, goals, contributions, grocery lists/items, chores, chat,
vehicles, vehicle expenses, trips, trip expenses, investments, insurance policies, tax documents).

- **Row Level Security on every table.** A user can only read or write rows whose `household_id` is their household.
- **Private expenses** are visible only to the person who paid or recorded them — enforced in the database.
- **Integrity triggers** reject rows that reference people or parent records from another household.
- **Privileged actions run as SQL functions** that re-check the caller’s role: `create_household`, `join_household`,
  `update_member`, `remove_member`, `transfer_headship`, `regenerate_invite_code`, `decide_reimbursement`,
  `set_chore_status`, `wallet_top_up/transfer/withdraw` (no overdrafts, row-locked), `settle_pair` (clears both directions, records one net payment), `pay_bill`, `delete_my_account`.
- **Account deletion** erases personal records and the login; if shared history must remain for the family, the login is anonymised and disabled instead.
- Amounts are `numeric(14,2)` in the database and summed as **integer paise** in the app.

## How the numbers are calculated

| Figure | Formula |
|---|---|
| Household spent (month) | Σ shared expenses dated in the month |
| Your share | Σ what you paid − Σ others’ split shares owed to you + Σ your split shares owed to others |
| Income (month) | each member’s monthly income (from the month they joined) + extra income entries |
| Savings rate | (income − spent) ÷ income |
| Budget projection | spent so far ÷ day of month × days in month |
| Balances / settle-up | net open splits per person; greedy largest-debtor ↔ largest-creditor matching (≤ n−1 payments) |
| Monthly bill load | Σ bills normalised: weekly × 52/12, quarterly ÷ 3, yearly ÷ 12 |
| Goal monthly target | remaining ÷ months left to target date (rounded up to the paisa) |
| Trip spend | Σ amount × exchange rate into the trip’s base currency |
| Mileage | (last − first odometer at fill-ups) ÷ litres bought after the first fill |
| CAGR | (current ÷ invested)^(1/years) − 1, only for holdings ≥ 1 year old |
| Tax eligible | min(claimed, legal limit) per section; tax saved = eligible × slab × 1.04 cess |
| Health score | 30% savings rate (target 30%), 25% emergency fund (target 6 months), 15% budget discipline, 15% spending stability (coefficient of variation), 15% protection (health cover + life cover ÷ 10× income) |
| Forecast | weighted average of the last 3 complete months, 3 : 2 : 1 |

All of the above are unit-tested in [`finance.test.ts`](frontend/src/lib/finance.test.ts).

## Design system

**Seven selectable themes** (Settings → Theme, or the palette button in the top bar). **Midnight** is the default; the choice is saved per device, and *Match my device* follows the phone/computer setting. Green and red are reserved for money in/out in every theme.

| Theme | Type | Background | Primary | Accent |
|---|---|---|---|---|
| **Midnight** (default) | dark | `#0A0E1C` night-indigo | `#8C9BFF` indigo | `#F4B850` saffron |
| Pure Black | dark (OLED) | `#000000` | `#8F9CFF` | `#F4B850` |
| Graphite | dark | `#111113` | `#FF7A63` coral | `#7FA8FF` |
| Plum Night | dark | `#120E18` | `#C4A3FF` lilac | `#EDB45F` amber |
| Ocean Deep | dark | `#06121A` | `#4FC3E0` cyan | `#F0BB55` gold |
| Daylight | light | `#F6F7FB` | `#3B4BC8` indigo | `#E59A1C` saffron |
| Sand | light | `#F7F3EC` | `#6B3FA0` plum | `#C9852E` amber |

How it works: `next-themes` sets `data-theme="<id>"` on `<html>`; each theme is one token block in
[`globals.css`](frontend/src/app/globals.css) and the ids/names live in [`themes.ts`](frontend/src/lib/themes.ts). Components only use
tokens (`bg-surface`, `text-ink-2`, `bg-primary`, …), so every theme styles every screen. Component classes (`.card`, `.field`, …) are in
Tailwind’s `components` layer so utility classes such as `pl-10` always win — this is what keeps icons from overlapping input text.

Typography: Plus Jakarta Sans for headings, Inter for text, tabular numbers everywhere. Signature detail: a small accent “fold” on featured cards, echoing the logo.

## Testing

```bash
cd frontend
npm run typecheck     # TypeScript strict
npm run lint          # ESLint (Next.js + TypeScript + React Hooks), no rules disabled
npm run test:run      # 31 Vitest tests: calculation engine + demo business rules
npm run build         # production build (Vercel)
npm run build:android # Android static bundle + Capacitor sync
```

The database rules were verified against the live project with two signed-in test users (household creation and joining,
private-expense isolation, role checks, wallet overdraft protection, settle-up, bill payment, budget uniqueness,
cross-household writes, realtime delivery, account deletion) — see AUDIT.md §3.

## Troubleshooting

| Problem | Fix |
|---|---|
| Confirmation email link opens `localhost` | Set Site URL and Redirect URLs in Supabase (see [Configuration](#configuration)). |
| “Email not confirmed” when signing in | Open the link in the confirmation email (check spam). |
| Sign-up emails stop arriving | Supabase’s built-in sender is rate-limited; configure custom SMTP. |
| “You don’t have permission to do that” | Your role can’t do this (e.g. students can’t approve). Ask the head/parent. |
| “Not enough balance in your wallet” | Add money to the wallet first — wallets can’t go negative. |
| Demo shows old data | Settings → Reset demo data (the demo also refreshes each new month). |
| Vercel deployment “Blocked” | Hobby plan restriction on commit authors — see [Deployment](#deployment). |

## Contributing, security & licence

- Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). Open items are tracked in [AUDIT.md](AUDIT.md).
- Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).
- Code is released under the [MIT Licence](LICENSE). Use of the hosted service is governed by the in-app [Terms](https://frontend-phi-lemon-1hkzt9uj98.vercel.app/terms) and [Privacy Policy](https://frontend-phi-lemon-1hkzt9uj98.vercel.app/privacy).
- Kinfold gives no financial, investment or tax advice; all insights are educational estimates from your own data.
