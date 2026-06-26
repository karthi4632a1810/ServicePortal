import mongoose from 'mongoose';

const approvalLogSchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true, index: true },
    requestNumber: String,
    action: {
      type: String,
      enum: ['approve', 'reject', 'forward', 'request_info', 'assign', 'start', 'pause', 'complete', 'cancel', 'comment', 'accept', 'submit_for_review', 'confirm_completion', 'send_back_rework'],
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userRole: String,
    department: String,
    remarks: String,
    stepIndex: Number,
    stepName: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model('ApprovalLog', approvalLogSchema);
