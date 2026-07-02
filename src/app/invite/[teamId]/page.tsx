'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function InviteJoinPage({ params }: { params: Promise<{ teamId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (resolvedParams.teamId) {
      sessionStorage.setItem('gleemile_invite_code', resolvedParams.teamId);
      
      // 상태에 상관없이 홈으로 이동하여 온보딩 인터셉터가 처리하도록 함
      if (status !== 'loading') {
        router.push('/');
      }
    }
  }, [resolvedParams.teamId, status, router]);

  // 구름 마스코트 렌더링 등 UI가 필요하다면 여기에 추가 (찰나의 순간이므로 로딩 표시)
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFDF9] to-[#FDF4E3] flex flex-col items-center justify-center p-4">
      <div className="animate-[bounce_3s_infinite_ease-in-out]">
        <img src="/images/confused.webp" alt="Mascot" width={120} height={120} className="drop-shadow-lg" />
      </div>
      <p className="mt-6 text-slate-600 font-medium text-lg">초대 링크를 확인 중입니다...</p>
    </div>
  );
}
