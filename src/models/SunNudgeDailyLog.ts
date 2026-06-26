import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISunNudgeDailyLog extends Document {
  userId: string;
  activityType: string;
  firstApplyTime: string;
  didReapply: string;
  missedParts: string[];
  sunPointEarned: number;
  createdAt: Date;
}

const SunNudgeDailyLogSchema = new Schema<ISunNudgeDailyLog>(
  {
    userId: { type: String, required: true, index: true },
    activityType: { type: String, required: true },
    firstApplyTime: { type: String, required: true },
    didReapply: { type: String, required: true },
    missedParts: { type: [String], default: [] },
    sunPointEarned: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    collection: 'sunnudgedailylogs',
  }
);

// DB 모델 초기화 패턴 (Next.js HMR 대응)
export const SunNudgeDailyLog: Model<ISunNudgeDailyLog> =
  mongoose.models.SunNudgeDailyLog ||
  mongoose.model<ISunNudgeDailyLog>('SunNudgeDailyLog', SunNudgeDailyLogSchema);
