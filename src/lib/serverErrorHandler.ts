/**
 * 서버 에러 핸들링 및 로깅 유틸리티
 * 프로덕션 환경에서도 에러 정보를 수집할 수 있도록 도와줍니다.
 */

import { NextRequest, NextResponse } from 'next/server';

interface ErrorContext {
  url: string;
  method: string;
  userAgent: string;
  timestamp: string;
  environment: string;
  memoryUsage: NodeJS.MemoryUsage;
  uptime: number;
}

interface DetailedError {
  message: string;
  stack?: string;
  context: ErrorContext;
  suspectedCause?: string;
}

/**
 * 서버 에러를 상세히 로깅하고 분석합니다.
 */
export function logServerError(error: Error, request?: NextRequest, additionalContext?: any): DetailedError {
  const context: ErrorContext = {
    url: request?.url || 'unknown',
    method: request?.method || 'unknown',
    userAgent: request?.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
  };

  const detailedError: DetailedError = {
    message: error.message,
    stack: error.stack,
    context,
    suspectedCause: analyzeError(error),
  };

  // 상세 에러 로깅
  console.error('🚨 서버 에러 상세 분석:', detailedError);
  
  // 추가 컨텍스트가 있으면 함께 로깅
  if (additionalContext) {
    console.error('📋 추가 컨텍스트:', additionalContext);
  }

  return detailedError;
}

/**
 * 에러 메시지를 분석하여 가능한 원인을 추정합니다.
 */
function analyzeError(error: Error): string {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';

  // MongoDB 관련 에러
  if (message.includes('buffering timed out') || message.includes('mongoose') || message.includes('mongodb')) {
    return 'MongoDB 연결 또는 쿼리 문제';
  }

  // JWT 관련 에러
  if (message.includes('jwt') || message.includes('token') || message.includes('jsonwebtoken')) {
    return 'JWT 토큰 처리 문제';
  }

  // 메모리 관련 에러
  if (message.includes('memory') || message.includes('heap') || message.includes('out of memory')) {
    return '메모리 부족 또는 누수';
  }

  // 서버 컴포넌트 렌더링 에러
  if (message.includes('server components render') || message.includes('server-side exception')) {
    return '서버 컴포넌트 렌더링 문제 - 데이터 페칭 또는 환경변수 문제 가능성';
  }

  // 파일 시스템 관련 에러
  if (message.includes('enoent') || message.includes('file not found') || message.includes('permission denied')) {
    return '파일 시스템 접근 문제';
  }

  // 네트워크 관련 에러
  if (message.includes('timeout') || message.includes('connection') || message.includes('network')) {
    return '네트워크 연결 문제';
  }

  // 환경변수 관련 에러
  if (message.includes('undefined') || message.includes('null') || message.includes('missing')) {
    return '환경변수 또는 설정 누락';
  }

  return '알 수 없는 서버 에러';
}

/**
 * 에러 응답을 생성합니다.
 */
export function createErrorResponse(
  error: Error, 
  status: number = 500, 
  request?: NextRequest,
  additionalContext?: any
): NextResponse {
  const detailedError = logServerError(error, request, additionalContext);
  
  // 프로덕션에서는 민감한 정보를 숨깁니다
  const isProduction = process.env.NODE_ENV === 'production';
  
  return NextResponse.json(
    {
      error: isProduction ? '서버 오류가 발생했습니다.' : error.message,
      ...(isProduction ? {} : { 
        details: detailedError,
        timestamp: detailedError.context.timestamp,
      }),
    },
    { status }
  );
}

/**
 * 환경변수 상태를 확인합니다.
 */
export function checkEnvironmentVariables(): { [key: string]: boolean } {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SITE_URL',
    'NEXTAUTH_URL',
  ];

  const status: { [key: string]: boolean } = {};
  
  requiredVars.forEach(varName => {
    status[varName] = !!process.env[varName] && process.env[varName]!.length > 0;
  });

  console.log('🔍 환경변수 상태:', status);
  return status;
}

/**
 * 서버 상태를 종합적으로 확인합니다.
 */
export function getServerStatus(): {
  environment: string;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  envVars: { [key: string]: boolean };
  timestamp: string;
} {
  return {
    environment: process.env.NODE_ENV || 'unknown',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    envVars: checkEnvironmentVariables(),
    timestamp: new Date().toISOString(),
  };
}
