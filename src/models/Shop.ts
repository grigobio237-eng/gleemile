import mongoose, { Document, Schema } from 'mongoose';

export interface IShop extends Document {
  name: string;
  shopCode: string; // 고유 추적 코드 (예: A01, B01)
  navigatorId: mongoose.Types.ObjectId; // 담당 네비게이터 (User 모델 참조)
  category?: string; // 업종 (예: 성형외과, 피부과, 에스테틱 등)
  address?: string;
  description?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ShopSchema = new Schema<IShop>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  shopCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  navigatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

// 인덱스 설정
ShopSchema.index({ navigatorId: 1 });

export default mongoose.models.Shop || mongoose.model<IShop>('Shop', ShopSchema);
