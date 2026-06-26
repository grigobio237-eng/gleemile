import mongoose, { Document, Schema } from 'mongoose';

export interface IMileTeamMember extends Document {
  teamId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'director' | 'leader' | 'member' | 'supporter';
  // 팀원/스터디원 전용 필드
  position?: 'MF' | 'FW' | 'DF' | 'GK';
  playerNumber?: number;
  weight?: number;            // kg (영양 계산용)
  height?: number;            // cm
  dominantFoot?: 'left' | 'right' | 'both';
  birthDate?: Date;
  // 청강생/외부 자문-자녀 연결
  linkedPlayerId?: mongoose.Types.ObjectId; // 청강생/외부 자문일 때 연결된 팀원/스터디원(자녀)의 member _id
  // 이적 관련
  status: 'active' | 'inactive' | 'transferred';
  pastDataConsent: boolean;    // 이적 시 과거 데이터 공유 동의
  joinedAt: Date;
  leftAt?: Date;
  // 역할별 권한 (총무/조장/스태프용)
  permissions?: {
    viewWellness: boolean;     // 웰니스 데이터 열람
    viewAcwr: boolean;         // ACWR 데이터 열람
    manageAnnouncements: boolean; // 공지사항 관리
    manageSchedule: boolean;   // 스케줄 관리
    manageMembers: boolean;    // 멤버 관리
    viewReports: boolean;      // 리포트 열람
  };
  createdAt: Date;
  updatedAt: Date;
}

// 역할별 기본 권한 매핑
export const DEFAULT_PERMISSIONS: Record<string, IMileTeamMember['permissions']> = {
  director: {
    viewWellness: true,
    viewAcwr: true,
    manageAnnouncements: true,
    manageSchedule: true,
    manageMembers: true,
    viewReports: true,
  },
  leader: {
    viewWellness: true,
    viewAcwr: true,
    manageAnnouncements: true,
    manageSchedule: true,
    manageMembers: false,
    viewReports: true,
  },
  member: {
    viewWellness: false,
    viewAcwr: false,
    manageAnnouncements: false,
    manageSchedule: false,
    manageMembers: false,
    viewReports: false,
  },
  supporter: {
    viewWellness: false,
    viewAcwr: false,
    manageAnnouncements: false,
    manageSchedule: false,
    manageMembers: false,
    viewReports: false,
  },
};

const MileTeamMemberSchema = new Schema<IMileTeamMember>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'MileTeam', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['director', 'leader', 'member', 'supporter'],
      required: true,
    },
    // 팀원/스터디원 전용
    position: { type: String, enum: ['MF', 'FW', 'DF', 'GK'] },
    playerNumber: { type: Number },
    weight: { type: Number },
    height: { type: Number },
    dominantFoot: { type: String, enum: ['left', 'right', 'both'] },
    birthDate: { type: Date },
    // 청강생/외부 자문 연결
    linkedPlayerId: { type: Schema.Types.ObjectId, ref: 'User' },
    // 상태
    status: {
      type: String,
      enum: ['active', 'inactive', 'transferred'],
      default: 'active',
    },
    pastDataConsent: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date },
    // 권한
    permissions: {
      viewWellness: { type: Boolean, default: false },
      viewAcwr: { type: Boolean, default: false },
      manageAnnouncements: { type: Boolean, default: false },
      manageSchedule: { type: Boolean, default: false },
      manageMembers: { type: Boolean, default: false },
      viewReports: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// 동일 팀에 동일 유저 중복 가입 방지 (active 상태 기준)
MileTeamMemberSchema.index({ teamId: 1, userId: 1, status: 1 }, { unique: true });
// 빠른 조회를 위한 인덱스
MileTeamMemberSchema.index({ userId: 1, status: 1 });
MileTeamMemberSchema.index({ teamId: 1, role: 1 });

// 역할에 따른 기본 권한 자동 설정
MileTeamMemberSchema.pre('save', function(this: any, next) {
  if (this.isNew && !this.permissions?.viewWellness && DEFAULT_PERMISSIONS[this.role]) {
    this.permissions = { ...DEFAULT_PERMISSIONS[this.role] };
  }
  next();
});

// 멱등성 보장을 위한 복합 유니크 인덱스 (팀 1개당 유저 1명만 가입 가능)
MileTeamMemberSchema.index({ teamId: 1, userId: 1 }, { unique: true });

export default mongoose.models.MileTeamMember || mongoose.model<IMileTeamMember>('MileTeamMember', MileTeamMemberSchema);
