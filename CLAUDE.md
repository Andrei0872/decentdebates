# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

Monorepo with `pnpm` workspaces and Turborepo.

- `apps/client` — Next.js frontend
- `apps/api` — NestJS backend
- `apps/notification-worker` — Headless NestJS worker; consumes BullMQ notification jobs, writes to DB, publishes Redis pub/sub signals
- `packages/db` — Postgres schema, Knex seeds, DB bootstrapping (`DbModule` imported by the API)
- `packages/shared-types` — Cross-app TypeScript contracts (no app code allowed here)
- `packages/telemetry` — OpenTelemetry SDK setup (`initTelemetry`, loaded via each app's `src/instrumentation.ts`), BullMQ telemetry and queue-depth metrics
- `packages/eslint-config` — Shared ESLint config

## Boundaries

- Cross-app contracts belong in `packages/shared-types`, not duplicated between `apps/client` and `apps/api`.
- No imports across apps. Shared code must go through a package.
- All DB-related code belongs in `packages/db`.

## Commands

```bash
# Start everything (spins up Docker, builds packages, starts dev servers)
pnpm run dev

# Start only the API
pnpm run dev:api

# Build all packages/apps
pnpm build

# Lint / format (check)
pnpm lint
pnpm format

# Lint / format (fix)
pnpm lint:fix
pnpm format:fix

# Seed the database
pnpm run seed
pnpm run seed:file -- 03_debates.js   # run a single seed file

# Reset the DB (wipes volumes, restarts Postgres, runs migrations)
pnpm run db:reset

# Migrations (packages/db/migrations; `dev`/`start:prod:local*` run db:migrate first)
pnpm run db:migrate                 # apply pending migrations
pnpm run db:migrate:make -- <name>  # new migration file

# Production builds on the host, against the prod-local compose project's
# Postgres/Redis (same host ports as dev, so stop dev's with `docker:down` first)
pnpm run start:prod:local         # api, notification-worker and client
pnpm run start:prod:local:api     # api and notification-worker only
pnpm run start:prod:local:client  # client only

# api and notification-worker built as Docker images and run in containers
# (compose profile `app`), plus the o11y stack, in the prod-local compose project
pnpm run start:prod:containers

# Compose projects: dev (`decentdebates`), prod-local (`decentdebates-prodlocal`),
# test (`decentdebates-test`, `docker-compose.test.yml`: other host ports, data on tmpfs)
pnpm run docker:up                # dev
pnpm run docker:down              # dev, including profiled services
pnpm run docker:prod-local:up
pnpm run docker:prod-local:down
pnpm run docker:test:up
pnpm run docker:test:down
```

Dockerfiles: `apps/api/Dockerfile`, `apps/notification-worker/Dockerfile` (build context: repo root).

### Running tests

```bash
# Unit tests of every package that has them
pnpm test:unit

# API — unit (from apps/api or root)
pnpm --filter api test:unit

# API — integration (starts the test compose project automatically)
pnpm --filter api test:integration

# API — integration only (`docker:test:up` must already have run)
pnpm --filter api test:integration:only

# Client — unit
pnpm --filter client test:unit

# Client — unit in watch mode
pnpm --filter client test:unit:watch

# API — E2E (bootstraps the app in-process; starts the test compose project automatically -- no running server needed)
pnpm --filter api test:e2e

# Client — E2E (Playwright). Requires the prod-local backend already running
# (`start:prod:local:api` or `start:prod:containers`), seeded, and apps/client/.env.test.local
# filled in. Playwright starts the client itself (`start:prod:local:client`); outside CI it
# reuses whatever already serves :3000.
pnpm --filter client test:e2e
```

Unit spec files: `*.spec.ts` (under `src/`). Integration spec files: `*.int-spec.ts` (under `test/integration/`).

## Environment files

| File | Purpose |
|---|---|
| `packages/db/.env` | Local Postgres connection (copy from `.env.example`) |
| `apps/api/.env` | API config incl. `COOKIE_SECRET` (copy from `.env.example`) |
| `apps/api/.env.test` | Test overrides pointing the API and worker tests at the test compose project (copy from `.env.test.example`; required) |
| `apps/client/.env.development` | Dev server URLs |
| `apps/client/.env.test.local` | E2E credentials (fill in after copying) |

## Architecture

### API (NestJS)

Authentication is session-based (express-session + Redis). `AuthenticateGuard` is registered as a global guard — all routes require authentication by default; use `@Public()` to opt out.

Domain modules under `src/entities/`: `debates`, `review`, `comment`, `moderator`, `notification`, `user`. Each follows the standard NestJS module/controller/service pattern.

`packages/db` is imported as `DbModule` and handles all DB access via raw `pg` queries (no ORM by design — see README research notes).

Real-time notifications use SSE. The API's `NotificationService` subscribes to a Redis pub/sub channel; when the notification worker publishes a message, `NotificationService` pushes it through a shared `Subject<NotificationMessage>` that SSE controllers subscribe to.

### Client (Next.js + Redux)

State is managed with Redux Toolkit. Slices live in `src/store/slices/`: `debates.slice.ts`, `moderator.slice.ts`, `user.slice.ts`. `StoreProvider.tsx` and `AuthHydrator.tsx` wrap the app shell.

The rich-text editor throughout the app is Lexical (`@lexical/react`).

Drag-and-drop (argument reordering) uses `react-dnd`.

## Purpose

Besides shipping the product, this project is a vehicle for learning product and software engineering (e.g. observability, reliability, deployment). Explanations of the why matter as much as the code.

## Working conventions

- Always follow the standard, idiomatic industry practice for the tool or domain, in code, tests and design alike.
  - When the standard approach is unclear, or several approaches are reasonable, don't pick one: ask first, presenting each option with its trade-offs (ups and downs).
- When a prompt contains questions, answer them first, before implementing anything, unless the prompt explicitly says to implement right away.
- In explanations, use common software engineering terminology where it fits (e.g. stopgap, module preloading, red herring, decorator, backpressure) and briefly gloss terms on first use.
- No redundant comments. Default to none; add one only when the why isn't evident from the code: a constraint, an ordering requirement, a trade-off, a workaround.
  - Don't restate what a name or signature already says (e.g. `/** Whether X is enabled. */` above `isXEnabled()`).
  - Don't describe what the code does, narrate framework behavior, or list downstream effects; state only the non-obvious reason, as briefly as possible.
- Run and verify through the scripts in `package.json` / `turbo.json`; don't invoke `node dist/...` or tool binaries directly. If a workflow has no script, say so and propose one.
- Don't write to the dev database (registering users, creating debates) to verify behavior without asking first.

## Testing conventions

- Prefer integration tests for DB-heavy backend behavior over unit tests.
- Prefer E2E tests for multi-step workflows; don't duplicate coverage already in integration tests.
- Assert on observable behavior, not implementation details.
- Do not rely on specific seed data unless the test is explicitly about seeds.
- Extract DB helper queries into test helpers — don't inline them in specs.
- Keep test doubles minimal; stub only what isn't exercised.
- Reuse existing helpers and factories before adding new ones.

## Logging

- Successful test runs should produce no routine log output.

## Docs

- When generating or updating documentation, use the codebase as the sole source of truth. Do not mention features, patterns, or capabilities that are not implemented. Do not use inflated or aspirational language to describe what the code does.
