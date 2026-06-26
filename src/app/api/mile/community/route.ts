import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import CommunityPost from '@/models/CommunityPost';
import MileTeamMember from '@/models/MileTeamMember';
import User from '@/models/User';

// GET: 팀 내 커뮤니티 게시글 목록 조회
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category'); // 'question' | 'tip' | null(all)

    // 사용자의 활성 팀 멤버십 조회
    const membership = await MileTeamMember.findOne({
      userId: session.user.id,
      status: 'active',
    });

    if (!membership) {
      return NextResponse.json({ posts: [] });
    }

    const query: any = { teamId: membership.teamId };
    if (category && category !== 'all') {
      query.category = category;
    } else {
      // 일반 커뮤니티 카테고리와 구분을 위해, 팀 커뮤니티에서는 기본적으로 질문(question)과 팁(tip)을 지원
      query.category = { $in: ['question', 'tip', 'free'] };
    }

    const posts = await CommunityPost.find(query)
      .populate('authorId', 'name image mileRole')
      .sort({ createdAt: -1 })
      .limit(30);

    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    console.error('[Mile Community GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: 팀 내 커뮤니티 게시글 작성
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, category = 'question' } = body;

    if (!title || !content) {
      return NextResponse.json({ error: '제목과 내용은 필수입니다' }, { status: 400 });
    }

    // 사용자의 활성 팀 멤버십 조회
    const membership = await MileTeamMember.findOne({
      userId: session.user.id,
      status: 'active',
    });

    if (!membership) {
      return NextResponse.json({ error: '소속된 모임이 없습니다. 팀 가입이 필요합니다.' }, { status: 403 });
    }

    // 사용자 정보 상세 조회 (작성자 프로필 이미지 및 이름 동기화용)
    const user = await User.findById(session.user.id);
    const authorName = user?.name || session.user.name || '익명 팀원/스터디원';
    const authorImage = user?.image || session.user.image || '';

    const post = await CommunityPost.create({
      title,
      content,
      category,
      teamId: membership.teamId,
      authorId: session.user.id,
      authorName,
      authorImage,
      viewCount: 0,
      likes: [],
      comments: [],
    });

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error('[Mile Community POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
