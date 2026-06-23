import mongoose from 'mongoose';

const formVersionSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true, index: true },
    version: { type: Number, required: true },
    filename: { type: String, required: true },
    publishedBy: String,
    publishedAt: { type: Date, default: Date.now },
    changelog: String,
  },
  { timestamps: true }
);

formVersionSchema.index({ formId: 1, version: 1 }, { unique: true });

export default mongoose.model('FormVersion', formVersionSchema);
