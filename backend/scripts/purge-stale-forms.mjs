import connectDatabase from '../src/config/database.js';
import Form from '../models/Form.js';
import FormVersion from '../models/FormVersion.js';
import Request from '../models/Request.js';
import AuditLog from '../models/AuditLog.js';

const staleFormIds = ['form-hr-leave', 'form-finance-advance', 'form-it-miss-punch'];

await connectDatabase();
const rf = await Form.deleteMany({ formId: { $in: staleFormIds } });
const rv = await FormVersion.deleteMany({ formId: { $in: staleFormIds } });
const rr = await Request.deleteMany({ formId: { $in: staleFormIds } });
const ra = await AuditLog.deleteMany({ entityId: { $in: staleFormIds } });
console.log('Purged stale forms:', {
  forms: rf.deletedCount,
  versions: rv.deletedCount,
  requests: rr.deletedCount,
  audit: ra.deletedCount,
});
process.exit(0);
