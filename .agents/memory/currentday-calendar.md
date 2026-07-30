---
name: currentDay Calendar Fix
description: How currentDay must be computed so the app always opens today's project day.
---

**Rule:** `currentDay = Storage.getCalendarDay()` — always today's calendar day relative to `startDate`. Never cap it by `highestDay` or any "next unread" formula.

**Why:** The original formula `Math.min(calendarDay, (highestDay||0)+1)` was designed for sequential read-gating, but it caused Day 1 to show whenever `highestDay = 0` (fresh/cleared localStorage). The app is a daily journal — Dodi should always see today's entry regardless of reading history. `highestDay` tracks progress/achievements only; it must not gate which day is displayed.

**How to apply:** In `app.js init()`: `currentDay = Storage.getCalendarDay()`. In `openTodayBook()`: no need to recompute; `currentDay` is already today. `isDayUnlocked(currentDay)` is always true since `currentDay <= calendarDay` by definition.

**Storage side:** `getCalendarDay()` requires `_startDate` to be set first. `setStartDate(dateStr)` must be called in `loadConfig()` after fetching `config.json`. If `_startDate` is null, `getCalendarDay()` falls back to 1 — causing Day 1 to appear.
