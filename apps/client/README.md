# Client

This package contains the Next.js client for Decent Debates.

## Environment files

| File | Tracked | Purpose |
|------|---------|---------|
| `.env.development` | yes | API and WebSocket URLs for local dev |
| `.env.test.local` | no | E2E test credentials (copy from `.env.test.local.example`) |
| `.env.production.local` | no | API and WebSocket URLs for a local production build (copy from `.env.production.local.example`) |

### Setup

```bash
# Ensure you're in the apps/client directory.

cp .env.development.example .env.development

cp .env.test.local.example .env.test.local
# Then fill in E2E_USERNAME and E2E_PASSWORD in .env.test.local

cp .env.production.local.example .env.production.local
# Then fill in the URLs in .env.production.local (used when running a local production build)
```

## Development

From the repo root:

```bash
pnpm run dev
```

To run only the client:

```bash
pnpm --filter client run dev
```

Open `http://localhost:3000` in your browser.

## E2E tests

Playwright does **not** start any servers. Before running the suite:

1. Start the full stack from the repo root — `pnpm run dev` (or `pnpm run start:prod:local` for a production build). The client must be reachable at `http://localhost:3000` and the API at the URL in `.env.test.local`.
2. Seed the database — `pnpm run seed` from the root. The specs rely on seed data (e.g. the `history` tag) and on the accounts configured below.
3. Fill in `.env.test.local` (copy from `.env.test.local.example`): `E2E_USERNAME`, `E2E_PASSWORD`, `E2E_MODERATOR_USERNAME`, `E2E_MODERATOR_PASSWORD`, `NEXT_PUBLIC_API_SERVER_URL`.

Then, from the `apps/client` directory:

```bash
pnpm test:e2e
```

(The API E2E suite, `pnpm --filter api test:e2e`, is self-contained by contrast — it starts Docker and bootstraps the app in-process, so it needs no running server.)
