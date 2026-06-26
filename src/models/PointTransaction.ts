import mongoose, { Document, Schema } from 'mongoose';

export interface IPointTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'earned' | 'used' | 'expired' | 'admin_grant' | 'admin_deduct';
  amount: number; // 양수: 적립, 음수: 사용
  description: string;
  orderId?: mongoose.Types.ObjectId; // 구매 적립인 경우
  balance: number; // 거래 후 잔액
  expiresAt?: Date; // 포인트 만료일 (적립 시에만)
  createdAt: Date;
  updatedAt: Date;
}

const PointTransactionSchema = new Schema<IPointTransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['earned', 'used', 'expired', 'admin_grant', 'admin_deduct'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  balance: {
    type: Number,
    required: true
  },
  expiresAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
});

// 복합 인덱스
PointTransactionSchema.index({ userId: 1, createdAt: -1 });
PointTransactionSchema.index({ userId: 1, type: 1 });

export default mongoose.models.PointTransaction || mongoose.model<IPointTransaction>('PointTransaction', PointTransactionSchema);
