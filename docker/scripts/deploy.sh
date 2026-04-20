#!/usr/bin/env bash
# Deploy: pull image from Docker Hub and do a rolling update with health check.
#
# Usage:
#   ./docker/scripts/deploy.sh [options] [command]
#
# Options:
#   -v <tag>   Image tag to deploy (default: latest)
#   -n         Skip docker pull, use local image as-is
#   -h         Show this help
#
# Commands (default: deploy):
#   deploy    Pull image, start MySQL if needed, rolling update with health check
#   seed      Run prisma seed in the running container  [prompts y/N]
#   reset     Destroy all containers + DB volume, then redeploy fresh  [prompts "yes"]
#   rollback  Revert to the previous backup container
#   status    Show running container info
#   logs      Tail container logs
#   stop      Stop the app container
#   restart   Restart the app container
#
# Environment variables (all optional, override via export or .env.production):
#   TAG              Image tag            (default: latest)
#   CONTAINER_NAME   App container name   (default: nest_admin_app)
#   MYSQL_CONTAINER  MySQL container name (default: nest_admin_mysql)
#   MYSQL_DATABASE   MySQL database name  (default: nest_admin)
#   PLATFORM         Docker platform      (default: linux/amd64)

set -euo pipefail

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
MYSQL_CONTAINER="${MYSQL_CONTAINER:-nest_admin_mysql}"
MYSQL_DATABASE="${MYSQL_DATABASE:-nest_admin}"
PLATFORM="${PLATFORM:-linux/amd64}"
TAG="${TAG:-latest}"
NO_PULL=false

# ── Parse flags ───────────────────────────────────────────────────────────────
usage() {
  awk 'NR==1{next} /^[^#]/{exit} {gsub(/^# ?/,""); print}' "$0"
  exit 0
}

while getopts ":v:nh" opt; do
  case $opt in
    v) TAG="$OPTARG" ;;
    n) NO_PULL=true ;;
    h) usage ;;
    :) fatal "Option -$OPTARG requires an argument." ;;
    \?) fatal "Unknown option: -$OPTARG" ;;
  esac
done
shift $((OPTIND - 1))

COMMAND="${1:-deploy}"
FULL_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$(cd "${SCRIPT_DIR}/../../" && pwd)/.env.production"

