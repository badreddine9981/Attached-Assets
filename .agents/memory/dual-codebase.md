---
name: Dual Codebase Layout
description: The project has both a vanilla JS app and an unused React scaffold — all real code is in public/js/.
---

**Rule:** All app logic lives in `public/js/` (vanilla JS) and is loaded by `index.html` via `<script>` tags. The `src/` directory is a React/TypeScript scaffold that is NOT used by the running app.

**Why:** Vite's `root` is the artifact directory. `index.html` at the root loads `css/style.css` and `js/*.js` from the `public/` folder. The React files in `src/` are never bundled or executed in the current setup.

**How to apply:** When fixing bugs or adding features, edit files in `public/js/app.js`, `public/js/storage.js`, `public/css/style.css`, and `index.html`. Do not edit files under `src/` for app logic — they have no effect.
