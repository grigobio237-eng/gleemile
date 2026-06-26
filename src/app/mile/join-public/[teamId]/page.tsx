import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import MileTeamMember from '@/models/MileTeamMember';
import MileTeam from '@/models/MileTeam';

export default async function PublicJoinCallbackPage({ params }: { params: Promise<{ teamId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/');
  }

  await connectDB();
  const { teamId } = await params;
  const team = await MileTeam.findById(teamId);
  
  if (team && team.isPublic) {
    const existing = await MileTeamMember.findOne({ teamId, userId: session.user.id });
    if (!existing) {
      await MileTeamMember.create({
        teamId,
        userId: session.user.id,
        role: 'member',
        status: 'active'
      });
    }
  }

  // 가입 완료 후 해당 팀의 대시보드로 무마찰 리다이렉트
  redirect(`/mile/team/${teamId}`);
}
