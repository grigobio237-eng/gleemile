import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import CommunityPost from '@/models/CommunityPost';
import User from '@/models/User';
import mongoose from 'mongoose';

// POST: 특정 커뮤니티 게시글에 댓글 작성
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body = await req.json();
    const { postId, content } = body;

    if (!postId || !content) {
      return NextResponse.json({ error: 'postId와 댓글 내용은 필수입니다' }, { status: 400 });
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 });
    }

    // 사용자 정보 상세 조회
    const user = await User.findById(session.user.id);
    const authorName = user?.name || session.user.name || '익명 팀원';
    const authorImage = user?.image || session.user.image || '';

    // 댓글 객체 생성
    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      authorId: new mongoose.Types.ObjectId(session.user.id),
      authorName,
      authorImage,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 포스트의 comments 배열에 추가
    await CommunityPost.findByIdAndUpdate(postId, {
      $push: { comments: newComment },
    });

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error: any) {
    console.error('[Mile Comment POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
