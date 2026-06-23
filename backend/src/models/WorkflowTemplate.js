import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    role: String,
    assignee: String,
  },
  { _id: false }
);

const workflowTemplateSchema = new mongoose.Schema(
  {
    templateId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    steps: { type: [stepSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('WorkflowTemplate', workflowTemplateSchema);
