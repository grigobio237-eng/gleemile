import mongoose, { Document, Schema } from 'mongoose';

export interface IHospitalVisitLog extends Document {
  hospitalId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  accessType: 'pre-consultation' | 'post-care' | 'patient-detail';
  timestamp: Date;
}

const HospitalVisitLogSchema = new Schema<IHospitalVisitLog>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accessType: { 
      type: String, 
      enum: ['pre-consultation', 'post-care', 'patient-detail'], 
      required: true 
    },
    timestamp: { type: Date, default: Date.now, index: true },
  }
);

export default mongoose.models.HospitalVisitLog || mongoose.model<IHospitalVisitLog>('HospitalVisitLog', HospitalVisitLogSchema);
