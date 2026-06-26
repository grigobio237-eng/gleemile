import mongoose, { Document, Schema } from 'mongoose';

export interface ILTVCalculation extends Document {
  userId: mongoose.Types.ObjectId;
  calculationDate: Date;
  ltvValue: number; // 총 생애 가치
  averageOrderValue: number; // 평균 주문 금액
  purchaseFrequency: number; // 구매 빈도 (월 단위)
  customerLifespan: number; // 고객 생애 기간 (월 단위)
  totalOrders: number; // 총 주문 수
  totalRevenue: number; // 총 수익
  firstPurchaseDate: Date; // 첫 구매일
  lastPurchaseDate: Date; // 마지막 구매일
  isActive: boolean; // 활성 고객 여부
  customerTier: 'new' | 'regular' | 'vip' | 'churned'; // 고객 등급
  ltvTier: 'low' | 'medium' | 'high' | 'premium'; // LTV 등급
  metadata: {
    acquisitionChannel: string; // 획득 채널
    acquisitionCost?: number; // 획득 비용
    predictedLTV?: number; // 예측 LTV
    churnProbability?: number; // 이탈 확률
    nextPurchasePrediction?: Date; // 다음 구매 예측일
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ILTVSegment extends Document {
  name: string;
  description: string;
  criteria: {
    ltvRange?: {
      min: number;
      max: number;
    };
    customerTier?: string[];
    ltvTier?: string[];
    acquisitionChannel?: string[];
    purchaseFrequency?: {
      min: number;
      max: number;
    };
    customerLifespan?: {
      min: number;
      max: number;
    };
    totalOrders?: {
      min: number;
      max: number;
    };
    customConditions?: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
      value: any;
    }>;
  };
  filters: {
    dateRange?: {
      startDate: Date;
      endDate: Date;
    };
    productCategories?: string[];
    regions?: string[];
    ageRanges?: Array<{ min: number; max: number }>;
    customFilters?: Record<string, any>;
  };
  isActive: boolean;
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    category: 'ltv_tier' | 'customer_behavior' | 'acquisition' | 'retention' | 'custom';
    tags: string[];
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ILTVMetrics extends Document {
  segmentId?: mongoose.Types.ObjectId;
  calculationDate: Date;
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    // 기본 LTV 메트릭
    totalCustomers: number;
    averageLTV: number;
    medianLTV: number;
    totalLTV: number;
    
    // LTV 분포
    ltvDistribution: Array<{
      tier: 'low' | 'medium' | 'high' | 'premium';
      count: number;
      percentage: number;
      averageLTV: number;
    }>;
    
    // 고객 등급별 LTV
    customerTierLTV: Array<{
      tier: 'new' | 'regular' | 'vip' | 'churned';
      count: number;
      averageLTV: number;
      totalLTV: number;
    }>;
    
    // 획득 채널별 LTV
    channelLTV: Array<{
      channel: string;
      count: number;
      averageLTV: number;
      totalLTV: number;
      averageCAC?: number;
      ltvCacRatio?: number;
    }>;
    
    // 제품 카테고리별 LTV
    categoryLTV: Array<{
      category: string;
      count: number;
      averageLTV: number;
      totalLTV: number;
    }>;
    
    // LTV 성장률
    ltvGrowth: {
      period: string;
      previousAverageLTV: number;
      currentAverageLTV: number;
      growthRate: number;
      growthAmount: number;
    };
    
    // 예측 LTV
    predictedLTV: {
      nextMonth: number;
      nextQuarter: number;
      nextYear: number;
      confidence: number; // 예측 신뢰도 (0-1)
    };
  };
  insights: Array<{
    type: 'ltv_insight' | 'growth_insight' | 'segment_insight' | 'prediction_insight';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    data: any;
  }>;
  metadata: {
    calculatedBy: mongoose.Types.ObjectId;
    calculationMethod: 'historical' | 'predicted' | 'hybrid';
    dataQuality: 'high' | 'medium' | 'low';
  };
  createdAt: Date;
}

export interface ILTVComparison extends Document {
  name: string;
  description: string;
  segments: Array<{
    segmentId: mongoose.Types.ObjectId;
    segmentName: string;
    timeRange: {
      startDate: Date;
      endDate: Date;
    };
  }>;
  comparisonType: 'ltv' | 'growth' | 'distribution' | 'channel' | 'category';
  metrics: {
    averageLTV: number;
    medianLTV: number;
    totalLTV: number;
    ltvGrowthRate: number;
    bestPerformingSegment: string;
    worstPerformingSegment: string;
  };
  insights: Array<{
    type: 'best_performing' | 'worst_performing' | 'trend' | 'anomaly' | 'opportunity';
    segmentName: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    data: any;
  }>;
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
  };
}

const LTVCalculationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  calculationDate: { type: Date, required: true },
  ltvValue: { type: Number, required: true },
  averageOrderValue: { type: Number, required: true },
  purchaseFrequency: { type: Number, required: true },
  customerLifespan: { type: Number, required: true },
  totalOrders: { type: Number, required: true },
  totalRevenue: { type: Number, required: true },
  firstPurchaseDate: { type: Date, required: true },
  lastPurchaseDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  customerTier: {
    type: String,
    enum: ['new', 'regular', 'vip', 'churned'],
    required: true
  },
  ltvTier: {
    type: String,
    enum: ['low', 'medium', 'high', 'premium'],
    required: true
  },
  metadata: {
    acquisitionChannel: { type: String, required: true },
    acquisitionCost: { type: Number },
    predictedLTV: { type: Number },
    churnProbability: { type: Number },
    nextPurchasePrediction: { type: Date }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const LTVSegmentSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  criteria: {
    ltvRange: {
      min: { type: Number },
      max: { type: Number }
    },
    customerTier: [{ type: String, enum: ['new', 'regular', 'vip', 'churned'] }],
    ltvTier: [{ type: String, enum: ['low', 'medium', 'high', 'premium'] }],
    acquisitionChannel: [{ type: String }],
    purchaseFrequency: {
      min: { type: Number },
      max: { type: Number }
    },
    customerLifespan: {
      min: { type: Number },
      max: { type: Number }
    },
    totalOrders: {
      min: { type: Number },
      max: { type: Number }
    },
    customConditions: [{
      field: { type: String },
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'between', 'in', 'not_in']
      },
      value: { type: Schema.Types.Mixed }
    }]
  },
  filters: {
    dateRange: {
      startDate: { type: Date },
      endDate: { type: Date }
    },
    productCategories: [{ type: String }],
    regions: [{ type: String }],
    ageRanges: [{
      min: { type: Number },
      max: { type: Number }
    }],
    customFilters: { type: Schema.Types.Mixed }
  },
  isActive: { type: Boolean, default: true },
  metadata: {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['ltv_tier', 'customer_behavior', 'acquisition', 'retention', 'custom'],
      default: 'ltv_tier'
    },
    tags: [{ type: String }],
    version: { type: String, default: '1.0.0' },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'production'
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const LTVMetricsSchema: Schema = new Schema({
  segmentId: { type: Schema.Types.ObjectId, ref: 'LTVSegment' },
  calculationDate: { type: Date, required: true },
  timeRange: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  metrics: {
    totalCustomers: { type: Number, required: true },
    averageLTV: { type: Number, required: true },
    medianLTV: { type: Number, required: true },
    totalLTV: { type: Number, required: true },
    
    ltvDistribution: [{
      tier: { type: String, enum: ['low', 'medium', 'high', 'premium'] },
      count: { type: Number, required: true },
      percentage: { type: Number, required: true },
      averageLTV: { type: Number, required: true }
    }],
    
    customerTierLTV: [{
      tier: { type: String, enum: ['new', 'regular', 'vip', 'churned'] },
      count: { type: Number, required: true },
      averageLTV: { type: Number, required: true },
      totalLTV: { type: Number, required: true }
    }],
    
    channelLTV: [{
      channel: { type: String, required: true },
      count: { type: Number, required: true },
      averageLTV: { type: Number, required: true },
      totalLTV: { type: Number, required: true },
      averageCAC: { type: Number },
      ltvCacRatio: { type: Number }
    }],
    
    categoryLTV: [{
      category: { type: String, required: true },
      count: { type: Number, required: true },
      averageLTV: { type: Number, required: true },
      totalLTV: { type: Number, required: true }
    }],
    
    ltvGrowth: {
      period: { type: String, required: true },
      previousAverageLTV: { type: Number, required: true },
      currentAverageLTV: { type: Number, required: true },
      growthRate: { type: Number, required: true },
      growthAmount: { type: Number, required: true }
    },
    
    predictedLTV: {
      nextMonth: { type: Number, required: true },
      nextQuarter: { type: Number, required: true },
      nextYear: { type: Number, required: true },
      confidence: { type: Number, required: true }
    }
  },
  insights: [{
    type: {
      type: String,
      enum: ['ltv_insight', 'growth_insight', 'segment_insight', 'prediction_insight']
    },
    message: { type: String, required: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    recommendations: [{ type: String }],
    data: { type: Schema.Types.Mixed }
  }],
  metadata: {
    calculatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    calculationMethod: {
      type: String,
      enum: ['historical', 'predicted', 'hybrid'],
      default: 'historical'
    },
    dataQuality: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'high'
    }
  },
  createdAt: { type: Date, default: Date.now }
});

const LTVComparisonSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  segments: [{
    segmentId: { type: Schema.Types.ObjectId, ref: 'LTVSegment', required: true },
    segmentName: { type: String, required: true },
    timeRange: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true }
    }
  }],
  comparisonType: {
    type: String,
    enum: ['ltv', 'growth', 'distribution', 'channel', 'category'],
    required: true
  },
  metrics: {
    averageLTV: { type: Number, required: true },
    medianLTV: { type: Number, required: true },
    totalLTV: { type: Number, required: true },
    ltvGrowthRate: { type: Number, required: true },
    bestPerformingSegment: { type: String, required: true },
    worstPerformingSegment: { type: String, required: true }
  },
  insights: [{
    type: {
      type: String,
      enum: ['best_performing', 'worst_performing', 'trend', 'anomaly', 'opportunity']
    },
    segmentName: { type: String, required: true },
    message: { type: String, required: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    recommendations: [{ type: String }],
    data: { type: Schema.Types.Mixed }
  }],
  metadata: {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  }
});

// 인덱스 설정
LTVCalculationSchema.index({ userId: 1, calculationDate: -1 });
LTVCalculationSchema.index({ ltvTier: 1, customerTier: 1 });
LTVCalculationSchema.index({ 'metadata.acquisitionChannel': 1 });
LTVCalculationSchema.index({ isActive: 1 });

LTVSegmentSchema.index({ isActive: 1, createdAt: -1 });
LTVSegmentSchema.index({ 'metadata.createdBy': 1 });
LTVSegmentSchema.index({ 'metadata.category': 1 });

LTVMetricsSchema.index({ segmentId: 1, calculationDate: -1 });
LTVMetricsSchema.index({ calculationDate: -1 });

LTVComparisonSchema.index({ 'metadata.createdBy': 1 });
LTVComparisonSchema.index({ comparisonType: 1 });

export const LTVCalculation = mongoose.models.LTVCalculation || mongoose.model<ILTVCalculation>('LTVCalculation', LTVCalculationSchema);
export const LTVSegment = mongoose.models.LTVSegment || mongoose.model<ILTVSegment>('LTVSegment', LTVSegmentSchema);
export const LTVMetrics = mongoose.models.LTVMetrics || mongoose.model<ILTVMetrics>('LTVMetrics', LTVMetricsSchema);
export const LTVComparison = mongoose.models.LTVComparison || mongoose.model<ILTVComparison>('LTVComparison', LTVComparisonSchema);















