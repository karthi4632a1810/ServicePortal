# PaperZero — Hostinger VPS deploy

## What runs in production

| Service | Role |
|---------|------|
| **nginx** | Reverse proxy on `APP_PORT` (default 8093) → frontend |
| **frontend** | React app + internal nginx (proxies `/api` to backend) |
| **backend** | Node API |
| **mongo** | Database (not exposed publicly) |

Your `forms/` JSON files are in Git and synced to MongoDB on deploy.

---

## A. On your PC — push to Git

```bash
cd ServicePortal
git init
git add .
git commit -m "PaperZero production setup"
git remote add origin https://github.com/YOUR_USER/ServicePortal.git
git push -u origin main
```

Do **not** commit `.env` or `backend/.env` (they are gitignored).

---

## B. On Hostinger VPS — one-time setup

SSH into the VPS:

```bash
ssh root@YOUR_VPS_IP
```

**Step 1 — Install Docker**

```bash
cd /opt
git clone https://github.com/YOUR_USER/ServicePortal.git paperzero
cd paperzero
bash deploy/install-vps.sh
```

**Step 2 — Point domain DNS**

In Hostinger DNS for `mapims.edu.in`:

| Type | Name | Value |
|------|------|-------|
| A | `paper` | Your VPS public IP |

This creates **https://paper.mapims.edu.in**. Wait 5–30 minutes for DNS.

**Step 3 — Create production `.env`**

```bash
cd /opt/paperzero
cp .env.production.example .env
nano .env
```

Set at minimum:

- `DOMAIN=paper.mapims.edu.in`
- `ACME_EMAIL=it@mapims.edu.in` (or your IT email — used for SSL)
- `CORS_ORIGIN=https://paper.mapims.edu.in`
- `JWT_SECRET=` (long random string)
- `HRMS_DB_*` (MySQL credentials)

**Step 4 — HRMS remote access**

In cPanel → Remote MySQL®, allow your **VPS public IP**.

**Step 5 — First deploy + seed**

Shared Hostinger Docker (ports 27017/5000/3000 already used by other apps):

```bash
# Add to .env:
# APP_PORT=8093

bash deploy/deploy.sh --hostinger --seed
```

In **Hostinger Docker Manager** → **serviceportal** → use `deploy/docker-compose.hostinger-manager.yml` in the **.yaml editor** (includes Traefik labels for `paper.mapims.edu.in`).

**Requires:** Traefik project running in Docker Manager (default Hostinger VPS template).

**Env vars** in Docker Manager (same as `.env` on server).

After deploy, Traefik routes `https://paper.mapims.edu.in` → `paperzero-nginx` (no port 8093 needed for public access).

Fallback direct port (SSH deploy only): `APP_PORT=8093` in `docker-compose.hostinger.yml`.

Dedicated VPS (nginx on 80/443; optional Caddy: `--profile caddy`):

```bash
bash deploy/deploy.sh --seed
```

**Step 6 — Verify**

Hostinger shared:
```bash
curl -s http://127.0.0.1:8093/api/health
curl -s https://paper.mapims.edu.in/api/health
```

Dedicated VPS:
```bash
curl -s https://paper.mapims.edu.in/api/health
curl -s https://paper.mapims.edu.in/api/forms | head
```

Open the site in a browser. Login: Staff ID `12345` / `superadmin` (or your HRMS staff + `mapims`).

---

## C. After code changes — update VPS

```bash
cd /opt/paperzero
bash deploy/update.sh
```

---

## D. Port map on your server (avoid conflicts)

| Port | Used by |
|------|---------|
| 27017, 5000, 3000 | **mrd_cl** |
| 8085, 5010 | ambulance_qr |
| 8088, 5011 | gen_cl |
| 8089, 5012 | gen_cl_dental |
| 8090, 5013 | tms |
| 8091, 5014 | pfs |
| 8092, 5015 | pg_cl |
| **8093** | **PaperZero (ServicePortal)** ← use this |

PaperZero mongo/backend stay **internal only** (no host ports).

---

## Useful commands

Hostinger shared (`--hostinger`):

```bash
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.hostinger.yml"

# Logs
$COMPOSE logs -f

# Restart
$COMPOSE restart

# Stop
$COMPOSE down

# Re-seed forms
$COMPOSE exec backend node backend/scripts/seedMongoDb.js --skip-users

# Full re-seed
$COMPOSE --profile seed run --rm seed
```

Dedicated VPS:

```bash
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
$COMPOSE logs -f
$COMPOSE restart
$COMPOSE down
$COMPOSE exec backend node backend/scripts/seedMongoDb.js --skip-users
$COMPOSE --profile seed run --rm seed
```

---

## Local dev (unchanged)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
docker compose exec backend node backend/scripts/seedMongoDb.js
```

App: http://localhost:3000
