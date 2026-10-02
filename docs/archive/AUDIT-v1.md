# ManaKhata — Project Audit & Status Report

| | |
|---|---|
| **Audit date** | 2 October 2026 |
| **Repository** | https://github.com/iragavarapunagaatchutaneelima/ManaKhata |
| **Hosted demo** | https://frontend-phi-lemon-1hkzt9uj98.vercel.app |
| **Audited code** | local branch `fix/audit-theme-android` (based on `appmod/java-upgrade-20260523153831` + uncommitted local work) |
| **Scope** | Frontend (Next.js), Backend (Spring Boot), AI service (FastAPI), Docker/infra, deployment, Android |

This file is the single list of everything found while auditing the project. Section 4 lists what was **fixed in this pass** (with evidence). Section 5 lists what is **still open**, ordered by priority, with a concrete suggested fix for each, so the team can pick items up one by one.

---

## 1. Executive summary

| Area | Before audit | After this pass |
|---|---|---|
| Vercel link | **Down** — `404 DEPLOYMENT_NOT_FOUND` | **Live** — all 27 routes return 200 |
| Backend GET endpoints (25 tested) | 19 OK, **6 × HTTP 500** | **25 / 25 OK** |
| Backend create endpoints (5 tested) | **3 × HTTP 500** | **5 / 5 OK** |
| Page refresh / deep link | **Logged the user out** | Session kept |
| Dialogs (Add Expense, Goals, Vehicles) | **Opened off-screen** on scrolled pages | Centered |
| Light theme | **Broken** (dark body forced, white text on light cards) | Plain "Ledger" theme, light + dark |
| Critical npm vulnerabilities | **1 critical** (Next.js RCE), 10 high | **0 critical**, 5 high (dev-only tooling) |
| Android | Empty `mobile/` folder | Capacitor app in `frontend/android`, CI builds the APK |
| CI | None | GitHub Actions: backend tests, frontend checks, Android APK |

**Overall:** the project is now runnable end-to-end locally (frontend ↔ backend), deployable as a hosted demo, and packageable for Android. The biggest remaining risks are **architecture debt** (entities returned directly from controllers, almost no tests) and **features that are demo-only** (chat, wallet history, AI micro-service).

---

## 2. Local vs GitHub vs Vercel — what differs

### 2.1 Git state

| Ref | Commit | Notes |
|---|---|---|
| `origin/main` (GitHub default branch) | `0145cba` "Enable hosted demo fallback" | **3 commits behind** the working branch |
| `origin/appmod/java-upgrade-20260523153831` | `00c95ce` | Same as local `HEAD` before this audit |
| Local working tree (before audit) | `00c95ce` **+ 22 uncommitted files** | `@Transactional` on 17 controllers, demo-login changes, ESLint rules disabled, Playwright dev-dependency, `vercel-login-check.png` |

The 3 commits missing from `main`:

1. `f8f2bf3` *Fix project errors and prepare for deployment* — 118 files: chores, goals, grocery, investments, medical, tax, trips, splits, gamification modules (backend + frontend), PWA manifest, `next.config.js`, QUICK_START.md.
2. `36ef351` *Update README with Vercel deployment link*.
3. `00c95ce` *Fix Jackson infinite recursion* — also committed scratch files (`scratch_tail*.txt`, `fix_entities.py`) and two backend log archives.

➡ **Action for the team:** merge the working branch into `main` via a PR so GitHub's default branch matches what is deployed.

### 2.2 Why the Vercel link was down

