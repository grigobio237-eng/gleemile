import mongoose, { Document, Schema } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: 'order' | 'payment' | 'shipping' | 'member' | 'product' | 'refund' | 'other';
  order: number; // 정렬 순서
  views: number; // 조회수
  helpful: number; // 도움이 됨
  notHelpful: number; // 도움이 안됨
  status: 'active' | 'hidden';
  tags?: string[]; // 태그
  createdBy: mongoose.Types.ObjectId; // 작성자 (관리자)
  updatedBy?: mongoose.Types.ObjectId; // 수정자
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['order', 'payment', 'shipping', 'member', 'product', 'refund', 'other'],
      required: true
    },
    order: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    helpful: {
      type: Number,
      default: 0,
    },
    notHelpful: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'hidden'],
      default: 'active'
    },
    tags: [{
      type: String,
      trim: true,
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스 설정
FAQSchema.index({ category: 1, status: 1, order: 1 });
FAQSchema.index({ question: 'text', answer: 'text' }); // 텍스트 검색 인덱스

const FAQ = mongoose.models.FAQ || mongoose.model<IFAQ>('FAQ', FAQSchema);

export default FAQ;

