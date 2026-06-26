import mongoose, { Document, Schema } from 'mongoose';

export interface IMileSubscription extends Document {
  userId: mongoose.Types.ObjectId;         // 결제 주체 (총무/조장 or 청강생/외부 자문)
  teamId: mongoose.Types.ObjectId;
  plan: 'basic' | 'pro' | 'premium';
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  // 결제 정보
  paymentMethod?: 'card' | 'bank' | 'free';
  billingKey?: string;                     // 나이스페이 빌링키 (정기결제용)
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  amount: number;                          // 월 결제 금액 (원)
  // 기간
  startDate: Date;
  endDate: Date;
  trialEndsAt?: Date;
  // 인원
  maxPlayers: number;                      // 플랜별 팀원/스터디원 제한
  // 이력
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MileSubscriptionSchema = new Schema<IMileSubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'MileTeam', required: true },
    plan: { type: String, enum: ['basic', 'pro', 'premium'], default: 'basic' },
    status: { type: String, enum: ['trial', 'active', 'expired', 'cancelled'], default: 'trial' },
    paymentMethod: { type: String, enum: ['card', 'bank', 'free'] },
    billingKey: { type: String },
    lastPaymentDate: { type: Date },
    nextPaymentDate: { type: Date },
    amount: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    trialEndsAt: { type: Date },
    maxPlayers: { type: Number, default: 20 },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

MileSubscriptionSchema.index({ teamId: 1 });
MileSubscriptionSchema.index({ userId: 1 });
MileSubscriptionSchema.index({ status: 1, endDate: 1 });

// 플랜별 설정
export const PLAN_CONFIG = {
  basic: { label: '베이직', maxPlayers: 20, price: 49000, features: ['웰니스 체크', '신호등 대시보드', '공지사항'] },
  pro: { label: '프로', maxPlayers: 40, price: 99000, features: ['베이직 전체', 'ACWR 분석', 'AI 주간 리포트', '청강생/외부 자문 연동'] },
  premium: { label: '프리미엄', maxPlayers: 100, price: 199000, features: ['프로 전체', '다중 팀 관리', '영양 분석', '전용 상담'] },
};

export default mongoose.models.MileSubscription ||
  mongoose.model<IMileSubscription>('MileSubscription', MileSubscriptionSchema);
