import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LayoutTemplate, Shield, Zap, ArrowRight, ActivitySquare, Heart, MessageCircle } from 'lucide-react';
import { signIn } from 'next-auth/react';

export function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 font-sans selection:bg-emerald-200">
      
      {/* Navbar */}
      <nav className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <ActivitySquare className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight">Gleemile</span>
        </div>
        <Button 
          variant="outline"
          onClick={() => signIn()}
          className="rounded-full px-6 py-2 border-slate-200 hover:bg-slate-50 text-sm font-bold text-slate-600"
        >
          로그인
        </Button>
      </nav>

      {/* Hero Section */}
      <main className="w-full max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold mb-8 animate-in slide-in-from-bottom-4 duration-500">
          🎉 프리미엄 스포츠/소통 플랫폼 글리마일
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tight leading-tight mb-6 animate-in slide-in-from-bottom-6 duration-700">
          안전하고 즐거운<br className="md:hidden" /> 우리 팀만의 시너지 라운지
        </h1>
        <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto mb-12 animate-in slide-in-from-bottom-8 duration-700 delay-150">
          파편화된 일정 관리와 소통을 하나로 통합하세요.<br/>
          강력한 프라이버시가 보장되는 환경에서 팀을 안전하게 지휘할 수 있습니다.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in duration-1000 delay-300">
          <Button 
            onClick={() => signIn()}
            className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-base shadow-xl shadow-emerald-500/20 transition-all hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 border-0 flex items-center gap-2"
          >
            무료로 시작하기 <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>

      {/* 3-Step Guide */}
      <section className="w-full max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">1. 프라이빗 라운지 개설</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              클릭 몇 번으로 우리 팀만의 독립된 공간을 생성하세요. 초대 코드로 쉽게 팀원을 모을 수 있습니다.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center mb-6 text-cyan-600">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">2. 0.1초 실시간 동기화</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              강력한 실시간 엔진을 통해 채팅, 공지사항, 투표 등 모든 소통이 기다림 없이 완벽하게 동기화됩니다.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 text-rose-500">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">3. 철통 보안 웰니스 케어</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              민감한 개인 생체/건강 데이터는 완벽히 격리된 스토리지에 보관되어 프라이버시 침해 없이 안전하게 관리됩니다.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="w-full text-center py-12 text-sm font-medium text-slate-400">
        © {new Date().getFullYear()} Gleemile. All rights reserved.
      </footer>
    </div>
  );
}
