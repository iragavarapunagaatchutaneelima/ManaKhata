# ManaKhata Learning Notes

## Product Direction

ManaKhata is best understood as a household finance OS, not just an expense tracker. The UX should feel like a command center: confident, premium, family-friendly, and fast enough for daily use.

## Design System

- Default experience is dark, blue-black, and lightly glossy.
- Use sky, cyan, royal blue, mint, and amber accents for finance-state feedback.
- Prefer restrained glass cards, subtle reflective shine, blue aurora gradients, and soft motion rather than flat panels or over-glossed effects.
- Keep motion purposeful: navigation, hover, page entry, progress changes, skeleton loading, and modal transitions.
- Always include reduced-motion support for accessibility.

## Frontend Architecture

- Next.js App Router lives in `frontend/src/app`.
- Shared UI primitives live in `frontend/src/components/ui`.
- Demo fallback and API calls live in `frontend/src/lib/api.ts`.
- Auth persistence lives in `frontend/src/store/authStore.ts`.
- Global theme and motion tokens live in `frontend/src/app/globals.css`.

## Demo Data Strategy

- Demo data must remain realistic and aligned with backend seed users.
- Demo password is `Demo@1234`.
- Primary household is `Mario Family`.
- Keep emails synchronized between `frontend/src/constants/demo.ts`, `frontend/src/lib/api.ts`, and `backend/src/main/java/com/manaKhata/config/DataInitializer.java`.

## Verification Habit

Run the frontend production build after UI or type changes:

```bash
cd frontend
npm run build
```

For backend changes, run:

```bash
cd backend
./mvnw test
```

## Recent Upgrade Summary

- Refined the UI into a calmer blue-noir visual layer.
- Added click interaction audio.
- Improved dashboard hero, stat cards, app shell, auth pages, and landing page treatment.
- Expanded frontend demo data so the app remains useful even without the backend running.
- Rewrote the README for a clean production handoff.
