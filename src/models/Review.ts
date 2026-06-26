import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId; // 구매 인증용
  rating: number; // 1-5 통합 별점
  title?: string; // 리뷰 제목
  content: string; // 리뷰 내용
  images: string[]; // 리뷰 이미지들
  isVerified: boolean; // 구매 인증 여부
  helpfulCount: number; // 도움됨 수
  helpfulUsers: mongoose.Types.ObjectId[]; // 도움됨을 누른 사용자들
  replies: Array<{
    userId: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
  }>; // 관리자/파트너 답변
  status: 'pending' | 'approved' | 'rejected' | 'hidden'; // 리뷰 상태
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    maxlength: 100,
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  images: [{
    type: String, // 이미지 URL
  }],
  isVerified: {
    type: Boolean,
    default: false,
  },
  helpfulCount: {
    type: Number,
    default: 0,
  },
  helpfulUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  replies: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 500,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// 인덱스 설정
ReviewSchema.index({ productId: 1, status: 1 });
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ createdAt: -1 });

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
