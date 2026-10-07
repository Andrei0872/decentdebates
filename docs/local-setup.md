# Local Setup

## Prerequisites

- Node.js 24 (`.nvmrc`; with nvm: `nvm use`)
- `pnpm`
- `docker`

To test GitHub Actions workflows locally, see [`docs/act.md`](act.md).

## Environment files

### DB

```bash
# Ensure you're in the `packages/db` folder.
cp .env.example .env
```

### API

```bash
# Ensure you're in the `apps/api` directory.
cp .env.example .env
```

For test-specific overrides, create `apps/api/.env.test` from `apps/api/.env.test.example`.

### Client

```bash
# Ensure you're in the `apps/client` directory.

# Dev server URLs (defaults work out of the box).
cp .env.development.example .env.development

# E2E credentials — fill in E2E_USERNAME and E2E_PASSWORD after copying.
cp .env.test.local.example .env.test.local
```

## Spinning up

1. Install dependencies

    ```bash
    pnpm install
    ```

2. Start everything

    ```bash
    pnpm run dev
    ```

    Invokes `docker compose`, builds shared packages, then starts the client and API dev servers.

3. Inspect service logs:

    ```bash
    pnpm run db:logs
    ```

## Developing

### DB schema changes

Reload the Postgres instance with the latest schema:

```bash
pnpm run db:reset
```

### Seeding

```bash
# From the root. Can be run while `pnpm run dev` is active.
pnpm run seed

# Run a specific seed file:
pnpm run seed:file -- 03_debates.js
```

## Documentation

### API (Swagger)

While the API runs in development mode (`pnpm run dev` or `pnpm run dev:api`), Swagger UI is served at [http://localhost:3001/docs](http://localhost:3001/docs) and the raw OpenAPI JSON at [http://localhost:3001/docs-json](http://localhost:3001/docs-json).

The docs are only registered when `NODE_ENV` is unset or `development`.
## Running tests

- **API E2E** (`pnpm --filter api test:e2e`) is self-contained — it starts Docker and bootstraps the NestJS app in-process.
- **Client E2E** (`pnpm --filter client test:e2e`) needs the full stack already running (`pnpm run dev`, or `pnpm run start:prod:local`) and a seeded database. Playwright does not start any server; `apps/client/.env.test.local` must also be filled in.
