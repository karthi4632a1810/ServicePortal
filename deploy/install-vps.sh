#!/usr/bin/env bash
# One-time Hostinger VPS setup (Ubuntu 22.04 / 24.04)
# Run as root or with sudo:  bash deploy/install-vps.sh

set -euo pipefail

echo "==> Updating system..."
apt-get update -y
apt-get upgrade -y

echo "==> Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

echo "==> Enabling Docker on boot..."
systemctl enable docker
systemctl start docker

echo "==> Firewall (UFW)..."
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable || true
fi

echo ""
echo "Done. Next steps:"
echo "  1. Clone your repo:  git clone <your-repo-url> /opt/paperzero"
echo "  2. cd /opt/paperzero"
echo "  3. cp .env.production.example .env   && nano .env"
echo "  4. bash deploy/deploy.sh --seed"
