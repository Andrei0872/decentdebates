# AGENTS.md

## Repo

- Monorepo with `pnpm` workspaces and Turborepo.
- Apps live in `apps/*`.
- Shared code lives in `packages/*`.

## Ownership

- `apps/client`: Frontend.
- `apps/api`: Backend.
- `packages/db`: Schema, seeds, knex config, DB bootstrapping.
- `packages/shared-types`: Cross-app shared types.

## Boundaries

- Do not duplicate cross-app contracts between `apps/client` and `apps/api`. Move them to `packages/shared-types`.
- Do not import app code across apps. Shared code must go through a package.
- Keep DB-related code in `packages/db`.

## Env

- DB env: `packages/db/.env`.
- API env: `apps/api/.env`.
- API test overrides: `apps/api/.env.test` from `apps/api/.env.test.example`.

## Testing

- Prefer integration tests for DB-heavy backend behavior.
- Prefer E2E tests for multi-step workflows. Ensure workflows covered by E2E tests are not duplicated by integration tests.
- Prefer assertions on observable behavior over implementation details.
- Do not rely on incidental seed contents unless the test is explicitly about seeds.
- Do not place helper DB queries inline in integration specs. Extract them into test helpers.
- Keep test doubles minimal. If a dependency is not exercised, use a simple stub.
- New tests should prefer existing helpers and factories before introducing new ones.


## Logging

- Prefer framework logging over raw `console.log` / `console.error`.
- Keep routine logs out of successful test runs.

## Docs

- Local setup: [Spinning up the application](./readme.md#spinning-up-the-application).
