'use client';

import React, { useEffect, useState } from 'react';
import { isWebView, openExternalBrowser } from '@/utils/webViewDetection';
import Image from 'next/image';

export function InAppBrowserGuard() {
  const [isMounted, setIsMounted] = useState(false);
  const [showIosOverlay, setShowIosOverlay] = useState(false);
  const [isIosState, setIsIosState] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    if (isWebView()) {
      const userAgent = (window.navigator?.userAgent || '').toLowerCase();
      const isAndroid = /android/i.test(userAgent);
      const isIos = /iphone|ipad|ipod/i.test(userAgent);
      setIsIosState(isIos);

      if (isAndroid) {
        // Android: 바로 강제 전환하지 않고 오버레이를 보여줍니다 (크롬 미설치 유저 대비)
        setShowIosOverlay(true);
      } else if (isIos) {
        // iOS: 강제 전환 불가로 인한 안내 오버레이 활성화
        setShowIosOverlay(true);
      } else {
        // 기타 환경 대비용 오버레이 활성화
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
          <b className="text-emerald-600">
            {isIosState ? '사파리(Safari)' : '기본 시스템'} 브라우저
          </b>로 이어드릴게요.
        </p>
        
        {/* 하단/상단 버튼 유도 UI */}
        <div className="bg-white/80 backdrop-blur-sm px-6 py-5 rounded-2xl shadow-sm border border-orange-100/50 w-full max-w-sm flex flex-col items-center gap-4">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') openExternalBrowser(window.location.href);
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors"
          >
            기본 브라우저로 열기 (추천)
          </button>
          
          <div className="w-full border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500 font-medium mb-2">
              버튼이 작동하지 않는다면:
            </p>
            <div className="flex items-center justify-center gap-2 text-slate-600 text-sm">
              <span className="font-bold text-slate-800">우측 상단/하단 메뉴(⋮)</span>에서
              <span className="font-semibold text-emerald-600">다른 브라우저로 열기</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
