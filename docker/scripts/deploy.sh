#!/usr/bin/env bash
# Deploy: pull image from Docker Hub and do a rolling update with health check.
#
# Usage:
#   ./docker/scripts/deploy.sh [options] [command]
#
# Options:
#   -v <tag>   Image tag to deploy: git-sha, semver, or latest (default: latest)
#   -h         Show this help
#
# Commands (default: deploy):
#   deploy    Pull image and do a rolling update
#   rollback  Revert to the previous version
#   status    Show running container info
#   logs      Tail container logs
#   stop      Stop the container
#   restart   Restart the container
#
# Environment variables:
#   TAG            Image tag to deploy   (default: latest)
#   CONTAINER_NAME App container name    (default: nest_admin_app)
#   NETWORK        Docker network        (default: nest-admin_backend)
#   HEALTH_URL     Default: http://localhost:8001/health

set -euo pipefail

# ── Colors ($'...' embeds the ESC byte directly — no echo/printf interpretation needed) ──
RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'
CYAN=$'\033[0;36m'; BOLD=$'\033[1m'; NC=$'\033[0m'
info()  { printf "${CYAN}${BOLD}[deploy]${NC} %s\n" "$*"; }
ok()    { printf "${GREEN}${BOLD}[deploy]${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}${BOLD}[deploy]${NC} %s\n" "$*"; }
fatal() { printf "${RED}${BOLD}[deploy]${NC} %b\n" "$*" >&2; exit 1; }

# ── Config ────────────────────────────────────────────────────────────────────
IMAGE_NAME="nest-admin"
REGISTRY="${DOCKER_REGISTRY:-docker.io}"
NAMESPACE="${DOCKER_NAMESPACE:-gvray}"
CONTAINER_NAME="${CONTAINER_NAME:-nest_admin_app}"
NETWORK="${NETWORK:-nest-admin_backend}"
PLATFORM="${PLATFORM:-linux/amd64}"
TAG="${TAG:-latest}"

HEALTH_URL="${HEALTH_URL:-http://localhost:8001/health}"

# ── Parse flags ───────────────────────────────────────────────────────────────
usage() {
  awk 'NR==1{next} /^[^#]/{exit} {gsub(/^# ?/,""); print}' "$0"
  exit 0
}

while getopts ":v:h" opt; do
  case $opt in
    v) TAG="$OPTARG" ;;
    h) usage ;;
    :) fatal "Option -$OPTARG requires an argument." ;;
    \?) fatal "Unknown option: -$OPTARG" ;;
  esac
done
shift $((OPTIND - 1))

COMMAND="${1:-deploy}"
FULL_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}"
ENV_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../" && pwd)/.env.production"

# ── Commands ──────────────────────────────────────────────────────────────────
cmd_status() {
  docker ps --filter "name=${CONTAINER_NAME}" \
    --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
}

cmd_logs() {
  docker logs -f "$CONTAINER_NAME"
}

cmd_stop() {
  info "Stopping ${CONTAINER_NAME}..."
  docker stop "$CONTAINER_NAME"
  ok "Stopped."
}

cmd_restart() {
  info "Restarting ${CONTAINER_NAME}..."
  docker restart "$CONTAINER_NAME"
  ok "Restarted."
}

cmd_rollback() {
  info "Rolling back..."
  local backup
  backup=$(docker ps -a --format '{{.Names}}' | grep "${CONTAINER_NAME}_backup_" | sort | tail -1)
  [[ -z "$backup" ]] && fatal "No backup container found."
  local prev_image
  prev_image=$(docker inspect "$backup" --format '{{.Config.Image}}')
  info "Restoring: ${prev_image}"
  docker stop   "$CONTAINER_NAME" 2>/dev/null || true
  docker rm     "$CONTAINER_NAME" 2>/dev/null || true
  docker rename "$backup"         "$CONTAINER_NAME"
  docker start  "$CONTAINER_NAME"
  ok "Rollback done → ${prev_image}"
}

