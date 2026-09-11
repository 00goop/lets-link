# Let's Link

Plan an outing around your people. Create a party, share an invitation code,
and calculate a meeting center from locations participants choose to share.
React and Tailwind retain the original purple/pink social-planning identity;
Express provides validated APIs with SQLite persistence.

## Run locally

Use Node.js 22.18+ (the built-in SQLite API is experimental on Node 22).

```bash
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. Create a new account with a 12+ character password.
The API runs on port 4000; Vite proxies `/api` to it. A Gemini key is optional
for core account/party flows and required for AI suggestions. Keys stay server-side.

```bash
npm test
npm run build
```

The tests exercise password verification, cookie sessions, private party access,
invitation capacity and idempotency, shared locations, restart persistence,
cross-origin rejection and geographic edge cases. Normal CI makes no AI calls.

## Architecture

React → Express routes → SQLite users/sessions/parties/members.
Participant locations → shared spherical center → Gemini suggestion service.
See [migration map](docs/migration-map.md) for preserved historical implementations.

| API | Purpose |
|---|---|
| `POST /api/auth/register`, `/login`, `/logout` | Salted scrypt passwords and opaque HttpOnly sessions |
| `GET/PATCH /api/users/me` | Current account/profile |
| `GET/POST /api/parties` | Member-scoped list and party creation |
| `POST /api/parties/join` | Join using an invitation code |
| `GET /api/parties/:id` | Member-authorized party detail |
| `PATCH /api/parties/:id/location` | Update only the caller's shared location |
| `POST /api/venues/recommend` | Compute center from stored member locations, then request suggestions |

## Engineering decisions and limits

- A weighted spherical center handles the international date line; it does not
  guarantee equidistant journeys or minimize travel time. The algorithm is shared
  by client and server, independently inspectable, and tested without an LLM.
- Gemini suggestions are unverified; the service does not certify venue existence,
  opening hours or availability. Confirm a venue before traveling.
- Core accounts, profiles, parties and memberships are server-persisted. Polls,
  photos, and friend drafts remain browser-local supporting features; they are
  not a shared real-time collaboration service. UI state refreshes every 10 seconds.
- Old localStorage accounts are not migrated automatically because the original
  login did not verify passwords. Create a new account explicitly.
- SQLite requires a persistent disk and a single application instance. Configure
  `HOST`, `ALLOWED_ORIGIN`, HTTPS and `NODE_ENV=production` before hosting. There is
  no verified public deployment, password recovery, email verification, or distributed
  rate limiter. Invitation codes grant party membership; share them deliberately.
- Historical role: full-stack lead at Emory Hacks, as stated in the supplied resume.
  Current modernization adds separately tested backend behavior; do not describe
  these later additions as verified hackathon-era implementation.
