// 주문 상태 전환 규칙 정의
export const ORDER_STATUS_RULES = {
  // 현재 상태에서 가능한 다음 상태들
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [], // 배송완료 후에는 변경 불가
  cancelled: [] // 취소된 주문은 변경 불가
} as const;

// 파트너가 변경할 수 있는 상태들
export const PARTNER_ALLOWED_STATUSES = [
  'confirmed',    // 주문 확인
  'preparing',    // 상품 준비
  'shipped',      // 배송 시작
  'delivered'     // 배송 완료
] as const;

// 관리자가 변경할 수 있는 상태들 (모든 상태)
export const ADMIN_ALLOWED_STATUSES = [
  'pending',
  'confirmed', 
  'preparing',
  'shipped',
  'delivered',
  'cancelled'
] as const;

// 상태 전환 가능 여부 확인
export function canTransitionTo(currentStatus: string, targetStatus: string, userRole: 'admin' | 'partner'): boolean {
  // 관리자는 모든 상태 변경 가능
  if (userRole === 'admin') {
    return ADMIN_ALLOWED_STATUSES.includes(targetStatus as never);
  }
  
  // 파트너는 제한된 상태만 변경 가능
  if (userRole === 'partner') {
    if (!PARTNER_ALLOWED_STATUSES.includes(targetStatus as never)) {
      return false;
    }
    
    // 현재 상태에서 목표 상태로 전환 가능한지 확인
    const allowedTransitions = ORDER_STATUS_RULES[currentStatus as keyof typeof ORDER_STATUS_RULES];
    return allowedTransitions?.includes(targetStatus as never) || false;
  }
  
  return false;
}

// 상태 전환 시 필요한 추가 검증
export function validateStatusTransition(
  currentStatus: string, 
  targetStatus: string, 
  userRole: 'admin' | 'partner',
  orderData?: any
): { valid: boolean; message?: string } {
  
  // 기본 전환 가능 여부 확인
  if (!canTransitionTo(currentStatus, targetStatus, userRole)) {
    return {
      valid: false,
      message: `${currentStatus}에서 ${targetStatus}로 변경할 수 없습니다.`
    };
  }
  
  // 특별한 비즈니스 규칙 검증
  if (targetStatus === 'cancelled') {
    // 취소는 배송 시작 전에만 가능
    if (['shipped', 'delivered'].includes(currentStatus)) {
      return {
        valid: false,
        message: '배송이 시작된 주문은 취소할 수 없습니다.'
      };
    }
  }
  
  if (targetStatus === 'delivered') {
    // 배송 완료는 배송 중인 주문만 가능
    if (currentStatus !== 'shipped') {
      return {
        valid: false,
        message: '배송 중인 주문만 배송 완료로 변경할 수 있습니다.'
      };
    }
  }
  
  return { valid: true };
}

// 상태별 표시명과 설명
export const STATUS_INFO = {
  pending: {
    label: '주문 대기',
    description: '결제 확인 대기 중',
    color: 'bg-yellow-100 text-yellow-800',
    icon: 'Clock'
  },
  confirmed: {
    label: '주문 확인',
    description: '주문이 확인되었습니다',
    color: 'bg-blue-100 text-blue-800',
    icon: 'CheckCircle'
  },
  preparing: {
    label: '상품 준비중',
    description: '상품을 준비하고 있습니다',
    color: 'bg-orange-100 text-orange-800',
    icon: 'Package'
  },
  shipped: {
    label: '배송중',
    description: '배송이 시작되었습니다',
    color: 'bg-purple-100 text-purple-800',
    icon: 'Truck'
  },
  delivered: {
    label: '배송완료',
    description: '배송이 완료되었습니다',
    color: 'bg-green-100 text-green-800',
    icon: 'CheckCircle'
  },
  cancelled: {
    label: '주문 취소',
    description: '주문이 취소되었습니다',
    color: 'bg-red-100 text-red-800',
    icon: 'XCircle'
  }
} as const;
