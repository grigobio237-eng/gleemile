import React from 'react';
import { PuttingResult } from '@/types/golf';
import { Target, ArrowRight, ArrowLeft, ArrowUp } from 'lucide-react';

interface Props {
  result: PuttingResult | null;
  onResetZero: () => void;
  pitch: number;
  roll: number;
}

export default function HUDDisplay({ result, onResetZero, pitch, roll }: Props) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 p-4 pb-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-4">
      
      {/* Sensor Debug & Reset */}
      <div className="flex items-center justify-between">
        <div className="text-white/70 text-xs font-mono bg-black/40 px-2 py-1 rounded backdrop-blur-md">
          P: {pitch.toFixed(1)}° | R: {roll.toFixed(1)}°
        </div>
        <button 
          onClick={onResetZero}
          className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30 transition-colors"
        >
          영점 리셋
        </button>
      </div>

      {/* Main HUD Card */}
      {result ? (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 text-white shadow-2xl">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-sm font-medium text-emerald-300 mb-1 flex items-center gap-1">
                <Target className="w-4 h-4" /> 스마트 퍼팅 캐디
              </h2>
              <div className="text-4xl font-black tabular-nums tracking-tighter">
                {result.targetDistance.toFixed(1)}
                <span className="text-xl font-bold text-white/60 ml-1">m</span>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end">
              <span className="text-xs text-white/50 bg-black/30 px-2 py-1 rounded-lg">
                직선 {result.rawDistance}m
              </span>
              {result.elevation !== 0 && (
                <span className={`text-xs mt-1 px-2 py-1 rounded-lg font-bold ${result.elevation > 0 ? 'text-rose-400 bg-rose-500/20' : 'text-blue-400 bg-blue-500/20'}`}>
                  {result.elevation > 0 ? '오르막' : '내리막'} {result.elevation > 0 ? '+' : ''}{result.elevation}cm
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 bg-black/40 rounded-2xl p-4 flex items-center gap-4 border border-white/10">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              result.aimDirection === 'LEFT' ? 'bg-amber-500/20 text-amber-400' :
              result.aimDirection === 'RIGHT' ? 'bg-sky-500/20 text-sky-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {result.aimDirection === 'LEFT' && <ArrowLeft className="w-6 h-6" />}
              {result.aimDirection === 'RIGHT' && <ArrowRight className="w-6 h-6" />}
              {result.aimDirection === 'STRAIGHT' && <ArrowUp className="w-6 h-6" />}
            </div>
            <div>
              <div className="text-xs text-white/60 mb-0.5 font-medium">추천 에이밍</div>
              <div className="text-lg font-bold leading-tight">
                {result.aimDirection === 'STRAIGHT' ? (
                  <span>홀컵 바로 보기</span>
                ) : (
                  <span>
                    홀컵 {result.aimDirection === 'LEFT' ? '좌측' : '우측'} 
                    <strong className="text-emerald-400 ml-1 mx-1 text-xl">{result.cupOffset}</strong>컵
                  </span>
                )}
              </div>
              {result.aimDirection !== 'STRAIGHT' && (
                <div className="text-xs text-white/40 mt-1">({result.aimCm}cm)</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-white text-center">
          <p className="text-sm font-medium">센서 데이터를 불러오는 중...</p>
        </div>
      )}
    </div>
  );
}
