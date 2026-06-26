import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyPassword } from '@/lib/auth';
import Order from '@/models/Order';
import Refund from '@/models/Refund';

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { password, reason, reasonDetail } = await request.json();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 로컬 계정인 경우 비밀번호 확인
    if (user.provider === 'local') {
      if (!password) {
        return NextResponse.json({ error: '비밀번호를 입력해주세요.' }, { status: 400 });
      }

      if (!user.passwordHash) {
        return NextResponse.json({ error: '비밀번호 정보를 찾을 수 없습니다.' }, { status: 400 });
      }

      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
      }
    }

    // 진행 중인 주문 확인
    const activeOrders = await Order.find({
      userId: user._id,
      status: { $in: ['pending', 'confirmed', 'shipped'] },
    });

    if (activeOrders.length > 0) {
      return NextResponse.json(
        { error: `진행 중인 주문이 ${activeOrders.length}건 있습니다. 모든 주문이 완료된 후 탈퇴할 수 있습니다.` },
        { status: 400 }
      );
    }

    // 진행 중인 환불 확인
    const activeRefunds = await Refund.find({
      userId: user._id,
      status: { $in: ['pending', 'approved', 'pickup_requested', 'pickup_completed', 'inspecting'] },
    });

    if (activeRefunds.length > 0) {
      return NextResponse.json(
        { error: `진행 중인 환불 신청이 ${activeRefunds.length}건 있습니다. 모든 환불 처리가 완료된 후 탈퇴할 수 있습니다.` },
        { status: 400 }
      );
    }

    // 탈퇴 사유 저장 (선택사항, 개선사항을 위한 로그)
    const deleteReason = {
      reason,
      reasonDetail: reasonDetail || '',
      deletedAt: new Date(),
    };

    // 사용자 정보 삭제 (실제로는 soft delete 권장)
    // GDPR 및 개인정보 보호법을 위해 실제 삭제 대신 비활성화 처리
    user.email = `deleted_${Date.now()}_${user.email}`;
    user.name = '탈퇴한 사용자';
    user.phone = '';
    user.addresses = [];
    user.paymentMethods = [];
    user.wishlist = [];
    user.points = 0;
    user.referralCode = undefined;
    user.referredBy = undefined;
    user.marketingConsent = false;
    user.notificationSettings = undefined;
    user.deletedAt = new Date();
    user.deleteReason = deleteReason;
    user.isDeleted = true;

    // 파트너 계정인 경우 추가 처리
    if (user.role === 'partner') {
      user.partnerStatus = 'suspended';
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: '회원 탈퇴가 완료되었습니다.',
    });
  } catch (error: any) {
    console.error('회원 탈퇴 오류:', error);
    return NextResponse.json(
      { error: error.message || '회원 탈퇴에 실패했습니다.' },
      { status: 500 }
    );
  }
}

