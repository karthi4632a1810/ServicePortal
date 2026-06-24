import connectDatabase from '../config/database.js';
import Request from '../models/Request.js';
import ApprovalLog from '../models/ApprovalLog.js';

export async function clearAllRequests() {
  const [requests, approvalLogs] = await Promise.all([
    Request.deleteMany({}),
    ApprovalLog.deleteMany({}),
  ]);

  return {
    requests: requests.deletedCount ?? 0,
    approvalLogs: approvalLogs.deletedCount ?? 0,
  };
}

if (process.argv[1]?.includes('clearRequests.js')) {
  connectDatabase()
    .then(() => clearAllRequests())
    .then(({ requests, approvalLogs }) => {
      console.log(`Removed ${requests} request(s) and ${approvalLogs} approval log(s)`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
