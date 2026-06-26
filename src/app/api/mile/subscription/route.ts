import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import MileSubscription, { PLAN_CONFIG } from '@/models/MileSubscription';
import MileTeamMember from '@/models/MileTeamMember';
import MileTeam from '@/models/MileTeam';

// GET: 내 구독 상태 조회
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    // 총무/조장 멤버십 확인
    const membership = await MileTeamMember.findOne({
      userId: session.user.id,
      status: 'active',
      role: { $in: ['director', 'leader'] },
    });

    if (!membership) {
      return NextResponse.json({ hasSubscription: false, message: '총무/조장 권한이 필요합니다' });
    }

    const subscription = await MileSubscription.findOne({
      teamId: membership.teamId,
      status: { $in: ['trial', 'active'] },
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        plans: PLAN_CONFIG,
      });
    }

    // 현재 팀원/스터디원 수
    const playerCount = await MileTeamMember.countDocuments({
      teamId: membership.teamId,
      status: 'active',
      role: 'member',
    });

    const team = await MileTeam.findById(membership.teamId).select('teamName');

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        plan: subscription.plan,
        planLabel: PLAN_CONFIG[subscription.plan as keyof typeof PLAN_CONFIG].label,
        status: subscription.status,
        amount: subscription.amount,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        trialEndsAt: subscription.trialEndsAt,
        nextPaymentDate: subscription.nextPaymentDate,
        maxPlayers: subscription.maxPlayers,
        currentPlayers: playerCount,
      },
      team: { name: team?.teamName },
      plans: PLAN_CONFIG,
    });
  } catch (error: any) {
    console.error('[Subscription GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: 구독 시작 (트라이얼 또는 유료)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body = await req.json();
    const { plan, action } = body;

    const membership = await MileTeamMember.findOne({
      userId: session.user.id,
      status: 'active',
      role: { $in: ['director', 'leader'] },
    });

    if (!membership) {
      return NextResponse.json({ error: '총무/조장 권한이 필요합니다' }, { status: 403 });
    }

    // 이미 활성 구독이 있는지 확인
    const existing = await MileSubscription.findOne({
      teamId: membership.teamId,
      status: { $in: ['trial', 'active'] },
    });

    if (existing && action !== 'cancel') {
      return NextResponse.json({ error: '이미 활성 구독이 있습니다' }, { status: 400 });
    }

    if (action === 'cancel' && existing) {
      existing.status = 'cancelled';
      existing.cancelledAt = new Date();
      existing.cancelReason = body.cancelReason || '사용자 요청';
      await existing.save();
      return NextResponse.json({ success: true, message: '구독이 취소되었습니다' });
    }

    if (!plan || !PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG]) {
      return NextResponse.json({ error: '올바른 플랜을 선택해 주세요' }, { status: 400 });
    }

    const planConfig = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG];
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14일 무료
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await MileSubscription.create({
      userId: session.user.id,
      teamId: membership.teamId,
      plan,
      status: 'trial',
      paymentMethod: 'free',
      amount: planConfig.price,
      startDate: now,
      endDate,
      trialEndsAt: trialEnd,
      maxPlayers: planConfig.maxPlayers,
    });

    return NextResponse.json({
      success: true,
      subscription,
      message: `${planConfig.label} 플랜 14일 무료 체험이 시작되었습니다!`,
    });
  } catch (error: any) {
    console.error('[Subscription POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
