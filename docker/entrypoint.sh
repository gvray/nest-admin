#!/usr/bin/env sh
# Container entrypoint
#
# Startup sequence:
#   1. Schema sync
#      - prisma/migrations/ has files → prisma migrate deploy  (production)
#      - no migration files           → prisma db push         (first-run / dev)
#   2. Auto-seed on fresh database
#      - user table empty → run dist/prisma/seed.js once
#      - users exist      → skip (already seeded)
#   3. Start application

set -e

MIGRATIONS_DIR="prisma/migrations"

# ── 1. Schema ─────────────────────────────────────────────────────────────────
if [ -d "$MIGRATIONS_DIR" ] && [ -n "$(ls -A "$MIGRATIONS_DIR" 2>/dev/null)" ]; then
  echo "[entrypoint] Running prisma migrate deploy..."
  node_modules/.bin/prisma migrate deploy
else
  echo "[entrypoint] No migrations found — running prisma db push..."
  node_modules/.bin/prisma db push --accept-data-loss
fi

# ── 2. Auto-seed (first run only) ─────────────────────────────────────────────
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count()
  .then(n => process.stdout.write(String(n)))
  .catch(() => process.stdout.write('0'))
  .finally(() => p.\$disconnect());
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  echo "[entrypoint] Fresh database — running seed..."
  if [ "${NODE_ENV}" = "development" ]; then
    node_modules/.bin/ts-node prisma/seed.ts
  else
    node dist/prisma/seed.js
  fi
  echo "[entrypoint] Seed complete."
else
  echo "[entrypoint] Database already seeded (${USER_COUNT} users) — skipping."
fi

# ── 3. Start ──────────────────────────────────────────────────────────────────
echo "[entrypoint] Starting application..."
exec "$@"
