import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function InviteJoinPage({ params }: { params: Promise<{ teamId: string }> }) {
  const resolvedParams = await params;
  const teamId = resolvedParams.teamId;
  const session = await getServerSession(authOptions);

  // [중요: 카카오 인앱 브라우저 세션 유실 방지 가드]
  if (!session?.user?.id) {
    // 로그인되지 않은 유저는, 로그인 성공 후 다시 이 초대 주소로 무마찰 회귀하도록 callbackUrl 명시
    redirect(`/auth/signin?callbackUrl=/invite/${teamId}`);
  }

  // 로그인 된 유저라면 DB 쿼리로 TeamMember 등록 처리 로직 (생략: 백엔드 모듈 연동부)
  // await joinTeam(session.user.id, teamId);
  
  // 아래는 실제 백엔드 연동 전 임시 Stub 리다이렉트입니다.
  redirect(`/mile/${teamId}/dashboard`);
}
