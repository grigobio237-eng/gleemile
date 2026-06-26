import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPolicy extends Document {
  type: string;        // 'TERMS', 'PRIVACY', 'SENSITIVE', 'MARKETING', 'PASS_REFUND', etc. (dynamic string)
  title: string;       // "서비스 이용약관" 등 정책 제목
  content: string;     // 에디터에서 작성된 HTML/Rich Text 형식의 본문
  version: number;     // 버전 관리 (1.0, 2.0 등 자동 증가)
  effectiveDate?: Date;// 시행일
  isRequired: boolean; // 필수 동의 여부
  isActive: boolean;   // 현재 적용중인 최신 버전인지(true), 보관된 이전 버전인지(false)
  authorId?: mongoose.Types.ObjectId; // 수정한 관리자 ID
  createdAt: Date;
  updatedAt: Date;
}

const PolicySchema = new Schema<IPolicy>(
  {
    type: { 
      type: String, 
      required: true, 
      uppercase: true, 
      trim: true,
      index: true
    },
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    version: { 
      type: Number, 
      required: true, 
      default: 1.0 
    },
    effectiveDate: { 
      type: Date 
    },
    isRequired: { 
      type: Boolean, 
      default: false 
    },
    isActive: { 
      type: Boolean, 
      default: true,
      index: true
    },
    authorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
  },
  { 
    timestamps: true 
  }
);

// 타입별로 최신 활성 정책을 빠르게 가져오기 위한 복합 인덱스
PolicySchema.index({ type: 1, isActive: 1, version: -1 });

const Policy: Model<IPolicy> =
  mongoose.models.Policy || mongoose.model<IPolicy>('Policy', PolicySchema);

export default Policy;
