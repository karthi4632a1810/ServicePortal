#!/usr/bin/env bash
# Pull latest code from Git and redeploy (no data loss)
# Usage: bash deploy/update.sh [--hostinger]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

HOSTINGER=false
for arg in "$@"; do
  case "$arg" in
    --hostinger) HOSTINGER=true ;;
  esac
done

# Default to hostinger mode if APP_PORT is set in .env
if [[ -f .env ]] && grep -qE '^APP_PORT=' .env 2>/dev/null; then
  HOSTINGER=true
fi

DEPLOY_ARGS=()
$HOSTINGER && DEPLOY_ARGS+=(--hostinger)

echo "==> Git pull..."
git pull --ff-only

echo "==> Re-deploy..."
bash deploy/deploy.sh "${DEPLOY_ARGS[@]}"

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.hostinger.yml"
$HOSTINGER || COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

echo "==> Re-sync forms..."
$COMPOSE exec -T backend node backend/scripts/seedMongoDb.js --skip-users

echo "Update complete."
