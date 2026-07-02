export type TeamRole = 'owner' | 'manager' | 'member' | 'guest';

export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: '관리자',
  manager: '운영진',
  member: '회원',
  guest: '참관인'
};

/**
 * 모임 개설자 또는 최고 관리자 권한인지 확인
 */
export const isOwner = (role: string | undefined): boolean => {
  return role === 'owner';
};

/**
 * 운영진 이상의 권한인지 확인 (owner 포함)
 */
export const isManagerOrHigher = (role: string | undefined): boolean => {
  return role === 'owner' || role === 'manager';
};

/**
 * 정식 멤버 이상의 권한인지 확인 (owner, manager 포함)
 */
export const isMemberOrHigher = (role: string | undefined): boolean => {
  return role === 'owner' || role === 'manager' || role === 'member';
};

export const normalizeRole = (role: string | undefined): TeamRole => {
  if (!role) return 'guest';
  
  // 신규 역할 그대로 반환
  if (role === 'owner' || role === 'manager' || role === 'member' || role === 'guest') {
    return role as TeamRole;
  }
  
  // 구버전 역할 하위 호환 매핑
  if (role === 'head_coach' || role === 'director') return 'owner';
  if (role === 'coach') return 'manager';
  if (role === 'player') return 'member';
  
  return 'guest';
};
