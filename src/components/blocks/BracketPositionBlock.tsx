import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Users, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlockProps {
  role: string;
}

export function BracketPositionBlock({ role }: BlockProps) {
  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm text-obsidian leading-tight">대진표/포지션 보드</p>
            <p className="text-[10px] font-bold text-slate-500">기량 기반 자동 스쿼드 배정</p>
          </div>
        </div>
        {(role === 'director' || role === 'head_coach' || role === 'coach') && (
          <Button size="sm" variant="outline" className="h-7 text-xs px-2 rounded-lg border-amber-200 text-amber-700 hover:bg-amber-50 flex gap-1">
            <Shuffle className="w-3.5 h-3.5" /> 자동 조짜기
          </Button>
        )}
      </div>
      <CardContent className="p-3">
        
        {/* Field UI */}
        <div className="relative w-full aspect-[4/3] bg-green-600 rounded-xl overflow-hidden border-4 border-white shadow-inner mb-3">
          {/* Field Lines (Mock for Soccer Field) */}
          <div className="absolute inset-0 flex">
            <div className="w-1/2 border-r-2 border-white/50 h-full relative">
               <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1/4 h-1/2 border-2 border-l-0 border-white/50" />
            </div>
            <div className="w-1/2 h-full relative">
               <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1/4 h-1/2 border-2 border-r-0 border-white/50" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-white/50" />
          </div>

          {/* Draggable Avatars (Mock Positions) */}
          <div className="absolute top-[40%] left-[20%] w-8 h-8 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold shadow-md cursor-pointer hover:scale-110 transition-transform">FW</div>
          <div className="absolute top-[20%] left-[40%] w-8 h-8 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold shadow-md cursor-pointer hover:scale-110 transition-transform">MF</div>
          <div className="absolute top-[70%] left-[30%] w-8 h-8 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold shadow-md cursor-pointer hover:scale-110 transition-transform">DF</div>
          <div className="absolute top-[45%] left-[5%] w-8 h-8 rounded-full border-2 border-white bg-yellow-400 flex items-center justify-center text-[10px] text-obsidian font-bold shadow-md cursor-pointer hover:scale-110 transition-transform">GK</div>
          
          <div className="absolute top-[30%] right-[30%] w-8 h-8 rounded-full border-2 border-white bg-red-500 flex items-center justify-center text-[10px] text-white font-bold shadow-md cursor-pointer hover:scale-110 transition-transform">FW</div>
          <div className="absolute top-[60%] right-[20%] w-8 h-8 rounded-full border-2 border-white bg-red-500 flex items-center justify-center text-[10px] text-white font-bold shadow-md cursor-pointer hover:scale-110 transition-transform">MF</div>
          <div className="absolute top-[45%] right-[5%] w-8 h-8 rounded-full border-2 border-white bg-green-300 flex items-center justify-center text-[10px] text-obsidian font-bold shadow-md cursor-pointer hover:scale-110 transition-transform">GK</div>
        </div>

        <div className="flex justify-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 border border-slate-200" />
            <span className="text-xs font-bold text-slate-600">A팀 (Blue)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-slate-200" />
            <span className="text-xs font-bold text-slate-600">B팀 (Red)</span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
