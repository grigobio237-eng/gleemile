'use client';

import React, { useState } from 'react';
import { Target, ChevronRight } from 'lucide-react';
import PuttingAssistantContainer from '@/components/golf/PuttingAssistantContainer';

export default function SmartPuttingAssistantBlock() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl p-5 shadow-lg cursor-pointer transform transition-transform hover:scale-[1.02] active:scale-95 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
        
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <Target className="w-6 h-6 text-emerald-100" />
          </div>
          <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="relative z-10">
          <h3 className="text-xl font-black mb-1">스마트 퍼팅 어시스턴트</h3>
          <p className="text-sm text-emerald-100/90 font-medium leading-relaxed">
            AR 화면으로 홀컵을 비추면<br/>보정 거리와 에이밍을 알려줍니다.
          </p>
        </div>
      </div>

      {isOpen && (
        <PuttingAssistantContainer onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
