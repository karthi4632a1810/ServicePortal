import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    companyDomain: { type: String, required: true, trim: true },
    defaultSlaHours: { type: Number, required: true, min: 1, max: 720 },
    adminEmail: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false },
);

const portalSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'organization' },
    organization: { type: organizationSchema, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

export default mongoose.model('PortalSettings', portalSettingsSchema);
