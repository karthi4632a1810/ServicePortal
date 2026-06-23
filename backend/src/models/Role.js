import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    level: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Role', roleSchema);
