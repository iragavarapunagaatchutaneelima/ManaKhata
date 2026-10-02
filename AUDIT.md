# Kinfold — Audit, verification & roadmap

| | |
|---|---|
| **Release audited** | Kinfold 2.0.0 (formerly ManaKhata) — branch `release/kinfold-v2` |
| **Date** | 2 October 2026 |
| **Live** | Web: <https://frontend-phi-lemon-1hkzt9uj98.vercel.app> · Database: Supabase project *Kinfold* (`lpqbtssvotkvogqmzohv`, ap-south-1) |
| **Previous audit** | [docs/archive/AUDIT-v1.md](docs/archive/AUDIT-v1.md) (ManaKhata 1.x, Spring Boot era) |

This document records **what was researched, what was built, how it was verified, and what is still open** — ordered by priority so the team can work through it.

---

## 1. Goals of the v2 upgrade

| Requirement | Outcome |
|---|---|
| Separate **demo** from the **real product**; entry choice on the first screen | Landing page offers *Try the demo — no sign-up* or *Create free account / Sign in*. Demo data lives only in the browser (`DemoBackend`); real accounts use Supabase (`LiveBackend`). Demo is visibly labelled everywhere with switch-person / reset / create-account actions. |
| **Real-world application** — anyone can sign up, enter their own data and get correct maths | Email sign-up with confirmation, password reset, household onboarding (create or join by invite code), roles, multi-member sync with realtime updates. One tested calculation engine for every figure. |
| Compare with real competitors and add what’s missing | See §2. Added bills & subscriptions, settle-up with debt simplification, income tracking, budget suggestions and projections, 50/30/20 check, health score, insurance cover check, tax limits, CSV/JSON export, account deletion. |
| New colours: realistic, distinct light & dark modes | **Indigo & Saffron** design system; light (cool paper white) and dark (deep night-indigo) are separate palettes, not inversions. |
| New name for web + Android | **Kinfold** everywhere; Android id `app.kinfold.mobile`; new logo, icons, splash. |
| Terms & conditions, licensing clear on GitHub | `/terms`, `/privacy` (accepted at sign-up), MIT `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, issue/PR templates. |
| Use the **same Vercel link**, deploy from GitHub, remove extra links | Deployed to the existing `frontend-phi-lemon-1hkzt9uj98.vercel.app` (project `manakata`) from GitHub `main`; extra CLI deployments removed (see §4). |

## 2. Competitive research (what real products do)

| Product | What families rely on it for | Adopted in Kinfold |
|---|---|---|
| **Splitwise** | Shared expenses, equal/custom splits, *simplify debts* to the fewest payments, settle-up history | Equal/custom splits on any expense, netted balances, greedy minimum-transfer plan, one-tap settle, settlement history |
| **Monarch Money** | One subscription for the household, shared dashboard, per-member logins, net worth | Household with roles and per-member logins, shared home dashboard, investments + liquid assets |
| **YNAB / Goodbudget** | Zero-based / envelope budgets, staying ahead of spending | Category budgets (household or personal), alert thresholds, month-end projection, suggested limits from history |
| **Honeydue** | Couples see bills and spending together, bill reminders | Recurring bills with due dates, overdue flags, mark-paid → expense |
| **Walnut / Indian expense apps** | ₹ formatting, UPI/cash, Indian categories | Lakh/crore formatting, UPI/cash/card methods, Indian categories (rent & EMI, family support, school fees), 80C/80D tax tracking, Indian financial year |
| **Kids’ money apps (FamZoo, GoHenry)** | Allowances, chores with rewards | Pocket-money wallet ledger, chores approved by a parent with automatic reward payout |

Deliberately **not** copied: bank-account aggregation and auto-import (needs regulated Account Aggregator / bank partnerships and would require storing bank consent — out of scope for an open-source app; Kinfold never asks for bank credentials).

## 3. Verification evidence

| Check | Result |
|---|---|
| Unit tests (`npm run test:run`) | **31 / 31 pass** — 24 calculation-engine tests with hand-checked numbers (paise-exact sums, splits, budgets, settle-up, wallet, bills, goals, tax caps, FX trips, mileage, CAGR, forecast, CSV injection, income-from-join-date) and 7 demo-rule tests (incl. one-row net settle-up and database default columns) |
| TypeScript strict (`npm run typecheck`) | 0 errors |
| ESLint (`npm run lint`) | 0 problems, **no rules disabled** (v1 needed 10 rules off and hid 153 errors) |
| Production build | Web build ✓ · Android static export ✓ (34 routes, navigation payloads flattened) |
| Database security tests (SQL, rolled back) | 18/18: private-expense isolation, wallet overdraft blocked, students can’t create chores or approve, chore reward payout (₹750 + ₹200 = ₹950), settle-up clears ₹500, stranger sees 0 rows and can’t write |
| Live end-to-end test (two signed-in users via `supabase-js` + publishable key) | **22/22** (incl. `settle_pair` net settlement and realtime) — earlier run 19/19 functional + security checks (create/join household, invite code case-insensitive, one-household rule, exact numeric round-trip ₹1,234.56, private isolation, signed-out sees nothing, role checks, wallet maths 1,350/650, overdraft and forged-row blocks, settle-up ₹617.28, reimbursement flow, bill due-date roll-over, duplicate-budget rejection, chat impersonation blocked, cross-household write blocked, deleted account can’t sign in). Cross-user **realtime** delivery verified separately. |
| Account deletion | Both paths verified: sole member → everything deleted; member with shared history → private data erased, login anonymised and disabled, family history intact |
| Supabase security advisor | Only intended client-callable functions remain (each re-checks the caller); internal trigger/helper functions revoked |
| UI walkthrough | Every screen in demo mode as head and as student, all 7 themes, desktop + 375 px phone, static Android bundle |
| Automated layout scan | Script checks every screen (desktop + phone) for icons overlapping input text, text overflowing its box and horizontal page scroll — **0 findings** after fixes; verified it catches the old overlap bug when re-injected |
| Functional simulation | Driven through the real UI: equal split (₹1,500 ÷ 4 → net +₹105, exactly as predicted), settle-up, chore approval paying ₹100 from parent to child wallet, bill paid (due date 3 Oct → 3 Nov), reimbursement approval, goal contribution — all totals matched hand calculations, 0 console errors |
| Test data | All test users and rows removed; production database starts empty |

## 4. Deployment state

| Item | State |
|---|---|
| GitHub | `main` holds Kinfold 2.1 (pull request #1 merged on 2026-10-02). CI runs web, Android APK and legacy-API jobs on every push. |
| Vercel | Project `manakata` serves <https://frontend-phi-lemon-1hkzt9uj98.vercel.app> from `main` (root directory `frontend`). Every push to `main` redeploys the same link automatically. |
| Production check | All 30 routes return 200, unknown routes 404, security headers present, demo flow and all 7 themes verified in a real browser on desktop and phone width with no console errors. App icons were 404 on the first 2.1 deploy because `.vercelignore` excluded `*.png`; fixed. |
| Extra links | Old CLI deployments were removed. Dependabot branches no longer create preview links (`frontend/vercel.json`). Pull-request previews from people still appear on the PR and are login-protected. |
| Supabase | Project *Kinfold* (free tier, $0/month), 4 migrations applied, database empty and ready |

## 5. Open items (prioritised)

**Owner action** = needs someone with access to the Supabase/Vercel accounts; **Dev** = code work.

### P0 — before inviting real families

| ID | Item | Who | How |
|---|---|---|---|
| K-01 | **Supabase Auth URLs** — Site URL is still the default, so confirmation and reset emails would point to `localhost` | Owner | Supabase → Authentication → URL Configuration: Site URL `https://frontend-phi-lemon-1hkzt9uj98.vercel.app`; Redirect URLs `https://frontend-phi-lemon-1hkzt9uj98.vercel.app/**` and `http://localhost:3000/**` |
| K-02 | **Email delivery** — Supabase’s built-in sender is limited to a few emails per hour | Owner | Authentication → Emails → SMTP settings: connect Resend / Amazon SES / Brevo with a domain you own; brand the templates as Kinfold |
| K-03 | **Vercel Hobby commit-author rule** — Git deploys from commits not authored by the Vercel account owner can be *Blocked* | Owner | Either merge PRs as the owner (squash merge authored by the owner), or move the project to a Pro team, or transfer it to the main developer’s account |
| K-04 | Legal review of Terms & Privacy and a named grievance contact | Owner | Have counsel review `/terms` and `/privacy`; add a monitored contact address |

