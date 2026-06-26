'use client';

import { useEffect, useState } from 'react';
import { X, Download, Share, PlusSquare } from 'lucide-react';
import Image from 'next/image';

export default function InstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 1. 이미 홈 화면에 설치되어 standalone 모드로 실행 중인지 체크
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // 2. localStorage에 저장된 7일간 노출 거부 일자 체크
    const dismissedTime = localStorage.getItem('youniqle-pwa-dismissed');
    if (dismissedTime) {
      const diff = Date.now() - Number(dismissedTime);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (diff < sevenDays) {
        return;
      }
    }

    // 3. 디바이스 환경 판단 (iOS 여부)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // 4. Android/Chrome 계열 설치 프롬프트 캡처 이벤트 리스너 등록
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS Safari의 경우 beforeinstallprompt 이벤트가 발생하지 않으므로 수동 넛지 활성화
    if (ios) {
      // 일반 Safari 브라우저에서 접속한 경우에만 넛지 (웹뷰 환경 필터링 방지)
      const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios|optios/.test(userAgent);
      if (isSafari) {
        // 즉각 띄우면 거부감이 드므로 마운트 후 3초 뒤에 부드럽게 넛지를 노출합니다.
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the Youniqle PWA install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // 7일간 다시 보지 않도록 현재 타임스탬프 기록
    localStorage.setItem('youniqle-pwa-dismissed', Date.now().toString());
  };

  // SSR Hydration 에러 방지용 가드
  if (!mounted || !showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="relative mx-auto max-w-md overflow-hidden rounded-[24px] border border-neutral-800 bg-[#0B0D10]/95 p-5 shadow-2xl backdrop-blur-md">
        
        {/* 장식용 골드 그라데이션 선 */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        {/* 닫기 버튼 */}
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 본문 콘텐츠 */}
        <div className="flex items-start space-x-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-neutral-900 border border-neutral-800 shadow-inner">
            <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized               src="/character/youniqle-1.png"
              alt="Youniqle"
              className="h-9 w-9 object-contain"
              onError={(e) => {
                // 대체 로고 방어 코드
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          
          <div className="flex-1 space-y-1 pr-4">
            <h4 className="text-base font-semibold text-white">
              gleemile을 홈 화면에 추가하세요 ✨
            </h4>
            <p className="text-xs leading-relaxed text-neutral-400">
              {isIOS 
                ? '앱을 추가하여 끊김 없는 맞춤 회복 솔루션과 푸시 알림을 바로 만나보세요.' 
                : '간편하게 전용 앱으로 설치하여 최적화된 리커버리 대시보드를 사용해 보세요.'}
            </p>
          </div>
        </div>

        {/* 디바이스 분기 액션 가이드 */}
        <div className="mt-4">
          {isIOS ? (
            // iOS 수동 설치 유도 가이드
            <div className="rounded-[16px] bg-neutral-900/60 border border-neutral-800/50 px-4 py-3 text-xs text-neutral-300">
              <div className="flex items-center space-x-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-neutral-800 text-[#D4AF37]">1</span>
                <span className="flex items-center">
                  Safari 하단의 <Share className="mx-1 h-3.5 w-3.5 inline-block text-blue-400" /> <strong>'공유'</strong> 아이콘을 탭합니다.
                </span>
              </div>
              <div className="mt-2.5 flex items-center">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-neutral-800 text-[#D4AF37]">2</span>
                <span className="flex items-center">
                  메뉴를 아래로 스크롤하여 <PlusSquare className="mx-1 h-3.5 w-3.5 inline-block text-white" /> <strong>'홈 화면에 추가'</strong>를 선택합니다.
                </span>
              </div>
            </div>
          ) : (
            // Android/Chrome 네이티브 설치 원터치 버튼
            <button
              onClick={handleInstallClick}
              disabled={!deferredPrompt}
              className="flex w-full items-center justify-center space-x-2 rounded-[16px] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] py-3 text-sm font-semibold text-[#0B0D10] transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>gleemile 앱 설치하기</span>
            </button>
          )}
        </div>

        {/* 하단 거부 제어 넛지 */}
        <div className="mt-3 text-center">
          <button
            onClick={handleDismiss}
            className="text-[10px] text-neutral-500 hover:text-neutral-300 underline transition-colors"
          >
            이번 주는 보지 않기
          </button>
        </div>

      </div>
    </div>
  );
}
