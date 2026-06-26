import { NextRequest, NextResponse } from 'next/server';
import { createLogoutCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: '로그아웃 되었습니다.' },
      { status: 200 }
    );

    // Clear auth cookie
    response.headers.set('Set-Cookie', createLogoutCookie());

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


