#!/usr/bin/env node
/**
 * PaperZero — Reset all requests (and related data)
 *
 * Clears requests, approval logs, request notifications, and request audit logs.
 * Forms, users, departments, and settings are not changed.
 *
 * Usage (project root):
 *   node backend/scripts/resetRequests.js --confirm
 *   node backend/scripts/resetRequests.js --confirm --uploads
 *
 * Docker (from /docker/ServicePortal):
 *   docker compose exec backend node backend/scripts/resetRequests.js --confirm
 *   docker compose -f docker-compose.yml -f docker-compose.hostinger.yml exec backend node backend/scripts/resetRequests.js --confirm --uploads
 */

import '../src/seeds/resetRequests.js';
