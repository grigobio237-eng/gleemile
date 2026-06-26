import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { 
      termsAccepted, 
      privacyAccepted, 
      sensitiveInfoAccepted, 
      thirdPartyAccepted,
      marketingConsent 
    } = await request.json();

    // 필수 항목 체크 확인
    if (!termsAccepted || !privacyAccepted || !sensitiveInfoAccepted || !thirdPartyAccepted) {
      return NextResponse.json(
        { error: '모든 필수 약관에 동의해야 합니다.' },
        { status: 400 }
      );
    }

    await connectDB();

    const updateData: any = {
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
      sensitiveInfoAcceptedAt: new Date(),
      thirdPartyAcceptedAt: new Date(),
      updatedAt: new Date(),
    };

    if (marketingConsent !== undefined) {
      updateData.marketingConsent = marketingConsent;
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '약관 동의가 완료되었습니다.',
      consents: {
        termsAcceptedAt: updatedUser.termsAcceptedAt,
        privacyAcceptedAt: updatedUser.privacyAcceptedAt,
        sensitiveInfoAcceptedAt: updatedUser.sensitiveInfoAcceptedAt,
        thirdPartyAcceptedAt: updatedUser.thirdPartyAcceptedAt,
      }
    });

  } catch (error) {
    console.error('Consent update error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
