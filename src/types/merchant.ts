// ============================================================
// Gleemile 소상공인 모듈 타입 정의
// ============================================================

/** 업종 (Industry) */
export type MerchantIndustry =
  | 'beauty'    // 뷰티/헬스 (미용실, 네일, PT 등)
  | 'service'   // 출장/정비/인테리어
  | 'academy'   // 학원/교습소
  | 'retail'    // 전문 도소매
  | 'food';     // 외식/배달

/** 구독 플랜 */
export type MerchantPlan =
  | 'base'      // Labor-Shield 만 (9,900원)
  | 'beauty'    // Base + NoShow-Zero (14,900원)
  | 'service'   // Base + Quick-Quote (19,900원)
  | 'academy'   // Base + Pay-Collector (14,900원)
  | 'food';     // Base + Margin-Guard (14,900원)

/** 활성화 가능한 모듈 ID */
export type MerchantModuleId =
  | 'labor-shield'
  | 'noshow-zero'
  | 'quick-quote'
  | 'pay-collector'
  | 'margin-guard';

/** Firestore: teams/{teamId}/merchant_profile */
export interface MerchantProfile {
  industry: MerchantIndustry;
  plan: MerchantPlan;
  activeModules: MerchantModuleId[];
  isPromotionalFree: boolean;       // true = 무료 프로모션 (현재 전면 무료)
  monthlyFee: number;               // 실제 청구 금액 (프로모션 시 0)
  activatedAt: Date | null;
  updatedAt: Date | null;
}

/** 업종별 추천 플랜 매핑 */
export const INDUSTRY_PLAN_MAP: Record<MerchantIndustry, MerchantPlan> = {
  beauty:  'beauty',
  service: 'service',
  academy: 'academy',
  retail:  'academy',   // 도소매는 Pay-Collector 동일 사용
  food:    'food',
};

/** 업종별 활성화 모듈 */
export const INDUSTRY_MODULE_MAP: Record<MerchantIndustry, MerchantModuleId[]> = {
  beauty:  ['labor-shield', 'noshow-zero'],
  service: ['labor-shield', 'quick-quote'],
  academy: ['labor-shield', 'pay-collector'],
  retail:  ['labor-shield', 'pay-collector'],
  food:    ['labor-shield', 'margin-guard'],
};

/** 플랜별 정가 (홍보용, 실제 청구는 0원) */
export const PLAN_ORIGINAL_PRICE: Record<MerchantPlan, number> = {
  base:    9900,
  beauty:  14900,
  service: 19900,
  academy: 14900,
  food:    14900,
};

/** 업종 메타데이터 */
export interface IndustryMeta {
  id: MerchantIndustry;
  label: string;
  emoji: string;
  description: string;
  painPoint: string;         // 핵심 해결 페인포인트
  moduleLabel: string;       // 특화 모듈명
  plan: MerchantPlan;
}

export const INDUSTRY_META: IndustryMeta[] = [
  {
    id: 'beauty',
    label: '뷰티/헬스',
    emoji: '💇',
    description: '미용실, 네일, 피부관리, PT, 헬스장',
    painPoint: '노쇼 손실 연 5,913만원 · 수기 예약 하루 2.5시간',
    moduleLabel: 'NoShow-Zero (예약금·회원권)',
    plan: 'beauty',
  },
  {
    id: 'service',
    label: '출장/정비',
    emoji: '🔧',
    description: '정비소, 인테리어, 설비, 세탁, 청소',
    painPoint: '수기 견적 건당 35분 · AS 분쟁 월 1.8건',
    moduleLabel: 'Quick-Quote (사진 견적·AS 방어)',
    plan: 'service',
  },
  {
    id: 'academy',
    label: '학원/교습소',
    emoji: '📚',
    description: '예체능 학원, 어학원, 교습소',
    painPoint: '원비 미납률 14.5% · 독촉 마찰로 퇴원율 11.2%',
    moduleLabel: 'Pay-Collector (원비 자동 청구)',
    plan: 'academy',
  },
  {
    id: 'retail',
    label: '전문 도소매',
    emoji: '🏪',
    description: '꽃집, 건축자재, 공구상, B2B 도매',
    painPoint: '외상 미수금 월평균 1,250만원 자금 압박',
    moduleLabel: 'Pay-Collector (미수금 자동 청구)',
    plan: 'academy',
  },
  {
    id: 'food',
    label: '외식/배달',
    emoji: '🍱',
    description: '음식점, 배달 전문점, 프랜차이즈',
    painPoint: '배달 수수료 최대 29.3% · 역마진 적자 구조',
    moduleLabel: 'Margin-Guard (실질 마진·BEP 계산)',
    plan: 'food',
  },
];

// ────────────────────────────────────────
// NoShow-Zero 관련 타입
// ────────────────────────────────────────
export interface NoShowBooking {
  id: string;
  clientName: string;
  serviceName: string;
  depositAmount: number;        // 예약금
  expiresAt: Date;              // 결제 유효기한 (15분)
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  paymentLinkUrl?: string;      // Mock URL
  createdAt: Date;
}

export interface MembershipCard {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  createdAt: Date;
  updatedAt: Date;
}

// ────────────────────────────────────────
// Quick-Quote 관련 타입
// ────────────────────────────────────────
export interface QuoteItem {
  id: string;
  name: string;                 // 부품/공임명
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface Quote {
  id: string;
  clientName: string;
  clientPhone: string;
  siteAddress: string;
  items: QuoteItem[];
  totalAmount: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  beforePhotoUrls: string[];    // Firebase Storage URLs
  afterPhotoUrls: string[];
  signatureUrl?: string;
  paymentLinkUrl?: string;      // Mock
  createdAt: Date;
  updatedAt: Date;
}

// ────────────────────────────────────────
// Pay-Collector 관련 타입
// ────────────────────────────────────────
export interface Receivable {
  id: string;
  clientName: string;
  clientPhone: string;
  description: string;          // 품목/수강과목
  amount: number;
  dueDate: Date;
  status: 'unpaid' | 'paid' | 'overdue';
  reminderCount: number;        // 독촉 발송 횟수
  lastReminderAt?: Date;
  paidAt?: Date;
  createdAt: Date;
}

// ────────────────────────────────────────
// Margin-Guard 관련 타입
// ────────────────────────────────────────
export interface MenuItem {
  id: string;
  name: string;
  salePrice: number;            // 판매가
  ingredientCost: number;       // 식재료비
  packagingCost: number;        // 포장재비
  deliveryFeeRate: number;      // 배달비율 (%)
  platformFeeRate: number;      // 플랫폼 수수료율 (%)
  pgFeeRate: number;            // PG 결제 수수료율 (%)
  netProfit: number;            // 계산된 실질 순이익
  netMarginRate: number;        // 실질 마진율 (%)
}

export interface MarginSettings {
  fixedCosts: {
    rent: number;               // 임대료
    utilities: number;          // 공공요금
    laborCost: number;          // 인건비
    other: number;              // 기타
  };
  menuItems: MenuItem[];
  dailyBep: number;             // 일일 BEP (계산값)
  monthlyBep: number;           // 월 BEP (계산값)
  updatedAt: Date;
}
