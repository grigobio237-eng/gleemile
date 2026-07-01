'use client';

import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIos) {
      const hasDismissed = localStorage.getItem('ios_pwa_prompt_dismissed');
      if (!hasDismissed) {
        setShowIosPrompt(true);
      }
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const hasDismissed = localStorage.getItem('android_pwa_prompt_dismissed');
      if (!hasDismissed) {
        setShowAndroidPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('Service worker registration failed:', err);
      });
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
      console.log('User accepted the A2HS prompt');
      setShowAndroidPrompt(false);
    } else {
      console.log('User dismissed the A2HS prompt');
    }
    setDeferredPrompt(null);
  };

  const dismissAndroid = () => {
    setShowAndroidPrompt(false);
    localStorage.setItem('android_pwa_prompt_dismissed', 'true');
  };

  const dismissIos = () => {
    setShowIosPrompt(false);
    localStorage.setItem('ios_pwa_prompt_dismissed', 'true');
  };

  if (isStandalone) return null;

  if (showAndroidPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 animate-in slide-in-from-bottom-10">
        <div className="flex items-start justify-between">
          <div className="flex gap-3 items-center">
            <img src="/images/confident.png" alt="App Icon" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
            <div>
              <h4 className="text-sm font-black text-slate-800">앱으로 설치하기</h4>
              <p className="text-[11px] text-slate-500 font-medium">더 빠르고 편리하게 Gleemile을 이용하세요.</p>
            </div>
          </div>
          <button onClick={dismissAndroid} className="p-1 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <Button onClick={handleInstallClick} className="w-full mt-4 h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm">
          <Download className="w-4 h-4 mr-2" /> 설치하기
        </Button>
      </div>
    );
  }

  if (showIosPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 animate-in slide-in-from-bottom-10">
        <div className="flex items-start justify-between">
          <div className="flex gap-3 items-center">
            <img src="/images/confident.png" alt="App Icon" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
            <div>
              <h4 className="text-sm font-black text-slate-800">홈 화면에 추가하세요</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                하단의 <Share className="inline w-3.5 h-3.5 mx-0.5 text-blue-500" /> 공유 버튼을 누르고<br/>
                <PlusSquare className="inline w-3.5 h-3.5 mx-0.5 text-slate-700" /> <b>홈 화면에 추가</b>를 선택하세요.
              </p>
            </div>
          </div>
          <button onClick={dismissIos} className="p-1 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
