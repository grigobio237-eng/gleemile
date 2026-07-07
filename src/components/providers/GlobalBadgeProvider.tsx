'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function GlobalBadgeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // 1. 단일 알림 요약 문서 실시간 구독 (Firestore 읽기 최적화)
  useEffect(() => {
    if (!userId) {
      setTotalUnreadCount(0);
      return;
    }

    // 유저 메인 문서(users/{userId})에서 서버(Cloud Function 등)가 집계해주는 
    // 통합 안 읽음 카운트 필드(unreadTotal) 단 하나만 리스닝합니다.
    const userRef = doc(db, 'users', userId);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // 서버에서 업데이트 해주는 unreadTotal 필드 참조 (없으면 0)
        const currentTotal = data.unreadTotal || 0;
        setTotalUnreadCount(currentTotal);
      }
    }, (err) => {
      console.error("Failed to subscribe to global unread count:", err);
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
