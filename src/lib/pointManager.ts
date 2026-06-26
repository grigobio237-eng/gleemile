import User from '@/models/User';
import PointTransaction from '@/models/PointTransaction';
import mongoose from 'mongoose';

// 등급별 포인트 적립률
export const POINT_EARN_RATES = {
  cedar: 0.01,    // 1%
  rooter: 0.015,  // 1.5%
  bloomer: 0.02,  // 2%
  glower: 0.025,  // 2.5%
  ecosoul: 0.03,  // 3%
  start: 0.05,    // 5% (Navigator Pass Tier 1)
  signature: 0.10, // 10% (Navigator Pass Tier 2)
  black: 0.15      // 15% (Navigator Pass Tier 3)
} as const;

// 포인트 만료 기간 (일)
export const POINT_EXPIRY_DAYS = 365; // 1년

/**
 * 등급별 포인트 적립률 반환
 */
export function getPointEarnRate(grade: string): number {
  return POINT_EARN_RATES[grade as keyof typeof POINT_EARN_RATES] || POINT_EARN_RATES.cedar;
}

/**
 * 포인트 적립 처리
 */
export async function earnPoints(
  userId: string | mongoose.Types.ObjectId,
  amount: number,
  description: string,
  orderId?: string | mongoose.Types.ObjectId
): Promise<{ success: boolean; earnedPoints: number; newBalance: number; error?: string }> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, earnedPoints: 0, newBalance: 0, error: '사용자를 찾을 수 없습니다.' };
    }

    // 등급별 적립률 계산
    const earnRate = getPointEarnRate(user.grade);
    const earnedPoints = Math.floor(amount * earnRate);

    if (earnedPoints <= 0) {
      return { success: true, earnedPoints: 0, newBalance: user.points };
    }

    // 포인트 만료일 계산
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + POINT_EXPIRY_DAYS);

    // 사용자 포인트 업데이트
    const newBalance = user.points + earnedPoints;
    user.points = newBalance;
    await user.save();

    // 포인트 거래 내역 기록 (earned)
    await PointTransaction.create({
      userId: user._id,
      type: 'earned',
      amount: earnedPoints,
      description,
      orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
      balance: newBalance,
      expiresAt
    });

    console.log(`포인트 적립 완료: 사용자 ${user.email}, ${earnedPoints}P 적립, 잔액 ${newBalance}P`);

    return { success: true, earnedPoints, newBalance };
  } catch (error) {
    console.error('포인트 적립 오류:', error);
    return { success: false, earnedPoints: 0, newBalance: 0, error: '포인트 적립 중 오류가 발생했습니다.' };
  }
}

/**
 * 고정 포인트 지급 (구매 금액과 무관한 이벤트성 지급: 리뷰, 이벤트 등)
 */
export async function grantFixedPoints(
  userId: string | mongoose.Types.ObjectId,
  fixedPoints: number,
  description: string
): Promise<{ success: boolean; grantedPoints: number; newBalance: number; error?: string }> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, grantedPoints: 0, newBalance: 0, error: '사용자를 찾을 수 없습니다.' };
    }

    if (fixedPoints <= 0) {
      return { success: true, grantedPoints: 0, newBalance: user.points };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + POINT_EXPIRY_DAYS);

    const newBalance = user.points + fixedPoints;
    user.points = newBalance;
    await user.save();

    await PointTransaction.create({
      userId: user._id,
      type: 'earned',
      amount: fixedPoints,
      description,
      balance: newBalance,
      expiresAt
    });

    return { success: true, grantedPoints: fixedPoints, newBalance };
  } catch (error) {
    console.error('고정 포인트 지급 오류:', error);
    return { success: false, grantedPoints: 0, newBalance: 0, error: '포인트 지급 중 오류가 발생했습니다.' };
  }
}

/**
 * 관리자 지급 (admin_grant)
 */
export async function adminGrantPoints(
  userId: string | mongoose.Types.ObjectId,
  fixedPoints: number,
  description: string
): Promise<{ success: boolean; grantedPoints: number; newBalance: number; error?: string }> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, grantedPoints: 0, newBalance: 0, error: '사용자를 찾을 수 없습니다.' };
    }
    if (fixedPoints <= 0) {
      return { success: false, grantedPoints: 0, newBalance: user.points, error: '지급 포인트는 0보다 커야 합니다.' };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + POINT_EXPIRY_DAYS);

    user.points += fixedPoints;
    await user.save();

    await PointTransaction.create({
      userId: user._id,
      type: 'admin_grant',
      amount: fixedPoints,
      description,
      balance: user.points,
      expiresAt
    });

    return { success: true, grantedPoints: fixedPoints, newBalance: user.points };
  } catch (error) {
    console.error('관리자 포인트 지급 오류:', error);
    return { success: false, grantedPoints: 0, newBalance: 0, error: '관리자 포인트 지급 중 오류가 발생했습니다.' };
  }
}

/**
 * 관리자 차감 (admin_deduct)
 */