# ── MySQL ─────────────────────────────────────────────────────────────────────
ensure_mysql() {
  # Parse password and port from DATABASE_URL (mysql://user:pass@host:port/db)
  local db_pass; db_pass=$(echo "${DATABASE_URL}" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
  local db_port; db_port=$(echo "${DATABASE_URL}" | sed -n 's|.*@[^:]*:\([0-9]*\)/.*|\1|p')
  db_port="${db_port:-3306}"

  if docker inspect "$MYSQL_CONTAINER" >/dev/null 2>&1; then
    local state; state=$(docker inspect "$MYSQL_CONTAINER" --format '{{.State.Status}}')
    if [[ "$state" == "running" ]]; then
      ok "MySQL already running (${MYSQL_CONTAINER})."
      return
    fi
    info "Starting existing MySQL container (${MYSQL_CONTAINER})..."
    docker start "$MYSQL_CONTAINER"
  else
    local cnf_mount=()
    local mysql_cnf="${SCRIPT_DIR}/../mysql/my.cnf"
    [[ -f "$mysql_cnf" ]] && cnf_mount=(-v "$(realpath "$mysql_cnf"):/etc/mysql/conf.d/my.cnf:ro")

    info "Starting MySQL container (${MYSQL_CONTAINER})..."
    docker run -d \
      --name    "$MYSQL_CONTAINER" \
      --restart unless-stopped \
      -p "${db_port}:3306" \
      -e MYSQL_ROOT_PASSWORD="${db_pass:-password}" \
      -e MYSQL_DATABASE="${MYSQL_DATABASE}" \
      -v nest_admin_mysql_data:/var/lib/mysql \
      "${cnf_mount[@]}" \
      mysql:8.0 \
        --default-authentication-plugin=mysql_native_password \
        --character-set-server=utf8mb4 \
        --collation-server=utf8mb4_unicode_ci
  fi

  info "Waiting for MySQL to be ready (up to 120s)..."
  local i
  for i in $(seq 1 24); do
    if docker exec "$MYSQL_CONTAINER" \
        mysqladmin ping -h 127.0.0.1 -u root -p"${db_pass:-password}" --silent 2>/dev/null; then
      ok "MySQL ready."
      return
    fi
    sleep 5
  done
  fatal "MySQL did not become ready within 120s."
}

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
  backup=$(docker ps -a --format '{{.Names}}' | grep "${CONTAINER_NAME}_backup_" | sort | tail -1 || true)
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

  [[ ! -f "$ENV_FILE" ]] && fatal ".env.production not found: ${ENV_FILE}"
  set -a; source "$ENV_FILE"; set +a

  [[ -z "${JWT_SECRET:-}"   ]] && fatal "JWT_SECRET is not set in .env.production"
  [[ -z "${DATABASE_URL:-}" ]] && fatal "DATABASE_URL is not set in .env.production"

  printf "\n"
  printf "  ${BOLD}Image     ${NC} %s\n" "${image_tag}"
  printf "  ${BOLD}Platform  ${NC} %s\n" "${PLATFORM}"
  printf "  ${BOLD}Container ${NC} %s\n" "${CONTAINER_NAME}"
  printf "  ${BOLD}Port      ${NC} %s\n" "${PORT:-8001}"
  printf "\n"

  # 1. Ensure MySQL is running before starting the app
  ensure_mysql

  # 2. Pull image (skip with -n to use locally built image)
  if $NO_PULL; then
    docker image inspect "$image_tag" >/dev/null 2>&1 \
      || fatal "No local image found: ${image_tag} (run build.sh first)"
    info "Skipping pull — using local image: ${image_tag}"
  else
    info "Pulling ${image_tag} (${PLATFORM})..."
    if ! docker pull --platform "$PLATFORM" "$image_tag" 2>/dev/null; then
      docker image inspect "$image_tag" >/dev/null 2>&1 \
        && warn "Pull failed — using local image: ${image_tag}" \
        || fatal "Pull failed and no local image found: ${image_tag}"
    fi
  fi

  # 3. Stop existing container first (frees the port), then rename as backup
  local prev_container="" prev_image=""
  if docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
    local ts; ts=$(date +%Y%m%d_%H%M%S)
    prev_container="${CONTAINER_NAME}_backup_${ts}"
    prev_image=$(docker inspect "$CONTAINER_NAME" --format '{{.Config.Image}}')
    docker stop   "$CONTAINER_NAME"
    docker rename "$CONTAINER_NAME" "$prev_container"
    ok "Backed up previous container as ${prev_container}"
  fi

  # 4. Start new container
  local health_url="http://localhost:${PORT:-8001}/health"
  info "Starting new container..."
  docker run -d \
    --name    "$CONTAINER_NAME" \
    --platform "$PLATFORM" \
    --restart unless-stopped \
    -p "${PORT:-8001}:${PORT:-8001}" \
    -e NODE_ENV="${NODE_ENV:-production}" \
    -e DATABASE_URL="$DATABASE_URL" \
    -e PORT="${PORT:-8001}" \
    -e JWT_SECRET="$JWT_SECRET" \
    -e JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-7d}" \
    -e ENABLE_CORS="${ENABLE_CORS:-false}" \
    "$image_tag"

  # 5. Health check: retry every 5s for up to 60s
  local healthy=false i
  ok "Waiting for health check at ${health_url} (60s timeout)..."
  for i in $(seq 1 12); do
    if curl -sf --max-time 5 "$health_url" >/dev/null 2>&1; then
      ok "Health check passed (attempt ${i})!"
      healthy=true
      break
    fi
    sleep 5
  done

  # 6. Rollback on failure
  if [[ "$healthy" != "true" ]]; then
    warn "Health check failed. Rolling back..."
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm   "$CONTAINER_NAME" 2>/dev/null || true
    if [[ -n "$prev_container" ]]; then
      docker rename "$prev_container" "$CONTAINER_NAME"
      docker start  "$CONTAINER_NAME"
      fatal "Rolled back to ${prev_image}. Check: docker logs ${CONTAINER_NAME}"
    else
      fatal "Health check failed. No previous container — manual intervention required."
    fi
  fi

  # 7. Clean up old backup containers (keep 3 most recent)
  local backups; backups=$(docker ps -a --format '{{.Names}}' \
    | grep "${CONTAINER_NAME}_backup_" | sort || true)
  local bcount=0
  [[ -n "$backups" ]] && bcount=$(echo "$backups" | wc -l | tr -d ' ')
  if [[ $bcount -gt 3 ]]; then
    echo "$backups" | head -n $((bcount - 3)) | xargs docker rm -f 2>/dev/null || true
  fi
  docker image prune -f >/dev/null

  printf "\n"
  ok "Deployed  → ${image_tag}"
  ok "Health    → ${health_url}"
}

