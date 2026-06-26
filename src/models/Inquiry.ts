import mongoose, { Document, Schema } from 'mongoose';

export interface IInquiry extends Document {
  inquiryId: string;
  userId?: mongoose.Types.ObjectId;
  userEmail: string;
  userName: string;
  phoneNumber?: string;
  floor?: number;
  artistId?: string;
  type: 'general' | 'delivery' | 'payment' | 'product' | 'technical' | 'refund' | 'partnership';
  subject: string;
  content: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';

  // AI 관련 필드
  aiAnswer?: string;
  aiGeneratedAt?: Date;
  aiModel?: string;
  aiConfidence?: number;
  aiNeedsReview?: boolean;

  // 관리자 응답
  adminAnswer?: string;
  adminId?: mongoose.Types.ObjectId;
  answeredAt?: Date;

  // 메타데이터
  source: 'website' | 'email' | 'phone' | 'api' | 'admin' | 'webhook';
  tags: string[];
  attachments?: Array<{
    filename: string;
    url: string;
    size: number;
    type: string;
  }>;

  // 처리 정보
  assignedTo?: mongoose.Types.ObjectId;
  category?: string;
  subcategory?: string;

  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema = new Schema<IInquiry>({
  inquiryId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: false
  },
  floor: {
    type: Number,
    required: false
  },
  artistId: {
    type: String,
    required: false
  },
  type: {
    type: String,
    enum: ['general', 'delivery', 'payment', 'product', 'technical', 'refund', 'partnership'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // AI 관련 필드
  aiAnswer: {
    type: String
  },
  aiGeneratedAt: {
    type: Date
  },
  aiModel: {
    type: String
  },
  aiConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  aiNeedsReview: {
    type: Boolean,
    default: false
  },

  // 관리자 응답
  adminAnswer: {
    type: String
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  answeredAt: {
    type: Date
  },

  // 메타데이터
  source: {
    type: String,
    enum: ['website', 'email', 'phone', 'api', 'admin', 'webhook'],
    default: 'website'
  },
  tags: [{
    type: String
  }],
  attachments: [{
    filename: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, required: true }
  }],

  // 처리 정보
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  category: {
    type: String
  },
  subcategory: {
    type: String
  }
}, {
  timestamps: true
});

// 인덱스 설정 (unique: true 필드는 자동으로 인덱스가 생성되므로 제외)
InquirySchema.index({ userEmail: 1 });
InquirySchema.index({ status: 1 });
InquirySchema.index({ type: 1 });
InquirySchema.index({ source: 1 });
InquirySchema.index({ priority: 1 });
InquirySchema.index({ createdAt: -1 });
InquirySchema.index({ aiNeedsReview: 1 });

// 가상 필드
InquirySchema.virtual('hasAiAnswer').get(function () {
  return !!this.aiAnswer;
});

InquirySchema.virtual('hasAdminAnswer').get(function () {
  return !!this.adminAnswer;
});

InquirySchema.virtual('isResolved').get(function () {
  return this.status === 'resolved' || this.status === 'closed';
});

// JSON 변환 시 가상 필드 포함
InquirySchema.set('toJSON', { virtuals: true });
InquirySchema.set('toObject', { virtuals: true });

export default mongoose.models.Inquiry || mongoose.model<IInquiry>('Inquiry', InquirySchema);