### P1 — product completeness

| ID | Item | Who | Suggested approach |
|---|---|---|---|
| K-05 | Email links open the website, not the Android app | Dev | Android App Links for `/auth/callback` and `/auth/reset` (assetlinks.json on the site + intent filters) |
| K-06 | Bill/renewal reminders are in-app only | Dev | Web Push + `@capacitor/push-notifications`, scheduled by a Supabase cron Edge Function |
| K-07 | No receipt photos | Dev | Supabase Storage bucket per household with RLS; attach to expenses |
| K-08 | One household per person | Dev | Drop the unique index, add a household switcher |
| K-09 | Settle-up is recorded manually | Dev | “Pay via UPI” button using `upi://pay` intents with amount and note pre-filled |
| K-10 | Offline use in live mode | Dev | Service worker + queued writes (IndexedDB) |
| K-11 | English only | Dev | i18n (Hindi, Telugu first) with `next-intl` |
| K-12 | Play Store release | Dev + Owner | Upload keystore as a GitHub secret, `bundleRelease` job, store listing |

### P2 — scale & quality

| ID | Item | Suggested approach |
|---|---|---|
| K-13 | Every realtime event reloads all 22 collections | Reload only the changed collection (`LiveBackend.loadCollection`) |
| K-14 | Full history is loaded on sign-in | Load 13 months by default; page older data on demand |
| K-15 | Live integration test is a manual script | Run it in CI against a Supabase *branch* with seeded test users |
| K-16 | No browser E2E tests | Playwright happy paths (demo + live) in CI |
| K-17 | Accessibility not formally audited | WCAG 2.2 AA pass (contrast tokens are chosen for AA; verify focus order and screen-reader labels) |
| K-18 | 12 npm advisories (5 high) — all in dev/build tooling (vite, vitest, undici, js-yaml, browserslist, Capacitor CLI); none ship to users | Let Dependabot raise updates; re-run `npm audit` monthly |
| K-19 | Investment values are manual | Optional NAV fetch from AMFI for mutual funds |
| K-20 | `legacy/` v1 stack is unused | Remove in 2.1 once nobody needs it |
| K-21 | No audit log of sensitive actions | Append-only `activity_log` table written by the SQL functions |

## 6. Known limitations (by design)

- Kinfold does not move money, hold funds, or connect to banks; wallet, settlements and reimbursements record money moved outside the app.
- Insights, health score, tax and insurance figures are educational estimates from your own entries, not advice.
- Tax limits implement the **old regime** for taxpayers under 60; the new regime allows few of these deductions.
