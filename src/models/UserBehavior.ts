import mongoose, { Document, Schema } from 'mongoose';

export interface IUserBehavior extends Document {
  userId?: mongoose.Types.ObjectId;
  sessionId: string;
  eventType: 
    | 'view' 
    | 'click' 
    | 'add_to_cart' 
    | 'remove_from_cart' 
    | 'purchase' 
    | 'like' 
    | 'dislike' 
    | 'share' 
    | 'comment' 
    | 'search' 
    | 'filter' 
    | 'sort' 
    | 'scroll' 
    | 'time_on_page'
    | 'sound_therapy_start'
    | 'sound_therapy_stop'
    | 'recommendation_view'
    | 'recommendation_click';
  itemId?: mongoose.Types.ObjectId;
  itemType?: 'product' | 'content' | 'category' | 'brand';
  itemData?: {
    name?: string;
    category?: string;
    brand?: string;
    price?: number;
    tags?: string[];
    attributes?: Record<string, any>;
  };
  context: {
    pageUrl: string;
    referrer?: string;
    userAgent: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    screenResolution?: string;
    language: string;
    timezone: string;
  };
  behaviorData: {
    duration?: number; // 페이지 체류 시간 (초)
    scrollDepth?: number; // 스크롤 깊이 (0-100)
    clickPosition?: { x: number; y: number };
    searchQuery?: string;
    filterCriteria?: Record<string, any>;
    sortCriteria?: string;
    quantity?: number; // 구매/장바구니 수량
    value?: number; // 구매 금액
  };
  timestamp: Date;
  metadata: {
    source: 'web' | 'mobile_app' | 'api';
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
}

const UserBehaviorSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  sessionId: { type: String, required: true },
  eventType: {
    type: String,
    enum: [
      'view', 'click', 'add_to_cart', 'remove_from_cart', 'purchase', 'like', 'dislike', 'share', 'comment', 
      'search', 'filter', 'sort', 'scroll', 'time_on_page',
      'sound_therapy_start', 'sound_therapy_stop', 'recommendation_view', 'recommendation_click'
    ],
    required: true
  },
  itemId: { type: Schema.Types.ObjectId },
  itemType: {
    type: String,
    enum: ['product', 'content', 'category', 'brand']
  },
  itemData: {
    name: { type: String },
    category: { type: String },
    brand: { type: String },
    price: { type: Number },
    tags: [{ type: String }],
    attributes: { type: Schema.Types.Mixed }
  },
  context: {
    pageUrl: { type: String, required: true },
    referrer: { type: String },
    userAgent: { type: String, required: true },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
      required: true
    },
    screenResolution: { type: String },
    language: { type: String, required: true },
    timezone: { type: String, required: true }
  },
  behaviorData: {
    duration: { type: Number },
    scrollDepth: { type: Number, min: 0, max: 100 },
    clickPosition: {
      x: { type: Number },
      y: { type: Number }
    },
    searchQuery: { type: String },
    filterCriteria: { type: Schema.Types.Mixed },
    sortCriteria: { type: String },
    quantity: { type: Number },
    value: { type: Number }
  },
  timestamp: { type: Date, default: Date.now },
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile_app', 'api'],
      default: 'web'
    },
    version: { type: String, default: '1.0.0' },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'production'
    }
  }
});

// 인덱스 설정
UserBehaviorSchema.index({ userId: 1, timestamp: -1 });
UserBehaviorSchema.index({ userId: 1, eventType: 1, timestamp: -1 });
UserBehaviorSchema.index({ itemId: 1, itemType: 1, timestamp: -1 });
UserBehaviorSchema.index({ sessionId: 1, timestamp: -1 });
UserBehaviorSchema.index({ timestamp: -1 });

export default mongoose.models.UserBehavior || mongoose.model<IUserBehavior>('UserBehavior', UserBehaviorSchema);















