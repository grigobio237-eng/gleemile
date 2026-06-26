import { NextRequest, NextResponse } from 'next/server';

export interface SecurityConfig {
  cors: {
    origin: string | string[] | boolean;
    methods: string[];
    allowedHeaders: string[];
    credentials: boolean;
  };
  headers: {
    contentSecurityPolicy: string;
    xFrameOptions: string;
    xContentTypeOptions: boolean;
    xXSSProtection: boolean;
    referrerPolicy: string;
    permissionsPolicy: string;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
}

const defaultSecurityConfig: SecurityConfig = {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? [process.env.NEXT_PUBLIC_APP_URL || 'https://youniqle.com']
      : ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'X-API-Key',
      'X-Client-Version'
    ],
    credentials: true
  },
  headers: {
    contentSecurityPolicy: "default-src 'self'; media-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https: wss:; frame-ancestors 'none';",
    xFrameOptions: 'DENY',
    xContentTypeOptions: true,
    xXSSProtection: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=()'
  },
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15분
    maxRequests: 100
  }
};

export class SecurityManager {
  private config: SecurityConfig;

  constructor(config: SecurityConfig = defaultSecurityConfig) {
    this.config = config;
  }

  public applySecurityHeaders(response: NextResponse): NextResponse {
    // CORS 헤더
    if (Array.isArray(this.config.cors.origin)) {
      response.headers.set('Access-Control-Allow-Origin', this.config.cors.origin.join(', '));
    } else if (typeof this.config.cors.origin === 'string') {
      response.headers.set('Access-Control-Allow-Origin', this.config.cors.origin);
    }

    response.headers.set('Access-Control-Allow-Methods', this.config.cors.methods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', this.config.cors.allowedHeaders.join(', '));
    response.headers.set('Access-Control-Allow-Credentials', this.config.cors.credentials.toString());

    // 보안 헤더
    response.headers.set('Content-Security-Policy', this.config.headers.contentSecurityPolicy);
    response.headers.set('X-Frame-Options', this.config.headers.xFrameOptions);

    if (this.config.headers.xContentTypeOptions) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }

    if (this.config.headers.xXSSProtection) {
      response.headers.set('X-XSS-Protection', '1; mode=block');
    }

    response.headers.set('Referrer-Policy', this.config.headers.referrerPolicy);
    response.headers.set('Permissions-Policy', this.config.headers.permissionsPolicy);

    // 추가 보안 헤더
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  }

  public validateOrigin(origin: string | null): boolean {
    if (!origin) return false;

    if (Array.isArray(this.config.cors.origin)) {
      return this.config.cors.origin.includes(origin);
    } else if (typeof this.config.cors.origin === 'string') {
      return this.config.cors.origin === origin;
    } else if (this.config.cors.origin === true) {
      return true;
    }

    return false;
  }

  public sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    } else if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    } else if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeString(key)] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }

  private sanitizeString(str: string): string {
    return str
      .replace(/[<>]/g, '') // HTML 태그 제거
      .replace(/javascript:/gi, '') // JavaScript 프로토콜 제거
      .replace(/on\w+=/gi, '') // 이벤트 핸들러 제거
      .replace(/script/gi, '') // script 키워드 제거
      .replace(/expression/gi, '') // CSS expression 제거
      .replace(/vbscript:/gi, '') // VBScript 프로토콜 제거
      .replace(/data:/gi, '') // Data URI 제거
      .trim();
  }

  public validateApiKey(apiKey: string | null): boolean {
    if (!apiKey) return false;

    const validApiKeys = process.env.API_KEYS?.split(',') || [];
    return validApiKeys.includes(apiKey);
  }

  public validateJWT(token: string | null): boolean {
    if (!token) return false;

    try {
      // JWT 토큰 형식 검증 (실제 검증은 별도 라이브러리 사용)
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      // 헤더와 페이로드가 유효한 Base64인지 확인
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));

      // 만료 시간 확인
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  public generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  }

  public hashPassword(password: string): string {
    // 실제 구현에서는 bcrypt 사용
    const crypto = require('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  public verifyPassword(password: string, hashedPassword: string): boolean {
    const crypto = require('crypto');
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }
}

// 미들웨어 함수들
export function createSecurityMiddleware(config?: Partial<SecurityConfig>) {
  const securityManager = new SecurityManager({
    ...defaultSecurityConfig,
    ...config
  });

  return (req: NextRequest) => {
    const origin = req.headers.get('origin');

    // CORS 검증
    if (origin && !securityManager.validateOrigin(origin)) {
      return NextResponse.json(
        { error: 'CORS policy violation' },
        { status: 403 }
      );
    }

    // API 키 검증 (선택적)
    const apiKey = req.headers.get('x-api-key');
    if (apiKey && !securityManager.validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // JWT 토큰 검증 (선택적)
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (!securityManager.validateJWT(token)) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
    }

    return null; // 요청 허용
  };
}

export function createCORSHandler() {
  return (req: NextRequest) => {
    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      const securityManager = new SecurityManager();
      return securityManager.applySecurityHeaders(response);
    }

    return null;
  };
}

// 보안 이벤트 로깅
export class SecurityLogger {
  private static instance: SecurityLogger;
  private logs: Array<{
    timestamp: Date;
    type: 'security_violation' | 'rate_limit' | 'invalid_auth' | 'suspicious_activity';
    ip: string;
    userAgent: string;
    details: any;
  }> = [];

  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  public log(type: 'security_violation' | 'rate_limit' | 'invalid_auth' | 'suspicious_activity',
    ip: string, userAgent: string, details: any) {
    this.logs.push({
      timestamp: new Date(),
      type,
      ip,
      userAgent,
      details
    });

    // 로그가 너무 많아지면 오래된 것들 제거
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500);
    }

    // 프로덕션에서는 실제 로깅 시스템으로 전송
    if (process.env.NODE_ENV === 'production') {
      console.warn(`Security Event: ${type}`, {
        ip,
        userAgent,
        details,
        timestamp: new Date().toISOString()
      });
    }
  }

  public getLogs(type?: string, limit: number = 100) {
    let filteredLogs = this.logs;

    if (type) {
      filteredLogs = this.logs.filter(log => log.type === type);
    }

    return filteredLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public clearLogs() {
    this.logs = [];
  }
}

export default SecurityManager;