cmd_deploy() {
  local image_tag="${FULL_IMAGE}:${TAG}"

  # Load docker/.env into the current shell
  [[ ! -f "$ENV_FILE" ]] && fatal ".env.production not found: ${ENV_FILE}"
  set -a; source "$ENV_FILE"; set +a

  [[ -z "${JWT_SECRET:-}"    ]] && fatal "JWT_SECRET is not set - add it to .env"
  [[ -z "${DATABASE_URL:-}"  ]] && fatal "DATABASE_URL is not set - add it to .env"

  printf "\n"
  printf "  ${BOLD}Image     ${NC} %s\n" "${image_tag}"
  printf "  ${BOLD}Platform  ${NC} %s\n" "${PLATFORM}"
  printf "  ${BOLD}Container ${NC} %s\n" "${CONTAINER_NAME}"
  printf "  ${BOLD}Port      ${NC} %s\n" "${PORT:-8001}"
  printf "\n"

  info "Pulling ${image_tag} (${PLATFORM})..."
  docker pull --platform "$PLATFORM" "$image_tag"

  # Rename current container (keep running as backup while new one starts)
  local prev_container="" prev_image=""
  if docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
    local ts; ts=$(date +%Y%m%d_%H%M%S)
    prev_container="${CONTAINER_NAME}_backup_${ts}"
    prev_image=$(docker inspect "$CONTAINER_NAME" --format '{{.Config.Image}}')
    docker rename "$CONTAINER_NAME" "$prev_container"
    ok "Backed up container as ${prev_container}"
  fi

  # Parse DATABASE_URL to extract host and port for health check
  local db_host db_port health_url
  db_host=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  db_port=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  health_url="http://localhost:${PORT:-8001}/health"

  # Start new container with port mapping for direct access
  info "Starting new container..."
  docker run -d \
    --name     "$CONTAINER_NAME" \
    --platform "$PLATFORM" \
    --restart  unless-stopped \
    -p "${PORT:-8001}:${PORT:-8001}" \
    -e NODE_ENV="${NODE_ENV:-production}" \
    -e DATABASE_URL="$DATABASE_URL" \
    -e PORT="${PORT:-8001}" \
    -e JWT_SECRET="$JWT_SECRET" \
    -e JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-7d}" \
    -e ENABLE_CORS="${ENABLE_CORS:-false}" \
    "$image_tag"

  # Health check (5s timeout)
  ok "Waiting for health check at ${health_url}..."
  if curl -sf --max-time 5 "$health_url" >/dev/null 2>&1; then
    ok "Health check passed!"
  else
    warn "Health check failed after 5 seconds"
    return 1
  fi

  # Rollback on failure
  if [[ "$healthy" != "true" ]]; then
    warn "Health check failed. Rolling back..."
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm   "$CONTAINER_NAME" 2>/dev/null || true
    if [[ -n "$prev_container" ]]; then
      docker rename "$prev_container" "$CONTAINER_NAME"
      docker start  "$CONTAINER_NAME"
      docker port "$CONTAINER_NAME" "${PORT:-8001}" >/dev/null 2>&1 && \
        health_url="http://localhost:${PORT:-8001}/health" || \
        health_url="http://localhost:$(docker port "$CONTAINER_NAME" | grep -o '[0-9]*' | head -1)/health"
      fatal "Rolled back to ${prev_image}. Check: docker logs ${CONTAINER_NAME}"
    else
      fatal "Health check failed. No previous container - manual intervention required."
    fi
  fi

  # Stop backup and clean up
  [[ -n "$prev_container" ]] && { docker stop "$prev_container" 2>/dev/null || true; }

  docker ps -a --format '{{.Names}}' \
    | grep "${CONTAINER_NAME}_backup_" \
    | sort | head -n -3 \
    | xargs -r docker rm -f
  docker image prune -f >/dev/null

  printf "\n"
  ok "Deployed -> ${image_tag}"
  ok "Health check: ${health_url}"
}

# ── Dispatch ──────────────────────────────────────────────────────────────────
case "$COMMAND" in
  deploy)   cmd_deploy ;;
  rollback) cmd_rollback ;;
  status)   cmd_status ;;
  logs)     cmd_logs ;;
  stop)     cmd_stop ;;
  restart)  cmd_restart ;;
  *) fatal "Unknown command: $COMMAND\n  Use: deploy | rollback | status | logs | stop | restart" ;;
esac