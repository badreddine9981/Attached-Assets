# Neworldody

A luxury living book experience for **Dodi (دودي)**. Each day unlocks one new page of reflection, wisdom, space, and a personal surprise. The book opens only once per day; the rest of the time it floats in its own night sky, waiting for the next dawn.

## Run & Operate

- `pnpm --filter @workspace/neworldody run dev` — run the web app (path: `/`)
- `PORT=20774 BASE_PATH=/ pnpm --filter @workspace/neworldody run build` — production build
- `pnpm --filter @workspace/api-server run dev` — shared API server (currently unused by this app)
- `pnpm run typecheck` — full workspace typecheck
- Required env: none for the frontend (uses localStorage + JSON files). Database is available if the backend is ever needed.

## Stack

- pnpm workspaces, Node.js 24, Vite 7
- Frontend: plain HTML5, CSS3, vanilla JavaScript
- Data: JSON files in `public/data/days/`
- Persistence: `localStorage` for progress, settings, and next-unlock time
- PWA: `manifest.json` + `sw.js` for offline reading
- Fonts: Aref Ruqaa, IBM Plex Sans Arabic, Cinzel via Google Fonts

## Where things live

- `artifacts/neworldody/index.html` — three scenes (library, reading, waiting)
- `artifacts/neworldody/public/css/style.css` — luxury book styling, RTL Arabic, 3D transforms, animations
- `artifacts/neworldody/public/js/app.js` — scene orchestration, day loading, card rendering
- `artifacts/neworldody/public/js/storage.js` — `localStorage` progress + unlock rules
- `artifacts/neworldody/public/js/sky.js` — deterministic unique sky per day
- `artifacts/neworldody/public/data/days/day_001.json` … `day_007.json` — daily content
- `artifacts/neworldody/public/manifest.json` — PWA manifest
- `artifacts/neworldody/public/sw.js` — offline cache

## Architecture decisions

- Plain vanilla JS instead of React because the requested experience is a single, cinematic HTML document with heavy CSS animations and no routing.
- All content lives in JSON files so days can be authored without touching code.
- Unlock logic is calendar-day based with a midnight countdown; the next page becomes available at the next midnight after the current page is read.
- Every day gets a deterministic, unique sky generated from the day number so no two skies repeat.
- The app is intentionally frontend-only and offline-first; no backend or database is needed for the first 7 days.

## Product

- Open the floating leather book to reveal today's page.
- Each page contains five cards: Page of the Day, Wisdom of the Day, Space of the Day, a rotating Variable Card, and a Surprise Card.
- Special occasions (milestones, birthdays, etc.) render an extra card.
- Close the book to return to the waiting scene with a countdown to the next midnight unlock.
- Works offline as an installable PWA.

## User preferences

- Built for Dodi (دودي) — personal, intimate tone; every page reads like a gift.
- No generic motivational clichés; content is specific, calm, and human.

## Gotchas

- The `PORT` and `BASE_PATH` env vars must be set when running Vite build from a shell (the workflow supplies them automatically).
- Service worker caches the first 7 days only; future days need to be added to `sw.js` or served fresh when online.
- Days are loaded from `public/data/days/day_###.json`; the app falls back to a generated default if a file is missing.

## Pointers

- See the `react-vite` skill if the app later needs routing or backend integration.
- See the `pnpm-workspace` skill for workspace structure and shared libraries.
