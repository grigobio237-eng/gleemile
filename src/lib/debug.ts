/**
 * 디버깅 유틸리티
 * 서버 컴포넌트 렌더링 에러 리듬체크를 위한 유틸리티 함수들
 */

/**
 * 환경변수 상태를 확인합니다.
 */
export function checkEnvironmentVariables() {
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SITE_URL',
    'NEXTAUTH_URL',
  ];

  const envStatus = requiredEnvVars.map(envVar => ({
    name: envVar,
    exists: !!process.env[envVar],
    hasValue: !!process.env[envVar] && process.env[envVar]!.length > 0,
    length: process.env[envVar]?.length || 0,
  }));

  console.log('🔍 환경변수 상태 확인:', envStatus);
  
  const missingVars = envStatus.filter(env => !env.exists || !env.hasValue);
  if (missingVars.length > 0) {
    console.error('❌ 누락된 환경변수:', missingVars.map(env => env.name));
    return false;
  }

  console.log('✅ 모든 필수 환경변수가 설정되어 있습니다.');
  return true;
}

/**
 * MongoDB 연결 상태를 확인합니다.
 */
export async function checkMongoDBConnection() {
  try {
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    console.log('🔍 MongoDB 연결 상태:', {
      readyState: connectionState,
      state: states[connectionState as keyof typeof states],
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    });

    return connectionState === 1; // connected
  } catch (error) {
    console.error('❌ MongoDB 연결 확인 실패:', error);
    return false;
  }
}

/**
 * 메모리 사용률을 확인합니다.
 */
export function checkMemoryUsage() {
  const memUsage = process.memoryUsage();
  const os = require('os');
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memUsagePercent = (usedMemory / totalMemory) * 100;

  const memoryInfo = {
    process: {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
    },
    system: {
      total: Math.round(totalMemory / 1024 / 1024), // MB
      free: Math.round(freeMemory / 1024 / 1024), // MB
      used: Math.round(usedMemory / 1024 / 1024), // MB
      usagePercent: Math.round(memUsagePercent * 100) / 100,
    },
  };

  console.log('🔍 메모리 사용률:', memoryInfo);

  if (memUsagePercent > 95) {
    console.error('🚨 치명적 메모리 사용률:', memUsagePercent + '%');
    return false;
  }

  return true;
}

/**
 * 전체 시스템 상태를 확인합니다.
 */
export async function checkSystemHealth() {
  console.log('🔍 시스템 상태 확인 시작...');
  
  const results = {
    environment: checkEnvironmentVariables(),
    mongodb: await checkMongoDBConnection(),
    memory: checkMemoryUsage(),
  };

  const allHealthy = Object.values(results).every(result => result === true);
  
  console.log('🔍 시스템 상태 확인 결과:', {
    ...results,
    overall: allHealthy ? 'healthy' : 'unhealthy',
  });

  return {
    healthy: allHealthy,
    results,
  };
}

/**
 * 서버 컴포넌트 렌더링 에러 리듬체크
 */
export function diagnoseServerComponentError(error: Error) {
  console.log('🔍 서버 컴포넌트 렌더링 에러 리듬체크 시작...');
  
  const diagnosis: {
    errorMessage: string;
    errorStack: string | undefined;
    timestamp: string;
    environment: string | undefined;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    suspectedCause?: string;
  } = {
    errorMessage: error.message,
    errorStack: error.stack,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
  };

  // 에러 메시지 분석
  if (error.message.includes('buffering timed out')) {
    console.error('❌ MongoDB 연결 타임아웃 에러 감지');
    diagnosis.suspectedCause = 'MongoDB connection timeout';
  } else if (error.message.includes('JWT')) {
    console.error('❌ JWT 관련 에러 감지');
    diagnosis.suspectedCause = 'JWT token or secret issue';
  } else if (error.message.includes('memory')) {
    console.error('❌ 메모리 관련 에러 감지');
    diagnosis.suspectedCause = 'Memory usage issue';
  } else {
    console.error('❌ 기타 서버 컴포넌트 렌더링 에러');
    diagnosis.suspectedCause = 'Unknown server component rendering error';
  }

  console.log('🔍 에러 리듬체크 결과:', diagnosis);
  return diagnosis;
}
