import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SlidersHorizontal, AlertTriangle, Users } from 'lucide-react';

interface BlockProps {
  role: string;
}

export function PartBalanceSchedulerBlock({ role }: BlockProps) {
  const [votes, setVotes] = useState({
    vocal: true,
    guitar: false,
    bass: true,
    drum: false,
    key: true,
  });

  const isDrumMissing = !votes.drum;

  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-pink-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm text-obsidian leading-tight">파트별 밸런스 스케줄러</p>
            <p className="text-[10px] font-bold text-slate-500">이번주 토요일 합주 참석 투표</p>
          </div>
        </div>
        {isDrumMissing && (
          <div className="flex items-center gap-1 text-red-500 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-[10px] font-bold">위험</span>
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        {isDrumMissing && (
          <div className="bg-red-50 p-2 rounded-xl border border-red-100 mb-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-bold leading-relaxed">
              현재 <span className="text-red-900 font-black">드럼</span> 파트 참석자가 없습니다! 이대로면 합주가 불가능할 수 있습니다.
            </p>
          </div>
        )}

        <div className="grid grid-cols-5 gap-2">
          {Object.entries(votes).map(([part, isAttending]) => (
            <div key={part} className="flex flex-col items-center gap-1">
              <button 
                onClick={() => setVotes(v => ({ ...v, [part]: !v[part as keyof typeof votes] }))}
                className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${
                  isAttending ? 'bg-pink-100 border-2 border-pink-400 shadow-sm' : 'bg-slate-50 border border-slate-200 opacity-50'
                }`}
              >
                <Users className={`w-5 h-5 ${isAttending ? 'text-pink-600' : 'text-slate-400'}`} />
              </button>
              <span className={`text-[10px] font-bold uppercase ${isAttending ? 'text-pink-600' : 'text-slate-400'}`}>
                {part}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
