/**
 * Gleemile 소상공인 서비스 레이어
 *
 * 알림톡 및 PG 결제는 MVP 단계에서 Mock으로 구현되어 있습니다.
 * 실제 API 연동 시 아래 MOCK 함수들을 실제 API 호출로 교체하세요.
 *
 * [카카오 알림톡 연동 시] src/lib/kakao-service.ts 생성 후 sendAlimtalk() 교체
 * [PG 결제 연동 시] src/lib/pg-service.ts 생성 후 createPaymentLink() 교체
 */

import {
  doc, getDoc, setDoc, updateDoc, collection,
  addDoc, getDocs, query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  MerchantProfile, MerchantIndustry, MerchantModuleId,
  NoShowBooking, MembershipCard, Quote, QuoteItem,
  Receivable, MarginSettings, MenuItem,
  INDUSTRY_PLAN_MAP, INDUSTRY_MODULE_MAP,
} from '@/types/merchant';
import { INDUSTRY_PLAN_MAP as planMap, INDUSTRY_MODULE_MAP as moduleMap } from '@/types/merchant';

// ════════════════════════════════════════════════════════
// 1. 점주 프로필 (MerchantProfile) CRUD
// ════════════════════════════════════════════════════════

const merchantRef = (teamId: string) =>
  doc(db, `teams/${teamId}/merchant_profile`, 'main');

export async function getMerchantProfile(teamId: string): Promise<MerchantProfile | null> {
  const snap = await getDoc(merchantRef(teamId));
  if (!snap.exists()) return null;
  return snap.data() as MerchantProfile;
}

export async function activateMerchantProfile(
  teamId: string,
  industry: MerchantIndustry
): Promise<void> {
  const plan = planMap[industry];
  const activeModules = moduleMap[industry];

  const profile: MerchantProfile = {
    industry,
    plan,
    activeModules,
    isPromotionalFree: true,
    monthlyFee: 0,              // 무료 프로모션: 0원
    activatedAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(merchantRef(teamId), profile);
}

export async function updateMerchantProfile(
  teamId: string,
  updates: Partial<MerchantProfile>
): Promise<void> {
  await updateDoc(merchantRef(teamId), { ...updates, updatedAt: new Date() });
}

// ════════════════════════════════════════════════════════
// 2. [MOCK] 카카오 알림톡 발송
//    실제 API 연동 시 이 함수를 교체하세요.
// ════════════════════════════════════════════════════════

export interface AlimtalkPayload {
  recipientPhone: string;
  templateCode: string;
  variables: Record<string, string>;
  webLink?: string;
}

/**
 * [MOCK] 알림톡 발송 시뮬레이션
 * 실제 카카오 비즈니스 채널 API 연동 전 가짜 응답을 반환합니다.
 */
export async function sendAlimtalk(payload: AlimtalkPayload): Promise<{
  success: boolean;
  messageId: string;
  shareUrl: string;       // 복사해서 직접 공유할 수 있는 URL
}> {
  // [MOCK] 500ms 딜레이로 실제 API 호출 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 500));

  const shareUrl = payload.webLink || `https://gleemile.com/link/${Date.now()}`;

  console.log('[MOCK] 알림톡 발송:', {
    phone: payload.recipientPhone,
    template: payload.templateCode,
    variables: payload.variables,
    shareUrl,
  });

  return {
    success: true,
    messageId: `mock_${Date.now()}`,
    shareUrl,
  };
}

// ════════════════════════════════════════════════════════
// 3. [MOCK] PG 결제 링크 생성
//    실제 PG(토스페이먼츠/포트원) 연동 시 교체하세요.
// ════════════════════════════════════════════════════════

export interface PaymentLinkOptions {
  orderId: string;
  orderName: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  expiresInMinutes?: number;    // 결제 링크 유효 시간 (기본: 15분)
}

/**
 * [MOCK] 결제 링크 생성 시뮬레이션
 */
export async function createPaymentLink(options: PaymentLinkOptions): Promise<{
  paymentLinkUrl: string;
  orderId: string;
  expiresAt: Date;
}> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + (options.expiresInMinutes ?? 15));

  const mockUrl = `https://gleemile.com/pay/${options.orderId}?amount=${options.amount}&name=${encodeURIComponent(options.orderName)}`;

  console.log('[MOCK] 결제 링크 생성:', mockUrl);

  return {
    paymentLinkUrl: mockUrl,
    orderId: options.orderId,
    expiresAt,
  };
}

