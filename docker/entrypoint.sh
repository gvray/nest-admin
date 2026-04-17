#!/usr/bin/env sh
# Container entrypoint: run Prisma migrations then hand off to CMD.
# Keeps migration logic in one place — works the same in compose, k8s, bare Docker.
set -e

echo "[entrypoint] Running database migrations..."
node_modules/.bin/prisma migrate deploy

echo "[entrypoint] Migrations complete. Starting application..."
exec "$@"
