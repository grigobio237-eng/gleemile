import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import TeamAnnouncement from '@/models/TeamAnnouncement';
import MileTeamMember from '@/models/MileTeamMember';

// GET: 팀 공지사항 목록 조회
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    const type = searchParams.get('type'); // 'notice' | 'schedule' | 'urgent' | null(all)

    if (!teamId) {
      // 유저의 활성 팀 자동 탐색
      const membership = await MileTeamMember.findOne({
        userId: session.user.id,
        status: 'active',
      });
      if (!membership) {
        return NextResponse.json({ announcements: [] });
      }
      const query: any = { teamId: membership.teamId };
      if (type) query.type = type;

      const announcements = await TeamAnnouncement.find(query)
        .populate('authorId', 'name avatar')
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(30);

      return NextResponse.json({ announcements });
    }

    // 팀 소속 확인
    const membership = await MileTeamMember.findOne({
      userId: session.user.id,
      teamId,
      status: 'active',
    });
    if (!membership) {
      return NextResponse.json({ error: '팀 소속이 아닙니다' }, { status: 403 });
    }

    const query: any = { teamId };
    if (type) query.type = type;

    const announcements = await TeamAnnouncement.find(query)
      .populate('authorId', 'name avatar')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(30);

    return NextResponse.json({ announcements });
  } catch (error: any) {
    console.error('[Announcements GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: 공지사항 작성 (총무/조장 전용)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body = await req.json();
    const { teamId, title, content, type = 'notice', isPinned, eventDate, eventTime, eventLocation, eventType } = body;

    if (!title || !content) {
      return NextResponse.json({ error: '제목과 내용은 필수입니다' }, { status: 400 });
    }

    // 총무/조장 권한 확인
    const membership = await MileTeamMember.findOne({
      userId: session.user.id,
      teamId: teamId || undefined,
      status: 'active',
      role: { $in: ['director', 'leader'] },
    });

    if (!membership) {
      return NextResponse.json({ error: '총무/조장 권한이 필요합니다' }, { status: 403 });
    }

    const announcement = await TeamAnnouncement.create({
      teamId: membership.teamId,
      authorId: session.user.id,
      title,
      content,
      type,
      isPinned: isPinned || false,
      eventDate: eventDate ? new Date(eventDate) : undefined,
      eventTime,
      eventLocation,
      eventType,
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error: any) {
    console.error('[Announcements POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: 공지사항 삭제 (총무/조장 전용)
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const announcementId = searchParams.get('id');

    if (!announcementId) {
      return NextResponse.json({ error: 'id가 필요합니다' }, { status: 400 });
    }

    const announcement = await TeamAnnouncement.findById(announcementId);
    if (!announcement) {
      return NextResponse.json({ error: '공지사항을 찾을 수 없습니다' }, { status: 404 });
    }

    // 작성자 또는 총무/조장 권한 확인
    const membership = await MileTeamMember.findOne({
      userId: session.user.id,
      teamId: announcement.teamId,
      status: 'active',
      role: { $in: ['director', 'leader'] },
    });

    if (!membership) {
      return NextResponse.json({ error: '삭제 권한이 없습니다' }, { status: 403 });
    }

    await TeamAnnouncement.findByIdAndDelete(announcementId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Announcements DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
