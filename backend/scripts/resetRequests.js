#!/usr/bin/env node
/**
 * PaperZero — Reset all requests (and related data)
 *
 * Usage:
 *   node backend/scripts/resetRequests.js --confirm
 *   node backend/scripts/resetRequests.js --confirm --uploads
 *
 * Docker:
 *   docker compose exec backend node backend/scripts/resetRequests.js --confirm
 */

import { resetAllRequests } from '../src/seeds/resetRequests.js';

const args = process.argv.slice(2);
const confirm = args.includes('--confirm') || args.includes('--yes');

if (!confirm) {
  console.error('Aborted: --confirm is required.\n');
  console.error('  node backend/scripts/resetRequests.js --confirm');
  console.error('  node backend/scripts/resetRequests.js --confirm --uploads');
  console.error('\nDocker:');
  console.error('  docker compose exec backend node backend/scripts/resetRequests.js --confirm');
  process.exit(1);
}

resetAllRequests({
  confirm: true,
  clearUploads: args.includes('--uploads'),
  clearAudit: !args.includes('--keep-audit'),
})
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nReset failed:', err.message || err);
    process.exit(1);
  });
