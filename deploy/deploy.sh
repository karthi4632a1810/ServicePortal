#!/usr/bin/env bash
# Build and start PaperZero (production)
# Usage:
#   bash deploy/deploy.sh --hostinger --seed   # Hostinger shared VPS (port 8093)
#   bash deploy/deploy.sh --traefik --seed     # Hostinger + Traefik domain routing
#   bash deploy/deploy.sh --seed               # Dedicated VPS with nginx (ports 80/443)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
SEED=false
HOSTINGER=false
TRAEFIK=false

for arg in "$@"; do
  case "$arg" in
    --seed) SEED=true ;;
    --hostinger) HOSTINGER=true ;;
    --traefik) TRAEFIK=true ;;
    -h|--help)
      echo "Usage: bash deploy/deploy.sh [--hostinger|--traefik] [--seed]"
      echo "  --hostinger  Shared VPS, nginx on APP_PORT (8093)"
      echo "  --traefik    Shared VPS, Traefik routes paper.mapims.edu.in"
      echo "  --seed       First deploy: seed MongoDB + forms"
      exit 0
      ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

if $TRAEFIK; then
  COMPOSE="docker compose -f docker-compose.hostinger-manager.yml"
  HOSTINGER=true
elif $HOSTINGER; then
  COMPOSE="docker compose -f docker-compose.yml -f docker-compose.hostinger.yml"
fi

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.production.example to .env and edit it."
  exit 1
fi

if ! grep -qE '^DOMAIN=.+' .env 2>/dev/null; then
  echo "Set DOMAIN=your-domain.com in .env"
  exit 1
fi

echo "==> Building images..."
$COMPOSE build

echo "==> Starting services..."
$COMPOSE up -d

echo "==> Waiting for backend health..."
for i in $(seq 1 30); do
  if $COMPOSE exec -T backend node -e "fetch('http://127.0.0.1:5000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    break
  fi
  sleep 2
done

if $SEED; then
  echo "==> Seeding MongoDB (forms + config + users)..."
  if $TRAEFIK; then
    docker compose -f docker-compose.yml --profile seed run --rm seed
  else
    $COMPOSE --profile seed run --rm seed
  fi
fi

echo ""
DOMAIN=$(grep -E '^DOMAIN=' .env | cut -d= -f2- | tr -d '\r"')
APP_PORT=$(grep -E '^APP_PORT=' .env 2>/dev/null | cut -d= -f2- | tr -d '\r"' || echo "8093")
if $TRAEFIK; then
  echo "Deploy complete (Traefik mode)."
  echo "  Domain: https://${DOMAIN}"
  echo "  Test: curl -s https://${DOMAIN}/api/health"
elif $HOSTINGER; then
  echo "Deploy complete (Hostinger mode)."
  echo "  App port on server: ${APP_PORT}"
  echo "  Domain: https://${DOMAIN}"
  echo "  Test: curl -s http://127.0.0.1:${APP_PORT}/api/health"
else
  echo "Deploy complete."
  echo "  Site:  https://${DOMAIN}"
  echo "  Health: curl -s https://${DOMAIN}/api/health"
fi
echo ""
echo "Logs:  $COMPOSE logs -f"
echo "Stop:  $COMPOSE down"
