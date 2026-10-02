# ManaKhata — the household ledger

> *Mana Khata* — "our account". One shared ledger for the whole family: expenses, reimbursements, budgets, wallets, groceries, chores, goals, trips and more.

ManaKhata ships in **two variants from one codebase**:

| Variant | What it is | How to get it |
|---|---|---|
| 🌐 **Web app** | Next.js site — works in any desktop or mobile browser, installable as a PWA | Live demo: **https://frontend-phi-lemon-1hkzt9uj98.vercel.app** |
| 🤖 **Android app** | Native Android app (Capacitor) wrapping the same UI | Download the APK from the latest **CI** run, or build it yourself ([§7](#7-android-app)) |

**Demo sign-in:** any account below, password **`Demo@1234`**.

| Role | Email |
|---|---|
| Househead | `demo@manaKhata.app` |
| Parent | `ria@manaKhata.app` |
| Adult child | `max@manaKhata.app` |
| Student | `lucy@manaKhata.app` |
| Student | `jack@manaKhata.app` |

> 📋 **Project status & known issues:** see **[AUDIT.md](AUDIT.md)** — what was fixed, what is still open, and in which order to tackle it.

---

## Contents

1. [Features](#1-features)
2. [How it fits together](#2-how-it-fits-together)
3. [Tech stack](#3-tech-stack)
4. [Repository layout](#4-repository-layout)
5. [Run it locally](#5-run-it-locally)
6. [Configuration (environment variables)](#6-configuration-environment-variables)
7. [Android app](#7-android-app)
8. [Deploying](#8-deploying)
9. [API reference](#9-api-reference)
10. [Design system — the "Ledger" theme](#10-design-system--the-ledger-theme)
11. [Testing & quality checks](#11-testing--quality-checks)
12. [Troubleshooting](#12-troubleshooting)
13. [Contributing](#13-contributing)

---

## 1. Features

| Area | Screen | What you can do |
|---|---|---|
| **Overview** | Dashboard | Wallet balance, month spend, savings, pending reimbursements, financial health score, recent expenses, AI tips |
| | Household | Members, roles, per-member permissions (househead only), invite code |
| | Groceries | Shared lists, tick items, estimated cost, check out a list into an expense |
| | Chores | Assign chores with a reward, submit → approve → pay out |
| **Finance** | Expenses | Add / edit / delete, categories, personal vs household visibility, receipt scan UI, monthly breakdown |
| | Reimbursements | Request money back, approve / reject / settle (househead) |
| | Split IOUs | Split a bill between members and settle up |
| | Wallet | Household wallet, allocate funds to members |
| | Budget | Category budgets with alert thresholds |
| | Savings Goals | Targets, contributions, progress |
| | Investments · Medical Vault · Tax | Track holdings, insurance policies and tax documents |
| **Assets** | Vehicles · Trips | Vehicle fuel/maintenance log; trip budgets with multi-currency expenses |
| **Intelligence** | AI Advisor · Analytics | Health score, next-month predictions, investment suggestion, charts |
| **Social** | Family Chat · Achievements | Household chat (local-only for now — see AUDIT O-06), badges |
| **Account** | Settings · Integrations | Profile, theme, WhatsApp/bank integrations (preview) |
| **Everywhere** | | Light/dark theme, PDF statements, floating calculator, phone bottom tab bar |

### Demo mode

When `NEXT_PUBLIC_DEMO_MODE=true` (the hosted site and the default Android build) the app never contacts a server — sign-in uses the demo accounts and every screen uses built-in sample data. Edits show success but are **not saved**.

When demo mode is off (local development), the app talks to the Spring Boot API. If the API is not running at all, it falls back to demo data so the UI can still be explored.

---

## 2. How it fits together

```
 ┌──────────────────────────┐        ┌──────────────────────────────┐
 │  Web browser / PWA       │        │  Android app (Capacitor)     │
 │  Next.js on Vercel       │        │  same UI, static export      │
 └────────────┬─────────────┘        └──────────────┬───────────────┘
              │  HTTPS JSON  (+ STOMP WebSocket /ws)│
              ▼                                     ▼
        ┌───────────────────────────────────────────────────┐
        │  Spring Boot API  :8080                           │
        │  JWT auth · REST controllers · JPA/Hibernate      │
        └───────────────┬───────────────────────────────────┘
                        │
              ┌─────────┴─────────┐          ┌───────────────────────┐
              │ H2 (dev, in-mem)  │          │ FastAPI AI service    │
              │ MySQL 8 (docker)  │          │ :8000 (optional, not  │
              └───────────────────┘          │ yet called — AUDIT O-09)
                                             └───────────────────────┘
```

---

## 3. Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js **16.3** (App Router, Turbopack), React 19, TypeScript 5, Tailwind CSS 4, Zustand, Recharts, Framer Motion, Axios, jsPDF |
| Android | Capacitor 8 (`@capacitor/android`, `app`, `status-bar`), minSdk 24, targetSdk 36 |
| Backend | Spring Boot 3.2 (Java 17), Spring Security + JWT (jjwt 0.12), Spring Data JPA, WebSocket/STOMP, Bucket4j rate limit, Actuator |
| Database | H2 in-memory (default dev), MySQL 8 (docker-compose) |
| AI service | Python 3.11, FastAPI, Uvicorn |
| CI / Hosting | GitHub Actions, Vercel (frontend) |

---

## 4. Repository layout

```
ManaKhata/
├── frontend/                  # Next.js app (web) + Capacitor Android project
│   ├── src/
│   │   ├── app/
│   │   │   ├── (dashboard)/   # all signed-in screens + layout (sidebar, top bar, bottom tabs)
│   │   │   ├── auth/          # login, register
│   │   │   ├── globals.css    # "Ledger" theme tokens and component classes
│   │   │   └── layout.tsx     # fonts, theme provider, toasts, NativeBridge
│   │   ├── components/        # UI components, StatementDownloader, NativeBridge (Android glue)
│   │   ├── lib/api.ts         # API client + demo-mode data
│   │   ├── store/authStore.ts # session (Zustand, persisted)
│   │   └── hooks/, constants/, types/
│   ├── android/               # generated Capacitor Android project (commit it)
│   ├── assets/                # source images for the Android icon/splash
│   ├── scripts/build-android.mjs
│   ├── capacitor.config.ts
│   └── next.config.js
├── backend/                   # Spring Boot API
│   └── src/main/java/com/manaKhata/
│       ├── auth/  household/  expense/  reimbursement/  budget/  asset/ (vehicles)
│       ├── goal/  grocery/  chore/  trip/  investment/  medical/  tax/  gamification/
│       ├── ai/  analytics/  backup/
│       └── config/            # security, CORS, WebSocket, rate limit, seed data
├── ai-service/                # FastAPI microservice
├── docker-compose.yml         # MySQL + backend + frontend + AI service
├── .github/workflows/ci.yml   # backend tests, frontend checks, Android APK
├── AUDIT.md                   # audit report and open issues
└── run.bat                    # Windows one-click launcher
```

---

## 5. Run it locally

### 5.0 Prerequisites

| Tool | Version | Needed for |
|---|---|---|
| Node.js | **20.9+** (22 recommended) | frontend |
| Java (JDK) | **17** | backend |
| Maven | 3.9 (or use the bundled `maven/` folder / `run.bat`) | backend |
| Python | 3.11+ | AI service (optional) |
| Docker Desktop | recent | option C only |
| Android Studio / JDK 21 + Android SDK | — | building the Android app locally |

### Option A — Frontend only (2 minutes, no backend)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 and sign in with a demo account. With no API running, the app automatically uses demo data.

To force pure demo mode (exactly like the hosted site), create `frontend/.env.local` with `NEXT_PUBLIC_DEMO_MODE=true`.

### Option B — Full stack (frontend + backend)

**1. Backend** (terminal 1):

```bash
cd backend
mvn spring-boot:run
```

On Windows without Maven installed, use the bundled copy:

```powershell
cd backend
..\maven\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run
```

Wait for `Started ManaKhataApplication`, then check http://localhost:8080/actuator/health → `{"status":"UP"}`.
The backend uses an **in-memory H2 database** seeded with the demo household on every start.

**2. Frontend** (terminal 2):

```bash
cd frontend
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:8080, DEMO_MODE=false
npm install
npm run dev
```

Sign in with `demo@manaKhata.app` / `Demo@1234` — this now signs in against the real API. Anything you add is saved until the backend restarts.

**3. AI service** (optional, terminal 3):

```bash
cd ai-service
python -m venv .venv && . .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Windows shortcut:** `run.bat` frees ports 3000/8080/8000 and starts all three in separate windows.

### Option C — Docker Compose (MySQL + everything)

```bash
cp .env.example .env            # then set a long random JWT_SECRET
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:8080 (health: `/actuator/health`) |
| AI service | http://localhost:8000/health |
| MySQL | `localhost:3306`, db `manaKhata`, user `manauser` / `manapass` |

---

## 6. Configuration (environment variables)

### Frontend (`frontend/.env.local`, Vercel project settings, or Docker build args)

`NEXT_PUBLIC_*` values are baked in **at build time** — rebuild after changing them.

| Variable | Default | Meaning |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Base URL of the Spring Boot API (also used for the WebSocket `…/ws`) |
| `NEXT_PUBLIC_DEMO_MODE` | `false` | `true` = never call the API; demo accounts + built-in data only |
| `NEXT_PUBLIC_APP_NAME` | `ManaKhata` | Display name |
| `BUILD_TARGET` | — | `android` = static export to `out/` (set automatically by `npm run build:android`) |

### Backend (environment or `application.yml`)

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `8080` | HTTP port |
| `SPRING_DATASOURCE_URL` | H2 in-memory | JDBC URL, e.g. `jdbc:mysql://host:3306/manaKhata?useSSL=false&serverTimezone=Asia/Kolkata` |
| `SPRING_DATASOURCE_DRIVER` | `org.h2.Driver` | Use `com.mysql.cj.jdbc.Driver` for MySQL |
| `SPRING_DATASOURCE_USERNAME` / `_PASSWORD` | `sa` / empty | DB credentials |
| `JPA_DDL_AUTO` | `update` | Hibernate schema mode |
| `JPA_OPEN_IN_VIEW` | `true` | Keep `true` until DTOs land (AUDIT O-15) |
| `JWT_SECRET` | dev default ⚠️ | **Always set in production** (≥ 32 chars) |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:3001` | Exact origins allowed to call the API — add your Vercel URL |
| `CORS_ALLOWED_ORIGIN_PATTERNS` | localhost ports, `https://localhost`, `capacitor://localhost` | Wildcard origins (the Android app is `https://localhost`) |
| `H2_CONSOLE_ENABLED` | `true` | Set `false` outside development |
| `AI_SERVICE_URL` | `http://localhost:8000` | FastAPI service |
| `LOG_LEVEL` | `INFO` | `com.manaKhata` log level |

### Docker Compose (`.env` in the repo root)

| Variable | Meaning |
|---|---|
| `JWT_SECRET` | **Required.** Compose refuses to start without it. |

### AI service

| Variable | Default | Meaning |
|---|---|---|
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:8080` | Allowed origins |
| `ENABLE_DOCS` | `true` | Serve Swagger UI at `/docs` |
| `LOG_LEVEL` | `info` | Log level |

---

## 7. Android app

The Android app is the same Next.js UI exported as static files and packaged with Capacitor. Android-specific touches: bottom tab bar, hardware **back button** (goes back; exits from the dashboard), status bar that follows the theme, ledger app icon and splash screen.

### 7.1 Get the APK without installing anything (CI)

1. Push to `main` (or any `fix/**`, `feat/**` branch) or run **Actions → CI → Run workflow**.
2. Open the finished run → **Artifacts** → download **`manakhata-debug-apk`**.
3. Copy the `.apk` to your phone and open it (allow "Install unknown apps" for your file manager).

By default the CI APK is the **offline demo app**. To make it talk to a deployed API, set a repository variable **`ANDROID_API_URL`** (Settings → Secrets and variables → Actions → Variables), e.g. `https://api.yourdomain.com`.

### 7.2 Build it yourself

Requirements: **JDK 21** and the **Android SDK** (easiest: install Android Studio).

```bash
cd frontend
npm install
npm run build:android          # static export -> out/ -> copied into android/
npm run android:open           # opens Android Studio -> Run ▶ on a device/emulator
```

Or build an APK from the command line:

```bash
cd frontend/android
./gradlew assembleDebug        # Windows: gradlew.bat assembleDebug
```

The APK is written to `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

### 7.3 Pointing the Android app at a real backend

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com npm run build:android
```

- When `NEXT_PUBLIC_API_URL` is set, demo mode is turned **off** automatically (override with `NEXT_PUBLIC_DEMO_MODE`).
- The app runs at `https://localhost` inside the WebView, so the API **must be HTTPS** (Android blocks plain-HTTP calls from an HTTPS page). The backend already allows `https://localhost` in CORS.
- For quick tests against a laptop backend, expose it over HTTPS with a tunnel (e.g. `cloudflared tunnel --url http://localhost:8080`) and use that URL.

### 7.4 Updating icons / splash

Edit `frontend/assets/icon-only.png`, `icon-foreground.png`, `icon-background.png`, `splash.png`, `splash-dark.png`, then:

```bash
cd frontend
npx @capacitor/assets generate --android --iconBackgroundColor '#1f7a57' --splashBackgroundColor '#f5f2ea' --splashBackgroundColorDark '#141714'
```

### 7.5 Play Store release

Not configured yet (CI builds a debug APK). Create an upload keystore, add signing config to `android/app/build.gradle`, store the keystore as a GitHub secret and add a `bundleRelease` step — tracked as AUDIT O-25.

### 7.6 Install as a PWA instead

On Android Chrome, open the web app → menu ⋮ → **Install app**. It opens full-screen with the same icon and theme colours.

---

## 8. Deploying

### 8.1 Frontend on Vercel (current setup)

The live demo is the Vercel project **`manakata`** (team *iragavarapunagaatchutaneelima's projects*), which owns the domain `frontend-phi-lemon-1hkzt9uj98.vercel.app`. `frontend/.vercel/project.json` links the folder to it.

| Vercel setting | Value |
|---|---|
| Framework | Next.js |
| Root directory | `frontend` (when connected to Git) |
| Environment variables | `NEXT_PUBLIC_DEMO_MODE=true` (Production + Preview) — already set |

Deploy manually from the CLI:

```bash
cd frontend
vercel deploy --prod
```

> ⚠️ **Hobby plan gotcha:** Vercel blocks a CLI deploy when the latest git commit's author email is not a member of the Vercel team (`TEAM_ACCESS_REQUIRED`). Make sure `git config user.email` is your real GitHub/Vercel email, or connect the project to the GitHub repo (Project → Settings → Git) so deploys come from GitHub automatically.

When a public backend exists, change the Vercel env vars to `NEXT_PUBLIC_DEMO_MODE=false` and `NEXT_PUBLIC_API_URL=https://<your-api>` and redeploy.

### 8.2 Backend

Any Docker host works (Render, Railway, Fly.io, a VM):

```bash
docker build -t manakhata-api ./backend
docker run -p 8080:8080 \
  -e SPRING_DATASOURCE_URL='jdbc:mysql://<host>:3306/manaKhata?useSSL=true' \
  -e SPRING_DATASOURCE_DRIVER=com.mysql.cj.jdbc.Driver \
  -e SPRING_DATASOURCE_USERNAME=... -e SPRING_DATASOURCE_PASSWORD=... \
  -e JWT_SECRET='<long random string>' \
  -e CORS_ALLOWED_ORIGINS='https://frontend-phi-lemon-1hkzt9uj98.vercel.app' \
  -e H2_CONSOLE_ENABLED=false \
  manakhata-api
```

Read AUDIT.md §5 (P0 items) before exposing the backend publicly.

---

## 9. API reference

All endpoints return `{ success, message, data, timestamp }`. Everything except `/api/auth/**` and `/actuator/health` needs `Authorization: Bearer <token>` (a missing/expired token returns **401**).

| Module | Endpoints |
|---|---|
| Auth | `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/refresh` |
| Household | `GET /api/household` · `PUT /api/household` · `GET /api/household/members` · `PATCH /api/household/members/{id}/permissions` · `POST /api/household/wallet/allocate` |
| Expenses | `GET /api/expenses` · `GET /api/expenses/household` · `GET /api/expenses/summary` · `POST /api/expenses` · `PUT /api/expenses/{id}` · `DELETE /api/expenses/{id}` |
| Splits | `GET /api/splits` · `GET /api/splits/i-owe` · `GET /api/splits/owed-to-me` · `POST /api/splits` · `PATCH /api/splits/{id}/settle` |
| Reimbursements | `GET /api/reimbursements` · `GET /api/reimbursements/summary` · `POST /api/reimbursements` · `PATCH /api/reimbursements/{id}/approve` · `…/reject` · `…/settle` |
| Budgets | `GET /api/budgets` · `GET /api/budgets/household` · `POST /api/budgets` · `PUT /api/budgets/{id}` · `DELETE /api/budgets/{id}` |
| Vehicles | `GET /api/vehicles` · `GET /api/vehicles/{id}` · `POST /api/vehicles` · `POST /api/vehicles/{id}/expenses` · `DELETE /api/vehicles/{id}` |
| Trips | `GET /api/trips` · `POST /api/trips` · `GET /api/trips/{id}/expenses` · `POST /api/trips/{id}/expenses` |
| Groceries | `GET /api/grocery` · `POST /api/grocery` · `POST /api/grocery/{listId}/items` · `PATCH /api/grocery/items/{id}/check` · `PATCH /api/grocery/{listId}/complete` · `DELETE /api/grocery/{listId}` · `DELETE /api/grocery/items/{id}` |
| Chores | `GET /api/chores` · `POST /api/chores` · `PATCH /api/chores/{id}/status` |
| Goals | `GET /api/goals` · `POST /api/goals` · `POST /api/goals/{id}/contribute` |
| Investments · Medical · Tax | `GET/POST /api/investments` · `GET/POST /api/medical/policies` · `GET/POST /api/tax` |
| Badges | `GET /api/badges` · `POST /api/badges` |
| AI & analytics | `GET /api/ai/insights` · `/api/ai/health-score` · `/api/ai/predictions` · `/api/ai/investments` · `GET /api/analytics/household` · `/api/analytics/personal` |
| Realtime | STOMP over WebSocket at `/ws` (SockJS fallback `/ws-sockjs`), topic `/topic/household/{id}` |

Quick check with curl:

```bash
curl -s -X POST localhost:8080/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"demo@manaKhata.app","password":"Demo@1234"}'
```

---

## 10. Design system — the "Ledger" theme

A deliberately plain look modelled on a paper *khata* book:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg-primary` | `#f5f2ea` paper | `#141714` | page background |
| `--bg-card` | `#fffdf8` | `#1b1f1b` | cards, inputs |
| `--text-primary` | `#1d2320` ink | `#ebe9e1` | body text |
| `--accent` | `#1f7a57` ledger green | `#5fbf93` | buttons, active nav, links |
| `--rule` / `--margin-rule` | `#c9bfa8` / `#c2453c` | | ledger rulings, red margin line |
| `--positive` / `--negative` / `--warning` | green / red / amber | | money in / out / alerts |

- **Type:** Fraunces (serif) for headings, Inter for text, tabular numbers everywhere so amounts line up.
- **Surfaces:** flat cards with a 1 px border — no glass, glows or animated backgrounds.
- **Signature details:** double rule under the top bar; the app icon's red margin line.
- Tokens live in `frontend/src/app/globals.css`; Tailwind's `brand-*` colours map to the accent scale via `@theme`; chart colours come from `src/constants/theme.ts`.

---

## 11. Testing & quality checks

```bash
# frontend
cd frontend
npm run typecheck
npm run lint
npm run test:run
npm run build

# backend
cd backend
mvn test
```

CI (`.github/workflows/ci.yml`) runs all of the above on every push/PR and then builds the Android APK.

---

## 12. Troubleshooting

| Symptom | Fix |
|---|---|
| Vercel shows `404 DEPLOYMENT_NOT_FOUND` | No production deployment exists — redeploy (`vercel deploy --prod` from `frontend/`). |
| Vercel deployment stuck as **Blocked** | Commit author isn't on the Vercel team — see the gotcha in [§8.1](#81-frontend-on-vercel-current-setup). |
| `vercel deploy` hangs on upload | `frontend/.vercelignore` must exclude `.next`, `node_modules`, `android`, `out` (it does — don't delete it). |
| Signed in as a demo user but numbers don't change after edits | You are in demo mode (hosted site / Android default). Run the backend locally for persistence. |
| Wrong password message says "Server is offline" | The API at `NEXT_PUBLIC_API_URL` is unreachable — start the backend or enable demo mode. |
| Windows: "port 8080 is reserved/in use" | A previous Java process is still running: `netstat -ano \| findstr :8080`, then `taskkill /PID <pid> /F`, or run `run.bat`. |
| Android app can't reach your API | The API must be **HTTPS** and listed in CORS; see [§7.3](#73-pointing-the-android-app-at-a-real-backend). |
| `docker compose up` fails with "JWT_SECRET is missing" | Copy `.env.example` to `.env` and set it. |
| Gradle: "Unsupported class file major version" | Android builds need **JDK 21** (backend still uses 17). |

---

## 13. Contributing

1. Branch from `main`: `git checkout -b feat/<short-name>`.
2. Pick an item from **[AUDIT.md](AUDIT.md) §5** (reference its ID, e.g. *O-06*, in your PR).
3. Run the checks in [§11](#11-testing--quality-checks).
4. Open a PR — CI must be green. Keep UI changes within the Ledger theme tokens.

## License

[MIT](LICENSE) © 2026 ManaKhata contributors
