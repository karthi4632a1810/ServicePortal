#!/usr/bin/env bash
# Pull latest code from Git and redeploy (no data loss)
# Usage: bash deploy/update.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Git pull..."
git pull --ff-only

echo "==> Re-sync forms into MongoDB after update..."
bash deploy/deploy.sh

docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend \
  node backend/scripts/seedMongoDb.js --skip-users

echo "Update complete."