export async function adminDeductPoints(
  userId: string | mongoose.Types.ObjectId,
  fixedPoints: number,
  description: string
): Promise<{ success: boolean; deductedPoints: number; newBalance: number; error?: string }> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, deductedPoints: 0, newBalance: 0, error: '사용자를 찾을 수 없습니다.' };
    }
    if (fixedPoints <= 0) {
      return { success: false, deductedPoints: 0, newBalance: user.points, error: '차감 포인트는 0보다 커야 합니다.' };
    }
    if (user.points < fixedPoints) {
      return { success: false, deductedPoints: 0, newBalance: user.points, error: '보유 포인트가 부족합니다.' };
    }

    user.points -= fixedPoints;
    await user.save();

    await PointTransaction.create({
      userId: user._id,
      type: 'admin_deduct',
      amount: -fixedPoints,
      description,
      balance: user.points
    });

    return { success: true, deductedPoints: fixedPoints, newBalance: user.points };
  } catch (error) {
    console.error('관리자 포인트 차감 오류:', error);
    return { success: false, deductedPoints: 0, newBalance: 0, error: '관리자 포인트 차감 중 오류가 발생했습니다.' };
  }
}

/**
 * 포인트 사용 처리
 */
export async function deductPoints(
  userId: string | mongoose.Types.ObjectId,
  amount: number,
  description: string,
  orderId?: string | mongoose.Types.ObjectId
): Promise<{ success: boolean; usedPoints: number; newBalance: number; error?: string }> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, usedPoints: 0, newBalance: 0, error: '사용자를 찾을 수 없습니다.' };
    }

    if (user.points < amount) {
      return { success: false, usedPoints: 0, newBalance: user.points, error: '포인트가 부족합니다.' };
    }

    // 사용자 포인트 업데이트
    const newBalance = user.points - amount;
    user.points = newBalance;
    await user.save();

    // 포인트 거래 내역 기록
    await PointTransaction.create({
      userId: user._id,
      type: 'used',
      amount: -amount, // 음수로 기록
      description,
      orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
      balance: newBalance
    });

    console.log(`포인트 사용 완료: 사용자 ${user.email}, ${amount}P 사용, 잔액 ${newBalance}P`);

    return { success: true, usedPoints: amount, newBalance };
  } catch (error) {
    console.error('포인트 사용 오류:', error);
    return { success: false, usedPoints: 0, newBalance: 0, error: '포인트 사용 중 오류가 발생했습니다.' };
  }
}

/**
 * 포인트 사용 가능 여부 확인
 */
export async function validatePointUsage(
  userId: string | mongoose.Types.ObjectId,
  amount: number,
  orderAmount: number
): Promise<{ isValid: boolean; error?: string; maxUsable?: number }> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { isValid: false, error: '사용자를 찾을 수 없습니다.' };
    }

    // 최대 사용 가능 포인트 (주문 금액의 50%)
    const maxUsable = Math.floor(orderAmount * 0.5);
    // 최소 사용 단위 (예: 10P)
    const MIN_UNIT = 10;

    if (amount > user.points) {
      return { isValid: false, error: '포인트가 부족합니다.', maxUsable: Math.min(user.points, maxUsable) };
    }

    if (amount > maxUsable) {
      return { isValid: false, error: `포인트는 주문 금액의 50%까지만 사용 가능합니다. (최대 ${maxUsable}P)`, maxUsable };
    }

    if (amount < 0) {
      return { isValid: false, error: '사용할 포인트는 0 이상이어야 합니다.' };
    }

    if (amount > 0 && amount % MIN_UNIT !== 0) {
      return { isValid: false, error: `포인트는 ${MIN_UNIT}P 단위로만 사용할 수 있습니다.` };
    }

    return { isValid: true, maxUsable };
  } catch (error) {
    console.error('포인트 사용 검증 오류:', error);
    return { isValid: false, error: '포인트 사용 검증 중 오류가 발생했습니다.' };
  }
}

/**
 * 포인트 만료 처리 (스케줄러용)
 */
export async function processExpiredPoints(): Promise<{ processedCount: number; expiredAmount: number }> {
  try {
    const now = new Date();

    // 만료된 포인트 조회
    const expiredTransactions = await PointTransaction.find({
      type: 'earned',
      expiresAt: { $lte: now },
      amount: { $gt: 0 }
    });

    let processedCount = 0;
    let expiredAmount = 0;

    for (const transaction of expiredTransactions) {
      const user = await User.findById(transaction.userId);
      if (!user || user.points < transaction.amount) continue;

      // 포인트 차감
      user.points -= transaction.amount;
      await user.save();

      // 만료 거래 내역 기록
      await PointTransaction.create({
        userId: transaction.userId,
        type: 'expired',
        amount: -transaction.amount,
        description: `포인트 만료 (${transaction.amount}P)`,
        balance: user.points
      });

      processedCount++;
      expiredAmount += transaction.amount;
    }

    console.log(`포인트 만료 처리 완료: ${processedCount}건, ${expiredAmount}P 만료`);

    return { processedCount, expiredAmount };
  } catch (error) {
    console.error('포인트 만료 처리 오류:', error);
    return { processedCount: 0, expiredAmount: 0 };
  }
}
