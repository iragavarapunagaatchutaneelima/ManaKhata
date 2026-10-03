# Legacy (ManaKhata v1)

This folder keeps the **v1 server stack** that ManaKhata used before it became **ManaKhata v2**:

| Folder / file | What it is |
|---|---|
| `backend/` | Spring Boot 3.2 REST API (Java 17, JWT auth, JPA/H2/MySQL) |
| `ai-service/` | Python FastAPI rule-based insights service (never called by the backend) |
| `docker-compose.yml` | MySQL + backend + AI service |
| `run.bat` | Windows launcher for the v1 stack |

**ManaKhata v2 does not use any of this.** The web and Android apps in `../frontend` talk directly to
Supabase (Postgres + Auth + Realtime) with the schema in `../supabase/migrations`, and all business
rules live in Row Level Security policies and SQL functions there.

The code is kept so nothing is lost and so it can be studied or revived. CI still compiles and tests
`legacy/backend` so it doesn't silently rot. It is a candidate for removal in a future release —
see `AUDIT.md`.

Run it (optional):

```bash
cd legacy/backend
mvn spring-boot:run          # http://localhost:8080, H2 in-memory, demo users seeded
```
