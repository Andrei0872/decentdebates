# syntax=docker/dockerfile:1.7
# Build from the repo root: docker build -f packages/db/Dockerfile .
# One-off image: runs pending migrations and exits.

ARG NODE_IMAGE=node:24.21.0-bookworm-slim

FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo

# `out/json` holds only manifests + the pruned lockfile (cached install layer),
# `out/full` holds the sources.
FROM base AS prune
COPY . .
# turbo's version comes from the root package.json (pinned exactly there).
RUN pnpm dlx turbo@$(node -p "require('./package.json').devDependencies.turbo") prune @decentdebates/db --docker

FROM base AS build
# Toolchain for native modules (bcrypt) when no prebuilt binary is available.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY --from=prune /repo/out/json/ .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm install --frozen-lockfile --store-dir /pnpm/store
COPY --from=prune /repo/out/full/ .
RUN pnpm turbo run build --filter @decentdebates/db
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm --filter @decentdebates/db deploy --prod --legacy --store-dir /pnpm/store /prod/db

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /prod/db/package.json ./
COPY --from=build --chown=node:node /prod/db/node_modules ./node_modules
COPY --from=build --chown=node:node /prod/db/dist ./dist
USER node
CMD ["node", "node_modules/knex/bin/cli.js", "--knexfile", "dist/knexfile.js", "migrate:latest"]
