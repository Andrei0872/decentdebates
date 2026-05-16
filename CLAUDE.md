# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

Monorepo with `pnpm` workspaces and Turborepo.

- `apps/client` — Next.js frontend
- `apps/api` — NestJS backend
- `packages/db` — Postgres schema, Knex seeds, DB bootstrapping (`DbModule` imported by the API)
- `packages/shared-types` — Cross-app TypeScript contracts (no app code allowed here)
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

# Reset the DB (wipes volumes and restarts Postgres)
pnpm run db:reset
```

### Running tests

```bash
# API — unit (from apps/api or root)
pnpm --filter api test:unit

# API — integration (requires Docker; starts it automatically)
pnpm --filter api test:integration

# API — integration only (Docker must already be running)
pnpm --filter api test:integration:only

# Client — unit
pnpm --filter client test:unit

# Client — unit in watch mode
pnpm --filter client test:unit:watch

# Client — E2E (Playwright)
pnpm --filter client test:e2e
```

Unit spec files: `*.spec.ts` (under `src/`). Integration spec files: `*.int-spec.ts` (under `test/integration/`).

## Environment files

| File | Purpose |
|---|---|
| `packages/db/.env` | Local Postgres connection (copy from `.env.example`) |
| `apps/api/.env` | API config incl. `COOKIE_SECRET` (copy from `.env.example`) |
| `apps/api/.env.test` | Test overrides for integration tests (copy from `.env.test.example`) |
| `apps/client/.env.development` | Dev server URLs |
| `apps/client/.env.test.local` | E2E credentials (fill in after copying) |

## Architecture

### API (NestJS)

Authentication is session-based (express-session + Redis). `AuthenticateGuard` is registered as a global guard — all routes require authentication by default; use `@Public()` to opt out.

Domain modules under `src/entities/`: `debates`, `review`, `comment`, `moderator`, `notification`, `user`. Each follows the standard NestJS module/controller/service pattern.

`packages/db` is imported as `DbModule` and handles all DB access via raw `pg` queries (no ORM by design — see README research notes).

Real-time notifications are handled via Socket.io (`@nestjs/websockets`) and coordinated through `EventEmitterModule`.

### Client (Next.js + Redux)

State is managed with Redux Toolkit. Slices live in `src/store/slices/`: `debates.slice.ts`, `moderator.slice.ts`, `user.slice.ts`. `StoreProvider.tsx` and `AuthHydrator.tsx` wrap the app shell.

The rich-text editor throughout the app is Lexical (`@lexical/react`).

Drag-and-drop (argument reordering) uses `react-dnd`.

## Testing conventions

- Prefer integration tests for DB-heavy backend behavior over unit tests.
- Prefer E2E tests for multi-step workflows; don't duplicate coverage already in integration tests.
- Assert on observable behavior, not implementation details.
- Do not rely on specific seed data unless the test is explicitly about seeds.
- Extract DB helper queries into test helpers — don't inline them in specs.
- Keep test doubles minimal; stub only what isn't exercised.
- Reuse existing helpers and factories before adding new ones.

## Logging

- Use the NestJS logger, not `console.log` / `console.error`.
- Successful test runs should produce no routine log output.

## Docs

- When generating or updating documentation, use the codebase as the sole source of truth. Do not mention features, patterns, or capabilities that are not implemented. Do not use inflated or aspirational language to describe what the code does.
