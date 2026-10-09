# syntax=docker/dockerfile:1.7

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
RUN pnpm dlx turbo@$(node -p "require('./package.json').devDependencies.turbo") prune api --docker

FROM base AS build
# Toolchain for native modules (bcrypt) when no prebuilt binary is available.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY --from=prune /repo/out/json/ .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm install --frozen-lockfile --store-dir /pnpm/store
COPY --from=prune /repo/out/full/ .
RUN pnpm turbo run build --filter api
# Self-contained copy of `api` with production deps only; workspace packages
# are copied into its node_modules instead of symlinked.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm --filter api deploy --prod --legacy --store-dir /pnpm/store /prod/api

FROM ${NODE_IMAGE} AS runtime
ARG GIT_SHA=unknown
ENV NODE_ENV=production
ENV SERVICE_VERSION=$GIT_SHA
WORKDIR /app
COPY --from=build --chown=node:node /prod/api/package.json ./
COPY --from=build --chown=node:node /prod/api/node_modules ./node_modules
COPY --from=build --chown=node:node /prod/api/dist ./dist
USER node
EXPOSE 3001 3002
CMD ["node", "--require", "./dist/instrumentation", "dist/main"]
