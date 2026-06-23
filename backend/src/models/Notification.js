import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    type: {
      type: String,
      enum: ['approval_required', 'approved', 'rejected', 'completed', 'reminder', 'info'],
      required: true,
    },
    title: String,
    message: String,
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
    requestNumber: String,
    read: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
