import connectDatabase from '../src/config/database.js';
import Request from '../src/models/Request.js';
import ApprovalLog from '../src/models/ApprovalLog.js';
import Notification from '../src/models/Notification.js';

await connectDatabase();

const [requests, approvalLogs, notifications] = await Promise.all([
  Request.deleteMany({}),
  ApprovalLog.deleteMany({}),
  Notification.deleteMany({}),
]);

console.log('Purged all request data:', {
  requests: requests.deletedCount,
  approvalLogs: approvalLogs.deletedCount,
  notifications: notifications.deletedCount,
});

process.exit(0);
