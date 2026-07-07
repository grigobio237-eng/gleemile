'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { 
  ArrowRight, KeyRound, Plus, MessageCircle, Heart, Users, Home, Share, Download, Shield, LayoutGrid, ActivitySquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export function MarketingLandingPage() {
  const [installGuideType, setInstallGuideType] = useState<'ios' | 'android' | null>(null);

  useEffect(() => {
    // SSR Safe User Agent Detection
    const ua = (window.navigator?.userAgent || '').toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    // Very simple standalone check
    const m = window.matchMedia ? window.matchMedia('(display-mode: standalone)') : null;
    const isStandalone = (m && m.matches) || (window.navigator as any)?.standalone === true;

    if (!isStandalone) {
      if (isIos) setInstallGuideType('ios');
      else if (isAndroid) setInstallGuideType('android');
    }
  }, []);

  const handleAuthAction = () => {
    signIn();
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 font-sans relative overflow-hidden selection:bg-emerald-200 pb-24">
      
      {/* 1. 7종 마스코트 플로팅 은하수 배경 엔진 */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        {/* 우측 상단 */}
        <div className="absolute top-10 right-[5%] w-32 h-32 opacity-80 animate-float-slow">
          <Image src="/images/happy.webp" alt="happy mascot" fill className="object-contain drop-shadow-xl" />
        </div>
        {/* 좌측 상단 (iOS 호환성을 위해 PNG) */}
        <div className="absolute top-20 left-[5%] w-40 h-40 opacity-70 animate-float-delayed">
          <Image src="/images/confident.png" alt="confident mascot" fill className="object-contain drop-shadow-xl" />
        </div>
        {/* 중상단 */}
        <div className="absolute top-1/3 left-[20%] w-24 h-24 opacity-40 animate-float-fast">
          <Image src="/images/confused.webp" alt="confused mascot" fill className="object-contain drop-shadow-lg" />
        </div>
        {/* 우측 중단 */}
        <div className="absolute top-[40%] right-[15%] w-28 h-28 opacity-30 animate-float-slow" style={{ animationDelay: '1s' }}>
          <Image src="/images/pouting.webp" alt="pouting mascot" fill className="object-contain drop-shadow-lg" />
        </div>
        {/* 좌측 하단 */}
        <div className="absolute bottom-[25%] left-[10%] w-36 h-36 opacity-60 animate-float-fast" style={{ animationDelay: '0.5s' }}>
          <Image src="/images/surprised.webp" alt="surprised mascot" fill className="object-contain drop-shadow-xl" />
        </div>
        {/* 중하단 */}
        <div className="absolute bottom-[15%] right-[25%] w-24 h-24 opacity-35 animate-float-delayed" style={{ animationDelay: '2.5s' }}>
          <Image src="/images/sad.webp" alt="sad mascot" fill className="object-contain drop-shadow-lg" />
        </div>
        {/* 여분의 7번째 은하수 요소 */}
        <div className="absolute top-[15%] right-[30%] w-20 h-20 opacity-20 animate-float-slow" style={{ animationDelay: '3s' }}>
          <Image src="/images/confident.webp" alt="confident mascot webp" fill className="object-contain drop-shadow-sm" />
        </div>
      </div>

      {/* Fixed Navbar with Login Button */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-[#FAF9F6]/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 drop-shadow-sm">
            <Image src="/images/happy.webp" alt="Gleemile Mascot" fill className="object-contain" sizes="32px" />
          </div>
          <span className="font-black text-lg tracking-tight text-slate-800">Gleemile</span>
        </div>
        <Button 
          variant="outline"
          onClick={handleAuthAction}
          className="rounded-full px-6 py-2 border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold text-slate-600 shadow-sm"
        >
          로그인
        </Button>
      </nav>

      {/* Main Content Layer */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 pt-24">
        
        {/* Header Title */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white border border-slate-200 text-emerald-600 text-xs font-bold mb-6 shadow-sm">
            ✨ Welcome to Gleemile
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight mb-4">
            우리 팀의 즐거운 기록이<br /> 시작되는 곳
          </h1>
          <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed max-w-md mx-auto">
            팀원들과의 따뜻한 소통, 그리고 정교한 웰니스 관리를 통해 더 건강하고 결속력 있는 커뮤니티를 지휘해 보세요.
          </p>
        </div>

        {/* 2. 핵심 대시보드 및 하이브리드 탭 실시간 뱃지 융합 (미러링 뷰) */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
          
          {/* 내가 소속된 클럽 (Mock) */}
          <div className="mb-8">
            <h2 className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mb-4 px-2">
              <LayoutGrid className="w-4 h-4" /> 내가 소속된 클럽
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x hide-scrollbar">
              {/* Mock Team 1 */}
              <div onClick={handleAuthAction} className="cursor-pointer flex flex-col items-center gap-2 snap-start flex-shrink-0 group">
                <div className="w-[72px] h-[72px] bg-white rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center justify-center text-3xl transition-transform group-hover:scale-105 relative">
                  🚀
                  {/* 딥 코랄 99+ 뱃지 */}
                  <div className="absolute -top-1.5 -right-1.5 bg-[#E05A47] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-bounce border-2 border-[#FAF9F6]">
                    99+
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-800">우주정복 크루</p>
                  <p className="text-[10px] text-slate-400">관리자</p>
                </div>
              </div>

              {/* Mock Team 2 */}
              <div onClick={handleAuthAction} className="cursor-pointer flex flex-col items-center gap-2 snap-start flex-shrink-0 group">
                <div className="w-[72px] h-[72px] bg-white rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center justify-center text-xl font-black text-slate-300 transition-transform group-hover:scale-105 relative">
                  가
                  <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#FAF9F6]"></div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-800">가족방</p>
                  <p className="text-[10px] text-slate-400">멤버</p>
                </div>
              </div>
            </div>
          </div>

          {/* 하이브리드 탭 목업: 클럽 대화방 */}
          <div onClick={handleAuthAction} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">클럽 대화방 입장</h3>
                <p className="text-[11px] text-slate-500">실시간으로 팀원들과 소통하세요.</p>
              </div>
            </div>
            {/* 우측 딥코랄 뱃지 융합 */}
            <div className="relative z-10 bg-[#E05A47] text-white text-[11px] font-bold px-2 py-1 rounded-full shadow-sm animate-bounce">
              99+
            </div>
            {/* Hover 배경 효과 */}
            <div className="absolute inset-0 bg-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>

          {/* 초대 코드 / 개설 (GuestLounge 구조 계승) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 space-y-2">
            <div onClick={handleAuthAction} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-800">초대 코드가 있나요?</h3>
                <p className="text-xs text-slate-500 mt-0.5">부여받은 코드를 입력하세요.</p>
              </div>
              <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-400">코드 6자리</div>
              <div className="w-8 h-8 rounded-lg bg-slate-400 flex items-center justify-center text-white shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
            
            <div className="h-px bg-slate-100 mx-4"></div>

            <div onClick={handleAuthAction} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-800">새로운 모임 개설</h3>
                <p className="text-xs text-slate-500 mt-0.5">직접 방장이 되어 팀을 지휘하세요.</p>
              </div>
              <Button onClick={(e) => { e.stopPropagation(); handleAuthAction(); }} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-9 px-4 text-xs font-bold shadow-sm">
                팀 개설하기
              </Button>
            </div>
          </div>

        </div>

        {/* 3. '관계 중심' 미러링 쇼케이스 카드 빌드 (엇갈린 에디토리얼 레이아웃) */}
        <div className="mt-20 w-full max-w-6xl px-4 mx-auto text-center relative z-10">
          <div className="mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-[#1E293B] tracking-tight mb-3">
              어떤 관계든, 글리마일
            </h2>
            <p className="text-[#64748B] text-sm sm:text-base font-medium">
              기술은 숨기고, 온전히 사람과 사람 사이의 온기에만 집중하세요.
            </p>
          </div>

          {/* 엇갈린 에디토리얼 레이아웃 및 경계 붕괴 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 pt-10 pb-16">
            
            {/* 🏠 1. Family 카드 (살짝 아래로 툭 떨어지는 안정감) */}
            <div className="relative group bg-white/50 backdrop-blur-md border border-white/80 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.05)] hover:-translate-y-1 md:translate-y-4 text-left">
              {/* ☁️ 캐릭터가 카드 경계선에서 빼꼼 고개를 내미는 효과 + 콘솔 경고 방어(sizes 추가) */}
              <div className="absolute -top-10 -left-6 w-20 h-20 opacity-80 animate-[float-slow_6s_infinite_ease-in-out] pointer-events-none">
                <Image src="/images/happy.webp" alt="Family Cloud" fill sizes="(max-width: 768px) 80px, 120px" className="object-contain" />
              </div>
              
              <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] flex items-center justify-center text-[#F43F5E] mb-6 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              </div>
              <h3 className="text-xl font-bold text-[#1E293B] mb-2">Family</h3>
              <p className="text-[#64748B] text-sm leading-relaxed font-medium">
                바쁜 일상 속에서도 가장 소중한 울타리,<br />가족의 안부와 일상의 온기를 하나로 묶어줍니다.
              </p>
            </div>

            {/* 💜 2. Couple 카드 (중앙에서 위로 세련되게 솟아오르는 하이라이트) */}
            <div className="relative group bg-white/70 backdrop-blur-lg border border-white rounded-3xl p-8 shadow-[0_15px_35px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_25px_50px_rgb(0,0,0,0.08)] hover:-translate-y-5 md:-translate-y-2 text-left z-10">
              {/* ☁️ 카드 우측 상단 경계선에 얹어진 삐진 구름 캐릭터 (위트 포인트) */}
              <div className="absolute -top-8 -right-6 w-20 h-20 opacity-90 animate-[float-delayed_5s_infinite_ease-in-out] pointer-events-none">
                <Image src="/images/pouting.webp" alt="Couple Cloud" fill sizes="(max-width: 768px) 80px, 120px" className="object-contain" />
              </div>

              <div className="w-12 h-12 rounded-2xl bg-[#FDF2F8] flex items-center justify-center text-[#EC4899] mb-6 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-[#1E293B] mb-2">Couple</h3>
              <p className="text-[#64748B] text-sm leading-relaxed font-medium">
                둘만의 데이트 통장, 약속, 은밀한 프라이빗 라운지까지.<br />서로에 대한 애정과 대화만 남겨주는 밀도 높은 공간.
              </p>
            </div>

            {/* 👥 3. Small Crew 카드 (오른쪽으로 흐르며 중간에 정착) */}
            <div className="relative group bg-white/50 backdrop-blur-md border border-white/80 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.05)] hover:-translate-y-1 md:translate-y-2 text-left">
              {/* ☁️ 카드 하단에 은은하게 겹쳐진 놀란 구름 */}
              <div className="absolute -bottom-8 -right-4 w-20 h-20 opacity-60 animate-[float-slow_8s_infinite_ease-in-out] pointer-events-none">
                <Image src="/images/surprised.webp" alt="Crew Cloud" fill sizes="(max-width: 768px) 80px, 120px" className="object-contain" />
              </div>

              <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] flex items-center justify-center text-[#22C55E] mb-6 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-[#1E293B] mb-2">Small Crew</h3>
              <p className="text-[#64748B] text-sm leading-relaxed font-medium">
                동호회, 와인 스터디, 소규모 프로젝트 크루.<br />돈과 정산의 번거로움은 지우고 결속력을 다지는 완벽한 도구.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* 4. 모바일 PWA 하단 설치 가이드라인 결합 */}
      {installGuideType && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom-full duration-500">
          <div className="max-w-md mx-auto bg-slate-800/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-slate-700/50 flex items-center justify-between gap-4">
            {installGuideType === 'ios' ? (
              <>
                <div className="flex-1">
                  <p className="text-xs font-bold">글리마일 앱으로 설치하기</p>
                  <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
                    하단의 <Share className="inline w-3 h-3 mx-0.5" /> <b>공유</b> 버튼을 누르고<br/>
                    <Plus className="inline w-3 h-3 mx-0.5 bg-white text-slate-800 rounded-sm" /> <b>홈 화면에 추가</b>를 선택하세요.
                  </p>
                </div>
                <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
                  <Image src="/images/confident.png" alt="icon" width={24} height={24} className="object-contain" />
                </div>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <p className="text-xs font-bold">1초만에 글리마일 앱 설치</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">바탕화면에서 바로 접속하세요!</p>
                </div>
                <Button className="h-8 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shrink-0">
                  <Download className="w-3 h-3 mr-1" /> 앱 설치
                </Button>
              </>
            )}
            {/* Close button for the banner */}
            <button onClick={() => setInstallGuideType(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-slate-400 rounded-full text-[10px] flex items-center justify-center hover:text-white border border-slate-700 shadow-sm transition-colors">
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
