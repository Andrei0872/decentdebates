# Client

This package contains the Next.js client for Decent Debates.

## Environment files

| File | Tracked | Purpose |
|------|---------|---------|
| `.env.development` | yes | API and WebSocket URLs for local dev |
| `.env.test.local` | no | E2E test credentials (copy from `.env.test.local.example`) |

### Setup

```bash
# Ensure you're in the apps/client directory.

cp .env.development.example .env.development

cp .env.test.local.example .env.test.local
# Then fill in E2E_USERNAME and E2E_PASSWORD in .env.test.local
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

```bash
# Ensure you're in the apps/client directory.
pnpm test:e2e
```

Playwright starts the dev server automatically if it isn't already running.
