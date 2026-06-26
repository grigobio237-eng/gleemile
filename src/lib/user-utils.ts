import { IUser } from '@/models/User';

/**
 * 사용자의 상태를 기반으로 최적의 접근 등급(Tier)을 계산합니다.
 * @param user 사용자 객체
 * @returns 'RESET' | 'REBORN' | 'RESTART' | 'BLACK'
 */
export function calculateUserTier(user: Partial<IUser>): 'RESET' | 'REBORN' | 'RESTART' | 'BLACK' {
  const type = user.passInfo?.type || 'NONE';

  // 1. BLACK 조건
  if (type === 'BLACK') {
    return 'BLACK';
  }

  // 2. RESTART 조건
  if (type === 'RESTART') {
    return 'RESTART';
  }

  // 3. REBORN 조건: REBORN 패스 보유 또는 유료 구독 활성 상태
  if (type === 'REBORN' || user.subscription?.status === 'active') {
    return 'REBORN';
  }

  // 4. 그 외 기본값: RESET
  return 'RESET';
}
