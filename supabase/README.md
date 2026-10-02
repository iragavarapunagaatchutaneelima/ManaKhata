# Kinfold database (Supabase)

Production project: **Kinfold** · ref `lpqbtssvotkvogqmzohv` · region `ap-south-1` (Mumbai) · Postgres 17.

Apply the migrations **in filename order** to create or update a database:

| File | What it does |
|---|---|
| `20261002000000_kinfold_schema.sql` | All tables, integrity triggers, Row Level Security policies, SQL functions, realtime publication |
| `20261002000100_lock_internal_functions.sql` | Makes trigger/helper functions uncallable by clients |
| `20261002000200_safe_account_deletion.sql` | Account deletion that erases personal data and anonymises shared history |

Rules for changes:

1. Never edit a migration that has been applied — add a new file.
2. Every table gets RLS. Privileged writes go through `SECURITY DEFINER` functions with `set search_path = public` that re-check the caller.
3. After DDL, run Supabase’s security advisor (Dashboard → Advisors) and fix warnings.
4. Mirror behaviour changes in `frontend/src/lib/backend.ts` (`DemoBackend`) and test them.
