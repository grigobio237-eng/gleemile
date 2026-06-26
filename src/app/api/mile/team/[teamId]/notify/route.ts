import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { sendPushNotification } from '@/lib/services/notificationService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Ensure this exists, or use your custom session retrieval

export async function POST(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = params;
    // 세션(로그인 유저) 확인
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = session.user.id;

    // 클라이언트로부터 최소한의 식별자만 수신 (안전장치)
    const { type, messageId, announcementId } = await request.json();

    // 1. 발송자 권한 검증: 현재 유저가 해당 팀의 멤버인지 확인
    const memberId = `${teamId}_${currentUserId}`;
    const memberSnap = await adminDb.collection('team_members').doc(memberId).get();
    if (!memberSnap.exists || memberSnap.data()?.status !== 'active') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const userRole = memberSnap.data()?.role;

    let title = '글리마일';
    let body = '새로운 알림이 도착했습니다.';
    let urlData = `/mile/team/${teamId}`;

    // 2. 서버 사이드 데이터 룩업 및 검증
    if (type === 'chat' && messageId) {
      const msgSnap = await adminDb.collection('teams').doc(teamId).collection('messages').doc(messageId).get();
      if (!msgSnap.exists) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }
      const msgData = msgSnap.data()!;
      // 위변조 방지: 요청한 유저가 실제 메시지 작성자인지 재확인
      if (msgData.senderId !== currentUserId) {
        return NextResponse.json({ error: 'Sender mismatch spoofing detected' }, { status: 403 });
      }

      // 발송자 이름 조회를 위해 유저 프로필 룩업 (또는 session.user.name 사용)
      const senderName = session.user.name || '알 수 없는 유저';
      title = `${senderName}님의 새 메시지`;
      body = msgData.attachmentUrl ? '미디어 파일을 보냈습니다.' : msgData.text;
      
    } else if (type === 'announcement' && announcementId) {
      // 공지사항 발송 권한(director, manager) 검증
      if (userRole !== 'director' && userRole !== 'manager') {
        return NextResponse.json({ error: 'Announcement notify forbidden' }, { status: 403 });
      }

      const annSnap = await adminDb.collection('teams').doc(teamId).collection('announcements').doc(announcementId).get();
      if (!annSnap.exists) {
        return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
      }
      const annData = annSnap.data()!;
      
      title = `[공지] ${annData.title}`;
      body = annData.content.substring(0, 50) + (annData.content.length > 50 ? '...' : '');
    } else {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 3. 검증된 데이터로 안전하게 알림 발송 (type 필터를 통해 유저별 설정 확인)
    const result = await sendPushNotification(teamId, currentUserId, title, body, urlData, type);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Notify API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
