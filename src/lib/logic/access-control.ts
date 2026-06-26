import { IUser } from '@/models/User';

export type UserGroup = 'NONE' | 'RESET' | 'REBORN' | 'RESTART' | 'BLACK';
export type ReportAccessLevel = 'BASIC' | 'FOUNDER' | 'PREMIUM';

export interface TierLimits {
  scannerLimit: number;
  diagnosisLimit: number;
  webtoonLimitHours: number; // 기다무 시간 (시간 단위)
  webtoonGenerationLimit: number; // 일일 생성 제한
  dataRetentionDays: number;
}

export const TIER_LIMITS: Record<UserGroup, TierLimits> = {
  NONE: {
    scannerLimit: 5,
    diagnosisLimit: 0,
    webtoonLimitHours: 72,
    webtoonGenerationLimit: 0,
    dataRetentionDays: 1
  },
  RESET: {
    scannerLimit: 5,
    diagnosisLimit: 5,
    webtoonLimitHours: 48,
    webtoonGenerationLimit: 0,
    dataRetentionDays: 7
  },
  REBORN: {
    scannerLimit: 9999,
    diagnosisLimit: 9999,
    webtoonLimitHours: 0, // 무제한
    webtoonGenerationLimit: 9999,
    dataRetentionDays: 90
  },
  RESTART: {
    scannerLimit: 9999, // 사실상 무제한
    diagnosisLimit: 9999,
    webtoonLimitHours: 0,
    webtoonGenerationLimit: 9999,
    dataRetentionDays: 9999 // 전체 기간
  },
  BLACK: {
    scannerLimit: 9999,
    diagnosisLimit: 9999,
    webtoonLimitHours: 0,
    webtoonGenerationLimit: 9999,
    dataRetentionDays: 9999
  }
};

export const FEATURE_COSTS = {
  scanner: 100,
  diagnosis: 200,
  webtoon: 300
};

export class AccessControl {
  /**
   * 유저의 패스 타입에 따른 그룹 반환
   */
  static getUserGroup(user: any): UserGroup {
    if (!user) return 'NONE';
    
    // role이 admin/superadmin인 경우 우선권 부여 가능 (필요시)
    if (this.isAdmin(user)) return 'BLACK'; // 관리자는 최고 등급 혜택

    const passType = user.passInfo?.type || 'NONE';
    if (passType === 'BLACK') return 'BLACK';
    if (passType === 'RESTART') return 'RESTART';
    if (passType === 'REBORN' || user.subscription?.status === 'active') return 'REBORN';
    if (passType === 'RESET') return 'RESET';
    
    // 구형 필드(tier) 및 grade 폴백
    const tier = user.tier || user.grade || 'NONE';
    if (['BLACK', 'RESTART', 'REBORN', 'RESET'].includes(tier)) return tier as UserGroup;

    return 'NONE';
  }

  /**
   * 프리미엄(유료) 등급 여부 확인
   */
  static isPremium(user: any): boolean {
    const group = this.getUserGroup(user);
    return ['REBORN', 'RESTART', 'BLACK'].includes(group);
  }

  /**
   * 리포트 및 콘텐츠 접근 권한 레벨 (BASIC, FOUNDER, PREMIUM)
   */
  static getReportAccessLevel(user: any, diagnosisType?: string): ReportAccessLevel {
    if (this.isAdmin(user)) return 'PREMIUM';

    // 특정 유료 진단 결과(단건 결제)인 경우 프리미엄 리포트로 간주
    if (diagnosisType && ['PAID', 'DEEP', 'PERSONALITY'].includes(diagnosisType.toUpperCase())) {
      return 'PREMIUM';
    }

    const group = this.getUserGroup(user);
    
    // REBORN 이상의 정기 구독자/멤버십은 PREMIUM
    if (['REBORN', 'RESTART', 'BLACK'].includes(group)) {
      return 'PREMIUM';
    }

    // RESET 티어이거나 파운더 전용 뱃지/티켓 소유자는 FOUNDER
    if (group === 'RESET' || user?.isFounder || user?.passInfo?.isFounder) {
      return 'FOUNDER';
    }

    return 'BASIC';
  }

  /**
   * 해당 유저의 티어별 제한 수치 반환
   */
  static getLimits(user: IUser): TierLimits {
    const group = this.getUserGroup(user);
    return TIER_LIMITS[group];
  }

  /**
   * 일일 사용량 초기화 필요 여부 확인 및 리셋
   */
  static async checkAndResetDailyStats(user: IUser): Promise<boolean> {
    const now = new Date();
    const lastReset = user.dailyStats?.lastResetDate || new Date(0);
    
    // 날짜가 바뀌었는지 확인 (KST 기준 권장이나 여기서는 UTC/Local 기준)
    if (now.toDateString() !== lastReset.toDateString()) {
      user.dailyStats = {
        scannerCount: 0,
        diagnosisCount: 0,
        webtoonCount: 0,
        lastResetDate: now
      };
      return true; // 리셋됨
    }
    return false;
  }

