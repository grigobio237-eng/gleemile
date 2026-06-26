import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Award, Zap, Star, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlockProps {
  role: string;
}

export function ConstantFeedbackBlock({ role }: BlockProps) {
  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-sky-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm text-obsidian leading-tight">상시 성장 피드백</p>
            <p className="text-[10px] font-bold text-slate-500">동료에게 인정 뱃지 보내기</p>
          </div>
        </div>
        <Button size="sm" className="bg-sky-500 hover:bg-sky-600 rounded-full text-xs font-bold px-3 h-8">
          뱃지 발송
        </Button>
      </div>
      
      <CardContent className="p-0">
        <div className="h-48 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          
          {/* Feed Item 1 */}
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 shadow-sm border border-orange-200">
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-sm flex-1">
              <p className="font-bold text-obsidian mb-1">
                <span className="text-sky-600">이수민</span>님이 <span className="text-sky-600">김현우</span>님에게 <span className="font-black text-orange-500">⚡ 해결사</span> 뱃지를 보냈습니다!
              </p>
              <p className="text-xs text-slate-600">어제 밤 늦게까지 서버 에러 잡아주셔서 정말 감사합니다 ㅠㅠ 덕분에 배포 무사히 마쳤어요!</p>
              <span className="text-[10px] text-slate-400 mt-2 block">2시간 전</span>
            </div>
          </div>

          {/* Feed Item 2 */}
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 shadow-sm border border-emerald-200">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-sm flex-1">
              <p className="font-bold text-obsidian mb-1">
                <span className="text-sky-600">박준호</span>님이 <span className="text-sky-600">최유리</span>님에게 <span className="font-black text-emerald-500">🛡️ 책임감 끝판왕</span> 뱃지를 보냈습니다!
              </p>
              <p className="text-xs text-slate-600">항상 문서화 꼼꼼히 남겨주시는 것 넘 든든합니다. 최고예요.</p>
              <span className="text-[10px] text-slate-400 mt-2 block">1일 전</span>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
