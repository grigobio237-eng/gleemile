import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email }).select('-passwordHash');
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 추천 코드가 없는 경우 자동 생성 (ID 기반)
    if (!user.referralCode) {
      const base = user._id.toString().slice(-6).toUpperCase();
      const newCode = `RF${base}`;
      user.referralCode = newCode;
      await user.save({ validateBeforeSave: false });
      console.log(`[/api/auth/me] Generated new referralCode for ${user.email}: ${newCode}`);
    }

    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      grade: user.grade,
      tier: user.tier,
      points: user.points,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      marketingConsent: user.marketingConsent,
      addresses: user.addresses,
      partnerStatus: user.partnerStatus,
      partnerApplication: user.partnerApplication,
      createdAt: user.createdAt,
    };

    return NextResponse.json({ user: userResponse });
  } catch (error) {
    console.error('Get user error:', error);

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    await connectDB();

    const { avatar, phone, marketingConsent, zipCode, address1, address2, referralCode } = await request.json();

    const user = await User.findOne({ email: session.user.email });
    // 추천 코드 최초 등록 (본인 referralCode 생성은 회원가입 시 가능, 여기서는 referredBy 설정을 허용)
    if (referralCode && !user.referredBy) {
      // 자기 자신의 코드 사용 방지
      if (user.referralCode && user.referralCode === referralCode) {
        return NextResponse.json({ error: '자기 자신의 추천 코드는 사용할 수 없습니다.' }, { status: 400 });
      }
      user.referredBy = referralCode;
    }
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사용자 정보 업데이트
    if (phone !== undefined) user.phone = phone;
    if (marketingConsent !== undefined) user.marketingConsent = marketingConsent;
    if (avatar !== undefined) user.avatar = avatar;

    // 주소 정보 업데이트
    if (zipCode && address1) {
      const newAddress = {
        label: '기본 배송지',
        recipient: user.name,
        phone: phone || user.phone || '', // 빈 문자열 허용
        zip: zipCode,
        addr1: address1,
        addr2: address2 || '',
      };

      // 기존 주소가 있으면 업데이트, 없으면 추가
      if (user.addresses && user.addresses.length > 0) {
        user.addresses[0] = newAddress;
      } else {
        user.addresses = [newAddress];
      }
    }

    await user.save();

    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      grade: user.grade,
      tier: user.tier,
      points: user.points,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      marketingConsent: user.marketingConsent,
      addresses: user.addresses,
      partnerStatus: user.partnerStatus,
      partnerApplication: user.partnerApplication,
      createdAt: user.createdAt,
    };

    return NextResponse.json({
      message: '프로필이 성공적으로 업데이트되었습니다.',
      user: userResponse,
    });
  } catch (error) {
    console.error('Update user error:', error);

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

