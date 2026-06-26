import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  isPrivate: boolean; // 비공개 문의 여부
  answers: Array<{
    userId: mongoose.Types.ObjectId;
    content: string;
    isOfficial: boolean; // 공식 답변 여부 (관리자/파트너)
    createdAt: Date;
  }>;
  status: 'pending' | 'answered' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
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
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  answers: [{
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
    isOfficial: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  status: {
    type: String,
    enum: ['pending', 'answered', 'closed'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// 인덱스 설정
QuestionSchema.index({ productId: 1, status: 1 });
QuestionSchema.index({ userId: 1 });
QuestionSchema.index({ createdAt: -1 });

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
