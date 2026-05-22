# ManaKhata

ManaKhata is a household finance management platform for families and shared homes. It combines a modern Next.js dashboard with a Spring Boot API to track expenses, budgets, reimbursements, shared assets, analytics, and rule-based financial insights.

## Live Demo

Live demo: _Deployment link will be added after the Vercel deployment is completed._

## Highlights

- Household workspace with member roles, househead controls, and permission-based access.
- Personal and household expense tracking with categories, monthly summaries, and visibility controls.
- Reimbursement workflow for creating, approving, rejecting, and settling shared payments.
- Budget management for personal and household spending plans.
- Vehicle and shared asset expense tracking with contribution summaries.
- Analytics dashboards for household and personal financial trends.
- Rule-based AI-style insights, health score, predictions, and investment suggestions.
- Automatic backup engines for JSON, SQL, and Excel-style exports.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Zustand, Recharts |
| Backend | Java 17, Spring Boot, Spring Security, JWT, Spring Data JPA |
| AI service | FastAPI placeholder service |
| Database | H2 for local development, with MySQL-ready configuration notes |
| Tooling | Docker Compose, Maven, npm, Vitest |

## Project Structure

```text
ManaKhata/
├── frontend/       # Next.js web application
├── backend/        # Spring Boot REST API
├── ai-service/     # FastAPI placeholder service
├── database/       # Database-related project files
├── docker/         # Docker support files
├── docs/           # Additional documentation
├── mobile/         # Mobile app workspace placeholder
├── docker-compose.yml
└── run.bat         # Windows helper to start local services
```

## Local Development

### Prerequisites

- Node.js 20 or later
- npm
- Java 17
- Maven 3.9 or later, or the bundled Maven files if present locally
- Python 3.11 or later for the optional AI service
- Docker Desktop if you want to use Docker Compose

### Start Everything on Windows

```bat
run.bat
```

Default local services:

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:8080` |
| AI service | `http://localhost:8000` |

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local` for local API configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME=ManaKhata
```

### Backend

```powershell
cd backend
..\maven\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run
```

If Maven is installed globally, you can use:

```powershell
cd backend
mvn spring-boot:run
```

### AI Service

```powershell
cd ai-service
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

## Demo Accounts

The backend seeds demo data on startup when the test profile is not active.

| Purpose | Value |
| --- | --- |
| Invite code | `SHARMA01` |
| Demo password | `Demo@1234` |
| Househead email | `demo@manaKhata.app` |
| Other users | `sunita@manaKhata.app`, `arjun@manaKhata.app`, `priya@manaKhata.app` |

To disable seed data, set:

```properties
manakhata.seed.enabled=false
```

## Configuration

### Frontend Environment

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8080` |
| `NEXT_PUBLIC_APP_NAME` | Display name used by the web app | `ManaKhata` |

### Backend Environment

| Variable | Description |
| --- | --- |
| `JWT_SECRET` | Secret used to sign JWT access tokens |
| `AI_SERVICE_URL` | Base URL for the optional AI service |
| `DB_USERNAME` | Database username for production database configuration |
| `DB_PASSWORD` | Database password for production database configuration |

## Testing

### Frontend

```powershell
cd frontend
npm run build
npx vitest run
```

### Backend

```powershell
cd backend
..\maven\apache-maven-3.9.6\bin\mvn.cmd test
```

## Deployment Notes

The Vercel deployment targets the `frontend/` Next.js application. For a fully functional production demo, the Spring Boot API must also be deployed to a backend host and `NEXT_PUBLIC_API_URL` must point to that deployed API URL.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
