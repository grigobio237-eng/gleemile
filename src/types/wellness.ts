import { Timestamp, FieldValue, DocumentData, QueryDocumentSnapshot, SnapshotOptions, FirestoreDataConverter } from 'firebase/firestore';

// ==========================================
// 1. 공통 웰니스 인터페이스 (Base)
// ==========================================
export interface BaseWellnessBlock {
  id: string; // 문서 ID
  type: 'WELLNESS_CHECK' | 'DAILY_QUESTION' | 'SLEEP_LOG' | 'RECOVERY_SCORE' | 'RECOVERY_REPORT' | 'USER_MOOD';
  userId: string;
  teamId: string;
  date: string; // YYYY-MM-DD
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// ==========================================
// 2. WellnessCheck 블록 스펙 (일간 웰니스 점검)
// ==========================================
export interface WellnessCheckBlock extends BaseWellnessBlock {
  type: 'WELLNESS_CHECK';
  sleep: number;             // 1~5
  fatigue: number;           // 1~5
  stress: number;            // 1~5
  tension: number;           // 1~5
  mentalStrainIndex: number; // 1.0 ~ 5.0 평균
  
  notes?: {
    sleep?: string;
    fatigue?: string;
    stress?: string;
    tension?: string;
  };

  collaborationVolume: number; // 1.0 ~ 3.0
  dailyCognitiveLoad: number;  // = collaborationVolume * mentalStrainIndex (자동 계산되어야 함)
  
  injuryNote?: string;
  source: 'quick' | 'scanner' | 'diagnosis';
}

// ==========================================
// 3. DailyQuestion 블록 스펙 (일간 설문/진단)
// ==========================================
// [아키텍처 분리]: 템플릿(질문 메타데이터)은 question_templates 컬렉션에 마스터로 존재함
export interface DailyQuestionBlock extends BaseWellnessBlock {
  type: 'DAILY_QUESTION';
  templateId: string; // 참조하는 루트 컬렉션 템플릿 ID (question_templates/{templateId})
  journey: 'WELLNESS' | 'CLINICAL_PRE' | 'CLINICAL_POST';
  medicalCategory?: 'PLASTIC' | 'ORTHOPEDIC' | 'INTERNAL' | 'GENERAL';
  
  // 템플릿의 전체 구조 대신, 질문 ID와 선택한 옵션의 점수/라벨만 경량화 저장
  answers: Array<{
    questionId: number;
    selectedLabel: string;
    score: number;
  }>;
}

// ==========================================
// 3-1. SleepLog 블록 스펙 (수면 데이터)
// ==========================================
export interface SleepLogBlock extends BaseWellnessBlock {
  type: 'SLEEP_LOG';
  bedTime: string; // HH:mm
  wakeTime: string; // HH:mm
  duration: number; // minutes
  quality: number; // 1-5 or 0-100
  efficiency: number; // percentage
  aiAnalysis?: string;
}

// ==========================================
// 3-2. RecoveryScore 블록 스펙 (회복 점수)
// ==========================================
export interface RecoveryScoreBlock extends BaseWellnessBlock {
  type: 'RECOVERY_SCORE';
  rawScore: number; // 0-25 sum of 5 questions
  totalScore: number; // 0-100 converted score
  metaphor: string;
  
  // Array 안티패턴 방어: 5개의 고정 문항이므로 Key-Value Record (Map) 구조로 최적화
  answers: Record<string, {
    category: string;
    score: number;
    detail?: string;
  }>;
  
  snapData?: {
    type: 'PHOTO' | 'TEXT';
    content: string; // Storage 이미지 URL 연동 고려
  };
  userNote?: string;
}

// ==========================================
// 3-3. RecoveryReport 블록 스펙 (주간/월간 리포트)
// ==========================================
export interface RecoveryReportBlock extends BaseWellnessBlock {
  type: 'RECOVERY_REPORT';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  summary: string;
  status?: string;
  recommendations: string[]; // 최대 10개로 제한 (Converter에서 검증)
  insight?: string;
  percentileFeedback?: string;
}

// ==========================================
// 3-4. UserMood 블록 스펙 (간편 감정 기록)
// ==========================================
export interface UserMoodBlock extends BaseWellnessBlock {
  type: 'USER_MOOD';
  moodScore: 1 | 2 | 3 | 4 | 5; // 1~5 정수형 타입 제한
  timeOfDay: string;
}

// ==========================================
// 4. 유니온 타입 및 Type Guards
// ==========================================
export type WellnessBlock = 
  | WellnessCheckBlock 
  | DailyQuestionBlock 
  | SleepLogBlock 
  | RecoveryScoreBlock 
  | RecoveryReportBlock 
  | UserMoodBlock;

export const isWellnessCheckBlock = (block: WellnessBlock): block is WellnessCheckBlock => {
  return block.type === 'WELLNESS_CHECK';
};

export const isDailyQuestionBlock = (block: WellnessBlock): block is DailyQuestionBlock => {
  return block.type === 'DAILY_QUESTION';
};

export const isSleepLogBlock = (block: WellnessBlock): block is SleepLogBlock => {
  return block.type === 'SLEEP_LOG';
};

export const isRecoveryScoreBlock = (block: WellnessBlock): block is RecoveryScoreBlock => {
  return block.type === 'RECOVERY_SCORE';
};

export const isRecoveryReportBlock = (block: WellnessBlock): block is RecoveryReportBlock => {
  return block.type === 'RECOVERY_REPORT';
};

export const isUserMoodBlock = (block: WellnessBlock): block is UserMoodBlock => {
  return block.type === 'USER_MOOD';
};

// ==========================================
// 5. Firestore Custom Converter
// ==========================================
export const wellnessBlockConverter: FirestoreDataConverter<WellnessBlock> = {
  toFirestore(block: WellnessBlock): DocumentData {
    // 저장 시점에 undefined 필드 제거 및 계산 로직 무결성 보장
    if (isWellnessCheckBlock(block)) {
      // ⚠️ dailyCognitiveLoad 수식 연산 강제 적용 (정합성 방어)
      const calculatedLoad = Number((block.collaborationVolume * block.mentalStrainIndex).toFixed(2));
      return { ...block, dailyCognitiveLoad: calculatedLoad };
    }
    
    if (isRecoveryReportBlock(block)) {
      // ⚠️ recommendations 배열 최대 10개로 슬라이싱 (Unbounded Growth 방어)
      const safeRecommendations = block.recommendations.slice(0, 10);
      return { ...block, recommendations: safeRecommendations };
    }
    
    // SleepLog, RecoveryScore, DailyQuestion, UserMood 등은 기본적으로 그대로 저장하되 undefined 필드는 제거됨
    // (Firebase는 기본적으로 undefined를 지원하지 않으므로 구조 분해 할당 시 유의)
    return { ...block };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): WellnessBlock {
    const data = snapshot.data(options)!;
    
    // serverTimestamp() 지연(null) 시 클라이언트 임시 시간 부여
    const createdAt = data.createdAt || Timestamp.now();
    const updatedAt = data.updatedAt || Timestamp.now();

    return {
      id: snapshot.id,
      ...data,
      createdAt,
      updatedAt,
    } as WellnessBlock;
  }
};
