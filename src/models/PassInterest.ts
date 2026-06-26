import mongoose, { Document, Schema } from 'mongoose';

export interface IPassInterest extends Document {
  userId: mongoose.Types.ObjectId;
  passId: 'reset' | 'reborn' | 'restart' | 'black';
  navigatorId?: mongoose.Types.ObjectId;
  viewCount: number;
  lastViewedAt: Date;
  status: 'viewed' | 'consulting' | 'purchased';
  notes?: string;
}

const PassInterestSchema = new Schema<IPassInterest>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  passId: { type: String, enum: ['reset', 'reborn', 'restart', 'black'], required: true },
  navigatorId: { type: Schema.Types.ObjectId, ref: 'User' },
  viewCount: { type: Number, default: 1 },
  lastViewedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['viewed', 'consulting', 'purchased'], default: 'viewed' },
  notes: { type: String }
}, {
  timestamps: true
});

// 복합 인덱스: 동일 유저가 동일 패스에 대한 기록은 하나만 유지하도록 함
PassInterestSchema.index({ userId: 1, passId: 1 }, { unique: true });

export default mongoose.models.PassInterest || mongoose.model<IPassInterest>('PassInterest', PassInterestSchema);
