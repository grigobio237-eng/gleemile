import mongoose, { Document, Schema } from 'mongoose';

export interface IAutomationRule extends Document {
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  
  // 트리거 설정
  triggers: {
    type: 'event' | 'schedule' | 'condition' | 'webhook' | 'api';
    eventType?: string;
    eventCategory?: string;
    conditions?: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'not_exists';
      value: any;
      logicalOperator?: 'AND' | 'OR';
    }>;
    schedule?: {
      type: 'daily' | 'weekly' | 'monthly' | 'custom';
      time: string;
      days?: number[];
      cron?: string;
    };
    webhookUrl?: string;
    apiEndpoint?: string;
  };
  
  // 조건 설정
  conditions: {
    userConditions?: Array<{
      field: 'userType' | 'registrationDate' | 'lastLoginDate' | 'totalSpent' | 'orderCount' | 'segmentIds' | 'subscriptionStatus' | 'emailVerified' | 'phoneVerified';
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'between' | 'is_null' | 'is_not_null';
      value: any;
      logicalOperator?: 'AND' | 'OR';
    }>;
    productConditions?: Array<{
      field: 'category' | 'price' | 'stock' | 'rating' | 'tags' | 'brand' | 'isActive';
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'contains' | 'not_contains';
      value: any;
      logicalOperator?: 'AND' | 'OR';
    }>;
    orderConditions?: Array<{
      field: 'status' | 'totalAmount' | 'paymentMethod' | 'shippingMethod' | 'createdAt' | 'updatedAt';
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'between';
      value: any;
      logicalOperator?: 'AND' | 'OR';
    }>;
    behaviorConditions?: Array<{
      field: 'pageViews' | 'sessionDuration' | 'cartAbandonment' | 'searchQueries' | 'emailOpens' | 'emailClicks' | 'lastActivity';
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'between';
      value: any;
      logicalOperator?: 'AND' | 'OR';
    }>;
    timeConditions?: Array<{
      field: 'timeOfDay' | 'dayOfWeek' | 'dayOfMonth' | 'month' | 'season' | 'holiday';
      operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'between';
      value: any;
      logicalOperator?: 'AND' | 'OR';
    }>;
  };
  
  // 액션 설정
  actions: Array<{
    type: 'email' | 'sms' | 'push' | 'coupon' | 'promotion' | 'segment' | 'tag' | 'webhook' | 'api' | 'delay' | 'condition';
    name: string;
    description?: string;
    delay?: number; // 분 단위
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    settings: {
      // 이메일 액션
      emailTemplate?: string;
      emailSubject?: string;
      emailContent?: string;
      emailTo?: string;
      emailCc?: string;
      emailBcc?: string;
      
      // SMS 액션
      smsTemplate?: string;
      smsContent?: string;
      smsTo?: string;
      
      // 푸시 액션
      pushTitle?: string;
      pushBody?: string;
      pushData?: Record<string, any>;
      pushImage?: string;
      pushAction?: string;
      
      // 쿠폰 액션
      couponCode?: string;
      couponType?: 'percentage' | 'fixed' | 'free_shipping';
      couponValue?: number;
      couponMinOrder?: number;
      couponMaxDiscount?: number;
      couponExpiryDays?: number;
      
      // 프로모션 액션
      promotionType?: 'discount' | 'bundle' | 'free_shipping' | 'buy_x_get_y';
      promotionValue?: number;
      promotionConditions?: Record<string, any>;
      
      // 세그먼트 액션
      segmentId?: string;
      segmentAction?: 'add' | 'remove' | 'replace';
      
      // 태그 액션
      tags?: string[];
      tagAction?: 'add' | 'remove' | 'replace';
      
      // 웹훅 액션
      webhookUrl?: string;
      webhookMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      webhookHeaders?: Record<string, string>;
      webhookBody?: Record<string, any>;
      
      // API 액션
      apiEndpoint?: string;
      apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      apiHeaders?: Record<string, string>;
      apiBody?: Record<string, any>;
    };
  }>;
  
  // 실행 설정
  execution: {
    maxExecutions?: number;
    executionLimit?: number; // 시간당/일당 실행 제한
    cooldownPeriod?: number; // 분 단위
    timeWindow?: {
      start: string; // HH:MM
      end: string; // HH:MM
      timezone: string;
    };
    daysOfWeek?: number[]; // 0=일요일, 1=월요일, ...
    daysOfMonth?: number[];
    months?: number[]; // 1=1월, 2=2월, ...
  };
  
  // 통계
  stats: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    lastExecutedAt?: Date;
    nextExecutionAt?: Date;
    averageExecutionTime: number;
    successRate: number;
  };
  
  // 메타데이터
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    tags: string[];
    category: 'marketing' | 'sales' | 'support' | 'retention' | 'acquisition' | 'engagement' | 'custom';
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const AutomationRuleSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },
  
  triggers: {
    type: {
      type: String,
      enum: ['event', 'schedule', 'condition', 'webhook', 'api'],
      required: true
    },
    eventType: { type: String },
    eventCategory: { type: String },
    conditions: [{
      field: { type: String, required: true },
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in', 'exists', 'not_exists'],
        required: true
      },
      value: { type: Schema.Types.Mixed },
      logicalOperator: { type: String, enum: ['AND', 'OR'], default: 'AND' }
    }],
    schedule: {
      type: { type: String, enum: ['daily', 'weekly', 'monthly', 'custom'] },
      time: { type: String },
      days: [{ type: Number }],
      cron: { type: String }
    },
    webhookUrl: { type: String },
    apiEndpoint: { type: String }
  },
  
  conditions: {
    userConditions: [{
      field: {
        type: String,
        enum: ['userType', 'registrationDate', 'lastLoginDate', 'totalSpent', 'orderCount', 'segmentIds', 'subscriptionStatus', 'emailVerified', 'phoneVerified']
      },
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'in', 'not_in', 'between', 'is_null', 'is_not_null']
      },
      value: { type: Schema.Types.Mixed },
      logicalOperator: { type: String, enum: ['AND', 'OR'], default: 'AND' }
    }],
    productConditions: [{
      field: {
        type: String,
        enum: ['category', 'price', 'stock', 'rating', 'tags', 'brand', 'isActive']
      },
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'in', 'not_in', 'contains', 'not_contains']
      },
      value: { type: Schema.Types.Mixed },
      logicalOperator: { type: String, enum: ['AND', 'OR'], default: 'AND' }
    }],
    orderConditions: [{
      field: {
        type: String,
        enum: ['status', 'totalAmount', 'paymentMethod', 'shippingMethod', 'createdAt', 'updatedAt']
      },
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'in', 'not_in', 'between']
      },
      value: { type: Schema.Types.Mixed },
      logicalOperator: { type: String, enum: ['AND', 'OR'], default: 'AND' }
    }],
    behaviorConditions: [{
      field: {
        type: String,
        enum: ['pageViews', 'sessionDuration', 'cartAbandonment', 'searchQueries', 'emailOpens', 'emailClicks', 'lastActivity']
      },
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'in', 'not_in', 'between']
      },
      value: { type: Schema.Types.Mixed },
      logicalOperator: { type: String, enum: ['AND', 'OR'], default: 'AND' }
    }],
    timeConditions: [{
      field: {
        type: String,
        enum: ['timeOfDay', 'dayOfWeek', 'dayOfMonth', 'month', 'season', 'holiday']
      },
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'in', 'not_in', 'between']
      },
      value: { type: Schema.Types.Mixed },
      logicalOperator: { type: String, enum: ['AND', 'OR'], default: 'AND' }
    }]
  },
  
  actions: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'coupon', 'promotion', 'segment', 'tag', 'webhook', 'api', 'delay', 'condition'],
      required: true
    },
    name: { type: String, required: true },
    description: { type: String },
    delay: { type: Number },
    conditions: [{
      field: { type: String, required: true },
      operator: { type: String, required: true },
      value: { type: Schema.Types.Mixed }
    }],
    settings: {
      emailTemplate: { type: String },
      emailSubject: { type: String },
      emailContent: { type: String },
      emailTo: { type: String },
      emailCc: { type: String },
      emailBcc: { type: String },
      smsTemplate: { type: String },
      smsContent: { type: String },
      smsTo: { type: String },
      pushTitle: { type: String },
      pushBody: { type: String },
      pushData: { type: Schema.Types.Mixed },
      pushImage: { type: String },
      pushAction: { type: String },
      couponCode: { type: String },
      couponType: { type: String, enum: ['percentage', 'fixed', 'free_shipping'] },
      couponValue: { type: Number },
      couponMinOrder: { type: Number },
      couponMaxDiscount: { type: Number },
      couponExpiryDays: { type: Number },
      promotionType: { type: String, enum: ['discount', 'bundle', 'free_shipping', 'buy_x_get_y'] },
      promotionValue: { type: Number },
      promotionConditions: { type: Schema.Types.Mixed },
      segmentId: { type: Schema.Types.ObjectId, ref: 'CustomerSegment' },
      segmentAction: { type: String, enum: ['add', 'remove', 'replace'] },
      tags: [{ type: String }],
      tagAction: { type: String, enum: ['add', 'remove', 'replace'] },
      webhookUrl: { type: String },
      webhookMethod: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE'] },
      webhookHeaders: { type: Schema.Types.Mixed },
      webhookBody: { type: Schema.Types.Mixed },
      apiEndpoint: { type: String },
      apiMethod: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE'] },
      apiHeaders: { type: Schema.Types.Mixed },
      apiBody: { type: Schema.Types.Mixed }
    }
  }],
  
  execution: {
    maxExecutions: { type: Number },
    executionLimit: { type: Number },
    cooldownPeriod: { type: Number },
    timeWindow: {
      start: { type: String },
      end: { type: String },
      timezone: { type: String, default: 'Asia/Seoul' }
    },
    daysOfWeek: [{ type: Number }],
    daysOfMonth: [{ type: Number }],
    months: [{ type: Number }]
  },
  
  stats: {
    totalExecutions: { type: Number, default: 0 },
    successfulExecutions: { type: Number, default: 0 },
    failedExecutions: { type: Number, default: 0 },
    lastExecutedAt: { type: Date },
    nextExecutionAt: { type: Date },
    averageExecutionTime: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 }
  },
  
  metadata: {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String }],
    category: {
      type: String,
      enum: ['marketing', 'sales', 'support', 'retention', 'acquisition', 'engagement', 'custom'],
      default: 'marketing'
    },
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

// 인덱스 설정
AutomationRuleSchema.index({ isActive: 1, priority: -1 });
AutomationRuleSchema.index({ 'triggers.type': 1, 'triggers.eventType': 1 });
AutomationRuleSchema.index({ 'metadata.category': 1 });
AutomationRuleSchema.index({ 'metadata.createdBy': 1 });
AutomationRuleSchema.index({ createdAt: -1 });

export default mongoose.models.AutomationRule || mongoose.model<IAutomationRule>('AutomationRule', AutomationRuleSchema);