// ════════════════════════════════════════════════════════
// 4. NoShow-Zero: 예약금 및 회원권 서비스
// ════════════════════════════════════════════════════════

export async function createDepositBooking(
  teamId: string,
  data: Pick<NoShowBooking, 'clientName' | 'serviceName' | 'depositAmount'>
): Promise<NoShowBooking> {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  // [MOCK] 결제 링크 생성
  const { paymentLinkUrl } = await createPaymentLink({
    orderId: `booking_${Date.now()}`,
    orderName: `${data.serviceName} 예약금`,
    amount: data.depositAmount,
    customerName: data.clientName,
    customerPhone: '',
    expiresInMinutes: 15,
  });

  const booking: Omit<NoShowBooking, 'id'> = {
    ...data,
    expiresAt,
    status: 'pending',
    paymentLinkUrl,
    createdAt: new Date(),
  };

  const colRef = collection(db, `teams/${teamId}/noshow_bookings`);
  const docRef = await addDoc(colRef, booking);

  return { id: docRef.id, ...booking };
}

export async function getMemberships(teamId: string): Promise<MembershipCard[]> {
  const colRef = collection(db, `teams/${teamId}/memberships`);
  const snap = await getDocs(query(colRef, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MembershipCard));
}

export async function createMembership(
  teamId: string,
  data: Omit<MembershipCard, 'id' | 'usedSessions' | 'remainingSessions' | 'createdAt' | 'updatedAt'>
): Promise<MembershipCard> {
  const now = new Date();
  const card: Omit<MembershipCard, 'id'> = {
    ...data,
    usedSessions: 0,
    remainingSessions: data.totalSessions,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(collection(db, `teams/${teamId}/memberships`), card);
  return { id: docRef.id, ...card };
}

export async function useMembershipSession(
  teamId: string,
  membershipId: string,
  clientPhone: string
): Promise<MembershipCard> {
  const ref = doc(db, `teams/${teamId}/memberships`, membershipId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('회원권을 찾을 수 없습니다.');

  const card = snap.data() as MembershipCard;
  if (card.remainingSessions <= 0) throw new Error('잔여 횟수가 없습니다.');

  const updated = {
    usedSessions: card.usedSessions + 1,
    remainingSessions: card.remainingSessions - 1,
    updatedAt: new Date(),
  };
  await updateDoc(ref, updated);

  // [MOCK] 잔여 횟수 카톡 알림
  await sendAlimtalk({
    recipientPhone: clientPhone,
    templateCode: 'MEMBERSHIP_USED',
    variables: {
      clientName: card.clientName,
      serviceName: card.serviceName,
      remainingSessions: String(updated.remainingSessions),
    },
  });

  return { ...card, ...updated };
}

// ════════════════════════════════════════════════════════
// 5. Quick-Quote: 사진 견적 서비스
// ════════════════════════════════════════════════════════

export async function createQuote(
  teamId: string,
  data: Pick<Quote, 'clientName' | 'clientPhone' | 'siteAddress' | 'items' | 'beforePhotoUrls'>
): Promise<Quote> {
  const totalAmount = data.items.reduce((sum, item) => sum + item.total, 0);

  const quote: Omit<Quote, 'id'> = {
    ...data,
    totalAmount,
    status: 'draft',
    afterPhotoUrls: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await addDoc(collection(db, `teams/${teamId}/quotes`), quote);
  return { id: docRef.id, ...quote };
}

export async function sendQuoteToClient(
  teamId: string,
  quoteId: string
): Promise<{ shareUrl: string }> {
  const ref = doc(db, `teams/${teamId}/quotes`, quoteId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('견적서를 찾을 수 없습니다.');

  const quote = snap.data() as Quote;
  const shareUrl = `https://gleemile.com/quote/${teamId}/${quoteId}`;

  // [MOCK] 알림톡 발송
  const result = await sendAlimtalk({
    recipientPhone: quote.clientPhone,
    templateCode: 'QUOTE_SENT',
    variables: {
      clientName: quote.clientName,
      totalAmount: quote.totalAmount.toLocaleString(),
    },
    webLink: shareUrl,
  });

  await updateDoc(ref, { status: 'sent', updatedAt: new Date() });

  return { shareUrl: result.shareUrl };
}

export async function getQuotes(teamId: string): Promise<Quote[]> {
  const snap = await getDocs(
    query(collection(db, `teams/${teamId}/quotes`), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quote));
}

// ════════════════════════════════════════════════════════
// 6. Pay-Collector: 미수금 자동 청구 서비스
// ════════════════════════════════════════════════════════

export async function createReceivable(
  teamId: string,
  data: Pick<Receivable, 'clientName' | 'clientPhone' | 'description' | 'amount' | 'dueDate'>
): Promise<Receivable> {
  const receivable: Omit<Receivable, 'id'> = {
    ...data,
    status: 'unpaid',
    reminderCount: 0,
    createdAt: new Date(),
  };

  const docRef = await addDoc(collection(db, `teams/${teamId}/receivables`), receivable);

  // [MOCK] 최초 청구 알림톡 발송
  const shareUrl = `https://gleemile.com/pay/${docRef.id}?amount=${data.amount}`;
  await sendAlimtalk({
    recipientPhone: data.clientPhone,
    templateCode: 'BILL_CREATED',
    variables: {
      clientName: data.clientName,
      description: data.description,
      amount: data.amount.toLocaleString(),
    },
    webLink: shareUrl,
  });

  return { id: docRef.id, ...receivable };
}

export async function getReceivables(teamId: string): Promise<Receivable[]> {
  const snap = await getDocs(
    query(collection(db, `teams/${teamId}/receivables`), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Receivable));
}

export async function sendReminder(teamId: string, receivableId: string): Promise<void> {
  const ref = doc(db, `teams/${teamId}/receivables`, receivableId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('청구 건을 찾을 수 없습니다.');

  const r = snap.data() as Receivable;
  const newCount = r.reminderCount + 1;

  // 재독촉 메시지 (감정 차단 정중한 톤)
  const templateCode = newCount === 1 ? 'REMINDER_1ST' : 'REMINDER_2ND';
  const shareUrl = `https://gleemile.com/pay/${receivableId}?amount=${r.amount}`;

  await sendAlimtalk({
    recipientPhone: r.clientPhone,
    templateCode,
    variables: {
      clientName: r.clientName,
      description: r.description,
      amount: r.amount.toLocaleString(),
    },
    webLink: shareUrl,
  });

  await updateDoc(ref, {
    reminderCount: newCount,
    lastReminderAt: new Date(),
    status: 'overdue',
  });
}

export async function markAsPaid(teamId: string, receivableId: string): Promise<void> {
  await updateDoc(doc(db, `teams/${teamId}/receivables`, receivableId), {
    status: 'paid',
    paidAt: new Date(),
  });
}

// ════════════════════════════════════════════════════════
// 7. Margin-Guard: 마진/BEP 계산 서비스
// ════════════════════════════════════════════════════════

export function calculateMenuMargin(item: Omit<MenuItem, 'id' | 'netProfit' | 'netMarginRate'>): {
  netProfit: number;
  netMarginRate: number;
} {
  const platformFee = item.salePrice * (item.platformFeeRate / 100);
  const pgFee = item.salePrice * (item.pgFeeRate / 100);
  const deliveryFee = item.salePrice * (item.deliveryFeeRate / 100);
  const totalCost = item.ingredientCost + item.packagingCost + platformFee + pgFee + deliveryFee;
  const netProfit = item.salePrice - totalCost;
  const netMarginRate = (netProfit / item.salePrice) * 100;

  return {
    netProfit: Math.round(netProfit),
    netMarginRate: Math.round(netMarginRate * 10) / 10,
  };
}

export function calculateBep(settings: Pick<MarginSettings, 'fixedCosts'>): {
  monthlyBep: number;
  dailyBep: number;
} {
  const { rent, utilities, laborCost, other } = settings.fixedCosts;
  const monthlyFixedCost = rent + utilities + laborCost + other;
  const dailyBep = Math.ceil(monthlyFixedCost / 25); // 월 25일 영업 기준

  return { monthlyBep: monthlyFixedCost, dailyBep };
}

export async function saveMarginSettings(
  teamId: string,
  settings: Omit<MarginSettings, 'dailyBep' | 'monthlyBep' | 'updatedAt'>
): Promise<void> {
  const { monthlyBep, dailyBep } = calculateBep(settings);
  const ref = doc(db, `teams/${teamId}/margin_settings`, 'main');
  await setDoc(ref, {
    ...settings,
    monthlyBep,
    dailyBep,
    updatedAt: new Date(),
  });
}

export async function getMarginSettings(teamId: string): Promise<MarginSettings | null> {
  const snap = await getDoc(doc(db, `teams/${teamId}/margin_settings`, 'main'));
  if (!snap.exists()) return null;
  return snap.data() as MarginSettings;
}
