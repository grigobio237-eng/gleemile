import mongoose, { Schema, Document, Model } from 'mongoose';

// 커뮤니티 게시글 인터페이스
export interface ICommunityPost extends Document {
  title: string;
  content: string;
  category: 'free' | 'review' | 'question' | 'notice' | 'tip';
  teamId?: mongoose.Types.ObjectId;
  
  // 작성자 정보
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  authorImage?: string;

  // 본문 이미지 목록 (S3/GCS URL)
  images?: string[];

  // 메트릭스
  viewCount: number;
  
  // 공감(좋아요) 누른 사용자 ID 목록
  likes: mongoose.Types.ObjectId[];

  // 댓글
  comments: {
    _id: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    authorName: string;
    authorImage?: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['free', 'review', 'question', 'notice', 'tip'],
      default: 'free',
      required: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'MileTeam',
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorImage: {
      type: String,
    },
    images: {
      type: [String],
      default: [],
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        authorId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        authorName: {
          type: String,
          required: true,
        },
        authorImage: {
          type: String,
        },
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// 인덱스 설정
CommunityPostSchema.index({ createdAt: -1 });
CommunityPostSchema.index({ category: 1, createdAt: -1 });
CommunityPostSchema.index({ teamId: 1, createdAt: -1 });


const CommunityPost: Model<ICommunityPost> =
  mongoose.models.CommunityPost || mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema);

export default CommunityPost;
