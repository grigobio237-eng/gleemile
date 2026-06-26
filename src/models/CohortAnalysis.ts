import mongoose, { Document, Schema } from 'mongoose';

export interface ICohortDefinition extends Document {
  name: string;
  description: string;
  cohortType: 'signup' | 'first_purchase' | 'product_category' | 'subscription' | 'custom';
  criteria: {
    // 가입 기반 코호트
    signupDateRange?: {
      startDate: Date;
      endDate: Date;
    };
    // 구매 기반 코호트
    firstPurchaseDateRange?: {
      startDate: Date;
      endDate: Date;
    };
    // 제품 카테고리 기반 코호트
    productCategories?: string[];
    // 구독 기반 코호트
    subscriptionTypes?: string[];
    // 커스텀 조건
    customConditions?: {
      field: string;
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
      value: any;
    }[];
  };
  filters: {
    userSegments?: mongoose.Types.ObjectId[];
    deviceTypes?: string[];
    trafficSources?: string[];
    countries?: string[];
    ageRanges?: Array<{ min: number; max: number }>;
    customFilters?: Record<string, any>;
  };
  isActive: boolean;
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    category: 'retention' | 'revenue' | 'engagement' | 'custom';
    tags: string[];
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ICohortMember extends Document {
  cohortId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  cohortDate: Date; // 코호트에 속한 날짜 (가입일, 첫 구매일 등)
  cohortPeriod: string; // 코호트 기간 (예: "2024-01", "2024-Q1")
  userContext: {
    deviceType: string;
    browser: string;
    country: string;
    trafficSource: string;
    userSegment?: mongoose.Types.ObjectId;
    age?: number;
    gender?: string;
  };
  metadata: {
    source: string; // 가입 경로, 구매 경로 등
    campaignId?: string;
    referrer?: string;
    customData?: Record<string, any>;
  };
  createdAt: Date;
}

export interface ICohortMetrics extends Document {
  cohortId: mongoose.Types.ObjectId;
  cohortPeriod: string;
  cohortDate: Date;
  totalMembers: number;
  metrics: {
    // 유지율 메트릭
    retention: Array<{
      period: number; // 코호트 생성 후 N개월/주/일
      periodType: 'day' | 'week' | 'month';
      activeUsers: number;
      retentionRate: number;
      churnRate: number;
    }>;
    // 수익 메트릭
    revenue: Array<{
      period: number;
      periodType: 'day' | 'week' | 'month';
      totalRevenue: number;
      averageRevenuePerUser: number;
      cumulativeRevenue: number;
    }>;
    // 참여도 메트릭
    engagement: Array<{
      period: number;
      periodType: 'day' | 'week' | 'month';
      activeUsers: number;
      averageSessions: number;
      averagePageViews: number;
      averageTimeSpent: number; // 분
    }>;
    // 구매 메트릭
    purchase: Array<{
      period: number;
      periodType: 'day' | 'week' | 'month';
      purchasingUsers: number;
      totalOrders: number;
      averageOrderValue: number;
      repeatPurchaseRate: number;
    }>;
  };
  calculatedAt: Date;
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface ICohortComparison extends Document {
  name: string;
  description: string;
  cohorts: Array<{
    cohortId: mongoose.Types.ObjectId;
    cohortName: string;
    cohortPeriod: string;
  }>;
  comparisonType: 'retention' | 'revenue' | 'engagement' | 'purchase';
  metrics: {
    averageRetentionRate: number;
    averageRevenuePerUser: number;
    averageEngagementScore: number;
    averagePurchaseRate: number;
  };
  insights: Array<{
    type: 'best_performing' | 'worst_performing' | 'trend' | 'anomaly';
    cohortName: string;
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

const CohortDefinitionSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  cohortType: {
    type: String,
    enum: ['signup', 'first_purchase', 'product_category', 'subscription', 'custom'],
    required: true
  },
  criteria: {
    signupDateRange: {
      startDate: { type: Date },
      endDate: { type: Date }
    },
    firstPurchaseDateRange: {
      startDate: { type: Date },
      endDate: { type: Date }
    },
    productCategories: [{ type: String }],
    subscriptionTypes: [{ type: String }],
    customConditions: [{
      field: { type: String },
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in', 'not_in']
      },
      value: { type: Schema.Types.Mixed }
    }]
  },
  filters: {
    userSegments: [{ type: Schema.Types.ObjectId, ref: 'CustomerSegment' }],
    deviceTypes: [{ type: String, enum: ['desktop', 'mobile', 'tablet'] }],
    trafficSources: [{ type: String }],
    countries: [{ type: String }],
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
      enum: ['retention', 'revenue', 'engagement', 'custom'],
      default: 'retention'
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

const CohortMemberSchema: Schema = new Schema({
  cohortId: { type: Schema.Types.ObjectId, ref: 'CohortDefinition', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cohortDate: { type: Date, required: true },
  cohortPeriod: { type: String, required: true },
  userContext: {
    deviceType: { type: String, required: true },
    browser: { type: String, required: true },
    country: { type: String, required: true },
    trafficSource: { type: String, required: true },
    userSegment: { type: Schema.Types.ObjectId, ref: 'CustomerSegment' },
    age: { type: Number },
    gender: { type: String }
  },
  metadata: {
    source: { type: String, required: true },
    campaignId: { type: String },
    referrer: { type: String },
    customData: { type: Schema.Types.Mixed }
  },
  createdAt: { type: Date, default: Date.now }
});

const CohortMetricsSchema: Schema = new Schema({
  cohortId: { type: Schema.Types.ObjectId, ref: 'CohortDefinition', required: true },
  cohortPeriod: { type: String, required: true },
  cohortDate: { type: Date, required: true },
  totalMembers: { type: Number, required: true },
  metrics: {
    retention: [{
      period: { type: Number, required: true },
      periodType: { type: String, enum: ['day', 'week', 'month'], required: true },
      activeUsers: { type: Number, required: true },
      retentionRate: { type: Number, required: true },
      churnRate: { type: Number, required: true }
    }],
    revenue: [{
      period: { type: Number, required: true },
      periodType: { type: String, enum: ['day', 'week', 'month'], required: true },
      totalRevenue: { type: Number, required: true },
      averageRevenuePerUser: { type: Number, required: true },
      cumulativeRevenue: { type: Number, required: true }
    }],
    engagement: [{
      period: { type: Number, required: true },
      periodType: { type: String, enum: ['day', 'week', 'month'], required: true },
      activeUsers: { type: Number, required: true },
      averageSessions: { type: Number, required: true },
      averagePageViews: { type: Number, required: true },
      averageTimeSpent: { type: Number, required: true }
    }],
    purchase: [{
      period: { type: Number, required: true },
      periodType: { type: String, enum: ['day', 'week', 'month'], required: true },
      purchasingUsers: { type: Number, required: true },
      totalOrders: { type: Number, required: true },
      averageOrderValue: { type: Number, required: true },
      repeatPurchaseRate: { type: Number, required: true }
    }]
  },
  calculatedAt: { type: Date, default: Date.now },
  timeRange: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  }
});

const CohortComparisonSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  cohorts: [{
    cohortId: { type: Schema.Types.ObjectId, ref: 'CohortDefinition', required: true },
    cohortName: { type: String, required: true },
    cohortPeriod: { type: String, required: true }
  }],
  comparisonType: {
    type: String,
    enum: ['retention', 'revenue', 'engagement', 'purchase'],
    required: true
  },
  metrics: {
    averageRetentionRate: { type: Number, default: 0 },
    averageRevenuePerUser: { type: Number, default: 0 },
    averageEngagementScore: { type: Number, default: 0 },
    averagePurchaseRate: { type: Number, default: 0 }
  },
  insights: [{
    type: {
      type: String,
      enum: ['best_performing', 'worst_performing', 'trend', 'anomaly']
    },
    cohortName: { type: String, required: true },
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
CohortDefinitionSchema.index({ isActive: 1, createdAt: -1 });
CohortDefinitionSchema.index({ 'metadata.createdBy': 1 });
CohortDefinitionSchema.index({ cohortType: 1 });

CohortMemberSchema.index({ cohortId: 1, userId: 1 });
CohortMemberSchema.index({ cohortId: 1, cohortPeriod: 1 });
CohortMemberSchema.index({ cohortDate: 1 });
CohortMemberSchema.index({ 'userContext.deviceType': 1 });
CohortMemberSchema.index({ 'userContext.trafficSource': 1 });

CohortMetricsSchema.index({ cohortId: 1, cohortPeriod: 1 });
CohortMetricsSchema.index({ calculatedAt: -1 });

CohortComparisonSchema.index({ 'metadata.createdBy': 1 });
CohortComparisonSchema.index({ comparisonType: 1 });

export const CohortDefinition = mongoose.models.CohortDefinition || mongoose.model<ICohortDefinition>('CohortDefinition', CohortDefinitionSchema);
export const CohortMember = mongoose.models.CohortMember || mongoose.model<ICohortMember>('CohortMember', CohortMemberSchema);
export const CohortMetrics = mongoose.models.CohortMetrics || mongoose.model<ICohortMetrics>('CohortMetrics', CohortMetricsSchema);
export const CohortComparison = mongoose.models.CohortComparison || mongoose.model<ICohortComparison>('CohortComparison', CohortComparisonSchema);















