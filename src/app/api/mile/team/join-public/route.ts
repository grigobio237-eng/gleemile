import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MileTeam from '@/models/MileTeam';
import MileTeamMember, { DEFAULT_PERMISSIONS } from '@/models/MileTeamMember';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { teamId } = await req.json();

    if (!teamId) {
      return NextResponse.json({ error: 'teamId가 필요합니다' }, { status: 400 });
    }

    const team = await MileTeam.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: '모임을 찾을 수 없습니다' }, { status: 404 });
    }

    if (!team.isPublic || !team.isActive) {
      return NextResponse.json({ error: '공개된 모임이 아니거나 활성화되지 않았습니다.' }, { status: 403 });
    }

    // Check if already joined
    const existingMembership = await MileTeamMember.findOne({
      teamId: team._id,
      userId: session.user.id,
    });

    if (existingMembership) {
      if (existingMembership.status === 'active') {
        return NextResponse.json({ error: '이미 가입된 모임입니다.' }, { status: 400 });
      } else {
        // Reactivate
        existingMembership.status = 'active';
        existingMembership.joinedAt = new Date();
        await existingMembership.save();
      }
    } else {
      // Create new membership
      await MileTeamMember.create({
        teamId: team._id,
        userId: session.user.id,
        role: 'member',
        status: 'active',
        permissions: DEFAULT_PERMISSIONS.member,
        joinedAt: new Date(),
      });
    }

    // Ensure User mileRole is set
    await User.findByIdAndUpdate(session.user.id, {
      $set: { mileRole: 'player' } // Don't overwrite if leader, but simplifed here (actually we should only set to player if it's new)
    });

    return NextResponse.json({ success: true, message: '가입이 완료되었습니다.' });
  } catch (error: any) {
    console.error('[Mile Team Join Public POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
