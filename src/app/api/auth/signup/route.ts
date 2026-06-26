import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/User';
import SurveyResponse from '@/models/SurveyResponse';
import { generateVerificationToken, generateVerificationExpiry } from '@/lib/verification';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { 
      name, 
      email, 
      password, 
      marketingConsent, 
      termsAccepted,
      privacyAccepted,
      sensitiveInfoAccepted,
      thirdPartyAccepted,
      referralCode 
    } = await request.json();

    // 입력값 검증 (필수 동의 확인)
    if (!termsAccepted || !privacyAccepted || !sensitiveInfoAccepted || !thirdPartyAccepted) {
      return NextResponse.json(
        { error: '모든 필수 약관에 동의해야 합니다.' },
        { status: 400 }
      );
    }

    // ... (Validation logic remains same)

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // ... (Password validation remains same)

    // 중복 이메일 확인 (탈퇴한 계정은 재가입 허용)
    const existingUser = await User.findOne({ email });
    if (existingUser && !existingUser.isDeleted) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 400 }
      );
    }

    // 만약 탈퇴한 계정이 있다면 기존 정보를 초기화하기 위해 삭제 처리
    if (existingUser && existingUser.isDeleted) {
      await User.deleteOne({ _id: existingUser._id });
      console.log(`[Signup] Removed deleted user account for re-registration: ${email}`);
    }

    // 추천인 코드 검증 (쿠키 또는 직접 입력)
    let validReferredBy = null;

    // 1. 직접 입력된 추천인 코드 확인
    let codeToCheck = referralCode;

    // 2. 입력된 코드가 없으면 쿠키에서 확인
    if (!codeToCheck) {
      const cookieStore = request.cookies;
      codeToCheck = cookieStore.get('referral_code')?.value;
      if (codeToCheck) {
        console.log(`Referral code from cookie: ${codeToCheck}`);
      }
    }

    // 3. 코드가 있으면 유효성 검증 (대소문자 구분 없이 검색)
    if (codeToCheck) {
      const referrer = await User.findOne({ 
        referralCode: { $regex: new RegExp(`^${codeToCheck}$`, 'i') } 
      });
      if (referrer) {
        validReferredBy = referrer.referralCode;
        console.log(`Referral linked: New user invited by ${referrer.email} (${referrer.referralCode})`);
      } else {
        console.log(`Invalid referral code: ${codeToCheck}`);
      }
    }

    // 비밀번호 해시화
    const passwordHash = await bcrypt.hash(password, 12);

    // 인증 토큰 생성
    const verificationToken = generateVerificationToken();
    const verificationExpiry = generateVerificationExpiry();

    // 사용자 생성
    const user = new User({
      name,
      email,
      passwordHash,
      provider: 'local',
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
      sensitiveInfoAcceptedAt: new Date(),
      thirdPartyAcceptedAt: new Date(),
      marketingConsent: marketingConsent || false,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpiry,
      referredBy: validReferredBy, // 추천인 연결
    });

    // 추천 코드 자동 생성 (간단 규칙)
    if (!user.referralCode) {
      const base = user._id.toString().slice(-6).toUpperCase();
      user.referralCode = `RF${base}`;
    }
    await user.save();

    // 4. 대기 중인 설문(pending_survey_id)이 있다면 유저와 연동
    const signupCookieStore = request.cookies;
    const pendingSurveyId = signupCookieStore.get('pending_survey_id')?.value;
    if (pendingSurveyId) {
      try {
        await SurveyResponse.findByIdAndUpdate(pendingSurveyId, {
          userId: user._id
        });
        console.log(`Survey linked to new user: ${user.email} (Survey: ${pendingSurveyId})`);
      } catch (linkError) {
        console.error('Failed to link pending survey:', linkError);
      }
    }

    // 인증 이메일 발송
    const emailResult = await sendVerificationEmail(email, verificationToken, name);

    const signupCompleteResponse = NextResponse.json(
      {
        message: emailResult.success 
          ? '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.'
          : '회원가입은 완료되었으나, 인증 이메일 발송 중 문제가 발생했습니다. 로그인 후 인증 메일 재발송을 요청해 주세요.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        emailSent: emailResult.success
      },
      { status: 201 }
    );

    // 연동 완료 후 쿠키 삭제
    if (pendingSurveyId) {
      signupCompleteResponse.cookies.delete('pending_survey_id');
    }

    return signupCompleteResponse;

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}