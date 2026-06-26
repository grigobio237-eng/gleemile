import mongoose, { Document, Schema } from 'mongoose';

export interface IRecommendation extends Document {
  userId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  itemType: 'product' | 'content' | 'category' | 'brand';
  recommendationType: 'collaborative' | 'content_based' | 'hybrid' | 'popular' | 'trending' | 'similar' | 'frequently_bought_together' | 'recently_viewed' | 'personalized';
  score: number; // 0-1 사이의 추천 점수
  reason: string; // 추천 이유
  metadata: {
    algorithm: string; // 사용된 알고리즘
    confidence: number; // 신뢰도 (0-1)
    generatedAt: Date;
    expiresAt?: Date;
    context?: {
      sessionId?: string;
      pageUrl?: string;
      userAgent?: string;
      deviceType?: string;
    };
  };
  status: 'active' | 'shown' | 'clicked' | 'purchased' | 'dismissed' | 'expired';
  interactions: Array<{
    type: 'view' | 'click' | 'add_to_cart' | 'purchase' | 'dismiss' | 'like' | 'dislike';
    timestamp: Date;
    metadata?: any;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  itemId: { type: Schema.Types.ObjectId, required: true },
  itemType: {
    type: String,
    enum: ['product', 'content', 'category', 'brand'],
    required: true
  },
  recommendationType: {
    type: String,
    enum: ['collaborative', 'content_based', 'hybrid', 'popular', 'trending', 'similar', 'frequently_bought_together', 'recently_viewed', 'personalized'],
    required: true
  },
  score: { type: Number, required: true, min: 0, max: 1 },
  reason: { type: String, required: true },
  metadata: {
    algorithm: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    generatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    context: {
      sessionId: { type: String },
      pageUrl: { type: String },
      userAgent: { type: String },
      deviceType: { type: String }
    }
  },
  status: {
    type: String,
    enum: ['active', 'shown', 'clicked', 'purchased', 'dismissed', 'expired'],
    default: 'active'
  },
  interactions: [{
    type: {
      type: String,
      enum: ['view', 'click', 'add_to_cart', 'purchase', 'dismiss', 'like', 'dislike'],
      required: true
    },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 인덱스 설정
RecommendationSchema.index({ userId: 1, itemType: 1, status: 1 });
RecommendationSchema.index({ userId: 1, recommendationType: 1, score: -1 });
RecommendationSchema.index({ itemId: 1, itemType: 1 });
RecommendationSchema.index({ 'metadata.generatedAt': -1 });
RecommendationSchema.index({ 'metadata.expiresAt': 1 });

export default mongoose.models.Recommendation || mongoose.model<IRecommendation>('Recommendation', RecommendationSchema);















