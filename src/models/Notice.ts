import mongoose, { Schema, Document, Model } from 'mongoose';

// 공지사항 타입
export type NoticeType = 'general' | 'important' | 'event' | 'maintenance' | 'update';

// 공지사항 상태
export type NoticeStatus = 'draft' | 'published' | 'archived';

// 노출 대상
export type NoticeTarget = 'all' | 'new' | 'existing' | 'partner' | 'admin';

// 공지사항 인터페이스
export interface INotice extends Document {
  // 기본 정보
  title: string;
  content: string;
  summary?: string;              // 요약 (목록용)

  // 분류
  type: NoticeType;
  category?: string;             // 카테고리 (선택적)
  tags: string[];

  // 상태
  status: NoticeStatus;

  // 중요도
  isPinned: boolean;             // 상단 고정
  isImportant: boolean;          // 중요 공지
  isPopup: boolean;              // 팝업 노출

  // 노출 대상
  targetAudience: NoticeTarget;  // 노출 대상 (전체, 신규회원, 기존회원, 파트너, 관리자)

  // 팝업 설정 (팝업인 경우)
  popupSettings?: {
    width: number;               // 팝업 너비
    height: number;              // 팝업 높이
    displayDays: number;         // 며칠간 표시 (하루 동안 보지 않기)
    backgroundColor?: string;    // 배경색
  };

  // 작성자
  authorId: mongoose.Types.ObjectId;
  authorName: string;

  // 첨부 파일
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
  }[];

  // 이미지
  thumbnailImage?: string;       // 썸네일 이미지
  images?: string[];             // 본문 이미지

  // 노출 기간
  startDate?: Date;              // 노출 시작일
  endDate?: Date;                // 노출 종료일

  // 통계
  viewCount: number;             // 조회수

  // 게시 정보
  publishedAt?: Date;            // 게시일
  archivedAt?: Date;             // 보관일

  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>(
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
    summary: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    type: {
      type: String,
      enum: ['general', 'important', 'event', 'maintenance', 'update'],
      default: 'general',
      required: true
    },
    category: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      required: true
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    isImportant: {
      type: Boolean,
      default: false,
    },
    isPopup: {
      type: Boolean,
      default: false,
    },
    targetAudience: {
      type: String,
      enum: ['all', 'new', 'existing', 'partner', 'admin'],
      default: 'all',
      required: true
    },
    popupSettings: {
      width: {
        type: Number,
        default: 500,
      },
      height: {
        type: Number,
        default: 600,
      },
      displayDays: {
        type: Number,
        default: 1,
      },
      backgroundColor: String,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: {
      type: String,
      required: true,
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileSize: Number,
        fileType: String,
      },
    ],
    thumbnailImage: String,
    images: [String],
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    publishedAt: Date,
    archivedAt: Date,
  },
  {
    timestamps: true,
  }
);

// 인덱스 설정
NoticeSchema.index({ status: 1, createdAt: -1 });
NoticeSchema.index({ isPinned: -1, createdAt: -1 });
NoticeSchema.index({ type: 1, status: 1 });

// 조회수 증가 메서드
NoticeSchema.methods.incrementViewCount = async function (this: INotice): Promise<INotice> {
  this.viewCount += 1;
  return this.save();
};

// 게시 메서드
NoticeSchema.methods.publish = async function (this: INotice): Promise<INotice> {
  this.status = 'published';
  this.publishedAt = new Date();
  return this.save();
};

// 보관 메서드
NoticeSchema.methods.archive = async function (this: INotice): Promise<INotice> {
  this.status = 'archived';
  this.archivedAt = new Date();
  return this.save();
};

// 가상 필드: 현재 노출 여부
NoticeSchema.virtual('isActive').get(function (this: INotice) {
  if (this.status !== 'published') return false;

  const now = new Date();

  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;

  return true;
});

// JSON 변환 시 가상 필드 포함
NoticeSchema.set('toJSON', { virtuals: true });
NoticeSchema.set('toObject', { virtuals: true });

const Notice: Model<INotice> =
  mongoose.models.Notice || mongoose.model<INotice>('Notice', NoticeSchema);

export default Notice;



