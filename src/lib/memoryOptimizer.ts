/**
 * 메모리 최적화 유틸리티
 * 높은 메모리 사용률 상황에서 메모리를 절약하기 위한 유틸리티 함수들
 */

/**
 * 현재 메모리 사용률을 확인합니다.
 */
export function getCurrentMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
  status: 'low' | 'medium' | 'high' | 'critical';
} {
  const memUsage = process.memoryUsage();
  const os = require('os');
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const percentage = (usedMemory / totalMemory) * 100;

  let status: 'low' | 'medium' | 'high' | 'critical';
  if (percentage < 70) status = 'low';
  else if (percentage < 85) status = 'medium';
  else if (percentage < 95) status = 'high';
  else status = 'critical';

  return {
    used: Math.round(usedMemory / 1024 / 1024), // MB
    total: Math.round(totalMemory / 1024 / 1024), // MB
    percentage: Math.round(percentage * 100) / 100,
    status
  };
}

/**
 * 메모리 사용률이 높을 때 가비지 컬렉션을 강제로 실행합니다.
 */
export function forceGarbageCollection(): void {
  if (global.gc) {
    global.gc();
    console.log('🗑️ 가비지 컬렉션 실행됨');
  } else {
    console.log('⚠️ 가비지 컬렉션을 사용할 수 없습니다. --expose-gc 플래그가 필요합니다.');
  }
}

/**
 * 메모리 사용률이 높은지 확인합니다.
 */
export function isMemoryUsageHigh(): boolean {
  const { percentage } = getCurrentMemoryUsage();
  return percentage > 90;
}

/**
 * 메모리 사용률이 치명적인지 확인합니다.
 */
export function isMemoryUsageCritical(): boolean {
  const { percentage } = getCurrentMemoryUsage();
  return percentage > 95;
}

/**
 * 메모리 최적화를 위한 설정을 반환합니다.
 */
export function getMemoryOptimizedSettings() {
  const memoryUsage = getCurrentMemoryUsage();
  
  return {
    // 메모리 사용률에 따른 모니터링 간격 조정
    monitoringInterval: memoryUsage.percentage > 90 ? 60000 : 30000, // 1분 또는 30초
    
    // 메모리 사용률에 따른 캐시 크기 제한
    maxCacheSize: memoryUsage.percentage > 90 ? 100 : 1000,
    
    // 메모리 사용률에 따른 로그 레벨 조정
    logLevel: memoryUsage.percentage > 95 ? 'error' : 'info',
    
    // 메모리 사용률에 따른 모니터링 활성화 여부
    enableMonitoring: memoryUsage.percentage < 90,
    
    // 메모리 사용률에 따른 알림 간격 조정
    alertInterval: memoryUsage.percentage > 90 ? 300000 : 60000, // 5분 또는 1분
  };
}

/**
 * 메모리 사용률이 높을 때 실행할 최적화 작업들
 */
export function performMemoryOptimization(): void {
  const memoryUsage = getCurrentMemoryUsage();
  
  console.log(`🔧 메모리 최적화 시작 - 현재 사용률: ${memoryUsage.percentage}%`);
  
  // 가비지 컬렉션 강제 실행
  if (memoryUsage.percentage > 85) {
    forceGarbageCollection();
  }
  
  // 메모리 사용률이 치명적일 때 경고
  if (memoryUsage.percentage > 95) {
    console.warn(`🚨 치명적 메모리 사용률: ${memoryUsage.percentage}%`);
    console.warn('⚠️ 서버 성능이 저하될 수 있습니다.');
  }
  
  console.log('✅ 메모리 최적화 완료');
}
