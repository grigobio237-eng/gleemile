import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db';
import MileTeam from '@/models/MileTeam';
import MileTeamMember from '@/models/MileTeamMember';
import TeamDashboardClient from './TeamDashboardClient';

export default async function TeamDashboardPage({ params }: { params: Promise<{ teamId: string }> }) {
  const resolvedParams = await params;
  const teamId = resolvedParams.teamId;

  await connectDB();
  const team = await MileTeam.findById(teamId);
  if (!team || !team.isActive) {
    redirect('/');
  }

  const session = await getServerSession(authOptions);
  
  let membership = null;
  if (session?.user?.id) {
    membership = await MileTeamMember.findOne({
      teamId,
      userId: session.user.id,
      status: 'active'
    });
  }

  if (!membership) {
    if (!team.isPublic) {
      // 비공개 방은 멤버가 아니면 접근 불가
      redirect('/');
    }
    // 공개 방은 멤버가 아니거나(Guest) 비회원이면 보기 전용(Guest)으로 접근 허용
    membership = {
      _id: 'guest',
      role: 'guest',
      position: '',
      playerNumber: ''
    };
  }

  const teamInfo = {
    membership: {
      _id: membership._id.toString(),
      role: membership.role,
      position: membership.position,
      playerNumber: membership.playerNumber,
    },
    team: {
      _id: team._id.toString(),
      teamName: team.teamName,
      teamCode: team.teamCode,
      category: team.category,
      templateType: team.templateType,
      ageGroup: team.ageGroup,
    }
  };

  return <TeamDashboardClient initialTeamInfo={teamInfo} />;
}
