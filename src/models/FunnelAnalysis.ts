import mongoose, { Document, Schema } from 'mongoose';

export interface IFunnelStep extends Document {
  funnelId: mongoose.Types.ObjectId;
  stepName: string;
  stepOrder: number;
  stepType: 'page_view' | 'click' | 'form_submit' | 'purchase' | 'custom';
  conditions: {
    pageUrl?: string;
    elementSelector?: string;
    formName?: string;
    customEvent?: string;
    properties?: Record<string, any>;
  };
  isConversionStep: boolean;
  metadata: {
    description?: string;
    category?: string;
    tags?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IFunnelAnalysis extends Document {
  name: string;
  description: string;
  isActive: boolean;
  steps: mongoose.Types.ObjectId[];
  timeWindow: {
    startDate: Date;
    endDate: Date;
    timezone: string;
  };
  filters: {
    userSegments?: mongoose.Types.ObjectId[];
    deviceTypes?: string[];
    trafficSources?: string[];
    countries?: string[];
    customFilters?: Record<string, any>;
  };
  metrics: {
    totalUsers: number;
    stepConversions: Array<{
      stepId: mongoose.Types.ObjectId;
      stepName: string;
      users: number;
      conversionRate: number;
      dropOffRate: number;
      avgTimeToStep: number; // 평균 도달 시간 (분)
    }>;
    overallConversionRate: number;
    totalDropOffRate: number;
    avgTimeToConversion: number;
    lastCalculatedAt: Date;
  };
  insights: Array<{
    type: 'bottleneck' | 'opportunity' | 'anomaly' | 'trend';
    stepId: mongoose.Types.ObjectId;
    stepName: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    data: any;
  }>;
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    category: 'conversion' | 'onboarding' | 'checkout' | 'engagement' | 'custom';
    tags: string[];
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IFunnelEvent extends Document {
  funnelId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  stepId: mongoose.Types.ObjectId;
  stepName: string;
  stepOrder: number;
  eventType: string;
  eventData: {
    pageUrl?: string;
    elementSelector?: string;
    formData?: any;
    customData?: any;
    timestamp: Date;
  };
  userContext: {
    deviceType: string;
    browser: string;
    country: string;
    trafficSource: string;
    userSegment?: mongoose.Types.ObjectId;
  };
  conversionData?: {
    isConversion: boolean;
    conversionValue?: number;
    conversionTime: number; // 단계 도달까지의 시간 (초)
  };
  createdAt: Date;
}

const FunnelStepSchema: Schema = new Schema({
  funnelId: { type: Schema.Types.ObjectId, ref: 'FunnelAnalysis', required: true },
  stepName: { type: String, required: true },
  stepOrder: { type: Number, required: true },
  stepType: {
    type: String,
    enum: ['page_view', 'click', 'form_submit', 'purchase', 'custom'],
    required: true
  },
  conditions: {
    pageUrl: { type: String },
    elementSelector: { type: String },
    formName: { type: String },
    customEvent: { type: String },
    properties: { type: Schema.Types.Mixed }
  },
  isConversionStep: { type: Boolean, default: false },
  metadata: {
    description: { type: String },
    category: { type: String },
    tags: [{ type: String }]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const FunnelAnalysisSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  steps: [{ type: Schema.Types.ObjectId, ref: 'FunnelStep' }],
  timeWindow: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    timezone: { type: String, default: 'Asia/Seoul' }
  },
  filters: {
    userSegments: [{ type: Schema.Types.ObjectId, ref: 'CustomerSegment' }],
    deviceTypes: [{ type: String, enum: ['desktop', 'mobile', 'tablet'] }],
    trafficSources: [{ type: String }],
    countries: [{ type: String }],
    customFilters: { type: Schema.Types.Mixed }
  },
  metrics: {
    totalUsers: { type: Number, default: 0 },
    stepConversions: [{
      stepId: { type: Schema.Types.ObjectId, ref: 'FunnelStep' },
      stepName: { type: String },
      users: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      dropOffRate: { type: Number, default: 0 },
      avgTimeToStep: { type: Number, default: 0 }
    }],
    overallConversionRate: { type: Number, default: 0 },
    totalDropOffRate: { type: Number, default: 0 },
    avgTimeToConversion: { type: Number, default: 0 },
    lastCalculatedAt: { type: Date, default: Date.now }
  },
  insights: [{
    type: {
      type: String,
      enum: ['bottleneck', 'opportunity', 'anomaly', 'trend']
    },
    stepId: { type: Schema.Types.ObjectId, ref: 'FunnelStep' },
    stepName: { type: String },
    message: { type: String },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    recommendations: [{ type: String }],
    data: { type: Schema.Types.Mixed }
  }],
  metadata: {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['conversion', 'onboarding', 'checkout', 'engagement', 'custom'],
      default: 'conversion'
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

const FunnelEventSchema: Schema = new Schema({
  funnelId: { type: Schema.Types.ObjectId, ref: 'FunnelAnalysis', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true },
  stepId: { type: Schema.Types.ObjectId, ref: 'FunnelStep', required: true },
  stepName: { type: String, required: true },
  stepOrder: { type: Number, required: true },
  eventType: { type: String, required: true },
  eventData: {
    pageUrl: { type: String },
    elementSelector: { type: String },
    formData: { type: Schema.Types.Mixed },
    customData: { type: Schema.Types.Mixed },
    timestamp: { type: Date, required: true }
  },
  userContext: {
    deviceType: { type: String, required: true },
    browser: { type: String, required: true },
    country: { type: String, required: true },
    trafficSource: { type: String, required: true },
    userSegment: { type: Schema.Types.ObjectId, ref: 'CustomerSegment' }
  },
  conversionData: {
    isConversion: { type: Boolean, default: false },
    conversionValue: { type: Number },
    conversionTime: { type: Number }
  },
  createdAt: { type: Date, default: Date.now }
});

// 인덱스 설정
FunnelStepSchema.index({ funnelId: 1, stepOrder: 1 });
FunnelStepSchema.index({ stepType: 1 });

FunnelAnalysisSchema.index({ isActive: 1, createdAt: -1 });
FunnelAnalysisSchema.index({ 'metadata.createdBy': 1 });
FunnelAnalysisSchema.index({ 'timeWindow.startDate': 1, 'timeWindow.endDate': 1 });

FunnelEventSchema.index({ funnelId: 1, userId: 1, createdAt: -1 });
FunnelEventSchema.index({ funnelId: 1, stepId: 1, createdAt: -1 });
FunnelEventSchema.index({ sessionId: 1, createdAt: -1 });
FunnelEventSchema.index({ 'conversionData.isConversion': 1 });

export const FunnelStep = mongoose.models.FunnelStep || mongoose.model<IFunnelStep>('FunnelStep', FunnelStepSchema);
export const FunnelAnalysis = mongoose.models.FunnelAnalysis || mongoose.model<IFunnelAnalysis>('FunnelAnalysis', FunnelAnalysisSchema);
export const FunnelEvent = mongoose.models.FunnelEvent || mongoose.model<IFunnelEvent>('FunnelEvent', FunnelEventSchema);















