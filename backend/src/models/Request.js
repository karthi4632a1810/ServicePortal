import mongoose from 'mongoose';

const workflowStepSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    type: {
      type: String,
      enum: ['hod', 'reporting_manager', 'specific_user', 'specific_role', 'department_processor', 'parallel'],
    },
    assignee: String,
    assigneeEmployeeId: String,
    role: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'skipped'],
      default: 'pending',
    },
    completedAt: Date,
    completedBy: String,
    comment: String,
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    id: String,
    by: String,
    role: String,
    text: String,
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['comment', 'action', 'system'], default: 'comment' },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    size: String,
    type: String,
    path: String,
    uploadedBy: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const employeeSnapshotSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    department: String,
    designation: String,
    branch: String,
    email: String,
    mobile: String,
    reportingManager: String,
    hod: String,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    avatar: String,
  },
  { _id: false }
);

const requestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, required: true, unique: true, index: true },
    formId: { type: String, required: true, index: true },
    formTitle: String,
    formVersion: Number,
    mdApprove: { type: Boolean, default: false },
    department: String,
    category: String,
    employee: employeeSnapshotSchema,
    status: {
      type: String,
      enum: ['submitted', 'pending_approval', 'approved', 'rejected', 'processing', 'completed', 'cancelled', 'sent_back'],
      default: 'submitted',
      index: true,
    },
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
    workflow: [workflowStepSchema],
    currentStep: { type: Number, default: 1 },
    comments: [commentSchema],
    attachments: [attachmentSchema],
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    assignedTo: String,
    assignedToEmployeeId: String,
    assignedToUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receiverApprovedBy: String,
    receiverApprovedAt: Date,
    staffFinishRemarks: String,
    staffFinishedBy: String,
    staffFinishedAt: Date,
    assignees: [{
      employeeId: String,
      name: String,
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending',
      },
    }],
    queueStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'pending_hod_review', 'paused', 'completed', 'cancelled'],
      default: 'pending',
    },
    dueDate: Date,
    slaHours: Number,
    slaBreached: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
    completedAt: Date,
  },
  { timestamps: true }
);

requestSchema.index({ 'employee.id': 1, submittedAt: -1 });
requestSchema.index({ status: 1, department: 1 });
requestSchema.index({ assignedToUserId: 1, queueStatus: 1 });
requestSchema.index({ formTitle: 'text', requestNumber: 'text', 'employee.name': 'text' });

export default mongoose.model('Request', requestSchema);
