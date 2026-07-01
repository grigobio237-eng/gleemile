import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { 
      name, 
      email, 
      password
    } = await request.json();

    // 입력값 검증
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: '이름, 이메일, 비밀번호는 필수 입력값입니다.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 중복 이메일 확인 (Firestore)
    const usersRef = adminDb.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();
    
    if (!snapshot.empty) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 해시화
    const passwordHash = await bcrypt.hash(password, 12);

    // 사용자 생성
    const newUserRef = usersRef.doc();
    const newUser = {
      email,
      name,
      passwordHash,
      provider: 'local',
      globalRole: 'member',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await newUserRef.set(newUser);

    return NextResponse.json(
      {
        message: '회원가입이 완료되었습니다.',
        user: {
          id: newUserRef.id,
          name: newUser.name,
          email: newUser.email,
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}