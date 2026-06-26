import mongoose, { Document, Schema } from 'mongoose';

export interface IHospital extends Document {
  name: string;
  code: string; // The unique password for access
  description?: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HospitalSchema = new Schema<IHospital>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    address: { type: String },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Hospital || mongoose.model<IHospital>('Hospital', HospitalSchema);
