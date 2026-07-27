# Neworldody

A premium interactive celestial journey for **Dodi (دودي)**. It is not a website — it is a living universe that opens one page every 24 hours, with a galaxy, a planetary system, a daily gate, and a daily challenge.

## Run & Operate

- `pnpm --filter @workspace/neworldody run dev` — run the web app (path: `/`)
- `PORT=20774 BASE_PATH=/ pnpm --filter @workspace/neworldody run build` — production build
- `pnpm --filter @workspace/api-server run dev` — shared API server (currently unused by this app)
- Required env: none for the frontend (uses localStorage + JSON files). Database is available if the backend is ever needed.

## Stack

- pnpm workspaces, Node.js 24, Vite 7
- Frontend: plain HTML5, CSS3, vanilla JavaScript (no frameworks)
- Data: JSON files in `public/data/`
- Persistence: `localStorage` for progress, settings, achievements, soul answers, dreams, and audio preferences
- PWA: `manifest.json` + `sw.js` for offline use
- Audio: Web Audio API generated ambient music and sound effects (no external audio files)
- Fonts: Aref Ruqaa, IBM Plex Sans Arabic, Cinzel via Google Fonts

## Where things live

- `artifacts/neworldody/index.html` — four pages (galaxy, planets, gate, challenge) + reading book + modals
- `artifacts/neworldody/public/css/style.css` — luxury cosmic styling, RTL Arabic, animations, responsive
- `artifacts/neworldody/public/js/app.js` — page orchestration, planets, gate, challenge, reading, modals, events
- `artifacts/neworldody/public/js/storage.js` — `localStorage` progress, achievements, challenges, soul, dreams, audio settings
- `artifacts/neworldody/public/js/sky.js` — deterministic galaxy, stars, moon, meteors for every scene and day
- `artifacts/neworldody/public/js/audio.js` — Web Audio API music and SFX, consent, volume, music/effects toggles
- `artifacts/neworldody/public/data/config.json` — app config and planet definitions
- `artifacts/neworldody/public/data/challenges.json` — daily challenges
- `artifacts/neworldody/public/data/achievements.json` — achievement definitions
- `artifacts/neworldody/public/data/events.json` — birthday, new year, anniversary, custom events
- `artifacts/neworldody/public/data/soul.json` — soul mirror questions and reflections
- `artifacts/neworldody/public/data/days/day_001.json` … `day_007.json` — first week of daily content
- `artifacts/neworldody/public/manifest.json` — PWA manifest
- `artifacts/neworldody/public/sw.js` — offline cache

## Architecture decisions

- Plain vanilla JS instead of frameworks because the experience is a single cinematic document with heavy CSS animations and no routing.
- All content lives in JSON files so days, challenges, and achievements can be authored without touching code.
- Unlock logic is calendar-day based with a midnight countdown; the next page becomes available at the next midnight after the current page is read.
- Every day gets a deterministic, unique sky generated from the day number.
- Audio is generated in-browser using the Web Audio API to avoid external file dependencies and keep the app lightweight and offline-capable.
- The app is intentionally frontend-only and offline-first; no backend or database is needed for the first 7 days.

## Product

- **Galaxy page**: slow spiral galaxy, nebula, twinkling stars, shooting stars, golden title. Tap to enter the planetary system.
- **Planetary system**: six planets orbiting a golden star, each representing a section (Messages, Wisdom, Soul, Achievements, Surprises, Dreams).
- **Today's Gate**: luxury golden hourglass with real falling-sand animation, countdown to next midnight, auto-unlock after 24 hours.
- **Today's Challenge**: one daily challenge with completion animation, unlocks a star, increases progress.
- **Living Book**: the original reading experience with 5 daily cards, special occasions, and a unique sky.
- **Living Star Map**: visual grid of unlocked days.
- **Mirror of the Soul**: daily reflective question with saved answers.
- **Achievement System**: unlockable achievements based on progress, challenges, and stars.
- **Special Events**: birthday, new year, anniversary, monthly milestones, custom events.
- **Audio**: per-page ambient music, sound effects, music/effects toggles, volume control, and first-visit consent.

## User preferences

- Built for Dodi (دودي) — personal, intimate tone; every page reads like a gift.
- No generic motivational clichés; content is specific, calm, and human.

## Gotchas

- The `PORT` and `BASE_PATH` env vars must be set when running Vite build from a shell (the workflow supplies them automatically).
- Service worker caches the first 7 days of content; future days need to be added to `sw.js` or served fresh when online.
- In development, Vite may log a WebSocket HMR warning through the Replit proxy; this is a dev-only visual artifact and does not affect the built PWA.
- The birthday event defaults to `01-01` in `data/events.json`; change it to Dodi's actual birthday for real use.

## Pointers

- See the `react-vite` skill if the app later needs routing or backend integration.
- See the `pnpm-workspace` skill for workspace structure and shared libraries.