  /**
   * 관리자 여부 확인
   */
  static isAdmin(user: any): boolean {
    if (!user) return false;
    return ['admin', 'superadmin'].includes(user.role);
  }

  /**
   * 의료기관 담당자 여부 확인
   */
  static isClinicStaff(user: any): boolean {
    if (!user) return false;
    if (this.isAdmin(user)) return true;
    
    // 파트너이면서 의료기관 타입인 경우
    return user.role === 'partner' && user.partnerApplication?.partnerType === 'medical';
  }

  /**
   * 특정 기능 사용 가능 여부 확인
   */
  static canUseFeature(user: IUser, feature: 'scanner' | 'diagnosis' | 'webtoon'): boolean {
    if (this.isAdmin(user)) return true;
    const limits = this.getLimits(user);
    const stats = user.dailyStats || { scannerCount: 0, diagnosisCount: 0, webtoonCount: 0 };

    switch (feature) {
      case 'scanner':
        return stats.scannerCount < limits.scannerLimit;
      case 'diagnosis':
        return stats.diagnosisCount < limits.diagnosisLimit;
      case 'webtoon':
        // 웹툰 생성 제한 체크 (감상은 무제한/기다무 로직 별도 필요)
        return stats.webtoonCount < limits.webtoonGenerationLimit;
      default:
        return false;
    }
  }

  /**
   * 스캔 카테고리별 사용 가능 여부 확인
   * Reset: 식단(MEAL), 상태(STATE)
   * Reborn: 식단, 상태 + 자세(POSTURE)
   * Restart/Black: 전체 (식단, 자세, 공간(SPACE), 시술전후(POST_OP))
   */
  static canUseScanType(user: any, type: string): boolean {
    if (this.isAdmin(user)) return true;
    const group = this.getUserGroup(user);
    const normalizedType = type.toUpperCase();
    
    // Life Snap 9개 카테고리는 모든 티어에서 사용 가능
    const lifeSnapCategories = ['MEAL', 'HYDRATION', 'SKIN', 'SLEEP', 'ACTIVITY', 'ROUTINE', 'BODY', 'MEDICAL_DOC', 'OTHER'];
    if (lifeSnapCategories.includes(normalizedType)) return true;

    if (group === 'BLACK' || group === 'RESTART') return true;
    if (group === 'REBORN') return ['MEAL', 'POSTURE', 'STATE'].includes(normalizedType);
    if (group === 'RESET' || group === 'NONE') return ['MEAL', 'STATE'].includes(normalizedType);
    return false;
  }

  /**
   * 리듬체크 타입별 사용 가능 여부 확인
   * Reset: daily, free (1회 체험 로직은 API에서 처리)
   * Reborn: daily, free
   * Restart/Black: daily, free, deep/paid
   */
  static canUseDiagnosisType(user: any, type: string): boolean {
    if (this.isAdmin(user)) return true;
    const group = this.getUserGroup(user);
    const lowerType = type.toLowerCase();
    
    if (group === 'BLACK' || group === 'RESTART') return true;
    if (group === 'REBORN') return ['daily', 'free'].includes(lowerType);
    if (group === 'RESET' || group === 'NONE') return ['daily', 'free'].includes(lowerType);
    return false;
  }

  /**
   * 티어별 포인트 적립 배수 반환
   * RESET: 1x (기본), REBORN: 1.1x, RESTART: 1.3x, BLACK: 1.5x
   */
  static getPointMultiplier(user: any): number {
    const group = this.getUserGroup(user);
    const multipliers: Record<UserGroup, number> = {
      NONE: 1,
      RESET: 1,
      REBORN: 1.1,
      RESTART: 1.3,
      BLACK: 1.5,
    };
    return multipliers[group] ?? 1;
  }

  /**
   * 티어별 포인트 적립 배수 라벨 (UI 표시용)
   */
  static getPointMultiplierLabel(user: any): string {
    const group = this.getUserGroup(user);
    const labels: Record<UserGroup, string> = {
      NONE: '',
      RESET: '',
      REBORN: '🔥 리본 보너스 x1.1',
      RESTART: '⚡ 리스타트 보너스 x1.3',
      BLACK: '👑 블랙 보너스 x1.5',
    };
    return labels[group] ?? '';
  }

  /**
   * 유저 등급별 과거 데이터 조회 기한(RESET 7일, REBORN 90일)에 만족하는지 검사
   */
  static canViewHistoryDate(user: any, createdAtDate: Date | string): boolean {
    if (this.isAdmin(user)) return true;
    const group = this.getUserGroup(user);
    const limits = TIER_LIMITS[group];
    if (!limits) return false;
    
    const retentionDays = limits.dataRetentionDays;
    if (retentionDays >= 9999) return true; // 무제한

    const createdTime = new Date(createdAtDate).getTime();
    const cutoffTime = new Date().getTime() - (retentionDays * 24 * 60 * 60 * 1000);
    return createdTime >= cutoffTime;
  }
}

