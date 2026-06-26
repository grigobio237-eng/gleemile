import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  price: number;
  minPrice?: number;
  maxPrice?: number;
  originalPrice?: number;
  stock: number;
  minStock?: number; // 최소 재고 수준
  maxStock?: number; // 최대 재고 수준
  reservedStock?: number; // 예약된 재고 (주문은 했지만 아직 결제 안된)
  category: string;
  status: 'active' | 'hidden' | 'out_of_stock'; // 재고 부족 상태 추가
  approvalStatus: 'pending' | 'approved' | 'rejected'; // 승인 상태 추가
  rejectionReason?: string; // 거부 사유
  featured?: boolean;
  featuredByAdmin?: boolean; // 관리자가 추천한 상품
  adminRecommendationReason?: string; // 관리자 추천 이유
  isFunding?: boolean; // 펀딩 상품 여부
  fundingEndDate?: Date; // 펀딩 종료일 (옵션)
  fundingGoal?: number; // 펀딩 목표 금액 (옵션)
  descriptionIsHtml?: boolean; // HTML 설명 여부
  images: Array<{
    url: string;
    w?: number;
    h?: number;
    type?: string;
  }>;
  summary: string;
  description: string;
  // 카테고리별 특화 정보 (선택적)
  nutritionInfo?: {
    calories?: string;
    protein?: string;
    fat?: string;
    carbohydrates?: string;
    sodium?: string;
  };
  originInfo?: {
    origin?: string;
    storageMethod?: string;
    shelfLife?: string;
    packagingMethod?: string;
  };
  clothingInfo?: {
    sizeGuide?: string;
    material?: string;
    careInstructions?: string;
  };
  electronicsInfo?: {
    specifications?: string;
    includedItems?: string;
    warranty?: string;
  };
  // 파트너 관련 필드
  partnerId?: mongoose.Types.ObjectId; // 파트너 ID
  partnerName?: string; // 파트너 이름
  partnerEmail?: string; // 파트너 이메일 (알림용)
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  minPrice: {
    type: Number,
    min: 0,
  },
  maxPrice: {
    type: Number,
    min: 0,
  },
  originalPrice: {
    type: Number,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  minStock: {
    type: Number,
    default: 10,
  },
  maxStock: {
    type: Number,
    default: 1000,
  },
  reservedStock: {
    type: Number,
    default: 0,
    min: 0,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'hidden', 'out_of_stock'],
    default: 'active',
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
    trim: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  featuredByAdmin: {
    type: Boolean,
    default: false,
  },
  adminRecommendationReason: {
    type: String,
    trim: true,
  },
  isFunding: {
    type: Boolean,
    default: false,
  },
  fundingEndDate: {
    type: Date,
  },
  fundingGoal: {
    type: Number,
    min: 0,
  },
  images: [{
    url: { type: String, required: true },
    w: { type: Number },
    h: { type: Number },
    type: { type: String },
  }],
  summary: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  descriptionIsHtml: {
    type: Boolean,
    default: false,
  },
  // 카테고리별 특화 정보 (선택적)
  nutritionInfo: {
    calories: { type: String },
    protein: { type: String },
    fat: { type: String },
    carbohydrates: { type: String },
    sodium: { type: String },
  },
  originInfo: {
    origin: { type: String },
    storageMethod: { type: String },
    shelfLife: { type: String },
    packagingMethod: { type: String },
  },
  clothingInfo: {
    sizeGuide: { type: String },
    material: { type: String },
    careInstructions: { type: String },
  },
  electronicsInfo: {
    specifications: { type: String },
    includedItems: { type: String },
    warranty: { type: String },
  },
  // 파트너 관련 필드
  partnerId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  partnerName: {
    type: String,
    trim: true
  },
  partnerEmail: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
});

// Index for search and filtering
ProductSchema.index({ name: 'text', summary: 'text', description: 'text' });
ProductSchema.index({ category: 1, status: 1, approvalStatus: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ partnerId: 1 });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

