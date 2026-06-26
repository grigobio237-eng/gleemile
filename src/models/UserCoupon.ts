import mongoose, { Document, Schema } from 'mongoose';

export interface IUserCoupon extends Document {
  userId: mongoose.Types.ObjectId;
  couponId: mongoose.Types.ObjectId;
  code: string;
  status: 'available' | 'used' | 'expired';
  downloadedAt: Date;
  validUntil: Date; // 사용자별 유효기간
  usedAt?: Date;
  orderId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserCouponSchema = new Schema<IUserCoupon>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  couponId: {
    type: Schema.Types.ObjectId,
    ref: 'Coupon',
    required: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['available', 'used', 'expired'],
    default: 'available'
  },
  downloadedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  usedAt: {
    type: Date
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  }
}, {
  timestamps: true
});

// 인덱스 설정
UserCouponSchema.index({ userId: 1, status: 1 });
UserCouponSchema.index({ code: 1, userId: 1 });

// 사용자는 같은 쿠폰을 userUsageLimit 만큼만 다운로드 가능
UserCouponSchema.index({ userId: 1, couponId: 1 }, { unique: false });

export default mongoose.models.UserCoupon || mongoose.model<IUserCoupon>('UserCoupon', UserCouponSchema);

