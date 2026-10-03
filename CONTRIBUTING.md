# Contributing to ManaKhata

Thanks for helping make ManaKhata better for families! This guide covers how to set up, what we expect in a change, and how to get it merged.

## Ground rules

- Be kind — see the [Code of Conduct](CODE_OF_CONDUCT.md).
- Never commit secrets (service-role keys, passwords, tokens). The Supabase **publishable** key is the only key that belongs in the code.
- Never paste real people’s financial data into issues, tests or screenshots. Use the demo household.
- Security problems go through [SECURITY.md](SECURITY.md), not public issues.

## Setup

```bash
git clone https://github.com/iragavarapunagaatchutaneelima/ManaKhata.git
cd ManaKhata/frontend
npm install
npm run dev          # http://localhost:3000 — "Try the demo" needs no account
```

## Making a change

1. Pick an item from [AUDIT.md](AUDIT.md) or open an issue describing the problem first for anything large.
2. Branch from `main`: `git checkout -b feat/<short-name>` or `fix/<short-name>`.
3. Keep changes focused. Match the existing style: the UI kit in `src/components/ui.tsx`, theme tokens (`bg-surface`, `text-ink-2`, `bg-primary` …) rather than raw colours, and money maths through `src/lib/money.ts` / `src/lib/finance.ts`.
4. **Money logic needs tests.** Any new calculation goes in `finance.ts` with a hand-checked case in `finance.test.ts`.
5. **Database changes** go in a *new* file in `supabase/migrations/` (`YYYYMMDDHHMMSS_description.sql`). Every new table needs Row Level Security, and anything privileged must be a `SECURITY DEFINER` function that re-checks the caller’s role. Mirror new rules in `DemoBackend` (`src/lib/backend.ts`) and add a test to `backend.test.ts`.
6. Run the checks:

   ```bash
   npm run typecheck && npm run lint && npm run test:run && npm run build
   ```

7. Open a pull request using the template. CI must be green (web, Android, legacy backend).

## Commit messages

Short imperative summary (`Add CSV export to reports`), then a blank line and the *why* if it isn’t obvious.

## Releases

Maintainers merge to `main`; Vercel deploys the website and CI publishes the Android APK artifact. Notable changes are listed in [CHANGELOG.md](CHANGELOG.md).

## Licence

By contributing you agree that your contributions are licensed under the [MIT Licence](LICENSE).
