import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 주석 해제하여 권한 체크 진행 
    // if (!session || session.user?.mileRole !== 'leader') {
    //   return NextResponse.json({ error: 'Unauthorized. Only coaches can update status.' }, { status: 403 });
    // }

    const body = await req.json();
    const { playerId, trainingLoad, coachComment } = body;

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    // 1. 여기서 DB에 팀원/스터디원 상태 업데이트 로직 (목업)
    // await db.collection('mile_players').updateOne({ _id: playerId }, { $set: { currentLoad: trainingLoad, lastComment: coachComment } });

    // 2. 부모 알림 트리거 로직 (목업)
    // const parent = await db.collection('users').findOne({ role: 'supporter', linkedPlayerId: playerId });
    // if (parent && parent.notificationSettings?.push?.systemUpdates) {
    //   await NotificationService.send(parent.id, {
    //     title: 'gleemile 총무/조장 알림',
    //     body: coachComment,
    //     type: 'COACH_UPDATE'
    //   });
    // }

    console.log(`[Notification Hook] Player ${playerId} updated. Simulated notification sent to guardian.`);

    return NextResponse.json({ 
      success: true, 
      message: 'Status updated and guardian notified.',
      data: {
        playerId,
        trainingLoad,
        notified: true
      }
    });

  } catch (error: any) {
    console.error('Failed to update coach status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
