# PaperZero — Hostinger VPS deploy

## What runs in production

| Service | Role |
|---------|------|
| **caddy** | HTTPS (Let's Encrypt) on ports 80/443 |
| **frontend** | React app + nginx proxy to API |
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

```bash
bash deploy/deploy.sh --seed
```

**Step 6 — Verify**

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

## Useful commands

```bash
# Logs (all services)
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Logs (backend only)
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend

# Restart everything
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Stop everything
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# Re-seed forms only (keeps users)
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend \
  node backend/scripts/seedMongoDb.js --skip-users

# Full re-seed
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile seed run --rm seed
```

---

## Local dev (unchanged)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
docker compose exec backend node backend/scripts/seedMongoDb.js
```

App: http://localhost:3000
