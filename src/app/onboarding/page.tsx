import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TeamOnboardingForm } from '@/components/team/TeamOnboardingForm';

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/onboarding');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-[100vw] h-[100vw] rounded-full bg-indigo-50/50 blur-3xl opacity-50" />
        <div className="absolute -bottom-1/2 -left-1/2 w-[100vw] h-[100vw] rounded-full bg-blue-50/50 blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 w-full">
        <TeamOnboardingForm userId={session.user.id} />
      </div>
    </div>
  );
}
