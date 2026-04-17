# syntax=docker/dockerfile:1.7
# BuildKit required: DOCKER_BUILDKIT=1 or Docker 23+

ARG NODE_VERSION=20
ARG ALPINE_VERSION=3.20

# ─── Base: shared toolchain ───────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base

# libc6-compat: required for some native Node bindings on Alpine
# tini: PID-1 signal handling, zombie reaping (Hoppscotch pattern)
RUN apk add --no-cache libc6-compat tini

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app


# ─── Deps: install all dependencies (layer cached until lockfile changes) ─────
FROM base AS deps

COPY package.json pnpm-lock.yaml ./

# BuildKit cache mount: pnpm store is reused across builds without being committed to the layer
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile


# ─── Builder: compile TypeScript + generate Prisma client ─────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy DATABASE_URL so Prisma generator does not need a live DB at build time
ENV DATABASE_URL="mysql://build:build@build:3306/build"

RUN pnpm prisma generate
RUN pnpm build


# ─── Runner: lean production image ────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS runner

RUN apk add --no-cache libc6-compat tini

WORKDIR /app

# OCI standard labels — injected at build time via --build-arg
ARG BUILD_DATE
ARG GIT_SHA
ARG VERSION="0.0.0"
LABEL org.opencontainers.image.title="nest-admin" \
      org.opencontainers.image.description="企业级后台管理系统" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.version="${VERSION}"

ENV NODE_ENV=production \
    PORT=8001 \
    TZ=Asia/Shanghai

# Copy compiled output and node_modules from builder.
# node_modules is copied as-is to preserve the pnpm virtual store structure
# where the generated Prisma client lives (node_modules/.pnpm/.../.prisma/client).
COPY --from=builder /app/dist         ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY prisma ./prisma

# Startup entrypoint: runs migrations then hands off to CMD
COPY docker/entrypoint.sh ./entrypoint.sh

# Create non-root user and fix ownership in a single layer
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nestjs \
 && chmod +x entrypoint.sh \
 && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 8001

# Health check uses Node itself — no need for wget or curl in the image
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e \
    "require('http').get('http://localhost:8001/health', r => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--", "./entrypoint.sh"]
CMD ["node", "dist/main.js"]