#!/usr/bin/env sh
# Container entrypoint: start application directly.
# In production deployment, migrations should be handled separately.

echo "[entrypoint] Starting application..."
exec "$@"
# Force rebuild
