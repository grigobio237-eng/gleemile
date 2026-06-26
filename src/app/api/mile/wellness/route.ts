import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import WellnessCheck from '@/models/WellnessCheck';
import MileTeamMember from '@/models/MileTeamMember';
import { calculateACWR, getKSTDateString } from '@/lib/mile/acwr';

// POST: 웰니스 체크 기록
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body = await req.json();
    const { sleep, fatigue, stress, tension, notes, collaborationVolume, injuryNote, source = 'quick' } = body;

    // 필수값 검증
    if (!sleep || !fatigue || !stress || !tension) {
      return NextResponse.json({ error: '정신적 피로 지수 4개 항목을 모두 입력해 주세요' }, { status: 400 });
    }

    if (!collaborationVolume || collaborationVolume < 1.0 || collaborationVolume > 3.0) {
      return NextResponse.json({ error: '협업 부량(1.0 ~ 3.0)을 올바르게 선택해 주세요' }, { status: 400 });
    }

    // 유저의 활성 팀 확인 (supporter 제외)
    const membership = await MileTeamMember.findOne({
      userId: session.user.id,
      status: 'active',
      role: { $in: ['member', 'director', 'leader'] },
    });

    if (!membership) {
      return NextResponse.json({ error: '활성 모임 소속이 없거나 기록 권한이 없습니다' }, { status: 400 });
    }

    const today = getKSTDateString();
    
    // 점수 역산 처리 (1:매우 좋음 ~ 5:매우 나쁨 통일 가정, 그대로 평균 냄)
    // 만약 UI에서 1:최악, 5:최상으로 들어온다면 여기서 변환하지만, 스키마에 따라 1~5 자체의 평균을 강도로 봄.
    // 여기서는 1~5를 바로 사용하여 평균을 산출 (값이 클수록 피로도 높음)
    const mentalStrainIndex = Math.round(((sleep + fatigue + stress + tension) / 4) * 10) / 10;
    
    // Daily Cognitive Load = Collaboration Volume * Mental Strain Index
    const dailyCognitiveLoad = Math.round((collaborationVolume * mentalStrainIndex) * 10) / 10;

    // upsert: 같은 날짜에 재입력하면 업데이트
    const check = await WellnessCheck.findOneAndUpdate(
      { userId: session.user.id, date: today },
      {
        userId: session.user.id,
        teamId: membership.teamId,
        date: today,
        sleep, fatigue, stress, tension,
        mentalStrainIndex,
        notes,
        collaborationVolume,
        dailyCognitiveLoad,
        injuryNote,
        source,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      check,
      message: `오늘의 컨디션이 기록되었습니다! (부하: ${dailyCognitiveLoad} AU)`,
    });
  } catch (error: any) {
    console.error('[Wellness POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: 웰니스 기록 조회 (개인 또는 팀)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view');         // 'my' | 'team'
    const days = parseInt(searchParams.get('days') || '28');
    const teamId = searchParams.get('teamId');
    const playerId = searchParams.get('playerId');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = getKSTDateString(startDate);

    // 개인 기록 조회
    if (view !== 'team') {
      const targetUserId = playerId || session.user.id;

      const checks = await WellnessCheck.find({
        userId: targetUserId,
        date: { $gte: startDateStr },
      }).sort({ date: -1 });

      // ACWR 연산을 위한 Load 배열 생성 (과거부터)
      const loads = checks
        .filter((c) => c.dailyCognitiveLoad)
        .map((c) => ({ date: c.date, load: c.dailyCognitiveLoad! }));

      const acwr = calculateACWR(loads);

      const todayStr = getKSTDateString();
      const todayCheck = checks.find((c) => c.date === todayStr);

      const LifeSnap = (await import('@/models/LifeSnap')).default;
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const todayMeals = await LifeSnap.find({
        userId: targetUserId,
        category: 'MEAL',
        createdAt: { $gte: startOfToday }
      }).sort({ createdAt: -1 });

      return NextResponse.json({
        checks,
        acwr,
        todayCheck: todayCheck || null,
        todayMeals: todayMeals || [], 
        stats: {
          totalDays: checks.length,
          avgWellness: checks.length > 0
            ? Math.round((checks.reduce((s, c) => s + c.mentalStrainIndex, 0) / checks.length) * 10) / 10
            : 0,
          avgLoad: loads.length > 0
            ? Math.round((loads.reduce((s, l) => s + l.load, 0) / loads.length) * 10) / 10
            : 0,
        },
      });
    }

    // 팀 전체 기록 조회 (호스트/조장용)
    if (view === 'team' && teamId) {
      const directorMembership = await MileTeamMember.findOne({
        userId: session.user.id,
        teamId,
        status: 'active',
        role: { $in: ['director', 'leader', 'trainer', 'medical'] },
      });

      if (!directorMembership) {
        return NextResponse.json({ error: '모임 데이터 열람 권한이 없습니다' }, { status: 403 });
      }

      const players = await MileTeamMember.find({
        teamId,
        status: 'active',
        role: 'member', // supporter 제외
      }).populate('userId', 'name avatar');

      const todayStr = getKSTDateString();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 28);
      const startDateStr = getKSTDateString(startDate);

      const allChecks = await WellnessCheck.find({
        teamId,
        date: { $gte: startDateStr },
      }).sort({ date: -1 });

      const squad = players.map((p) => {
        const pChecks = allChecks.filter(
          (c) => c.userId.toString() === (p.userId as any)?._id?.toString()
        );
        const check = pChecks.find((c) => c.date === todayStr);
        
        const loads = pChecks
          .filter((c) => c.dailyCognitiveLoad)
          .map((c) => ({ date: c.date, load: c.dailyCognitiveLoad! }));
        
        const acwr = calculateACWR(loads);

        return {
          memberId: p._id,
          userId: (p.userId as any)?._id,
          name: (p.userId as any)?.name || '알 수 없음',
          avatar: (p.userId as any)?.avatar,
          position: p.position,
          playerNumber: p.playerNumber,
           todayCheck: check
            ? {
                mentalStrainIndex: check.mentalStrainIndex,
                sleep: check.sleep,
                fatigue: check.fatigue,
                stress: check.stress,
                tension: check.tension,
                notes: check.notes,
                collaborationVolume: check.collaborationVolume,
                dailyCognitiveLoad: check.dailyCognitiveLoad,
              }
            : null,
          acwr, // Cognitive ACWR 결과 포함
          checkedIn: !!check,
        };
      });

      return NextResponse.json({
        squad,
        summary: {
          total: players.length,
          checkedIn: squad.filter((s) => s.checkedIn).length,
          avgWellness: allChecks.filter(c => c.date === todayStr).length > 0
            ? Math.round(
                (allChecks.filter(c => c.date === todayStr).reduce((s, c) => s + c.mentalStrainIndex, 0) / allChecks.filter(c => c.date === todayStr).length) * 10
              ) / 10
            : 0,
        },
      });
    }

    return NextResponse.json({ error: 'view 파라미터가 필요합니다' }, { status: 400 });
  } catch (error: any) {
    console.error('[Wellness GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
