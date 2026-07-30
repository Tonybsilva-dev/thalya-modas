# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable \
    && corepack prepare pnpm@10.33.0 --activate \
    && pnpm config set store-dir /pnpm/store

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

RUN apk add --no-cache python3 make g++
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @thalya-modas/api...

FROM base AS development

COPY apps/api ./apps/api

WORKDIR /workspace/apps/api

EXPOSE 3000

CMD ["pnpm", "dev"]

FROM base AS build

COPY apps/api ./apps/api

RUN pnpm --filter @thalya-modas/api build
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm --filter @thalya-modas/api deploy \
    --prod --legacy /opt/thalya-api
RUN cd /opt/thalya-api \
    && /workspace/apps/api/node_modules/.bin/prisma generate \
    --schema prisma/schema.prisma

FROM node:22-alpine AS runtime

RUN apk add --no-cache dumb-init libstdc++ \
    && addgroup -S thalya \
    && adduser -S thalya -G thalya

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build --chown=thalya:thalya /opt/thalya-api ./

USER thalya

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app/http/server.js"]
