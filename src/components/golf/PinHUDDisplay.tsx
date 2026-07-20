import React from 'react';
import { PinResult } from '@/types/pin';
import { Flag, Mountain } from 'lucide-react';

interface Props {
  result: PinResult | null;
}

export default function PinHUDDisplay({ result }: Props) {
  if (!result) return null;

  const isUphill = result.elevation > 0;
  
  return (
    <div className="absolute top-20 inset-x-4 z-30">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 text-white shadow-2xl">
        <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-sm mb-2">
          <Flag className="w-4 h-4" /> ⛳ 핀 파인더 가이드
        </div>
        
        <div className="text-center py-2">
          <div className="text-5xl font-black tabular-nums tracking-tighter drop-shadow-md flex items-center justify-center gap-1">
            {result.adjustedDistance.toFixed(0)}
            <span className="text-2xl font-bold text-white/70">m</span>
          </div>
          <p className="text-xs text-white/60 font-medium mt-1">(추천 공략 보정 거리)</p>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-sm">
          <div className="flex flex-col items-center">
            <span className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1">직선거리</span>
            <span className="font-medium bg-black/30 px-3 py-1 rounded-lg">{result.straightDistance.toFixed(0)} m</span>
          </div>
          <div className="w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1">고저차</span>
            <span className={`font-medium flex items-center gap-1 px-3 py-1 rounded-lg ${
              isUphill ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
            }`}>
              <Mountain className="w-3 h-3" />
              {isUphill ? '+' : ''}{result.elevation.toFixed(0)} m ({isUphill ? '오르막' : '내리막'})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
