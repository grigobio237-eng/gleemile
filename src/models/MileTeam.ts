import mongoose, { Document, Schema } from 'mongoose';

export interface IBaseBlock {
  blockId: string;
  blockName: string;
  category: 'core' | 'business' | 'hobby' | 'study' | 'sports';
  blockType: 'OKR' | 'ACWR' | 'SETTLEMENT' | string;
  isActive: boolean;
  order: number;
  [key: string]: any;
}

export interface IMileTeam extends Document {
  teamName: string;
  teamCode: string;           // 고유 팀 코드 (QR/링크에 사용)
  category: 'youth' | 'pro' | 'amateur';
  templateType: 'business' | 'hobby' | 'study' | 'sports'; // 동적 템플릿 유형
  ageGroup?: string;          // 예: 'U-12', 'U-15', 'U-18', '성인'
  region?: string;            // 활동 지역
  description?: string;
  logoUrl?: string;
  inviteLink: string;         // 팀 초대 링크 (유효기간 없음)
  isPublic: boolean;          // 공개 방 여부 (탐색 노출 여부)
  isActive: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejectedReason?: string;
  maxMembers: number;         // 팀 최대 인원
  createdBy: mongoose.Types.ObjectId; // 팀 등록 요청한 총무/조장의 userId
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  enabledBlocks: IBaseBlock[];
  createdAt: Date;
  updatedAt: Date;
}

const BaseBlockSchema = new Schema<IBaseBlock>({
  blockId: { type: String, required: true },
  blockName: { type: String, required: true },
  category: { type: String, enum: ['core', 'business', 'hobby', 'study', 'sports'], required: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, required: true }
}, {
  discriminatorKey: 'blockType',
  _id: false
});

const MileTeamSchema = new Schema<IMileTeam>(
  {
    teamName: { type: String, required: true, trim: true },
    teamCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: { 
      type: String, 
      enum: ['youth', 'pro', 'amateur'], 
      required: true 
    },
    templateType: {
      type: String,
      enum: ['business', 'hobby', 'study', 'sports'],
      default: 'sports'
    },
    ageGroup: { type: String, trim: true },
    region: { type: String, trim: true },
    description: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    inviteLink: { type: String, required: true, unique: true },
    isPublic: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'suspended'], 
      default: 'pending' 
    },
    rejectedReason: { type: String, trim: true },
    maxMembers: { type: Number, default: 40 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    enabledBlocks: {
      type: [BaseBlockSchema],
      default: []
    }
  },
  { timestamps: true }
);

// 승인 시 자동으로 isActive 활성화
MileTeamSchema.pre('save', function(this: any, next) {
  if (this.isModified('status') && this.status === 'approved') {
    this.isActive = true;
    if (!this.approvedAt) {
      this.approvedAt = new Date();
    }
  }
  if (this.isModified('status') && ['rejected', 'suspended'].includes(this.status)) {
    this.isActive = false;
  }
  next();
});

// --- Discriminator Registrations ---
const enabledBlocksArrayPath = MileTeamSchema.path('enabledBlocks') as mongoose.Schema.Types.DocumentArray;

// 1. OKR Block
enabledBlocksArrayPath.discriminator('OKR', new Schema({
  currentProgress: { type: Number, default: 0 },
  targetValue: { type: Number, default: 100 },
  objectiveTitle: { type: String, required: true }
}, { _id: false }));

// 2. ACWR Block
enabledBlocksArrayPath.discriminator('ACWR', new Schema({
  acuteLoad: { type: Number, default: 0 },
  chronicLoad: { type: Number, default: 0 },
  injuryRiskZone: { type: String, enum: ['Safe', 'Watch', 'Danger'], default: 'Safe' }
}, { _id: false }));

// 3. SETTLEMENT Block
enabledBlocksArrayPath.discriminator('SETTLEMENT', new Schema({
  bankAccount: { type: String, required: true },
  bankName: { type: String, required: true },
  totalAmount: { type: Number, default: 0 }
}, { _id: false }));

export default mongoose.models.MileTeam || mongoose.model<IMileTeam>('MileTeam', MileTeamSchema);
