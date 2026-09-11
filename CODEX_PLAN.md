# Let's Link modernization

## Current state

Root Vite entry imports `App.jsx` but Git tracks `app.jsx`, which fails on Linux.
The 2,000+ line root app is functional compared with the static `src/pages` mockups
and nested default Vite starter. Root app stores accounts and parties in localStorage;
login ignores the password. The Express backend only proxies Gemini. Geographic
center uses arithmetic longitude averaging, incorrect across the date line.

## Plan

Preserve the working root UI and unique legacy sources. Separate retired generations
under `legacy/` with a migration map. Add SQLite-backed sessions, users, parties and
memberships behind validated APIs; wire the existing UI's core flows to those APIs.
Keep photos/polls/friend drafts explicitly local until server replacements are tested.
Extract a shared spherical weighted center with edge-case tests. Add CI, architecture,
honest limitations, accessible errors and visually distinct social-planning polish.

## Acceptance and risk

- [x] Trace canonical entry and historical generations.
- [x] Fix case-sensitive import and preserve legacy map.
- [x] Test password verification, session persistence, authorization, party create/join and location updates.
- [x] Test geographic center at ordinary locations, date line, invalid input and antipodes.
- [x] Wire and build core UI; inspect desktop/mobile.
  Verified account creation, party creation, refreshed session, and responsive layout.
- [ ] Publish PR and verify GitHub CI.

Risk: existing browser-only data is not silently migrated into shared accounts.
SQLite is for one server instance with a persistent disk. Local supplementary features
must not be represented as real-time shared functionality. A weighted geographic
center is not an equal-travel-time solution.
