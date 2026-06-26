import mongoose, { Document, Schema } from 'mongoose';

export interface IPromotion extends Document {
  name: string;
  description?: string;
  type: 'discount' | 'bundle' | 'free_shipping' | 'buy_x_get_y' | 'flash_sale' | 'seasonal';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  
  // 할인 설정
  discountType?: 'percentage' | 'fixed' | 'free_item';
  discountValue?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  
  // 번들 설정
  bundleProducts?: Array<{
    productId: mongoose.Types.ObjectId;
    quantity: number;
    discountPercentage?: number;
  }>;
  
  // Buy X Get Y 설정
  buyXGetY?: {
    buyQuantity: number;
    getQuantity: number;
    getProductId: mongoose.Types.ObjectId;
    discountPercentage?: number;
  };
  
  // 플래시 세일 설정
  flashSale?: {
    originalPrice: number;
    salePrice: number;
    stockLimit?: number;
    soldCount: number;
  };
  
  // 적용 대상
  targetType: 'all' | 'products' | 'categories' | 'brands' | 'users';
  targetIds?: mongoose.Types.ObjectId[] | string[];
  excludedProducts?: mongoose.Types.ObjectId[];
  excludedCategories?: string[];
  
  // 사용자 조건
  userConditions?: {
    userGrades?: string[];
    minOrderCount?: number;
    maxOrderCount?: number;
    minTotalSpent?: number;
    maxTotalSpent?: number;
    newCustomersOnly?: boolean;
    existingCustomersOnly?: boolean;
  };
  
  // 시간 설정
  startDate: Date;
  endDate: Date;
  timezone?: string;
  
  // 사용 제한
  usageLimit?: number;
  usageCount: number;
  userUsageLimit?: number;
  
  // 우선순위 (높을수록 우선 적용)
  priority: number;
  
  // 자동화 설정
  automation?: {
    enabled: boolean;
    triggerType: 'time' | 'inventory' | 'sales' | 'user_behavior';
    triggerConditions: any;
    actions: Array<{
      type: 'activate' | 'deactivate' | 'notify' | 'extend';
      parameters: any;
    }>;
  };
  
  // 통계
  stats?: {
    totalViews: number;
    totalClicks: number;
    totalOrders: number;
    totalRevenue: number;
    conversionRate: number;
    avgOrderValue: number;
  };
  
  // 메타데이터
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>({
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
    enum: ['discount', 'bundle', 'free_shipping', 'buy_x_get_y', 'flash_sale', 'seasonal'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  
  // 할인 설정
  discountType: {
    type: String,
    enum: ['percentage', 'fixed', 'free_item']
  },
  discountValue: {
    type: Number,
    min: 0
  },
  maxDiscountAmount: {
    type: Number,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    min: 0
  },
  
  // 번들 설정
  bundleProducts: [{
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: {
      type: Number,
      min: 1
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  
  // Buy X Get Y 설정
  buyXGetY: {
    buyQuantity: {
      type: Number,
      min: 1
    },
    getQuantity: {
      type: Number,
      min: 1
    },
    getProductId: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  
  // 플래시 세일 설정
  flashSale: {
    originalPrice: {
      type: Number,
      min: 0
    },
    salePrice: {
      type: Number,
      min: 0
    },
    stockLimit: {
      type: Number,
      min: 1
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // 적용 대상
  targetType: {
    type: String,
    enum: ['all', 'products', 'categories', 'brands', 'users'],
    default: 'all'
  },
  targetIds: [Schema.Types.Mixed],
  excludedProducts: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludedCategories: [String],
  
  // 사용자 조건
  userConditions: {
    userGrades: [{
      type: String,
      enum: ['cedar', 'rooter', 'bloomer', 'glower', 'ecosoul']
    }],
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
    newCustomersOnly: {
      type: Boolean,
      default: false
    },
    existingCustomersOnly: {
      type: Boolean,
      default: false
    }
  },
  
  // 시간 설정
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  timezone: {
    type: String,
    default: 'Asia/Seoul'
  },
  
  // 사용 제한
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
  
  // 우선순위
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  
  // 자동화 설정
  automation: {
    enabled: {
      type: Boolean,
      default: false
    },
    triggerType: {
      type: String,
      enum: ['time', 'inventory', 'sales', 'user_behavior']
    },
    triggerConditions: Schema.Types.Mixed,
    actions: [{
      type: {
        type: String,
        enum: ['activate', 'deactivate', 'notify', 'extend']
      },
      parameters: Schema.Types.Mixed
    }]
  },
  
  // 통계
  stats: {
    totalViews: {
      type: Number,
      default: 0
    },
    totalClicks: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    avgOrderValue: {
      type: Number,
      default: 0
    }
  },
  
  // 메타데이터
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// 인덱스 설정
PromotionSchema.index({ status: 1 });
PromotionSchema.index({ type: 1 });
PromotionSchema.index({ startDate: 1, endDate: 1 });
PromotionSchema.index({ priority: -1 });
PromotionSchema.index({ targetType: 1, targetIds: 1 });
PromotionSchema.index({ tags: 1 });
PromotionSchema.index({ createdAt: -1 });

// 가상 필드: 활성 상태 확인
PromotionSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.startDate <= now && 
         this.endDate >= now;
});

// 가상 필드: 남은 시간 (초)
PromotionSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  if (this.endDate <= now) return 0;
  return Math.floor((this.endDate.getTime() - now.getTime()) / 1000);
});

// 가상 필드: 진행률 (플래시 세일용)
PromotionSchema.virtual('progressPercentage').get(function() {
  if (this.type === 'flash_sale' && this.flashSale?.stockLimit) {
    return Math.min(100, (this.flashSale.soldCount / this.flashSale.stockLimit) * 100);
  }
  return 0;
});

// 만료된 프로모션 자동 완료 처리
PromotionSchema.pre('save', function(next) {
  if (this.endDate < new Date() && this.status === 'active') {
    this.status = 'completed';
  }
  next();
});

export default mongoose.models.Promotion || mongoose.model<IPromotion>('Promotion', PromotionSchema);















