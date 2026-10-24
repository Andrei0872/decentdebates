# Local Setup

## Prerequisites

- Node.js 24 (`.nvmrc`; with nvm: `nvm use`)
- `pnpm`
- `docker`

To test GitHub Actions workflows locally, see [`docs/act.md`](act.md).

## Environment files

Each package loads its own env files with [dotenv-flow](https://github.com/kerimdzhanov/dotenv-flow) and validates them with Zod in its `config.ts` (`packages/db/src/config.ts`, `apps/api/src/config.ts`, `apps/notification-worker/src/config.ts`). The client uses Next.js's built-in loading and validates in `apps/client/src/env.ts`.

Precedence, highest first: real environment variables, `.env.{NODE_ENV}.local`, `.env.{NODE_ENV}`, `.env.local`, `.env`. `NODE_ENV` defaults to `development`. In `test`, `.env.local` is skipped.

Everything is committed except `.env*.local`, which holds secrets and personal overrides. The only required one is the API's cookie secret:

```bash
echo "COOKIE_SECRET=$(openssl rand -base64 32)" > apps/api/.env.local
```

The dev Postgres credentials in `packages/db/.env` (including `POSTGRES_PASSWORD`) are dev-only: they only reach the local compose Postgres and the test databases. A deployment supplies its own as real env vars. To use other ones (e.g. an existing volume), put them in `packages/db/.env.local`; docker compose reads that file too.

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

The docs are only registered when `NODE_ENV` is `development` (the default when unset).
## Running tests

- **API E2E** (`pnpm --filter api test:e2e`) is self-contained — it starts Docker and bootstraps the NestJS app in-process.
- **Client E2E** (`pnpm --filter client test:e2e`) needs the full stack already running (`pnpm run dev`, or `pnpm run start:prod:local`) and a seeded database. The E2E credentials are the seed accounts, committed in `apps/client/.env.test`.

## Observability and load testing

The o11y stack (OTel Collector, Prometheus, Loki, Tempo, Grafana and the exporters) runs in the prod-local compose project. It uses the same host ports as dev, so stop dev first (`pnpm run docker:down`).

```bash
# API and notification worker in containers, plus the o11y stack
pnpm run start:prod:containers -d --wait

pnpm run docker:prod-local:down
```

- Grafana: [http://localhost:3030](http://localhost:3030), user `admin`, password `admin` (or `GRAFANA_ADMIN_PASSWORD`). Dashboards are provisioned from `infra/o11y/grafana/dashboards/` into the DecentDebates folder and can't be edited in the UI; change the JSON files instead.
- Prometheus: [http://localhost:9090](http://localhost:9090).
- On Docker Desktop, node-exporter and cAdvisor report its Linux VM, not the Mac.

### k6

Install k6 with `brew install k6`. Load tests run against the load-test seed, which replaces the regular seed (re-seed when switching back for Playwright):

```bash
pnpm run seed:load
pnpm run k6 load-tests/smoke.js [k6 run flags]
```

Scripts live in `load-tests/`. They target `http://localhost:3001` unless `BASE_URL` is set. `smoke.js` sends 5 requests/s for 1 minute and fails if any check fails: run it first to confirm the target and the metrics pipeline work.

`pnpm run k6` pushes the results to Prometheus via remote write and tags the run with `testid` (`K6_TESTID`, or the script name plus a timestamp). The run appears on the `k6` dashboard, and as a "k6 runs" annotation on the other dashboards.
