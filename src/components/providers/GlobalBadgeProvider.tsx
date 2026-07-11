'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function GlobalBadgeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // 1. 모든 팀의 개별 unreadCount 합산 (클라이언트 사이드 집계)
  useEffect(() => {
    if (!userId) {
      setTotalUnreadCount(0);
      return;
    }

    const teamMetaRef = collection(db, 'users', userId, 'team_metadata');
    
    const unsubscribe = onSnapshot(teamMetaRef, (snap) => {
      let sum = 0;
      snap.forEach(doc => {
        const data = doc.data();
        // 각 팀 대시보드 진입 시 업데이트되는 lastUnreadCount 합산
        sum += data.lastUnreadCount || 0;
      });
      setTotalUnreadCount(sum);
    }, (err) => {
      console.error("Failed to subscribe to team metadata for badge:", err);
    });

    return () => unsubscribe();
  }, [userId]);

  // 2. 브라우저 및 OS PWA 뱃지 업데이트 (하이드레이션 & SSR 방어)
  useEffect(() => {
    // SSR 단계 우회 및 브라우저 지원 여부(Feature Detection) 확인
    if (typeof window !== 'undefined' && window.navigator && 'setAppBadge' in window.navigator) {
      const updateBadge = async () => {
        try {
          if (totalUnreadCount > 0) {
            // 알림 권한이 없는 iOS 16.4+ 기기 등에서는 catch로 부드럽게 Fall-safe 처리됨
            await (navigator as any).setAppBadge(totalUnreadCount);
          } else {
            await (navigator as any).clearAppBadge();
          }
        } catch (err) {
          // 권한 부족, PWA 미설치 브라우저 탭 환경 등 예외 발생 시 에러 로깅 후 무시
          console.debug("App badge update skipped (permission/support):", err);
        }
      };

      updateBadge();
    }
  }, [totalUnreadCount]);

  return <>{children}</>;
}
