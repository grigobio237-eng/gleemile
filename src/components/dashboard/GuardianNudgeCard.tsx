'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, HeartPulse } from 'lucide-react';

interface GuardianNudgeCardProps {
  playerName: string;
  fatigueLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function GuardianNudgeCard({ playerName, fatigueLevel }: GuardianNudgeCardProps) {
  const getNudgeMessage = () => {
    switch (fatigueLevel) {
      case 'HIGH':
        return `오늘 ${playerName} 팀원/스터디원의 피로도가 평소보다 높게 측정되었습니다. 훈련 후 "오늘 무릎은 괜찮았어?"라고 가볍게 물어봐 주시면 아이에게 큰 힘이 됩니다.`;
      case 'MEDIUM':
        return `${playerName} 팀원/스터디원가 이번 주 무난하게 훈련을 소화하고 있습니다. "오늘 수고했어!"라는 따뜻한 격려 한마디 부탁드립니다.`;
      case 'LOW':
        return `현재 ${playerName} 팀원/스터디원의 회복 상태가 매우 좋습니다. 주말 경기를 대비해 컨디션을 잘 유지할 수 있도록 응원해 주세요!`;
      default:
        return `오늘도 ${playerName} 팀원/스터디원를 응원해 주세요!`;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-pink-50 to-orange-50 border border-pink-100 rounded-[32px] overflow-hidden shadow-lg mt-6">
      <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
          <MessageCircle className="w-8 h-8 text-pink-500" />
        </div>
        <div className="space-y-2 text-center md:text-left flex-1">
          <h3 className="text-sm font-black text-pink-500 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
            <HeartPulse className="w-4 h-4" /> Parent Trust Nudge
          </h3>
          <p className="text-obsidian font-bold leading-relaxed text-sm md:text-base">
            "{getNudgeMessage()}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