- The Vercel project behind the link is **`manakata`** (ID `prj_PQpi7…`, team *iragavarapunagaatchutaneelima's projects*). Its domain `frontend-phi-lemon-1hkzt9uj98.vercel.app` was still attached, but **no production deployment existed** behind it → `DEPLOYMENT_NOT_FOUND`.
- A first redeploy attempt was **blocked by Vercel** (`TEAM_ACCESS_REQUIRED`): the CLI attaches git metadata, and the repo's commit author `ManaKhata Maintainer <maintainer@manakhata.local>` is not a member of the Vercel team (Hobby plan rule).
- The second deploy was made from a clean copy of `frontend/` (no git metadata), so it was attributed to the logged-in Vercel owner and went live.

➡ **Action:** set a real git identity (`git config user.email <your GitHub email>`) for this repo, or connect the Vercel project to the GitHub repo so deploys come from GitHub directly.

### 2.3 What the hosted demo is (and is not)

- Vercel hosts **only the frontend**. There is no public backend, so the hosted build runs with `NEXT_PUBLIC_DEMO_MODE=true` (set in the Vercel project's environment variables): sign-in uses the demo accounts and every screen uses built-in demo data. It makes **no** calls to any API (verified: zero requests to `localhost:8080`).
- Changes made on the hosted demo (adding an expense, etc.) are **not saved** — see O-07.

---

## 3. How the audit was done

| Check | Command / method | Result |
|---|---|---|
| Frontend type check | `npm run typecheck` | ✅ 0 errors |
| Frontend lint | `npm run lint` | ✅ passes — **but only because 10 rules are disabled**, see O-10 |
| Frontend unit tests | `npm run test:run` | ✅ 3 / 3 (1 test file) |
| Frontend production build | `npm run build` | ✅ 27 static routes |
| Android static build | `npm run build:android` | ✅ export + `cap sync`, 24 navigation payloads flattened |
| Backend tests | `mvn test` | ✅ 1 / 1 (1 test class) |
| Backend smoke test | login + every `GET /api/*` + 5 `POST`s + auth/CORS edge cases with `curl` | ✅ after fixes (see §4) |
| UI walkthrough | every dashboard route, light + dark, desktop + 375 px phone, against the real backend and in demo mode | ✅ after fixes |
| Dependency audit | `npm audit` | 13 findings left, 0 critical (see O-12) |
| Hosted demo | curl + browser on the Vercel URL | ✅ all routes 200, security headers present |

---

## 4. Fixed in this pass

Each item lists the symptom, the root cause, and the change.

### Backend

**F-01 · Six read endpoints returned HTTP 500** — `/api/household`, `/api/vehicles`, `/api/budgets`, `/api/budgets/household`, `/api/splits`, `/api/grocery`, `/api/reimbursements/summary`.
*Cause:* controllers return JPA entities; `spring.jpa.open-in-view` was `false`, so Jackson tried to read lazy relations after the Hibernate session closed (`LazyInitializationException` → "could not initialize proxy - no Session"). The uncommitted `@Transactional` on controllers did not help because serialization happens after the method returns.
*Fix:* `open-in-view` is now `${JPA_OPEN_IN_VIEW:true}` ([application.yml](backend/src/main/resources/application.yml)).

**F-02 · Creating an expense, trip or chore returned HTTP 500.**
*Cause:* `JwtAuthFilter` loads the current `User` **before** the Spring MVC open-session interceptor runs, so `user.getHousehold()` was a detached proxy that Jackson could not read.
*Fix:* new [OpenSessionConfig.java](backend/src/main/java/com/manaKhata/config/OpenSessionConfig.java) registers `OpenEntityManagerInViewFilter` ahead of the security filter chain.

**F-03 · Unauthenticated requests got 403 instead of 401.** The frontend could not tell an expired token from a permission problem.
*Fix:* `HttpStatusEntryPoint(UNAUTHORIZED)` in [SecurityConfig.java](backend/src/main/java/com/manaKhata/config/SecurityConfig.java). Verified: no token / bad token / wrong password → 401.

**F-04 · CORS allowed every `*.vercel.app` site** with credentials, and the configured origins were never read (YAML list bound to a `String`; docker-compose set `CORS_ALLOWED_ORIGINS`, which nothing read).
*Fix:* `CORS_ALLOWED_ORIGINS` (exact origins, comma-separated) and `CORS_ALLOWED_ORIGIN_PATTERNS` (defaults: localhost ports + Capacitor `https://localhost`). Verified: `https://localhost` → 200, `https://evil.vercel.app` → 403.

**F-05 · WebSocket could never connect.** The frontend opens a native WebSocket to `/ws`, but the server only exposed `/ws` as a SockJS endpoint.
*Fix:* native endpoint at `/ws`, SockJS fallback moved to `/ws-sockjs` ([WebSocketConfig.java](backend/src/main/java/com/manaKhata/config/WebSocketConfig.java)). The frontend URL is now derived from `NEXT_PUBLIC_API_URL` instead of hard-coded `ws://localhost:8080`.

**F-06 · Trips with no currency crashed the Trips page.** `baseCurrency` could be saved as `null`.
*Fix:* `Trip` defaults it to `INR` on persist/update.

**F-07 · `docker compose up` could not work.**
- The backend Dockerfile copied a pre-built `target/*.jar` (absent on a fresh clone) → now a multi-stage Maven build.
- MySQL URL was used with the **H2 driver** default → `SPRING_DATASOURCE_DRIVER=com.mysql.cj.jdbc.Driver` added.
- `JWT_SECRET` had a hard-coded fallback → now required (`.env.example` added).
- AI-service health check used `curl`, which `python:slim` does not include → Python one-liner.
- Frontend `NEXT_PUBLIC_*` were runtime env vars, but Next inlines them at **build** time → now build args.

### Frontend

**F-08 · Refreshing any page or opening a link logged the user out.**
*Cause:* the dashboard layout checked `isAuthenticated` before Zustand had re-hydrated the session from `localStorage`.
*Fix:* wait for `hasHydrated` ([layout.tsx](frontend/src/app/(dashboard)/layout.tsx)); the login page now forwards already-signed-in users to the dashboard.

**F-09 · Every dialog opened off-screen once the page was scrolled.**
*Cause:* the page-transition wrapper used `will-change: transform`, which makes it the containing block for `position: fixed` children.
*Fix:* opacity-only transition ([PageTransition.tsx](frontend/src/components/ui/PageTransition.tsx)).

**F-10 · A real user could silently be shown fake data.** Any 401/403/5xx from a running backend switched the screen to demo numbers (and cleared the token).
*Fix:* demo data is now used only when (a) the build is a demo build, (b) the session is a demo session, or (c) the API is unreachable. A 401 ends the session and returns to login; other errors are surfaced ([api.ts](frontend/src/lib/api.ts)).

**F-11 · Hosted demo depended on `localhost:8080` failing.**
*Fix:* `NEXT_PUBLIC_DEMO_MODE=true` builds never call the API. Locally (unset), demo accounts sign in against the real backend.

**F-12 · One bad value could blank an entire screen.**
*Fix:* `formatCurrency` tolerates null/invalid currency codes; new route-level error boundary [error.tsx](frontend/src/app/(dashboard)/error.tsx) keeps the shell and offers "Try again".

**F-13 · Theme problems.**
- The "Blue Noir" CSS forced a dark gradient on `<body>` in **both** themes, so light mode showed dark backgrounds with light-theme text.
- ~150 hard-coded `text-white/…`, `bg-white/…`, `border-white/…` classes and inline `rgba(255,255,255,…)` styles made text invisible on light surfaces (login inputs, chat bubbles, statement menu…).
- `tailwind.config.ts` is **ignored by Tailwind 4**, so every `bg-brand-*`/`border-brand-*` class produced no CSS at all.
- `var(--brand-color)` (Investments chart) was never defined → chart had no colour.
- Click sounds on every button (`InteractionAudio`).

*Fix:* new plain **"Ledger" theme** in [globals.css](frontend/src/app/globals.css): warm paper + ink, one ledger-green accent, flat bordered cards, serif headings (Fraunces) and tabular numbers, a double rule under the top bar and red margin line in the icon as the "khata book" signature. Brand colours moved into Tailwind 4 `@theme`; `dark:` variant follows the theme toggle; hard-coded colours replaced with tokens; one muted chart palette ([constants/theme.ts](frontend/src/constants/theme.ts)); click audio and animated blobs removed. Default theme is light; dark mode is one tap away.

**F-14 · Phone usability.** Added a bottom tab bar (Home · Expenses · Wallet · Grocery · More) under `lg`, safe-area padding, calculator button moved above the tab bar, PWA manifest/theme colours updated, new app icon.

**F-15 · Security-relevant dependency upgrades.** `next` 16.2.6 → **16.3.8** (fixes 3 critical RCE advisories and several SSRF/DoS ones), `axios` → 1.20.0, plus `npm audit fix` for transitive packages. Removed unused `playwright` dev-dependency.

### Android & delivery

**F-16 · Android app.** Capacitor 8 project in [frontend/android](frontend/android) (app id `app.manakhata.household`, minSdk 24, targetSdk 36). `npm run build:android` creates a static export and syncs it; hardware back button + status-bar colour handled in [NativeBridge.tsx](frontend/src/components/NativeBridge.tsx). Fixed a static-export quirk where client navigation payloads for the `(dashboard)` route group 404'd (every tab switch was a full reload).

**F-17 · CI.** [.github/workflows/ci.yml](.github/workflows/ci.yml): backend `mvn verify`; frontend typecheck → lint → tests → build; Android debug APK uploaded as a workflow artifact.

**F-18 · Repo hygiene.** Untracked committed log archives and scratch files; `.gitignore` now keeps `gradle-wrapper.jar` (the global `*.jar` rule would have broken `./gradlew` in CI) and ignores crash dumps/scratch files; removed dead `tailwind.config.ts`.

---

## 5. Open issues (to do)

Priority: **P0** = security or data-loss risk · **P1** = broken or misleading feature · **P2** = quality / maintainability · **P3** = polish.

### P0 — Security

| ID | Issue | Where | Suggested fix |
|---|---|---|---|
| O-01 | **WebSocket has no authentication.** Anyone can connect to `/ws` and subscribe to `/topic/household/{id}`; the `Authorization` STOMP header is never checked. Origins are `*`. | `config/WebSocketConfig.java` | Add a `ChannelInterceptor` that validates the JWT on `CONNECT` and checks household membership on `SUBSCRIBE`; reuse the CORS origin list. |
| O-02 | **Default JWT secret in `application.yml`.** Running the jar without `JWT_SECRET` signs tokens with a public key from the repo. | `application.yml` → `manaKhata.jwt.secret` | Remove the default and fail fast on startup when `JWT_SECRET` is missing or shorter than 32 bytes. |
| O-03 | **H2 console on by default and `X-Frame-Options` disabled for the whole API** (to let the console render). | `application.yml`, `SecurityConfig` | Default `H2_CONSOLE_ENABLED=false`; only relax frame options for `/h2-console/**` in a `dev` profile. |
| O-04 | **JWT stored in `localStorage`.** Any XSS can steal it; no refresh flow is wired in the frontend (`/api/auth/refresh` exists but is unused). | `store/authStore.ts`, `lib/api.ts` | Move to an `HttpOnly; Secure; SameSite` cookie, or at least implement refresh + short access-token lifetime. |
| O-05 | **Rate limiter can be exhausted / bypassed.** In-memory map per IP grows without bound; behind a proxy all users share one IP (`getRemoteAddr`). | `config/RateLimitFilter.java` | Use a bounded cache (Caffeine) keyed by user ID for authenticated calls and `X-Forwarded-For` via `ForwardedHeaderFilter`; stricter bucket for `/api/auth/login`. |

### P1 — Broken or misleading features

| ID | Issue | Where | Suggested fix |
|---|---|---|---|
| O-06 | **Family Chat is local-only.** Messages live in each browser's `localStorage`; other family members never see them. `GET/POST /api/chat/messages` are called by `api.ts` but **do not exist** on the backend. | `app/(dashboard)/chat/page.tsx`, backend | Add `ChatMessage` entity + `ChatController`; broadcast over STOMP `/topic/household/{id}` (after O-01). |
| O-07 | **Changes in demo mode are not kept.** Adding an expense/goal in the hosted demo shows a success toast but disappears on refresh. | `lib/api.ts` (`demoMutation`) | Persist demo mutations to `localStorage` and merge them into demo reads, or show a "demo — not saved" banner. |
| O-08 | **Wallet history is hard-coded** and `/api/wallet`, `/api/wallet/transfer` **do not exist** (the `wallet` and `notification` backend packages are empty). Allocations update balances but leave no ledger. | `app/(dashboard)/wallet/page.tsx`, backend | Add a `WalletTransaction` table written by allocate/transfer/chore payouts; expose `GET /api/wallet`. |
| O-09 | **The Python AI service is never called.** The backend computes "AI" insights in Java; `manaKhata.ai-service.url` is configured but no client uses it. The service is rule-based placeholder code. | `ai-service/`, `ai/AiInsightService.java` | Either remove the service from docker-compose and docs, or call it from `AiInsightService` with a timeout + Java fallback. |
| O-10 | **Seed data is dated in the future.** Demo expenses are created on fixed days of the *current* month (e.g. the 20th), so early in a month the list shows future-dated items. | `config/DataInitializer.java` | Seed relative to today (`today.minusDays(n)`). |
| O-11 | **Flyway migration is never run.** `V1__init_schema.sql` exists but Flyway is not a dependency; the schema comes from `ddl-auto: update`, which is unsafe for production MySQL. | `pom.xml`, `db/migration` | Add `flyway-core` + `flyway-mysql`, generate a full baseline migration, set `JPA_DDL_AUTO=validate` in prod. |

### P2 — Quality & maintainability

| ID | Issue | Suggested fix |
|---|---|---|
| O-12 | **13 npm advisories remain** (5 high, 7 moderate, 1 low) — all in dev/build tooling (`vite`, `vitest`, `undici`, `js-yaml`, `browserslist`, `brace-expansion`, `@capacitor/cli`→`xcode`→`uuid`). `npm audit fix` currently fails with an npm internal error. | Re-run `npm audit fix` after the next npm/vitest release; Dependabot (add `.github/dependabot.yml`). |
| O-13 | **Lint is passing only because 10 rules are switched off.** With the defaults there are **153 errors / 45 warnings**: 124 `no-explicit-any`, 38 unused vars, 18 `react-hooks/immutability`, 6 unescaped entities, 4 missing effect deps, etc. | Re-enable rules one at a time (start with `react-hooks/*` — those are real bugs), type the API layer (`ApiResponse<Expense[]>` etc.). |
| O-14 | **Almost no tests.** Backend: 1 test class. Frontend: 1 test file (auth store). | Backend: `@WebMvcTest`/`@DataJpaTest` per controller (the smoke script in §3 is a good starting list). Frontend: tests for `api.ts` fallback rules, `formatCurrency`, and the auth guard; one Playwright happy-path. |
| O-15 | **Controllers return JPA entities.** This is why open-session-in-view is needed (F-01/F-02), and it risks leaking fields (currently protected by many `@JsonIgnoreProperties`). | Introduce response DTOs per module, then set `JPA_OPEN_IN_VIEW=false`. |
| O-16 | **`@Transactional` on 17 controller classes** (uncommitted local change, kept as-is). It wraps whole HTTP handlers in write transactions. | Move transactions to service methods; mark reads `readOnly = true`. |
| O-17 | **Unused heavy dependencies:** MongoDB + RabbitMQ starters are on the classpath but their auto-configuration is excluded; `webflux` and `mapstruct` (with its annotation processor) are configured but no code uses them. | Remove, or put behind Maven profiles if the backup/replication feature is planned. |
| O-18 | **Large hand-written demo dataset inside `api.ts`** (~780 lines mixing HTTP client and fixtures). | Move fixtures to `src/demo/*.ts`; keep `api.ts` as a thin typed client. |
| O-19 | **Leftover / stale files:** empty `mobile/`, `database/`, `docker/`, `docs/` folders; `QUICK_START.md` and `learning.*` notes overlap with the new README; `run.bat` mentions Java 17 checks only; `.github/java-upgrade` tooling folders. | Delete empty folders, fold QUICK_START into README, move notes to `docs/`. |
| O-20 | **Backend Java 17 vs Docker/Android toolchains.** Backend targets Java 17; Capacitor 8 Android builds need **JDK 21**. | Document both (done in README) or move the backend to Java 21 LTS. |

### P3 — UX polish

| ID | Issue | Suggested fix |
|---|---|---|
| O-21 | "Add Expense" is at the bottom of the Expenses page; there is no quick-add on the dashboard. | Add a primary "+" action in the top bar / bottom bar. |
| O-22 | Long list names truncate early on phones (e.g. "Weekl…" on Grocery). | Let the title wrap to two lines on small screens. |
| O-23 | Some pages still use their own accent hues (trips purple, tax blue) instead of the theme accent. | Map remaining `purple-*` / `blue-*` accents to `brand-*` or category tokens. |
| O-24 | Notification bell shows a fixed "3" badge with no notifications behind it. | Hide until a notifications feed exists. |
| O-25 | Release signing for the Android app is not configured (CI builds a **debug** APK). | Create an upload keystore, store it as a GitHub secret, add a `assembleRelease` / `bundleRelease` job for Play Store. |

---

## 6. Suggested next steps (in order)

1. **Merge** `fix/audit-theme-android` → `main` (PR), and connect the Vercel project to GitHub so every merge redeploys the demo.
2. **Security sprint:** O-01 → O-05.
3. **Make collaboration real:** O-06 (chat) and O-08 (wallet ledger) — these are the features users will notice first.
4. **Deploy a real backend** (Render/Railway/Fly + managed MySQL), set `CORS_ALLOWED_ORIGINS` to the Vercel URL, set `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_DEMO_MODE=false` on Vercel and `ANDROID_API_URL` in GitHub repo variables.
5. **Testing & lint debt:** O-13, O-14, then DTOs (O-15).
6. **Play Store release:** O-25.
