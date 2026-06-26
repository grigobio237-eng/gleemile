import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('NextAuth signout API 호출됨');
    
    // 세션 확인
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log('세션이 없음 - 이미 로그아웃 상태');
      return NextResponse.json({ 
        success: true, 
        message: '이미 로그아웃 상태입니다.' 
      });
    }
    
    console.log('세션 무효화 처리:', session.user?.email);
    
    // NextAuth JWT 전략에서는 서버 측에서 토큰을 무효화할 수 없음
    // 클라이언트 측에서 쿠키 삭제로 처리됨
    return NextResponse.json({ 
      success: true, 
      message: '로그아웃 처리 완료',
      user: session.user?.email 
    });
    
  } catch (error) {
    console.error('NextAuth signout API 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: '로그아웃 처리 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: false, 
    error: 'POST 메서드를 사용해주세요.' 
  }, { status: 405 });
}
