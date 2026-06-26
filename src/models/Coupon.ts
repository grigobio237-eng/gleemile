import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number; // 퍼센트(0-100) 또는 고정금액
  minOrderAmount?: number; // 최소 주문 금액
  maxDiscountAmount?: number; // 최대 할인 금액 (퍼센트 쿠폰의 경우)
  usageLimit?: number; // 총 사용 가능 횟수
  usageCount: number; // 현재 사용된 횟수
  userUsageLimit?: number; // 사용자당 사용 가능 횟수
  status: 'active' | 'inactive' | 'expired';
  validityType: 'fixed' | 'from_download'; // 유효기간 설정 방식
  validFrom: Date;
  validUntil: Date;
  validityDurationDays?: number; // 다운로드 시점부터 유효기간 (일)
  applicableProducts?: mongoose.Types.ObjectId[]; // 적용 가능한 상품들
  applicableCategories?: string[]; // 적용 가능한 카테고리들
  excludedProducts?: mongoose.Types.ObjectId[]; // 제외할 상품들
  targetAudience: 'all' | 'new_customers' | 'existing_customers' | 'vip_customers';
  conditions?: {
    minOrderCount?: number; // 최소 주문 횟수
    maxOrderCount?: number; // 최대 주문 횟수
    minTotalSpent?: number; // 최소 총 구매 금액
    maxTotalSpent?: number; // 최대 총 구매 금액
    userGrades?: string[]; // 적용 가능한 사용자 등급
  };
  createdBy: mongoose.Types.ObjectId; // 생성한 관리자
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'free_shipping'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    min: 0
  },
  maxDiscountAmount: {
    type: Number,
    min: 0
  },
  usageLimit: {
    type: Number,
    min: 1
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  userUsageLimit: {
    type: Number,
    min: 1,
    default: 1
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  validityType: {
    type: String,
    enum: ['fixed', 'from_download'],
    default: 'fixed'
  },
  validFrom: {
    type: Date,
    required: function (this: any): boolean {
      return this.validityType === 'fixed';
    },
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: function (this: any): boolean {
      return this.validityType === 'fixed';
    }
  },
  validityDurationDays: {
    type: Number,
    min: 1,
    required: function (this: any): boolean {
      return this.validityType === 'from_download';
    }
  },
  applicableProducts: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: String,
    trim: true
  }],
  excludedProducts: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  targetAudience: {
    type: String,
    enum: ['all', 'new_customers', 'existing_customers', 'vip_customers'],
    default: 'all'
  },
  conditions: {
    minOrderCount: {
      type: Number,
      min: 0
    },
    maxOrderCount: {
      type: Number,
      min: 0
    },
    minTotalSpent: {
      type: Number,
      min: 0
    },
    maxTotalSpent: {
      type: Number,
      min: 0
    },
    userGrades: [{
      type: String,
      enum: ['cedar', 'rooter', 'bloomer', 'glower', 'ecosoul']
    }]
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// 인덱스 설정
CouponSchema.index({ status: 1 });
CouponSchema.index({ validFrom: 1, validUntil: 1 });
CouponSchema.index({ targetAudience: 1 });
CouponSchema.index({ createdAt: -1 });

// 쿠폰 코드 중복 방지
CouponSchema.pre('save', async function (next) {
  if (this.isNew) {
    const existing = await mongoose.model('Coupon').findOne({ code: this.code });
    if (existing) {
      const error = new Error('이미 존재하는 쿠폰 코드입니다.');
      return next(error);
    }
  }
  next();
});

// 만료 상태 자동 업데이트
CouponSchema.pre('save', function (next) {
  if (this.validUntil < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

// 가상 필드: 사용 가능 여부
CouponSchema.virtual('isUsable').get(function () {
  const now = new Date();
  return this.status === 'active' &&
    this.validFrom <= now &&
    this.validUntil >= now &&
    (!this.usageLimit || this.usageCount < this.usageLimit);
});

// 가상 필드: 남은 사용 횟수
CouponSchema.virtual('remainingUsage').get(function () {
  if (!this.usageLimit) return null;
  return Math.max(0, this.usageLimit - this.usageCount);
});

export default mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);














