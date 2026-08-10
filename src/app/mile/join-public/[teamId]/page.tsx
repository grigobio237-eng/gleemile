import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';

export default async function PublicJoinCallbackPage({ params }: { params: Promise<{ teamId: string }> }) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user?.id) {
    redirect('/');
  }

  // TODO: [Firebase-Migration] 임시 Stub 처리
  const { teamId } = await params;
  
  redirect(`/mile/dashboard`);
}
