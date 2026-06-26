// Rate Limiting 시스템
import { NextRequest, NextResponse } from 'next/server';
import cache from './cache';

interface RateLimitConfig {
  windowMs: number; // 시간 윈도우 (밀리초)
  maxRequests: number; // 최대 요청 수
  keyGenerator?: (request: NextRequest) => string; // 키 생성 함수
  skipSuccessfulRequests?: boolean; // 성공한 요청 건너뛰기
  skipFailedRequests?: boolean; // 실패한 요청 건너뛰기
  message?: string; // 제한 시 메시지
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (req) => this.getClientIP(req),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Too many requests, please try again later.',
      ...config
    };
  }

  // 클라이언트 IP 추출
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    if (cfConnectingIP) return cfConnectingIP;
    if (realIP) return realIP;
    if (forwarded) return forwarded.split(',')[0].trim();
    
    return 'unknown';
  }

  // Rate Limit 확인
  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    const key = this.config.keyGenerator!(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    const cacheKey = `rate_limit:${key}`;
    
    try {
      // 기존 요청 기록 조회
      const requests = await cache.get(cacheKey) || [];
      
      // 윈도우 밖의 오래된 요청 제거
      const validRequests = requests.filter((timestamp: number) => timestamp > windowStart);
      
      // 현재 요청 수 확인
      const currentRequests = validRequests.length;
      
      if (currentRequests >= this.config.maxRequests) {
        // 제한 초과
        const oldestRequest = Math.min(...validRequests);
        const resetTime = oldestRequest + this.config.windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter
        };
      }
      
      // 요청 기록에 현재 시간 추가
      validRequests.push(now);
      await cache.set(cacheKey, validRequests, Math.ceil(this.config.windowMs / 1000));
      
      const remaining = this.config.maxRequests - validRequests.length;
      const resetTime = now + this.config.windowMs;
      
      return {
        allowed: true,
        remaining,
        resetTime
      };
      
    } catch (error) {
      console.error('Rate limit check error:', error);
      // 오류 시 허용 (fail-open)
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs
      };
    }
  }

  // Rate Limit 미들웨어
  async middleware(request: NextRequest): Promise<NextResponse | null> {
    const result = await this.checkLimit(request);
    
    if (!result.allowed) {
      const response = NextResponse.json(
        { 
          error: this.config.message,
          retryAfter: result.retryAfter,
          resetTime: new Date(result.resetTime).toISOString()
        },
        { status: 429 }
      );
      
      // Rate Limit 헤더 추가
      response.headers.set('X-RateLimit-Limit', this.config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
      response.headers.set('Retry-After', result.retryAfter?.toString() || '0');
      
      return response;
    }
    
    return null; // 제한 없음
  }
}

// 미리 정의된 Rate Limiter들
export const rateLimiters = {
  // 일반 API 요청 (분당 1000회)
  general: new RateLimiter({
    windowMs: 60 * 1000, // 1분
    maxRequests: 1000,
    message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
  }),

  // 로그인 시도 (분당 5회)
  login: new RateLimiter({
    windowMs: 60 * 1000, // 1분
    maxRequests: 5,
    message: '로그인 시도 한도를 초과했습니다. 1분 후 다시 시도해주세요.'
  }),

  // 회원가입 (시간당 3회)
  signup: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1시간
    maxRequests: 3,
    message: '회원가입 시도 한도를 초과했습니다. 1시간 후 다시 시도해주세요.'
  }),

  // 비밀번호 재설정 (시간당 3회)
  passwordReset: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1시간
    maxRequests: 3,
    message: '비밀번호 재설정 요청 한도를 초과했습니다. 1시간 후 다시 시도해주세요.'
  }),

  // 이메일 인증 (분당 3회)
  emailVerification: new RateLimiter({
    windowMs: 60 * 1000, // 1분
    maxRequests: 3,
    message: '이메일 인증 요청 한도를 초과했습니다. 1분 후 다시 시도해주세요.'
  }),

  // 상품 검색 (분당 200회)
  search: new RateLimiter({
    windowMs: 60 * 1000, // 1분
    maxRequests: 200,
    message: '검색 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
  }),

  // 주문 생성 (분당 10회)
  order: new RateLimiter({
    windowMs: 60 * 1000, // 1분
    maxRequests: 10,
    message: '주문 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
  }),

  // 관리자 API (분당 500회)
  admin: new RateLimiter({
    windowMs: 60 * 1000, // 1분
    maxRequests: 500,
    message: '관리자 API 요청 한도를 초과했습니다.'
  }),

  // 추천 API (분당 50회)
  recommendations: new RateLimiter({
    windowMs: 60 * 1000, // 1분
    maxRequests: 50,
    message: '추천 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
  })
};

// Rate Limit 미들웨어 래퍼
export function withRateLimit(
  limiter: RateLimiter,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await limiter.middleware(request);
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    return handler(request);
  };
}

// IP별 Rate Limit (더 엄격한 제한)
export function createIPRateLimit(windowMs: number, maxRequests: number) {
  return new RateLimiter({
    windowMs,
    maxRequests,
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 'unknown';
      return `ip:${ip}`;
    },
    message: 'IP별 요청 한도를 초과했습니다.'
  });
}

// 사용자별 Rate Limit
export function createUserRateLimit(windowMs: number, maxRequests: number) {
  return new RateLimiter({
    windowMs,
    maxRequests,
    keyGenerator: (req) => {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // JWT 토큰에서 사용자 ID 추출 (간단한 구현)
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          return `user:${payload.userId}`;
        } catch (error) {
          return 'anonymous';
        }
      }
      return 'anonymous';
    },
    message: '사용자별 요청 한도를 초과했습니다.'
  });
}

// Rate Limit 통계 조회
export async function getRateLimitStats(): Promise<any> {
  try {
    const keys = await cache.keys('rate_limit:*');
    const stats = {
      totalKeys: keys.length,
      activeLimits: 0,
      totalRequests: 0
    };
    
    for (const key of keys) {
      const requests = await cache.get(key) || [];
      if (requests.length > 0) {
        stats.activeLimits++;
        stats.totalRequests += requests.length;
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Rate limit stats error:', error);
    return null;
  }
}

// Rate Limit 초기화 (관리자용)
export async function resetRateLimit(pattern: string = 'rate_limit:*'): Promise<boolean> {
  try {
    return await cache.delPattern(pattern);
  } catch (error) {
    console.error('Rate limit reset error:', error);
    return false;
  }
}

// createRateLimitMiddleware 함수 추가 (기존 withRateLimit와 동일)
export function createRateLimitMiddleware(limiter: RateLimiter, handler: any) {
  return withRateLimit(limiter, handler);
}

export default RateLimiter;