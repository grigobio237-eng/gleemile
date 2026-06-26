import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlockProps {
  role: string;
}

export function TimerProgressBlock({ role }: BlockProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center relative">
            <Timer className="w-4 h-4 text-white" />
            {isRunning && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white animate-pulse" />}
          </div>
          <div>
            <p className="font-black text-sm text-obsidian leading-tight">타이머 연동 진도 보드</p>
            <p className="text-[10px] font-bold text-slate-500">순공 시간 측정 및 랭킹</p>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        
        {/* Timer UI */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
          <h3 className="text-4xl font-black text-blue-600 font-mono tracking-wider">{formatTime(seconds)}</h3>
          <p className="text-xs text-slate-400 mt-1 font-bold">오늘 나의 순수 집중 시간</p>
          
          <Button 
            onClick={() => setIsRunning(!isRunning)}
            className={`mt-4 w-full h-10 rounded-xl font-bold text-sm gap-2 ${
              isRunning ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isRunning ? (
              <><Square className="w-4 h-4" /> 공부 종료</>
            ) : (
              <><Play className="w-4 h-4" /> 공부 시작</>
            )}
          </Button>
        </div>

        {/* Live Ranking */}
        <div>
          <h4 className="text-xs font-bold text-obsidian mb-2 px-1">🔥 현재 접속 중인 스터디원</h4>
          <div className="flex items-center gap-3">
            {/* Active User */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-green-500 flex items-center justify-center relative">
                <span className="text-sm font-bold text-indigo-700">YH</span>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-white" />
              </div>
              <span className="text-[10px] font-bold text-slate-600">4h 20m</span>
            </div>
            
            {/* Offline User */}
            <div className="flex flex-col items-center gap-1 opacity-50 grayscale">
              <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-transparent flex items-center justify-center">
                <span className="text-sm font-bold text-orange-700">SM</span>
              </div>
              <span className="text-[10px] font-bold text-slate-600">1h 10m</span>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
