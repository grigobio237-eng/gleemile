// 모니터링 시스템 초기화
import performanceMonitor from './monitoring';
import logger from './logger';
import notificationService from './notifications';

export function initializeMonitoring() {
  try {
    console.log('🚀 모니터링 시스템 초기화 시작...');

    // 1. 성능 모니터링 시작 (에러 처리)
    try {
      performanceMonitor.startMonitoring(5000); // 5초마다 수집
      console.log('✅ 성능 모니터링 시작됨');
    } catch (error) {
      console.warn('⚠️ 성능 모니터링 시작 실패:', error);
    }

    // 2. 로거 초기화 (에러 처리)
    try {
      logger.info('system', '모니터링 시스템 초기화 완료');
      console.log('✅ 로거 초기화 완료');
    } catch (error) {
      console.warn('⚠️ 로거 초기화 실패:', error);
    }

    // 3. 알림 시스템 테스트 (에러 처리)
    try {
      const testAlertId = notificationService.createAlert(
        'system',
        'low',
        '모니터링 시스템 시작',
        '모니터링 시스템이 정상적으로 시작되었습니다.',
        { timestamp: new Date().toISOString() }
      );
      console.log('✅ 알림 시스템 테스트 완료');
    } catch (error) {
      console.warn('⚠️ 알림 시스템 테스트 실패:', error);
    }

    // 4. 정기적인 로그 정리 설정 (에러 처리)
    try {
      setInterval(() => {
        try {
          logger.cleanupLogs(30); // 30일 이상 된 로그 삭제
        } catch (error) {
          console.warn('⚠️ 로그 정리 실패:', error);
        }
      }, 24 * 60 * 60 * 1000); // 24시간마다 실행
    } catch (error) {
      console.warn('⚠️ 로그 정리 설정 실패:', error);
    }

    // 5. 정기적인 알림 정리 설정 (에러 처리)
    try {
      setInterval(() => {
        try {
          notificationService.cleanupAlerts(30); // 30일 이상 된 알림 삭제
        } catch (error) {
          console.warn('⚠️ 알림 정리 실패:', error);
        }
      }, 24 * 60 * 60 * 1000); // 24시간마다 실행
    } catch (error) {
      console.warn('⚠️ 알림 정리 설정 실패:', error);
    }

    console.log('🎉 모니터링 시스템 초기화 완료!');
    
    return {
      performanceMonitor,
      logger,
      notificationService,
    };
  } catch (error) {
    console.error('❌ 모니터링 시스템 초기화 실패:', error);
    return null;
  }
}

// 모니터링 시스템 중지
export function shutdownMonitoring() {
  console.log('🛑 모니터링 시스템 중지 중...');
  
  performanceMonitor.stopMonitoring();
  logger.info('system', '모니터링 시스템 중지됨');
  
  console.log('✅ 모니터링 시스템 중지 완료');
}

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  shutdownMonitoring();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdownMonitoring();
  process.exit(0);
});

export default initializeMonitoring;
