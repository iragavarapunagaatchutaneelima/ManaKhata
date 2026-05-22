# ManaKhata — Learning / Engineering Notes

This document is the “why + how” of the project from an engineering point of view: what exists today, how to run it, how it’s wired, what was verified most recently, and what to improve next.

## 1) What ManaKhata is (today)

ManaKhata is a multi-service household finance prototype:

- **Frontend (`frontend/`)**: Next.js App Router UI with pages for auth, dashboard, analytics, expenses, budgets, reimbursements, vehicles, settings, and an AI advisor view.
- **Backend (`backend/`)**: Spring Boot REST API that implements the system of record (users/households/expenses/reimbursements/budgets/vehicles) and also provides rule-based “AI” endpoints.
- **AI service (`ai-service/`)**: FastAPI service with placeholder endpoints. It is currently *not* used by the backend’s AI endpoints; it’s scaffolding for future integration.

## 2) Repository structure (high level)

```text
ManaKhata/
  backend/           Spring Boot API (Java 17)
  frontend/          Next.js UI
  ai-service/        FastAPI placeholder service
  database/          (reserved / optional)
  docker/            (reserved / optional)
  docker-compose.yml Compose definition (requires Docker)
  run.bat            Windows runner (opens 3 terminals)
  README.md          GitHub-facing overview
  LICENSE            MIT license
```

## 3) Backend: domain + API surface

### Auth + household model

- **JWT-based auth** is used for protected endpoints.
- A user belongs to a **household**. The first user created (no invite code) becomes the **househead**.
- Househead can update household info, manage member permissions, and approve/settle reimbursements.

Key routes (Spring Boot):

- `POST /api/auth/register` (create household or join via invite code)
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/household` (household + member list + invite code)
- `PUT /api/household` (househead-only)
- `PATCH /api/household/members/{memberId}/permissions` (househead-only)
- `POST /api/household/wallet/allocate` (househead-only)

### Expenses

- `GET /api/expenses` (paged; personal by default)
- `GET /api/expenses/household` (househead or permitted members)
- `POST /api/expenses`
- `PUT /api/expenses/{id}`
- `DELETE /api/expenses/{id}`
- `GET /api/expenses/summary` (monthly totals + category breakdown)

### Reimbursements

- `GET /api/reimbursements` (paged; `filter=mine` supported)
- `POST /api/reimbursements`
- `PATCH /api/reimbursements/{id}/approve` (househead-only)
- `PATCH /api/reimbursements/{id}/reject` (househead-only)
- `PATCH /api/reimbursements/{id}/settle` (househead-only)
- `GET /api/reimbursements/summary`

### Budgets

- `GET /api/budgets` (user/month/year)
- `GET /api/budgets/household` (household/month/year)
- `POST /api/budgets`
- `PUT /api/budgets/{id}`
- `DELETE /api/budgets/{id}` (soft-deactivates)

### Vehicles

- `GET /api/vehicles`
- `GET /api/vehicles/{id}` (detail + totals + contribution breakdown)
- `POST /api/vehicles`
- `POST /api/vehicles/{id}/expenses`
- `DELETE /api/vehicles/{id}` (soft-deactivates)

### Analytics

- `GET /api/analytics/household` (6-month trend, category breakdown, member spending, reimbursements, income)
- `GET /api/analytics/personal` (6-month trend, savings, pending reimbursements)

### “AI” endpoints (implemented in backend)

The backend currently generates “AI” output via deterministic heuristics over expenses and income:

- `GET /api/ai/insights`
- `GET /api/ai/health-score`
- `GET /api/ai/predictions`
- `GET /api/ai/investments`

## 4) Demo seed data

Backend seeds a demo household by default (disabled when running with the `test` profile).

- Invite code: `SHARMA01`
- Password (all demo users): `Demo@1234`
- Users:
  - `demo@manaKhata.app` (househead)
  - `sunita@manaKhata.app`
  - `arjun@manaKhata.app`
  - `priya@manaKhata.app`

To disable seeding: set `manakhata.seed.enabled=false`.

## 5) Running the project locally

### Windows (recommended here)

From repo root:

```bat
run.bat
```

This starts:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- AI service: `http://localhost:8000`

### Manual commands

Backend:

```powershell
Set-Location backend
..\maven\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run
```

Frontend:

```powershell
Set-Location frontend
npm install
npm run dev
```

AI service:

```powershell
Set-Location ai-service
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

## 6) Testing / verification status

### Last verified build (by tool-run in this workspace)

Verified on **2026-05-22 (IST)**:

- Backend: `mvn test` passed; `mvn -DskipTests package` succeeded.
- Frontend: `npm run build` succeeded; `npx vitest run` passed.
- AI service: `python -m compileall ai-service` succeeded.

Not verified here:

- Docker Compose runtime (`docker` was not available in this environment).

### Known issues spotted during verification

- `frontend`: `npm run lint` fails currently (React hook rule + many `any` usages + a “used before declared” hook issue in the budget page).

## 7) Suggestions (if you want to take this to “production-ready”)

If you want me to proceed with improvements, these are the highest leverage next steps:

1. **Make lint pass**: remove `any`, fix hook dependencies, fix the “used before declared” effect issue, and align ESLint/TS rules with the desired strictness level.
2. **Wire the AI service** (or remove it): either integrate `AI_SERVICE_URL` and move AI computations to FastAPI, or delete the unused microservice to reduce complexity.
3. **Docker hardening**: ensure healthchecks work in images (many minimal images don’t ship with `curl`), and document `.env` secrets instead of defaults.
4. **Testing coverage**: add backend controller/service tests beyond the reimbursement flow; expand frontend component/page tests; add API contract tests.
5. **Security pass**: rotate demo secrets, ensure JWT secret handling is safe by default, and validate RBAC/permission checks consistently across endpoints.

## 8) Last update (source tree)

This workspace’s latest non-build-artifact modification time was **2026-05-22 14:21:13 (IST)** (`run.bat`).

