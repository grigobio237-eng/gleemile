import mongoose, { Document, Schema } from 'mongoose';

export interface IAutomationExecution extends Document {
  ruleId: mongoose.Types.ObjectId;
  ruleName: string;
  triggerType: 'event' | 'schedule' | 'condition' | 'webhook' | 'api';
  triggerData: {
    eventType?: string;
    eventCategory?: string;
    eventData?: Record<string, any>;
    scheduleType?: string;
    webhookData?: Record<string, any>;
    apiData?: Record<string, any>;
  };
  
  // 실행 대상
  targets: {
    userIds?: mongoose.Types.ObjectId[];
    segmentIds?: mongoose.Types.ObjectId[];
    emailAddresses?: string[];
    phoneNumbers?: string[];
    customTargets?: Record<string, any>;
  };
  
  // 실행 상태
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  progress: {
    total: number;
    completed: number;
    failed: number;
    percentage: number;
  };
  
  // 실행 결과
  results: {
    successful: number;
    failed: number;
    skipped: number;
    errors: Array<{
      target: string;
      action: string;
      error: string;
      timestamp: Date;
    }>;
  };
  
  // 실행된 액션들
  executedActions: Array<{
    actionType: string;
    actionName: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startTime: Date;
    endTime?: Date;
    duration?: number;
    result?: any;
    error?: string;
    targetCount: number;
    successCount: number;
    failureCount: number;
  }>;
  
  // 실행 설정
  executionConfig: {
    maxRetries: number;
    retryDelay: number;
    timeout: number;
    parallel: boolean;
    batchSize: number;
  };
  
  // 메타데이터
  metadata: {
    startedAt: Date;
    completedAt?: Date;
    duration?: number;
    executedBy: mongoose.Types.ObjectId;
    environment: 'development' | 'staging' | 'production';
    version: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const AutomationExecutionSchema: Schema = new Schema({
  ruleId: { type: Schema.Types.ObjectId, ref: 'AutomationRule', required: true },
  ruleName: { type: String, required: true },
  triggerType: {
    type: String,
    enum: ['event', 'schedule', 'condition', 'webhook', 'api'],
    required: true
  },
  triggerData: {
    eventType: { type: String },
    eventCategory: { type: String },
    eventData: { type: Schema.Types.Mixed },
    scheduleType: { type: String },
    webhookData: { type: Schema.Types.Mixed },
    apiData: { type: Schema.Types.Mixed }
  },
  
  targets: {
    userIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    segmentIds: [{ type: Schema.Types.ObjectId, ref: 'CustomerSegment' }],
    emailAddresses: [{ type: String }],
    phoneNumbers: [{ type: String }],
    customTargets: { type: Schema.Types.Mixed }
  },
  
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled', 'paused'],
    default: 'pending'
  },
  progress: {
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },
  
  results: {
    successful: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    errors: [{
      target: { type: String, required: true },
      action: { type: String, required: true },
      error: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }]
  },
  
  executedActions: [{
    actionType: { type: String, required: true },
    actionName: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'skipped'],
      default: 'pending'
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number },
    result: { type: Schema.Types.Mixed },
    error: { type: String },
    targetCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 }
  }],
  
  executionConfig: {
    maxRetries: { type: Number, default: 3 },
    retryDelay: { type: Number, default: 1000 },
    timeout: { type: Number, default: 300000 },
    parallel: { type: Boolean, default: true },
    batchSize: { type: Number, default: 100 }
  },
  
  metadata: {
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
    duration: { type: Number },
    executedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'production'
    },
    version: { type: String, default: '1.0.0' }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 인덱스 설정
AutomationExecutionSchema.index({ ruleId: 1, createdAt: -1 });
AutomationExecutionSchema.index({ status: 1, createdAt: -1 });
AutomationExecutionSchema.index({ 'metadata.startedAt': -1 });
AutomationExecutionSchema.index({ 'metadata.executedBy': 1 });

export default mongoose.models.AutomationExecution || mongoose.model<IAutomationExecution>('AutomationExecution', AutomationExecutionSchema);















