#!/usr/bin/env bash
# Build, tag, and optionally push/scan the production Docker image.
#
# Usage:
#   ./docker/scripts/build.sh [options]
#
# Options:
#   -v <version>   Extra semver tag (e.g. 1.2.3). Always tagged: <git-sha> + latest
#   -m             Multi-arch build (linux/amd64,linux/arm64) — forces push
#   -p             Push to registry (images go to hub, not loaded locally)
#   -s             Security scan with Trivy after build
#   -c             Clean buildx cache before build
#   -h             Show this help

set -euo pipefail

# ── Colors ($'...' embeds the ESC byte directly — no echo/printf interpretation needed) ──
RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'
CYAN=$'\033[0;36m'; BOLD=$'\033[1m'; NC=$'\033[0m'
info()  { printf "${CYAN}${BOLD}[build]${NC} %s\n" "$*"; }
ok()    { printf "${GREEN}${BOLD}[build]${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}${BOLD}[build]${NC} %s\n" "$*"; }
fatal() { printf "${RED}${BOLD}[build]${NC} %b\n" "$*" >&2; exit 1; }

# ── Config ────────────────────────────────────────────────────────────────────
IMAGE_NAME="nest-admin"
REGISTRY="${DOCKER_REGISTRY:-docker.io}"
NAMESPACE="${DOCKER_NAMESPACE:-gvray}"
VERSION="${VERSION:-}"
PLATFORM="${PLATFORM:-linux/amd64}"
BUILDER="${BUILDER:-nest-admin-builder}"

# Flags — overridden by getopts below
MULTI_ARCH=false
PUSH=false
SCAN=false
CLEAN=false

GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || printf "unknown")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD  2>/dev/null || printf "unknown")
BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# ── Parse flags ───────────────────────────────────────────────────────────────
usage() {
  awk 'NR==1{next} /^[^#]/{exit} {gsub(/^# ?/,""); print}' "$0"
  exit 0
}

while getopts ":v:mpsch" opt; do
  case $opt in
    v) VERSION="$OPTARG" ;;
    m) MULTI_ARCH=true ;;
    p) PUSH=true ;;
    s) SCAN=true ;;
    c) CLEAN=true ;;
    h) usage ;;
    :) fatal "Option -$OPTARG requires an argument." ;;
    \?) fatal "Unknown option: -$OPTARG" ;;
  esac
done

# Multi-arch can only go to a registry
if $MULTI_ARCH && ! $PUSH; then
  warn "Multi-arch requires a registry push. Enabling -p automatically."
  PUSH=true
fi

$MULTI_ARCH && PLATFORM="linux/amd64,linux/arm64"
FULL_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}"

# ── Collect tags ──────────────────────────────────────────────────────────────
# Always: :<git-sha>  +  :latest
# If -v given: also :<version>  → 3 tags total
TAG_FLAGS=(
  "--tag" "${FULL_IMAGE}:${GIT_COMMIT}"
  "--tag" "${FULL_IMAGE}:latest"
)
BUILT_TAGS=(
  "${FULL_IMAGE}:${GIT_COMMIT}"
  "${FULL_IMAGE}:latest"
)
if [[ -n "$VERSION" ]]; then
  TAG_FLAGS+=("--tag" "${FULL_IMAGE}:${VERSION}")
  BUILT_TAGS+=("${FULL_IMAGE}:${VERSION}")
fi

# ── Summary ───────────────────────────────────────────────────────────────────
printf "\n"
printf "  ${BOLD}Image    ${NC} %s\n"      "${FULL_IMAGE}"
printf "  ${BOLD}Platform ${NC} %s\n"      "${PLATFORM}"
printf "  ${BOLD}Commit   ${NC} %s (%s)\n" "${GIT_COMMIT}" "${GIT_BRANCH}"
printf "\n"

# ── Clean cache ───────────────────────────────────────────────────────────────
if $CLEAN; then
  info "Cleaning buildx cache..."
  docker buildx prune -f
fi

# ── Ensure buildx builder ─────────────────────────────────────────────────────
if ! docker buildx inspect "$BUILDER" &>/dev/null; then
  info "Creating buildx builder: $BUILDER"
  docker buildx create --name "$BUILDER" --driver docker-container --bootstrap
fi
docker buildx use "$BUILDER"

# ── Build ─────────────────────────────────────────────────────────────────────
info "Building ${#BUILT_TAGS[@]} tags (${PLATFORM})..."

# --load: single-arch local load; --push: registry (required for multi-arch)
PUSH_FLAG="--load"
$PUSH && PUSH_FLAG="--push"

# Assemble build args array to avoid word-splitting with conditional flags
BUILD_ARGS=(
  --platform "$PLATFORM"
  --target   runner
  "${TAG_FLAGS[@]}"
  --build-arg "BUILD_DATE=$BUILD_DATE"
  --build-arg "GIT_SHA=$GIT_COMMIT"
  --build-arg "VERSION=${VERSION:-$GIT_COMMIT}"
  --cache-from "type=registry,ref=${FULL_IMAGE}:buildcache"
)

# Attestations and cache-to require registry access — only when pushing
if $PUSH; then
  BUILD_ARGS+=(--provenance=true --sbom=true)
  # Docker Hub rejects cache blobs for multi-arch (too large); skip cache-to in that case
  if ! $MULTI_ARCH; then
    BUILD_ARGS+=(--cache-to "type=registry,ref=${FULL_IMAGE}:buildcache,mode=min")
  fi
fi

BUILD_ARGS+=("$PUSH_FLAG")

docker buildx build "${BUILD_ARGS[@]}" .

# ── Security scan ─────────────────────────────────────────────────────────────
if $SCAN; then
  info "Running Trivy scan on ${FULL_IMAGE}:${GIT_COMMIT}..."
  if command -v trivy &>/dev/null; then
    trivy image --exit-code 1 --severity HIGH,CRITICAL "${FULL_IMAGE}:${GIT_COMMIT}"
  else
    warn "Trivy not found — https://aquasecurity.github.io/trivy"
  fi
fi

# Write most-specific tag for deploy script to pick up automatically
printf "%s" "${FULL_IMAGE}:${VERSION:-$GIT_COMMIT}" > .image-tag

# ── Result ────────────────────────────────────────────────────────────────────
printf "\n"
if $PUSH; then
  ok "Pushed ${#BUILT_TAGS[@]} images to registry:"
else
  ok "Loaded ${#BUILT_TAGS[@]} images locally:"
fi
for tag in "${BUILT_TAGS[@]}"; do
  printf "  ${BOLD}→${NC} %s\n" "$tag"
done
printf "\n"