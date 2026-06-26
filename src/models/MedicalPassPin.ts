import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicalPassPin extends Document {
  userId: mongoose.Types.ObjectId;
  pin: string;
  createdAt: Date;
}

const MedicalPassPinSchema = new Schema<IMedicalPassPin>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  pin: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: '5m' } // 5분 후 자동 삭제 (TTL Index)
  }
});

export default mongoose.models.MedicalPassPin || mongoose.model<IMedicalPassPin>('MedicalPassPin', MedicalPassPinSchema);
