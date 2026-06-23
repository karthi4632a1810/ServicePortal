import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, index: true },
    entity: String,
    entityId: String,
    user: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    department: String,
    ip: String,
    browser: String,
    details: String,
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'success'],
      default: 'info',
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
