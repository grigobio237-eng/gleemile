// JWT 토큰 검증 미들웨어
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import connectDB from '@/lib/db';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// JWT 토큰 검증 함수
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// 기본 인증 미들웨어
export async function authenticateToken(request: NextRequest): Promise<{ user: any; error?: string }> {
  try {
    await connectDB();

    let token = '';
    const authHeader = request.headers.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // 쿠키에서 토큰 확인 (admin-token, partner-token 또는 token)
      token = request.cookies.get('admin-token')?.value ||
        request.cookies.get('partner-token')?.value ||
        request.cookies.get('token')?.value || '';
    }

    if (!token) {
      return { user: null, error: '인증 토큰이 필요합니다.' };
    }

    const decoded = verifyToken(token) as any;

    if (!decoded) {
      return { user: null, error: '유효하지 않은 토큰입니다.' };
    }

    // 유저 ID 필드 정규화 (id 또는 userId)
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return { user: null, error: '토큰에 사용자 정보가 없습니다.' };
    }

    // 사용자 정보 조회
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found in DB for ID:', userId);
      return { user: null, error: '사용자를 찾을 수 없습니다.' };
    }

    if (user.isDeleted) {
      return { user: null, error: '삭제된 계정입니다.' };
    }

    return { user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error: '인증 처리 중 오류가 발생했습니다.' };
  }
}

// 관리자 권한 검증 미들웨어
export async function authenticateAdmin(request: NextRequest): Promise<{ user: any; error?: string }> {
  const authResult = await authenticateToken(request);

  if (authResult.error) {
    return authResult;
  }

  if (!['admin', 'superadmin'].includes(authResult.user.role)) {
    return { user: null, error: '관리자 권한이 필요합니다.' };
  }

  return authResult;
}

// 파트너 권한 검증 미들웨어
export async function authenticatePartner(request: NextRequest): Promise<{ user: any; error?: string }> {
  const authResult = await authenticateToken(request);

  if (authResult.error) {
    return authResult;
  }

  if (!['admin', 'superadmin', 'partner'].includes(authResult.user.role)) {
    return { user: null, error: '파트너 또는 관리자 권한이 필요합니다.' };
  }

  return authResult;
}

// API 핸들러 래퍼 (인증 필요)
export function withAuth(handler: (request: NextRequest, user: any, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const authResult = await authenticateToken(request);

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    return handler(request, authResult.user, context);
  };
}

// API 핸들러 래퍼 (관리자 권한 필요)
export function withAdminAuth(handler: (request: NextRequest, user: any, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const authResult = await authenticateAdmin(request);

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.user ? 403 : 401 }
      );
    }

    return handler(request, authResult.user, context);
  };
}

// API 핸들러 래퍼 (파트너 권한 필요)
export function withPartnerAuth(handler: (request: NextRequest, user: any, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const authResult = await authenticatePartner(request);

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.user ? 403 : 401 }
      );
    }

    return handler(request, authResult.user, context);
  };
}

// 토큰 갱신 함수
export async function refreshToken(userId: string): Promise<string | null> {
  try {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return null;
    }

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '7d',
      issuer: 'youniqle',
      audience: 'youniqle-users'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

// 토큰 블랙리스트 관리 (간단한 메모리 기반)
const tokenBlacklist = new Set<string>();

export function addToBlacklist(token: string): void {
  tokenBlacklist.add(token);
}

export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}

// 로그아웃 시 토큰 무효화
export function invalidateToken(token: string): void {
  addToBlacklist(token);
}

// 토큰 검증 시 블랙리스트 확인
export function verifyTokenWithBlacklist(token: string): JWTPayload | null {
  if (isTokenBlacklisted(token)) {
    return null;
  }
  return verifyToken(token);
}














