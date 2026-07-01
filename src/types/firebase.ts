import { Timestamp, FieldValue } from 'firebase/firestore';

// ==========================================
// 유틸리티 타입
// ==========================================
export type Serializable<T> = {
  [K in keyof T]: T[K] extends Timestamp | FieldValue ? string : 
                  T[K] extends Timestamp | FieldValue | undefined ? string | undefined : 
                  T[K];
};

// ==========================================
// [Bucket 1] 팀 및 멤버 권한 도메인
// ==========================================

export interface IFirestoreUser {
  id: string;             
  name: string;           
  avatar?: string;        
  tier: 'RESET' | 'REBORN' | 'RESTART' | 'BLACK'; 
  isNavigator: boolean;   
  notificationSettings?: {
    isAllEnabled: boolean;
    chatEnabled: boolean;
    announcementEnabled: boolean;
  };
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface IFirestoreTeamCodeLookup {
  id: string;             // teamCode
  teamId: string;
  createdAt: Timestamp | FieldValue;
}

export interface IFirestoreTeam {
  id: string;             
  teamName: string;
  teamCode: string;       
  category: 'youth' | 'pro' | 'amateur';
  templateType: 'business' | 'hobby' | 'study' | 'sports';
  description?: string;
  logoUrl?: string;
  inviteLink: string;
  isPublic: boolean;
  isActive: boolean;
  maxMembers: number;
  createdBy: string;      
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  
  // 활성화 블록 임베딩
  enabledBlocks: TeamBlock[]; 
}

export interface IFirestoreTeamMember {
  id: string;             // `${teamId}_${userId}`
  teamId: string;
  userId: string;
  role: 'owner' | 'manager' | 'member' | 'guest';
  permissions: {
    viewWellness: boolean;
    viewAcwr: boolean;
    manageAnnouncements: boolean;
    manageMembers: boolean;
  };
  linkedPlayerId?: string; 
  status: 'active' | 'inactive' | 'transferred';
  joinedAt: Timestamp | FieldValue;
  leftAt?: Timestamp | FieldValue;
  
  // ACWR 개인 보안 데이터 임베딩
  acwrData?: {
    acuteLoad?: number;
    chronicLoad?: number;
    acwrRatio?: number;
    injuryRiskZone?: 'Safe' | 'Watch' | 'Danger';
  };
}

export interface IJoinRequest {
  id: string; // userId
  name: string;
  avatar?: string;
  gender?: 'male' | 'female' | 'none';
  ageGroup?: string;
  phoneNumber?: string;
  recommender?: string;
  introduction?: string;
  status: 'pending' | 'rejected';
  appliedAt: Timestamp | FieldValue;
}

// ==========================================
// [Bucket 2] 활성화 블록 데이터 도메인
// ==========================================

export interface IBaseBlock {
  blockId: string;
  isActive: boolean;
  order: number;
}

export interface IOkrBlock extends IBaseBlock {
  blockType: 'okr';
  objectiveTitle?: string;
  currentProgress?: number; // 0 ~ 100
  targetValue?: number;
}

export interface IAcwrBlock extends IBaseBlock {
  blockType: 'acwr';
  // 데이터는 팀 공용 문서가 아닌 IFirestoreTeamMember 하위의 acwrData로 이관하여 격리됨.
}

export interface ICalendarEvent {
  eventId: string;
  title: string;
  type: 'training' | 'match' | 'rest';
  startTime: Timestamp | FieldValue;
  endTime: Timestamp | FieldValue;
  location?: string;
  description?: string;
}

export interface ICalendarBlock extends IBaseBlock {
  blockType: 'schedule';
  // 데이터는 teams/{teamId}/events/{eventId} 서브컬렉션으로 이관되어 Unbounded Growth 방어됨.
}

// 나머지 21개 레거시 블록들을 위한 포괄적 임시 타입 (Bucket 2 전면 적용 시 개별 분리)
export type LegacyBlockType = 
  | 'wellness' | 'announcements' | 'community' | 'players'
  | 'kanban' | 'feedback' | 'weekly_pulse'
  | 'part_balance' | 'media_archive' | 'creative_burnout' | 'dday_board' | 'expense' | 'attendance' | 'gallery' | 'difficulty'
  | 'timer' | 'study_material' | 'assignment' | 'satisfaction'
  | 'bracket' | 'tactics';

export interface ILegacyBlock extends IBaseBlock {
  blockType: LegacyBlockType;
  [key: string]: any; 
}

export type TeamBlock = IOkrBlock | IAcwrBlock | ICalendarBlock | ILegacyBlock;

// Type Guards
export const isOkrBlock = (block: TeamBlock): block is IOkrBlock => {
  return block.blockType === 'okr';
};

export const isAcwrBlock = (block: TeamBlock): block is IAcwrBlock => {
  return block.blockType === 'acwr';
};

export const isCalendarBlock = (block: TeamBlock): block is ICalendarBlock => {
  return block.blockType === 'schedule';
};

// ==========================================
// [Bucket 3] 실시간 소통 도메인
// ==========================================

export interface IFirestoreTeamMessage {
  id: string;             
  senderId: string;       
  text: string;           
  attachmentUrl?: string; 
  attachmentType?: 'image' | 'file';
  isSystemMessage: boolean;
  
  // 절대 클라이언트 시간(new Date) 금지. 무조건 serverTimestamp()
  createdAt: Timestamp | FieldValue; 
  isDeleted: boolean;
}

export interface IFirestoreTeamAnnouncement {
  id: string;             
  authorId: string;       
  title: string;
  content: string;        
  isPinned: boolean;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}
