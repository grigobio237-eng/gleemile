import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db';
import MileTeam from '@/models/MileTeam';
import MileTeamMember from '@/models/MileTeamMember';
import TeamSettingsClient from './TeamSettingsClient';

export default async function TeamSettingsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=/mile/team/${teamId}/settings`);
  }

  await connectDB();
  const team = await MileTeam.findById(teamId);
  if (!team || !team.isActive) {
    redirect(`/mile`);
  }

  const membership = await MileTeamMember.findOne({
    teamId,
    userId: session.user.id,
    status: 'active'
  });

  if (!membership) {
    redirect(`/mile/team/${teamId}`);
  }

  const role = membership.role;
  if (role !== 'director' && role !== 'manager') {
    // 권한이 없으면 대시보드로 강제 튕겨냄
    redirect(`/mile/team/${teamId}`);
  }

  const teamInfo = {
    membership: {
      _id: membership._id.toString(),
      role: membership.role,
    },
    team: {
      _id: team._id.toString(),
      teamName: team.teamName,
      teamCode: team.teamCode,
      category: team.category,
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TeamSettingsClient teamInfo={teamInfo} currentUserId={session.user.id} />
    </div>
  );
}
