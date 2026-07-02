import fs from 'fs/promises';
import path from 'path';
import connectDatabase from '../config/database.js';
import config from '../config/index.js';
import Request from '../models/Request.js';
import ApprovalLog from '../models/ApprovalLog.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

function parseArgs(argv = process.argv.slice(2)) {
  return {
    confirm: argv.includes('--confirm') || argv.includes('--yes'),
    clearUploads: argv.includes('--uploads'),
    clearAudit: !argv.includes('--keep-audit'),
  };
}

async function removeUploadFiles() {
  const uploadsDir = config.paths.uploads;
  let entries;
  try {
    entries = await fs.readdir(uploadsDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return 0;
    throw err;
  }

  let removed = 0;
  for (const entry of entries) {
    if (entry.name === '.gitkeep') continue;
    await fs.rm(path.join(uploadsDir, entry.name), { recursive: true, force: true });
    removed += 1;
  }
  return removed;
}

/**
 * Delete all requests and related workflow data.
 * Does not touch forms, users, roles, or portal settings.
 */
export async function resetAllRequests(options = {}) {
  const { confirm, clearUploads, clearAudit } = { ...parseArgs(), ...options };

  if (!confirm) {
    throw new Error('Pass --confirm to delete all requests and related data.');
  }

  await connectDatabase();

  const [requestCount, approvalCount, notificationCount, auditCount] = await Promise.all([
    Request.countDocuments(),
    ApprovalLog.countDocuments(),
    Notification.countDocuments({ requestId: { $exists: true, $ne: null } }),
    clearAudit ? AuditLog.countDocuments({ entity: 'Request' }) : Promise.resolve(0),
  ]);

  console.log('\nPaperZero — Reset requests');
  console.log('------------------------');
  console.log(`Found ${requestCount} request(s)`);
  console.log(`Found ${approvalCount} approval log(s)`);
  console.log(`Found ${notificationCount} request notification(s)`);
  if (clearAudit) console.log(`Found ${auditCount} request audit log(s)`);

  const [requests, approvals, notifications, audits] = await Promise.all([
    Request.deleteMany({}),
    ApprovalLog.deleteMany({}),
    Notification.deleteMany({ requestId: { $exists: true, $ne: null } }),
    clearAudit ? AuditLog.deleteMany({ entity: 'Request' }) : { deletedCount: 0 },
  ]);

  console.log(`\nDeleted ${requests.deletedCount} request(s)`);
  console.log(`Deleted ${approvals.deletedCount} approval log(s)`);
  console.log(`Deleted ${notifications.deletedCount} notification(s)`);
  if (clearAudit) console.log(`Deleted ${audits.deletedCount} audit log(s)`);

  if (clearUploads) {
    const removedFolders = await removeUploadFiles();
    console.log(`Cleared ${removedFolders} upload folder(s) under uploads/`);
  } else {
    console.log('Upload files kept (pass --uploads to remove them too)');
  }

  console.log('\nUnchanged: forms, users, departments, settings.');
  return {
    requests: requests.deletedCount,
    approvals: approvals.deletedCount,
    notifications: notifications.deletedCount,
    audits: audits.deletedCount,
  };
}

function printUsage() {
  console.error('\nUsage:');
  console.error('  node backend/scripts/resetRequests.js --confirm');
  console.error('  node backend/scripts/resetRequests.js --confirm --uploads');
  console.error('  node backend/scripts/resetRequests.js --confirm --keep-audit');
  console.error('\nDocker:');
  console.error('  docker compose exec backend node backend/scripts/resetRequests.js --confirm');
  console.error('  docker compose exec backend node backend/src/seeds/resetRequests.js --confirm');
}

const isDirectRun = process.argv[1]?.replace(/\\/g, '/').includes('src/seeds/resetRequests.js');

if (isDirectRun) {
  const opts = parseArgs();
  if (!opts.confirm) {
    console.error('Aborted: --confirm is required.');
    printUsage();
    process.exit(1);
  }

  resetAllRequests(opts)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\nReset failed:', err.message || err);
      process.exit(1);
    });
}
