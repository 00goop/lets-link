# Let's Link

Let's Link is a social planning application built with a React frontend and an Express + Prisma backend backed by PostgreSQL.

## Project Structure

- `backend/` – Express server, Prisma schema, and API routes.
- `Entities/` – Entity metadata and the frontend API client (`Entities/all.js`).
- `Components/`, `Pages/`, `layout.js` – React application code.
- `docker-compose.yml` – Local development stack for PostgreSQL and the backend API.

## Prerequisites

- Node.js 18+
- npm 9+
- Docker (optional but recommended for local development)

## Backend Setup

```bash
cd backend
npm install
npx prisma generate
```

Create a `.env` file by copying the template:

```bash
cp .env.example .env
```

Update the values as needed. The Prisma schema expects a PostgreSQL database defined by `DATABASE_URL`.

### Database Migration

Generate the initial migration and apply it to your database:

```bash
cd backend
npx prisma migrate dev --name init
```

### Running the Backend

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:4000`.

## Docker Compose

To start PostgreSQL and the backend together:

```bash
docker-compose up --build
```

This will expose PostgreSQL on port `5432` and the API on port `4000`.

## Frontend API Client

The frontend interacts with the backend through the dynamic entity clients exported from `Entities/all.js`. Each entity exposes common helpers such as:

- `list(sort?)`
- `filter(filters, sort?)`
- `get(id)`
- `create(payload)`
- `update(id, payload)`
- `delete(id)`

The `User` client adds helpers for authentication and profile management: `login`, `register`, `logout`, `me`, and `updateMyUserData`.

The API base URL defaults to `http://localhost:4000` and can be overridden with the `VITE_API_URL` (Vite), `REACT_APP_API_URL`, or by setting `window.__LETS_LINK_API__` at runtime.

## OpenAPI Specification

The REST contract for the backend lives in `backend/openapi.yaml`. It documents authentication, CRUD routes for all entities, and request/response schemas.

## Authentication & Authorization

- JWT-based authentication via `/auth/register` and `/auth/login`.
- Every protected route expects a `Bearer` token in the `Authorization` header.
- Route-level logic enforces row-level security rules similar to those defined in the entity metadata.

## Helpful Scripts

- `npm run dev` – Start the backend with hot reloading.
- `npm run start` – Start the backend in production mode.
- `npm run migrate` – Apply Prisma migrations (`prisma migrate deploy`).

## Health Check

A simple health endpoint is available at `GET /health`.

---

For questions or improvements, reach out to @00goop.
