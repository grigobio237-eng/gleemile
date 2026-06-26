import mongoose, { Document, Schema } from 'mongoose';

export interface IUserProfile extends Document {
  userId: string; // 이메일 주소
  preferences: {
    // 제품 선호도
    productCategories: Array<{
      category: string;
      preferenceScore: number; // 0-1
      lastUpdated: Date;
    }>;
    brands: Array<{
      brand: string;
      preferenceScore: number;
      lastUpdated: Date;
    }>;
    priceRange: {
      min: number;
      max: number;
      preferred: number;
    };
    // 행동 패턴
    browsingPatterns: {
      preferredTimeSlots: number[]; // 시간대 (0-23)
      preferredDays: number[]; // 요일 (0-6)
      sessionDuration: {
        average: number; // 평균 세션 시간 (분)
        typical: number; // 일반적인 세션 시간
      };
      pageViewsPerSession: {
        average: number;
        typical: number;
      };
    };
    // 구매 패턴
    purchasePatterns: {
      frequency: number; // 월 구매 빈도
      averageOrderValue: number;
      preferredPaymentMethod: string;
      preferredShippingMethod: string;
      seasonalPreferences: Array<{
        season: 'spring' | 'summer' | 'fall' | 'winter';
        preferenceScore: number;
      }>;
    };
    // 콘텐츠 선호도
    contentPreferences: {
      preferredContentTypes: string[]; // blog, video, image, etc.
      preferredTopics: string[];
      readingTime: {
        average: number; // 평균 읽기 시간 (분)
        typical: number;
      };
    };
    // UI 선호도
    uiPreferences: {
      theme: 'light' | 'dark' | 'auto';
      language: string;
      fontSize: 'small' | 'medium' | 'large';
      layout: 'grid' | 'list' | 'compact';
      showRecommendations: boolean;
      showReviews: boolean;
      showPriceHistory: boolean;
    };
  };
  behaviorHistory: Array<{
    action: string; // view, click, purchase, search, etc.
    itemId: string;
    itemType: 'product' | 'content' | 'category' | 'brand';
    timestamp: Date;
    context: {
      page: string;
      referrer?: string;
      device: string;
      location?: string;
    };
    metadata: Record<string, any>;
  }>;
  recommendationHistory: Array<{
    recommendationId: string;
    algorithm: string;
    itemId: string;
    itemType: string;
    score: number;
    shownAt: Date;
    clicked: boolean;
    purchased: boolean;
    feedback?: 'positive' | 'negative' | 'neutral';
  }>;
  personalizationScore: {
    overall: number; // 0-1, 개인화 수준
    productRecommendations: number;
    contentRecommendations: number;
    uiCustomization: number;
    marketingPersonalization: number;
    lastUpdated: Date;
  };
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    lastActive: Date;
    dataQuality: 'high' | 'medium' | 'low';
    privacySettings: {
      allowPersonalization: boolean;
      allowDataCollection: boolean;
      allowMarketingPersonalization: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IPersonalizationRule extends Document {
  name: string;
  description: string;
  ruleType: 'recommendation' | 'content' | 'ui' | 'pricing' | 'marketing' | 'custom';
  conditions: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in' | 'between';
    value: any;
    weight: number; // 조건의 중요도 (0-1)
  }>;
  actions: Array<{
    type: 'show_recommendation' | 'hide_content' | 'change_layout' | 'adjust_price' | 'send_notification' | 'custom';
    parameters: Record<string, any>;
    priority: number; // 실행 우선순위
  }>;
  targetAudience: {
    userSegments: mongoose.Types.ObjectId[];
    demographics: {
      ageRange?: { min: number; max: number };
      gender?: string[];
      location?: string[];
    };
    behaviorPatterns: {
      purchaseHistory?: {
        minOrders: number;
        maxOrders?: number;
        minValue: number;
        maxValue?: number;
      };
      browsingPatterns?: {
        minSessions: number;
        minPageViews: number;
      };
    };
  };
  isActive: boolean;
  priority: number; // 규칙 우선순위
  effectiveness: {
    impressions: number;
    clicks: number;
    conversions: number;
    clickThroughRate: number;
    conversionRate: number;
    lastCalculated: Date;
  };
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    category: string;
    tags: string[];
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IPersonalizationExperiment extends Document {
  name: string;
  description: string;
  experimentType: 'ab_test' | 'multivariate' | 'bandit' | 'custom';
  hypothesis: string;
  variants: Array<{
    name: string;
    description: string;
    configuration: Record<string, any>;
    trafficAllocation: number; // 0-1, 트래픽 할당 비율
  }>;
  targetAudience: {
    userSegments: mongoose.Types.ObjectId[];
    criteria: Record<string, any>;
  };
  metrics: {
    primary: string; // 주요 지표
    secondary: string[]; // 보조 지표
    successCriteria: {
      metric: string;
      threshold: number;
      operator: 'greater_than' | 'less_than' | 'equals';
    };
  };
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  results: {
    totalUsers: number;
    variantResults: Array<{
      variantName: string;
      users: number;
      conversions: number;
      conversionRate: number;
      confidence: number;
      statisticalSignificance: boolean;
    }>;
    winner?: string;
    recommendation?: string;
  };
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    category: string;
    tags: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IPersonalizationInsight extends Document {
  userId?: mongoose.Types.ObjectId;
  segmentId?: mongoose.Types.ObjectId;
  insightType: 'preference' | 'behavior' | 'trend' | 'anomaly' | 'opportunity' | 'custom';
  title: string;
  description: string;
  confidence: number; // 0-1, 인사이트 신뢰도
  impact: 'low' | 'medium' | 'high' | 'critical';
  data: {
    metrics: Record<string, number>;
    trends: Array<{
      period: string;
      value: number;
      change: number;
    }>;
    comparisons: Array<{
      group: string;
      value: number;
      difference: number;
    }>;
  };
  recommendations: Array<{
    action: string;
    description: string;
    expectedImpact: string;
    implementation: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  isActionable: boolean;
  isResolved: boolean;
  resolvedAt?: Date;
  metadata: {
    generatedBy: mongoose.Types.ObjectId;
    generatedAt: Date;
    algorithm: string;
    dataSource: string[];
  };
  createdAt: Date;
}

const UserProfileSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true }, // 이메일 주소
  preferences: {
    productCategories: [{
      category: { type: String, required: true },
      preferenceScore: { type: Number, min: 0, max: 1, required: true },
      lastUpdated: { type: Date, required: true }
    }],
    brands: [{
      brand: { type: String, required: true },
      preferenceScore: { type: Number, min: 0, max: 1, required: true },
      lastUpdated: { type: Date, required: true }
    }],
    priceRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      preferred: { type: Number, required: true }
    },
    browsingPatterns: {
      preferredTimeSlots: [{ type: Number, min: 0, max: 23 }],
      preferredDays: [{ type: Number, min: 0, max: 6 }],
      sessionDuration: {
        average: { type: Number, required: true },
        typical: { type: Number, required: true }
      },
      pageViewsPerSession: {
        average: { type: Number, required: true },
        typical: { type: Number, required: true }
      }
    },
    purchasePatterns: {
      frequency: { type: Number, required: true },
      averageOrderValue: { type: Number, required: true },
      preferredPaymentMethod: { type: String, required: true },
      preferredShippingMethod: { type: String, required: true },
      seasonalPreferences: [{
        season: { type: String, enum: ['spring', 'summer', 'fall', 'winter'], required: true },
        preferenceScore: { type: Number, min: 0, max: 1, required: true }
      }]
    },
    contentPreferences: {
      preferredContentTypes: [{ type: String }],
      preferredTopics: [{ type: String }],
      readingTime: {
        average: { type: Number, required: true },
        typical: { type: Number, required: true }
      }
    },
    uiPreferences: {
      theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
      language: { type: String, default: 'ko' },
      fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
      layout: { type: String, enum: ['grid', 'list', 'compact'], default: 'grid' },
      showRecommendations: { type: Boolean, default: true },
      showReviews: { type: Boolean, default: true },
      showPriceHistory: { type: Boolean, default: false }
    }
  },
  behaviorHistory: [{
    action: { type: String, required: true },
    itemId: { type: String, required: true },
    itemType: { type: String, enum: ['product', 'content', 'category', 'brand'], required: true },
    timestamp: { type: Date, required: true },
    context: {
      page: { type: String, required: true },
      referrer: { type: String },
      device: { type: String, required: true },
      location: { type: String }
    },
    metadata: { type: Schema.Types.Mixed }
  }],
  recommendationHistory: [{
    recommendationId: { type: String, required: true },
    algorithm: { type: String, required: true },
    itemId: { type: String, required: true },
    itemType: { type: String, required: true },
    score: { type: Number, required: true },
    shownAt: { type: Date, required: true },
    clicked: { type: Boolean, default: false },
    purchased: { type: Boolean, default: false },
    feedback: { type: String, enum: ['positive', 'negative', 'neutral'] }
  }],
  personalizationScore: {
    overall: { type: Number, min: 0, max: 1, required: true },
    productRecommendations: { type: Number, min: 0, max: 1, required: true },
    contentRecommendations: { type: Number, min: 0, max: 1, required: true },
    uiCustomization: { type: Number, min: 0, max: 1, required: true },
    marketingPersonalization: { type: Number, min: 0, max: 1, required: true },
    lastUpdated: { type: Date, required: true }
  },
  metadata: {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastActive: { type: Date, required: true },
    dataQuality: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    privacySettings: {
      allowPersonalization: { type: Boolean, default: true },
      allowDataCollection: { type: Boolean, default: true },
      allowMarketingPersonalization: { type: Boolean, default: true }
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PersonalizationRuleSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  ruleType: {
    type: String,
    enum: ['recommendation', 'content', 'ui', 'pricing', 'marketing', 'custom'],
    required: true
  },
  conditions: [{
    field: { type: String, required: true },
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in', 'not_in', 'between'],
      required: true
    },
    value: { type: Schema.Types.Mixed, required: true },
    weight: { type: Number, min: 0, max: 1, required: true }
  }],
  actions: [{
    type: {
      type: String,
      enum: ['show_recommendation', 'hide_content', 'change_layout', 'adjust_price', 'send_notification', 'custom'],
      required: true
    },
    parameters: { type: Schema.Types.Mixed, required: true },
    priority: { type: Number, required: true }
  }],
  targetAudience: {
    userSegments: [{ type: Schema.Types.ObjectId, ref: 'CustomerSegment' }],
    demographics: {
      ageRange: {
        min: { type: Number },
        max: { type: Number }
      },
      gender: [{ type: String }],
      location: [{ type: String }]
    },
    behaviorPatterns: {
      purchaseHistory: {
        minOrders: { type: Number },
        maxOrders: { type: Number },
        minValue: { type: Number },
        maxValue: { type: Number }
      },
      browsingPatterns: {
        minSessions: { type: Number },
        minPageViews: { type: Number }
      }
    }
  },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, required: true },
  effectiveness: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    clickThroughRate: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    lastCalculated: { type: Date, default: Date.now }
  },
  metadata: {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    tags: [{ type: String }],
    version: { type: String, default: '1.0.0' },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'development'
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PersonalizationExperimentSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  experimentType: {
    type: String,
    enum: ['ab_test', 'multivariate', 'bandit', 'custom'],
    required: true
  },
  hypothesis: { type: String, required: true },
  variants: [{
    name: { type: String, required: true },
    description: { type: String, required: true },
    configuration: { type: Schema.Types.Mixed, required: true },
    trafficAllocation: { type: Number, min: 0, max: 1, required: true }
  }],
  targetAudience: {
    userSegments: [{ type: Schema.Types.ObjectId, ref: 'CustomerSegment' }],
    criteria: { type: Schema.Types.Mixed }
  },
  metrics: {
    primary: { type: String, required: true },
    secondary: [{ type: String }],
    successCriteria: {
      metric: { type: String, required: true },
      threshold: { type: Number, required: true },
      operator: {
        type: String,
        enum: ['greater_than', 'less_than', 'equals'],
        required: true
      }
    }
  },
  status: {
    type: String,
    enum: ['draft', 'running', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  results: {
    totalUsers: { type: Number, default: 0 },
    variantResults: [{
      variantName: { type: String, required: true },
      users: { type: Number, required: true },
      conversions: { type: Number, required: true },
      conversionRate: { type: Number, required: true },
      confidence: { type: Number, required: true },
      statisticalSignificance: { type: Boolean, required: true }
    }],
    winner: { type: String },
    recommendation: { type: String }
  },
  metadata: {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    tags: [{ type: String }]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PersonalizationInsightSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  segmentId: { type: Schema.Types.ObjectId, ref: 'CustomerSegment' },
  insightType: {
    type: String,
    enum: ['preference', 'behavior', 'trend', 'anomaly', 'opportunity', 'custom'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 1, required: true },
  impact: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  data: {
    metrics: { type: Schema.Types.Mixed, required: true },
    trends: [{
      period: { type: String, required: true },
      value: { type: Number, required: true },
      change: { type: Number, required: true }
    }],
    comparisons: [{
      group: { type: String, required: true },
      value: { type: Number, required: true },
      difference: { type: Number, required: true }
    }]
  },
  recommendations: [{
    action: { type: String, required: true },
    description: { type: String, required: true },
    expectedImpact: { type: String, required: true },
    implementation: { type: String, required: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    }
  }],
  isActionable: { type: Boolean, default: true },
  isResolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  metadata: {
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    generatedAt: { type: Date, required: true },
    algorithm: { type: String, required: true },
    dataSource: [{ type: String }]
  },
  createdAt: { type: Date, default: Date.now }
});

// 인덱스 설정 (userId는 unique: true로 이미 인덱스가 생성됨)
UserProfileSchema.index({ 'preferences.productCategories.category': 1 });
UserProfileSchema.index({ 'preferences.brands.brand': 1 });
UserProfileSchema.index({ 'behaviorHistory.timestamp': -1 });
UserProfileSchema.index({ 'personalizationScore.overall': -1 });

PersonalizationRuleSchema.index({ ruleType: 1, isActive: 1 });
PersonalizationRuleSchema.index({ priority: -1 });
PersonalizationRuleSchema.index({ 'targetAudience.userSegments': 1 });

PersonalizationExperimentSchema.index({ status: 1, startDate: 1 });
PersonalizationExperimentSchema.index({ 'targetAudience.userSegments': 1 });

PersonalizationInsightSchema.index({ userId: 1, insightType: 1 });
PersonalizationInsightSchema.index({ segmentId: 1, insightType: 1 });
PersonalizationInsightSchema.index({ impact: 1, isResolved: 1 });

export const UserProfile = mongoose.models.UserProfile || mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);
export const PersonalizationRule = mongoose.models.PersonalizationRule || mongoose.model<IPersonalizationRule>('PersonalizationRule', PersonalizationRuleSchema);
export const PersonalizationExperiment = mongoose.models.PersonalizationExperiment || mongoose.model<IPersonalizationExperiment>('PersonalizationExperiment', PersonalizationExperimentSchema);
export const PersonalizationInsight = mongoose.models.PersonalizationInsight || mongoose.model<IPersonalizationInsight>('PersonalizationInsight', PersonalizationInsightSchema);

