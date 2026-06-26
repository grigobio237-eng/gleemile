import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, BatteryWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlockProps {
  role: string;
}

export function CreativeBurnoutBlock({ role }: BlockProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  
  const emojis = [
    { id: 'good', icon: '🤩', label: '영감 폭발' },
    { id: 'soso', icon: '🙂', label: '무난함' },
    { id: 'tired', icon: '🫠', label: '아이디어 고갈' },
    { id: 'burnout', icon: '💀', label: '완전 번아웃' },
  ];

  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center gap-2 bg-gradient-to-r from-orange-50 to-white">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <Flame className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-black text-sm text-obsidian leading-tight">창작 번아웃 게이지</p>
          <p className="text-[10px] font-bold text-slate-500">오늘 나의 창작 멘탈리티는?</p>
        </div>
      </div>
      <CardContent className="p-4 text-center">
        <div className="flex justify-between gap-2 mb-4">
          {emojis.map(e => (
            <button
              key={e.id}
              onClick={() => setSelectedEmoji(e.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 ${
                selectedEmoji === e.id ? 'bg-orange-100 scale-110 shadow-sm border border-orange-200' : 'hover:bg-slate-50 border border-transparent grayscale opacity-50 hover:grayscale-0 hover:opacity-100'
              }`}
            >
              <span className="text-2xl">{e.icon}</span>
              <span className={`text-[9px] font-bold whitespace-nowrap ${selectedEmoji === e.id ? 'text-orange-700' : 'text-slate-500'}`}>
                {e.label}
              </span>
            </button>
          ))}
        </div>

        {selectedEmoji === 'burnout' && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2 text-left mb-3 animate-in slide-in-from-top-2">
            <BatteryWarning className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700 font-medium">휴식이 필요해 보이네요! 이번 주는 무리하지 말고 레퍼런스 디깅 위주로 템포를 조절해 보세요.</p>
          </div>
        )}

        <Button 
          disabled={!selectedEmoji}
          className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl"
        >
          멘탈리티 기록하기
        </Button>
      </CardContent>
    </Card>
  );
}
