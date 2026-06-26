// 보안 헤더 설정 미들웨어
import { NextRequest, NextResponse } from 'next/server';

export function setSecurityHeaders(response: NextResponse): NextResponse {
  // X-Content-Type-Options: MIME 타입 스니핑 방지
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options: 클릭재킹 방지
  response.headers.set('X-Frame-Options', 'DENY');

  // X-XSS-Protection: XSS 필터 활성화
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy: 리퍼러 정보 제한
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy: 브라우저 기능 제한
  response.headers.set('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // Content-Security-Policy: XSS 및 데이터 주입 공격 방지
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "media-src 'self' data:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https:; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
  );

  // Strict-Transport-Security: HTTPS 강제 (HTTPS 환경에서만)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // X-Permitted-Cross-Domain-Policies: 크로스 도메인 정책
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // Cross-Origin-Embedder-Policy: 리소스 임베딩 정책
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  // Cross-Origin-Opener-Policy: 창 열기 정책
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  // Cross-Origin-Resource-Policy: 리소스 정책
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return response;
}

// API 응답에 보안 헤더 적용하는 래퍼 함수
export function withSecurityHeaders(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request);
    return setSecurityHeaders(response);
  };
}

// CORS 설정
export function setCorsHeaders(response: NextResponse): NextResponse {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://youniqle.com',
    'https://www.youniqle.com'
  ];

  const origin = response.headers.get('origin');

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

// Rate Limiting 헤더
export function setRateLimitHeaders(response: NextResponse, limit: number, remaining: number, resetTime: number): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetTime.toString());

  return response;
}

// 캐시 제어 헤더
export function setCacheHeaders(response: NextResponse, maxAge: number = 3600): NextResponse {
  response.headers.set('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}`);
  response.headers.set('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());

  return response;
}

// 민감한 데이터 캐시 방지 헤더
export function setNoCacheHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

// API 버전 헤더
export function setApiVersionHeader(response: NextResponse, version: string = '1.0'): NextResponse {
  response.headers.set('X-API-Version', version);

  return response;
}

// 서버 정보 숨기기
export function hideServerInfo(response: NextResponse): NextResponse {
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  return response;
}

// 모든 보안 헤더를 한번에 적용하는 함수
export function applyAllSecurityHeaders(response: NextResponse): NextResponse {
  response = setSecurityHeaders(response);
  response = setCorsHeaders(response);
  response = hideServerInfo(response);
  response = setApiVersionHeader(response);

  return response;
}














