---
name: Service Worker Caching
description: The app's SW aggressively caches all JS/CSS files; how to bust it after code changes.
---

`public/sw.js` caches every JS and CSS file under `CACHE_NAME = 'neworldody-vN'`.

**Rule:** Any time JS or CSS files change, bump `CACHE_NAME` to the next version (e.g. v2 → v3). This triggers SW `activate` to delete the old cache and the browser fetches fresh files.

**Why:** The SW `fetch` handler returns cached files for all non-`/data/` requests. Without a version bump, users (and the screenshot tool's headless browser) keep loading stale code indefinitely — even after a server restart or `Cache-Control: no-store` headers, because the SW intercepts before the network.

**How to apply:** Before declaring a fix "shipped", bump `CACHE_NAME` in `public/sw.js`. Pair it with incrementing `?vN` query params on the `<script>` tags in `index.html` so even browsers that haven't activated the new SW yet pick up the new files.
