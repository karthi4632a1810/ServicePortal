import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'hod', 'processor', 'it_team', 'hr_team', 'finance_team', 'employee'],
      required: true,
    },
    department: { type: String, required: true },
    employeeId: { type: String },
    initials: String,
    avatar: String,
    active: { type: Boolean, default: true },
    portalPasswordChangedAt: { type: Date, default: null },
    notificationPreferences: {
      emailApproval: { type: Boolean, default: true },
      emailCompleted: { type: Boolean, default: true },
      emailRejected: { type: Boolean, default: true },
      emailReminder: { type: Boolean, default: true },
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
