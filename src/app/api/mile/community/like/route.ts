import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import CommunityPost from '@/models/CommunityPost';
import mongoose from 'mongoose';

// POST: 특정 커뮤니티 게시글에 좋아요(공감) 토글
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body = await req.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: 'postId는 필수입니다' }, { status: 400 });
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const hasLiked = post.likes.some((id: any) => id.toString() === userId.toString());

    let updatedPost;
    let liked = false;

    if (hasLiked) {
      // 이미 좋아요를 누른 경우 -> 취소
      updatedPost = await CommunityPost.findByIdAndUpdate(
        postId,
        { $pull: { likes: userId } },
        { new: true }
      );
      liked = false;
    } else {
      // 좋아요 추가
      updatedPost = await CommunityPost.findByIdAndUpdate(
        postId,
        { $addToSet: { likes: userId } },
        { new: true }
      );
      liked = true;
    }

    return NextResponse.json({
      success: true,
      liked,
      likesCount: updatedPost?.likes.length || 0,
    });
  } catch (error: any) {
    console.error('[Mile Like POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
