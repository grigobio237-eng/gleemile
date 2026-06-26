import mongoose, { Document, Schema } from 'mongoose';

export interface ICouponUsage extends Document {
  couponId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  code: string;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  usedAt: Date;
  createdAt: Date;
}

const CouponUsageSchema = new Schema<ICouponUsage>({
  couponId: {
    type: Schema.Types.ObjectId,
    ref: 'Coupon',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true
  },
  discountAmount: {
    type: Number,
    required: true,
    min: 0
  },
  originalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  finalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  usedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 인덱스 설정
CouponUsageSchema.index({ couponId: 1 });
CouponUsageSchema.index({ userId: 1 });
CouponUsageSchema.index({ orderId: 1 });
CouponUsageSchema.index({ code: 1 });
CouponUsageSchema.index({ usedAt: -1 });

// 복합 인덱스 (사용자별 쿠폰 사용 횟수 조회용)
CouponUsageSchema.index({ userId: 1, couponId: 1 });

export default mongoose.models.CouponUsage || mongoose.model<ICouponUsage>('CouponUsage', CouponUsageSchema);















