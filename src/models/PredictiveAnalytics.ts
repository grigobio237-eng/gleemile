import mongoose, { Document, Schema } from 'mongoose';

export interface IPredictionModel extends Document {
  name: string;
  description: string;
  modelType: 'churn' | 'purchase' | 'revenue' | 'demand' | 'lifetime_value' | 'custom';
  targetVariable: string; // 예측 대상 변수
  features: Array<{
    name: string;
    type: 'numeric' | 'categorical' | 'boolean' | 'date';
    importance: number; // 특성 중요도 (0-1)
    description: string;
  }>;
  algorithm: 'linear_regression' | 'logistic_regression' | 'random_forest' | 'gradient_boosting' | 'neural_network' | 'time_series';
  hyperparameters: Record<string, any>; // 모델 하이퍼파라미터
  trainingData: {
    startDate: Date;
    endDate: Date;
    sampleSize: number;
    features: string[];
  };
  performance: {
    accuracy: number; // 정확도 (0-1)
    precision: number; // 정밀도 (0-1)
    recall: number; // 재현율 (0-1)
    f1Score: number; // F1 점수 (0-1)
    auc: number; // AUC (0-1)
    mse?: number; // 평균 제곱 오차 (회귀용)
    mae?: number; // 평균 절대 오차 (회귀용)
  };
  status: 'training' | 'ready' | 'deployed' | 'retired' | 'error';
  version: string;
  isActive: boolean;
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    category: 'customer' | 'revenue' | 'inventory' | 'marketing' | 'custom';
    tags: string[];
    environment: 'development' | 'staging' | 'production';
    lastTrained: Date;
    nextRetrain?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IPrediction extends Document {
  modelId: mongoose.Types.ObjectId;
  entityId: string; // 예측 대상 엔티티 ID (고객 ID, 제품 ID 등)
  entityType: 'user' | 'product' | 'order' | 'campaign' | 'custom';
  predictionType: 'churn' | 'purchase' | 'revenue' | 'demand' | 'lifetime_value' | 'custom';
  predictionValue: number; // 예측값
  probability?: number; // 예측 확률 (분류 모델용)
  confidence: number; // 예측 신뢰도 (0-1)
  predictionDate: Date; // 예측 생성일
  targetDate: Date; // 예측 대상일
  features: Record<string, any>; // 예측에 사용된 특성값들
  actualValue?: number; // 실제값 (검증용)
  accuracy?: number; // 예측 정확도 (실제값과 비교)
  isVerified: boolean; // 검증 완료 여부
  metadata: {
    modelVersion: string;
    predictionMethod: 'batch' | 'realtime' | 'scheduled';
    dataQuality: 'high' | 'medium' | 'low';
    customData?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IPredictionInsight extends Document {
  modelId: mongoose.Types.ObjectId;
  insightType: 'performance' | 'drift' | 'bias' | 'feature_importance' | 'anomaly' | 'trend';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data: {
    metric: string;
    value: number;
    threshold?: number;
    trend?: 'increasing' | 'decreasing' | 'stable';
    period?: string;
  };
  recommendations: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
  }>;
  isResolved: boolean;
  resolvedAt?: Date;
  metadata: {
    generatedBy: mongoose.Types.ObjectId;
    generatedAt: Date;
    modelVersion: string;
  };
  createdAt: Date;
}

export interface IPredictionAlert extends Document {
  modelId: mongoose.Types.ObjectId;
  alertType: 'performance_degradation' | 'data_drift' | 'prediction_anomaly' | 'model_error' | 'threshold_breach';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold?: {
    metric: string;
    value: number;
    operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  };
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: Date;
  resolvedAt?: Date;
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    notificationChannels: string[]; // email, slack, webhook 등
    customData?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PredictionModelSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  modelType: {
    type: String,
    enum: ['churn', 'purchase', 'revenue', 'demand', 'lifetime_value', 'custom'],
    required: true
  },
  targetVariable: { type: String, required: true },
  features: [{
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['numeric', 'categorical', 'boolean', 'date'],
      required: true
    },
    importance: { type: Number, min: 0, max: 1, required: true },
    description: { type: String, required: true }
  }],
  algorithm: {
    type: String,
    enum: ['linear_regression', 'logistic_regression', 'random_forest', 'gradient_boosting', 'neural_network', 'time_series'],
    required: true
  },
  hyperparameters: { type: Schema.Types.Mixed },
  trainingData: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    sampleSize: { type: Number, required: true },
    features: [{ type: String }]
  },
  performance: {
    accuracy: { type: Number, min: 0, max: 1, required: true },
    precision: { type: Number, min: 0, max: 1, required: true },
    recall: { type: Number, min: 0, max: 1, required: true },
    f1Score: { type: Number, min: 0, max: 1, required: true },
    auc: { type: Number, min: 0, max: 1, required: true },
    mse: { type: Number },
    mae: { type: Number }
  },
  status: {
    type: String,
    enum: ['training', 'ready', 'deployed', 'retired', 'error'],
    default: 'training'
  },
  version: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  metadata: {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['customer', 'revenue', 'inventory', 'marketing', 'custom'],
      default: 'customer'
    },
    tags: [{ type: String }],
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'development'
    },
    lastTrained: { type: Date, required: true },
    nextRetrain: { type: Date }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PredictionSchema: Schema = new Schema({
  modelId: { type: Schema.Types.ObjectId, ref: 'PredictionModel', required: true },
  entityId: { type: String, required: true },
  entityType: {
    type: String,
    enum: ['user', 'product', 'order', 'campaign', 'custom'],
    required: true
  },
  predictionType: {
    type: String,
    enum: ['churn', 'purchase', 'revenue', 'demand', 'lifetime_value', 'custom'],
    required: true
  },
  predictionValue: { type: Number, required: true },
  probability: { type: Number, min: 0, max: 1 },
  confidence: { type: Number, min: 0, max: 1, required: true },
  predictionDate: { type: Date, required: true },
  targetDate: { type: Date, required: true },
  features: { type: Schema.Types.Mixed, required: true },
  actualValue: { type: Number },
  accuracy: { type: Number, min: 0, max: 1 },
  isVerified: { type: Boolean, default: false },
  metadata: {
    modelVersion: { type: String, required: true },
    predictionMethod: {
      type: String,
      enum: ['batch', 'realtime', 'scheduled'],
      default: 'batch'
    },
    dataQuality: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'high'
    },
    customData: { type: Schema.Types.Mixed }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PredictionInsightSchema: Schema = new Schema({
  modelId: { type: Schema.Types.ObjectId, ref: 'PredictionModel', required: true },
  insightType: {
    type: String,
    enum: ['performance', 'drift', 'bias', 'feature_importance', 'anomaly', 'trend'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  data: {
    metric: { type: String, required: true },
    value: { type: Number, required: true },
    threshold: { type: Number },
    trend: {
      type: String,
      enum: ['increasing', 'decreasing', 'stable']
    },
    period: { type: String }
  },
  recommendations: [{
    action: { type: String, required: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    description: { type: String, required: true }
  }],
  isResolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  metadata: {
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    generatedAt: { type: Date, required: true },
    modelVersion: { type: String, required: true }
  },
  createdAt: { type: Date, default: Date.now }
});

const PredictionAlertSchema: Schema = new Schema({
  modelId: { type: Schema.Types.ObjectId, ref: 'PredictionModel', required: true },
  alertType: {
    type: String,
    enum: ['performance_degradation', 'data_drift', 'prediction_anomaly', 'model_error', 'threshold_breach'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  threshold: {
    metric: { type: String },
    value: { type: Number },
    operator: {
      type: String,
      enum: ['greater_than', 'less_than', 'equals', 'not_equals']
    }
  },
  isActive: { type: Boolean, default: true },
  isTriggered: { type: Boolean, default: false },
  triggeredAt: { type: Date },
  resolvedAt: { type: Date },
  metadata: {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notificationChannels: [{ type: String }],
    customData: { type: Schema.Types.Mixed }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 인덱스 설정
PredictionModelSchema.index({ modelType: 1, status: 1 });
PredictionModelSchema.index({ 'metadata.createdBy': 1 });
PredictionModelSchema.index({ isActive: 1, createdAt: -1 });

PredictionSchema.index({ modelId: 1, entityId: 1, predictionDate: -1 });
PredictionSchema.index({ entityType: 1, predictionType: 1 });
PredictionSchema.index({ predictionDate: -1, targetDate: 1 });
PredictionSchema.index({ isVerified: 1 });

PredictionInsightSchema.index({ modelId: 1, insightType: 1 });
PredictionInsightSchema.index({ severity: 1, isResolved: 1 });
PredictionInsightSchema.index({ createdAt: -1 });

PredictionAlertSchema.index({ modelId: 1, alertType: 1 });
PredictionAlertSchema.index({ isActive: 1, isTriggered: 1 });
PredictionAlertSchema.index({ severity: 1, createdAt: -1 });

export const PredictionModel = mongoose.models.PredictionModel || mongoose.model<IPredictionModel>('PredictionModel', PredictionModelSchema);
export const Prediction = mongoose.models.Prediction || mongoose.model<IPrediction>('Prediction', PredictionSchema);
export const PredictionInsight = mongoose.models.PredictionInsight || mongoose.model<IPredictionInsight>('PredictionInsight', PredictionInsightSchema);
export const PredictionAlert = mongoose.models.PredictionAlert || mongoose.model<IPredictionAlert>('PredictionAlert', PredictionAlertSchema);















