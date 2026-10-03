# Security policy

ManaKhata stores household financial records, so we take security reports seriously.

## Reporting a vulnerability

**Please do not open a public issue.** Instead use GitHub’s private reporting:
**Security → Report a vulnerability** on <https://github.com/iragavarapunagaatchutaneelima/ManaKhata/security/advisories/new>.

Include what you found, steps to reproduce, and the impact. We aim to acknowledge reports within 3 working days and to fix
confirmed high-severity issues within 30 days. We’ll credit you in the release notes unless you prefer otherwise.

## Scope

In scope: the ManaKhata web app, the Android app, and the database rules in `supabase/migrations` (for example, any way to read
or change another household’s data, bypass a role check, or move wallet balances below zero).

Out of scope: the unused v1 code in `legacy/`, denial-of-service, social engineering, and issues in third-party platforms
(Supabase, Vercel) that should be reported to them.

## How ManaKhata protects data

- Postgres **Row Level Security** on every table, scoped to household membership.
- Privileged actions only through `SECURITY DEFINER` SQL functions that re-check the caller’s role; internal helpers are not callable by clients.
- Private expenses are hidden from other members at the database level.
- Only the Supabase **publishable** key is shipped in the apps; no service-role key exists in this repository.
- TLS in transit; encryption at rest by the hosting providers.

## Supported versions

Only the latest release on `main` (ManaKhata 2.x) receives security fixes.
