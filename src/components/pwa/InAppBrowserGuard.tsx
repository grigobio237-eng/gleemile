'use client';

import React, { useEffect, useState } from 'react';
import { isWebView, openExternalBrowser } from '@/utils/webViewDetection';
import Image from 'next/image';

export function InAppBrowserGuard() {
  const [isMounted, setIsMounted] = useState(false);
  const [showIosOverlay, setShowIosOverlay] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    if (isWebView()) {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isAndroid = /android/i.test(userAgent);
      const isIos = /iphone|ipad|ipod/i.test(userAgent);

      if (isAndroid) {
        // Android: 0.1초 내외 즉각적인 intent 전환
        openExternalBrowser(window.location.href);
      } else if (isIos) {
        // iOS: 강제 전환 불가로 인한 안내 오버레이 활성화
        setShowIosOverlay(true);
      } else {
        // 기타 환경 대비용 오버레이 활성화 (카카오 데스크톱 등)
        setShowIosOverlay(true);
      }
    }
  }, []);

  // Hydration 오류 방지 (서버 렌더링 시에는 null 반환)
  if (!isMounted) return null;

  // iOS 인앱 브라우저를 위한 오버레이 UI
  if (showIosOverlay) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#FFFDF9] to-[#FDF4E3] p-6 text-center">
        {/* 미려한 플로팅 애니메이션 효과가 적용된 마스코트 */}
        <div className="animate-[bounce_3s_infinite_ease-in-out] mb-8">
          <Image 
            src="/images/confused.webp" 
            alt="Confused Mascot" 
            width={120} 
            height={120} 
            className="drop-shadow-lg"
          />
        </div>
        
        {/* 프리미엄 폰트 및 카피라이팅 */}
        <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
          앗, 잠시만요!
        </h2>
        <p className="text-slate-600 font-medium leading-relaxed mb-10 max-w-xs mx-auto">
          더 원활한 소통과 소중한 기록 보존을 위해 <br/>
          <b className="text-emerald-600">사파리(Safari) 브라우저</b>로 이어드릴게요.
        </p>
        
        {/* 하단/상단 버튼 유도 UI */}
        <div className="bg-white/80 backdrop-blur-sm px-6 py-5 rounded-2xl shadow-sm border border-orange-100/50 w-full max-w-sm flex flex-col items-center gap-3">
          <p className="text-sm text-slate-700 font-bold">
            오른쪽 아래(또는 위) 탭에서
          </p>
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            </span>
            <span className="font-semibold text-slate-800 mx-1">사파리로 열기</span>
            <span>를 선택해 주세요</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