_run_seed() {
  docker inspect "$CONTAINER_NAME" >/dev/null 2>&1 \
    || fatal "Container '${CONTAINER_NAME}' is not running. Run deploy first."
  info "Running prisma seed in ${CONTAINER_NAME}..."
  docker exec "$CONTAINER_NAME" node dist/prisma/seed.js
  ok "Seed complete."
}

cmd_seed() {
  printf "\n"
  printf "  ${YELLOW}${BOLD}WARNING: Seed inserts initial data into the database.${NC}\n"
  printf "  ${YELLOW}Running on a non-empty DB may cause duplicate/conflict errors.${NC}\n"
  printf "\n"
  printf "  Continue? [y/N] "
  read -r reply || true
  [[ "$reply" != "y" && "$reply" != "Y" ]] && { info "Aborted."; exit 0; }
  _run_seed
}

cmd_reset() {
  [[ ! -f "$ENV_FILE" ]] && fatal ".env.production not found: ${ENV_FILE}"
  set -a; source "$ENV_FILE"; set +a

  printf "\n"
  printf "  ${RED}${BOLD}!! DANGER — DESTRUCTIVE OPERATION !!${NC}\n"
  printf "\n"
  printf "  ${RED}The following will be permanently destroyed:${NC}\n"
  printf "  ${RED}  • App container  : ${CONTAINER_NAME} (+ all backups)${NC}\n"
  printf "  ${RED}  • MySQL container: ${MYSQL_CONTAINER}${NC}\n"
  printf "  ${RED}  • MySQL volume   : nest_admin_mysql_data${NC}\n"
  printf "  ${RED}  • ALL DATABASE DATA WILL BE LOST${NC}\n"
  printf "\n"
  printf "  Then redeploy + optionally seed from scratch.\n"
  printf "\n"
  printf "  Type ${BOLD}\"yes\"${NC} to confirm: "
  read -r reply || true
  [[ "$reply" != "yes" ]] && { info "Aborted."; exit 0; }

  info "Removing app containers..."
  docker ps -a --format '{{.Names}}' \
    | grep -E "^${CONTAINER_NAME}(_backup_|$)" \
    | xargs -r docker rm -f 2>/dev/null || true

  info "Removing MySQL container..."
  docker stop "$MYSQL_CONTAINER" 2>/dev/null || true
  docker rm   "$MYSQL_CONTAINER" 2>/dev/null || true

  info "Removing MySQL data volume..."
  docker volume rm nest_admin_mysql_data 2>/dev/null || true

  ok "Destroyed. Starting fresh deploy..."
  printf "\n"
  cmd_deploy

  printf "\n"
  printf "  Run database seed? [y/N] "
  read -r seed_reply || true
  if [[ "$seed_reply" == "y" || "$seed_reply" == "Y" ]]; then
    _run_seed
  fi
}

# ── Dispatch ──────────────────────────────────────────────────────────────────
case "$COMMAND" in
  deploy)   cmd_deploy ;;
  seed)     cmd_seed ;;
  reset)    cmd_reset ;;
  rollback) cmd_rollback ;;
  status)   cmd_status ;;
  logs)     cmd_logs ;;
  stop)     cmd_stop ;;
  restart)  cmd_restart ;;
  *) fatal "Unknown command: $COMMAND\n  Use: deploy | seed | reset | rollback | status | logs | stop | restart" ;;
esac
