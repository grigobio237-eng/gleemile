import mongoose, { Document, Schema } from 'mongoose';

export interface IWellnessCheck extends Document {
  userId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  date: string;              // YYYY-MM-DD 형식 (하루 1회)
  
  // 정신적 피로 지수 (1-5 스케일, 1:매우 좋음 ~ 5:매우 나쁨)
  sleep: number;             // 수면 피로 (1:충분 ~ 5:부족)
  fatigue: number;           // 주관적 피로도 (1:활력 ~ 5:탈진)
  stress: number;            // 대인 관계 스트레스 (1:없음 ~ 5:매우높음)
  tension: number;           // 인지적 긴장도 (1:이완 ~ 5:과긴장)
  mentalStrainIndex: number; // 4개 평균 (1.0 ~ 5.0)

  notes?: {
    sleep?: string;
    fatigue?: string;
    stress?: string;
    tension?: string;
  };

  // 협업 부량 및 일간 인지 부하
  collaborationVolume: number; // 협업 부량 인자 (1.0 ~ 3.0)
  dailyCognitiveLoad: number;  // collaborationVolume * mentalStrainIndex
  
  // 추가 정보
  injuryNote?: string;       // 기타 메모
  source: 'quick' | 'scanner' | 'diagnosis'; // 어떤 경로로 입력했는지
  createdAt: Date;
  updatedAt: Date;
}

const WellnessCheckSchema = new Schema<IWellnessCheck>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'MileTeam', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    
    sleep: { type: Number, required: true, min: 1, max: 5 },
    fatigue: { type: Number, required: true, min: 1, max: 5 },
    stress: { type: Number, required: true, min: 1, max: 5 },
    tension: { type: Number, required: true, min: 1, max: 5 },
    mentalStrainIndex: { type: Number, required: true, min: 1, max: 5 },
    
    notes: {
      sleep: { type: String, default: '' },
      fatigue: { type: String, default: '' },
      stress: { type: String, default: '' },
      tension: { type: String, default: '' },
    },
    
    collaborationVolume: { type: Number, required: true, min: 1.0, max: 3.0 },
    dailyCognitiveLoad: { type: Number, required: true, min: 1.0, max: 15.0 },
    
    injuryNote: { type: String, trim: true },
    source: { type: String, enum: ['quick', 'scanner', 'diagnosis'], default: 'quick' },
  },
  { timestamps: true }
);

WellnessCheckSchema.index({ userId: 1, date: 1 }, { unique: true });
WellnessCheckSchema.index({ teamId: 1, date: 1 });

export default mongoose.models.WellnessCheck || mongoose.model<IWellnessCheck>('WellnessCheck', WellnessCheckSchema);
