import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'md', 'hod', 'processor', 'it_team', 'hr_team', 'finance_team', 'employee'],
      required: true,
    },
    department: { type: String, required: true },
    employeeId: { type: String },
    initials: String,
    avatar: String,
    active: { type: Boolean, default: true },
    portalPasswordChangedAt: { type: Date, default: null },
    notificationPreferences: {
      inAppRealtime: { type: Boolean, default: true },
      inAppNewTask: { type: Boolean, default: true },
      inAppSubmitted: { type: Boolean, default: true },
      inAppApprovalRequired: { type: Boolean, default: true },
      inAppRequestApproved: { type: Boolean, default: true },
      inAppRequestRejected: { type: Boolean, default: true },
      inAppRequestCompleted: { type: Boolean, default: true },
      inAppSlaReminder: { type: Boolean, default: true },
      emailSubmitted: { type: Boolean, default: false },
      emailApproval: { type: Boolean, default: false },
      emailApproved: { type: Boolean, default: false },
      emailRejected: { type: Boolean, default: false },
      emailCompleted: { type: Boolean, default: false },
      emailReminder: { type: Boolean, default: false },
      emailDailyDigest: { type: Boolean, default: false },
    },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
      accentColor: { type: String, default: '#2563EB' },
      compactMode: { type: Boolean, default: false },
      animations: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, department: 1 });
userSchema.index({ employeeId: 1 });

export default mongoose.model('User', userSchema);
