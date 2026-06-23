import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    resource: String,
    action: String,
    roles: [String],
  },
  { timestamps: true }
);

export default mongoose.model('Permission', permissionSchema);
