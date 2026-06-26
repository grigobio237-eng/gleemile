import mongoose, { Document, Schema } from 'mongoose';

export interface IContent extends Document {
  title: string;
  description: string;
  content?: string; // 본문 내용 (블로그 글 등)
  platform: 'video' | 'blog';
  type: 'video' | 'image' | 'text' | 'link'; // 콘텐츠 타입
  url?: string; // 외부 링크 (선택적)
  thumbnail?: string;
  images?: string[]; // 이미지 배열
  videos?: string[]; // 동영상 배열
  views: number;
  likes: number;
  comments: number; // 댓글 수
  publishedAt: Date;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  category: string;
  featured: boolean;
  authorId?: mongoose.Types.ObjectId; // 작성자 (관리자)
  authorName?: string; // 작성자 이름
  partnerId?: mongoose.Types.ObjectId; // 파트너 ID (파트너가 작성한 경우)
  partnerName?: string; // 파트너 이름
  partnerEmail?: string; // 파트너 이메일
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema = new Schema<IContent>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  content: {
    type: String,
    trim: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['video', 'blog']
  },
  type: {
    type: String,
    required: true,
    enum: ['video', 'image', 'text', 'link'],
    default: 'text'
  },
  url: {
    type: String,
    trim: true
  },
  thumbnail: {
    type: String,
    trim: true
  },
  images: [{
    type: String,
    trim: true
  }],
  videos: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  comments: {
    type: Number,
    default: 0,
    min: 0
  },
  publishedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    required: true,
    trim: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  authorName: {
    type: String,
    trim: true
  },
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
  timestamps: true
});

// 인덱스 생성
ContentSchema.index({ platform: 1, status: 1 });
ContentSchema.index({ publishedAt: -1 });
ContentSchema.index({ featured: 1, status: 1 });
ContentSchema.index({ tags: 1 });
ContentSchema.index({ partnerId: 1 }); // 파트너별 콘텐츠 조회용

export default mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);

