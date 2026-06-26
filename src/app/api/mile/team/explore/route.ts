import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MileTeam from '@/models/MileTeam';
import MileTeamMember from '@/models/MileTeamMember';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    // Search condition: must be public, approved, active. 
    // If query exists, match teamName or description.
    const filter: any = {
      isPublic: true,
      isActive: true,
      status: 'approved'
    };

    if (query) {
      filter.$or = [
        { teamName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    const publicTeams = await MileTeam.find(filter)
      .populate('createdBy', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get current user's memberships to avoid showing 'Join' if already joined
    let joinedTeamIds: string[] = [];
    if (session?.user?.id) {
      const userMemberships = await MileTeamMember.find({
        userId: session.user.id,
        status: 'active'
      });
      joinedTeamIds = userMemberships.map(m => m.teamId.toString());
    }

    // Compute member counts for public teams
    const teamsWithDetails = await Promise.all(
      publicTeams.map(async (team) => {
        const memberCount = await MileTeamMember.countDocuments({
          teamId: team._id,
          status: 'active'
        });
        const isJoined = joinedTeamIds.includes(team._id.toString());
        return {
          ...team.toObject(),
          memberCount,
          isJoined
        };
      })
    );

    return NextResponse.json({ teams: teamsWithDetails });
  } catch (error: any) {
    console.error('[Mile Team Explore GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
