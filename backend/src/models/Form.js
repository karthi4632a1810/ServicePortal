import mongoose from 'mongoose';

const formSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    department: { type: String, required: true },
    departmentId: String,
    description: String,
    icon: String,
    category: String,
    workflowTemplateId: { type: String, required: true },
    currentVersion: { type: Number, default: 1 },
    filename: { type: String, required: true },
    active: { type: Boolean, default: true },
    estimatedTime: String,
    slaHours: { type: Number, default: 48 },
  },
  { timestamps: true }
);

formSchema.index({ department: 1, active: 1 });
formSchema.index({ category: 1 });

export default mongoose.model('Form', formSchema);
