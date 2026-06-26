'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, History, Lock, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import Image from 'next/image';

interface MembershipUpsellDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export default function MembershipUpsellDialog({ 
  open, 
  onOpenChange, 
  title, 
  description 
}: MembershipUpsellDialogProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] rounded-[48px] overflow-hidden border-none p-0 bg-transparent shadow-2xl">
        <div className="bg-obsidian p-10 text-center space-y-6 relative overflow-hidden">
          {/* Custom Close Button */}
          <button 
            onClick={() => onOpenChange(false)}
            aria-label="닫기"
            className="absolute top-8 right-8 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors group"
          >
            <X className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
          </button>

          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[80px] rounded-full -mr-24 -mt-24" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full -ml-16 -mb-16" />
          
          <div className="relative z-10 flex flex-col items-center space-y-6">
            <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-xl animate-bounce-slow overflow-hidden">
              <Image src="/apple-touch-icon.png" width={48} height={48} alt="Youniqle" className="rounded-2xl" />
            </div>
            
            <div className="space-y-3">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#D4AF37] text-obsidian text-[10px] font-black uppercase tracking-[0.25em] mb-2 border border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                Data Archive Protocol
              </div>
              <DialogTitle className="text-3xl font-black text-white tracking-tighter leading-tight">
                {title || (
                  <>회복 기록을 자산으로<br /><span className="text-primary font-bold text-glow-cream">보관하고 해석</span>받으세요</>
                )}
              </DialogTitle>
            </div>

            <DialogDescription className="text-white/50 text-sm font-medium leading-relaxed break-keep px-4">
              {description || (
                <>
                  7일간의 리듬은 끝이 아니라 시작입니다.<br />
                  기록이 쌓이면 나를 이해하는 가장 강력한 데이터가 됩니다.<br />
                  gleemile 멤버십은 단순한 혜택이 아닌 데이터 OS 이용권입니다.
                </>
              )}
            </DialogDescription>
          </div>
        </div>

        <div className="bg-white p-10 space-y-8">
          <div className="grid gap-4">
            {[
              { icon: '📦', title: '리듬 보관함', desc: '7일 이상의 모든 기록을 영구 보관합니다.' },
              { icon: '📊', title: '주간 심층 해석', desc: '데이터를 분석해 매주 정체성 리포트를 제공합니다.' },
              { icon: '🛡️', title: '조용한 정리 신청', desc: '비공개로 심화 분석과 선택 기준을 정리해드립니다.' }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-3xl bg-mist/30 border border-line/50 hover:border-primary/30 transition-all group">
                <div className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</div>
                <div>
                  <h4 className="text-sm font-black text-obsidian">{item.title}</h4>
                  <p className="text-[11px] text-slate/60 font-bold leading-tight mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 space-y-4">
            <Button 
              onClick={() => {
                onOpenChange(false);
                router.push('/membership'); 
              }}
              className="w-full h-18 bg-obsidian hover:bg-black text-white rounded-[24px] font-black text-lg flex items-center justify-center gap-2 shadow-2xl shadow-obsidian/20 group transition-all"
            >
              보관함 및 멤버십 시작하기 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="text-[10px] text-slate/30 font-bold text-center">
              * gleemile 멤버십은 시술 할인권이 아닌 데이터 운영체제 이용권입니다.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
