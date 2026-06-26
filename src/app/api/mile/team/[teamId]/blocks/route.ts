import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import MileTeam from '@/models/MileTeam';
import mongoose from 'mongoose';
import { IBlockConfig } from '@/types/block';

// 팀 카테고리별 기본 블록 (Mock 데이터 배열과 동일)
const getDefaultBlocks = (category: string): IBlockConfig[] => {
  return [
    { blockId: 'wellness', blockName: '웰니스 체크', category: 'core', isActive: true, order: 0 },
    { blockId: 'announcements', blockName: '공지사항', category: 'core', isActive: true, order: 1 },
    { blockId: 'schedule', blockName: '일정', category: 'core', isActive: true, order: 2 },
    { blockId: 'community', blockName: '커뮤니티', category: 'core', isActive: true, order: 3 },
    { blockId: 'players', blockName: '멤버 명단', category: 'core', isActive: true, order: 4 },
  ];
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { teamId } = await params;
    await connectDB();

    // mock team의 경우 DB 연동 생략 및 기본값 반환
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
       return NextResponse.json({ blocks: getDefaultBlocks('sports') });
    }

    const team = await MileTeam.findById(teamId);
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    // DB에 블록 설정이 없거나 배열이 비어있으면 기본값 생성 및 저장 (Upsert/Initialize)
    if (!team.enabledBlocks || team.enabledBlocks.length === 0) {
      const defaultBlocks = getDefaultBlocks(team.templateType || 'sports');
      team.enabledBlocks = defaultBlocks as any;
      await team.save();
      return NextResponse.json({ blocks: team.enabledBlocks });
    }

    const sortedBlocks = [...team.enabledBlocks].sort((a, b) => a.order - b.order);
    return NextResponse.json({ blocks: sortedBlocks });
  } catch (error: any) {
    console.error('Error fetching blocks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { teamId } = await params;
    await connectDB();
    
    // mock team의 경우 무시
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
       return NextResponse.json({ success: true });
    }

    const { blocks } = await request.json();
    if (!Array.isArray(blocks)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const updatedTeam = await MileTeam.findByIdAndUpdate(
      teamId,
      { $set: { enabledBlocks: blocks } },
      { new: true, runValidators: true }
    );

    if (!updatedTeam) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    const sortedBlocks = [...updatedTeam.enabledBlocks].sort((a, b) => a.order - b.order);
    return NextResponse.json({ success: true, blocks: sortedBlocks });
  } catch (error: any) {
    console.error('Error updating blocks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
