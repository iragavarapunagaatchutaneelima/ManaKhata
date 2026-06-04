# ManaKhata

ManaKhata is a production-ready household finance operating system for families. It combines expense tracking, reimbursements, budgets, wallets, vehicles, chores, grocery lists, savings goals, investments, medical policies, tax records, trip budgets, AI insights, and real-time collaboration in one polished dashboard.

## What Changed in This Build

- Complete blue-noir UI refresh with restrained glossy cards, deep blue aurora backgrounds, subtle reflective highlights, animated navigation, premium dashboard shell, and smoother page transitions.
- Global interaction audio for button, link, input, and control clicks using the Web Audio API.
- Richer demo mode with realistic May 2026 household expenses, reimbursements, wallet activity, analytics, budgets, trips, goals, policies, investments, chores, and grocery data.
- Production build verified with Next.js 16.2.6 and React 19.2.4.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js App Router, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Zustand, Recharts |
| Backend | Spring Boot, Spring Security, JPA/Hibernate, Flyway |
| AI Service | Python FastAPI-style service entry under `ai-service` |
| Database | PostgreSQL-ready schema and seed data |
| Local Orchestration | Docker Compose plus helper scripts |

## Demo Login

Use any demo account with password `Demo@1234`.

| Role | Email |
| --- | --- |
| Househead | `demo@manaKhata.app` |
| Parent | `ria@manaKhata.app` |
| Adult Child | `max@manaKhata.app` |
| Student | `lucy@manaKhata.app` |
| Student | `jack@manaKhata.app` |

The frontend automatically falls back to local demo data when the backend is unavailable, so the product can be explored immediately.

## Quick Start

### Live Deployment

The frontend is live and deployed on Vercel:
**[https://frontend-phi-lemon-1hkzt9uj98.vercel.app](https://frontend-phi-lemon-1hkzt9uj98.vercel.app)**

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The API defaults to `http://localhost:8080`. Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` if your backend runs elsewhere.

### Full Local Stack

```bash
docker compose up --build
```

## Frontend Experience

- Dashboard shell: collapsible desktop sidebar, mobile slide-over navigation, premium top bar, notification indicator, theme toggle, statement download shortcut, and floating calculator.
- Visual language: dark-first blue-black gloss, sky/cyan/royal-blue highlights, glassmorphism surfaces, soft grid texture, calm aurora blobs, and subtle shine passes.
- Motion system: route transitions, sidebar slide animations, stat-card hover lifts, shimmer skeletons, smooth progress bars, table hover movement, and reduced-motion accessibility support.
- UX quality: clear demo credentials, responsive layouts, accessible focus states, graceful demo fallback, and optimized static production build output.

## Core Modules

- Household members and permission management
- Personal and household expenses
- Reimbursements and split IOUs
- Wallet balance and transactions
- Budgets and health scoring
- AI advisor, predictions, and investment suggestions
- Vehicles and maintenance tracking
- Trips and multi-currency trip expenses
- Grocery lists and chore rewards
- Investments, medical policies, and tax documents
- Achievements, integrations, family chat, and analytics

## Useful Commands

```bash
cd frontend && npm run build
cd frontend && npm run test
cd frontend && npm run lint
cd backend && ./mvnw test
```

## Production Notes

- Keep seeded demo data enabled only for demo/dev environments using `manakhata.seed.enabled`.
- Configure `NEXT_PUBLIC_API_URL` for deployed frontend builds.
- Rotate JWT/database secrets before deployment.
- Use HTTPS for deployed APIs because the app stores auth tokens in browser storage.
- Keep Next.js, React, and Spring dependencies patched before public exposure.

## Project Structure

```text
ManaKhata/
├── frontend/       Next.js app, UI, API client, stores, demo fallback data
├── backend/        Spring Boot API, domain modules, Flyway migrations, seed data
├── ai-service/     AI service entry point
├── database/       Database assets
├── docker/         Container support
├── docs/           Supporting docs
└── docker-compose.yml
```

## Current Verification

The frontend production build succeeds:

```bash
cd frontend
npm run build
```

Result: all 27 app routes compile and prerender successfully.
