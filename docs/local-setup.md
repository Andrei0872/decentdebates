# Local Setup

## Prerequisites

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
