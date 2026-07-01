import React from 'react';

export type SportType = 'soccer' | 'futsal' | 'basketball' | 'volleyball' | 'badminton' | 'tennis' | 'jokgu' | 'baseball' | 'chalkboard';

export const SPORTS: { type: SportType; label: string }[] = [
  { type: 'soccer', label: '축구' },
  { type: 'futsal', label: '풋살' },
  { type: 'basketball', label: '농구' },
  { type: 'volleyball', label: '배구' },
  { type: 'tennis', label: '테니스' },
  { type: 'badminton', label: '배드민턴' },
  { type: 'jokgu', label: '족구' },
  { type: 'baseball', label: '야구' },
  { type: 'chalkboard', label: '빈 칠판' },
];

interface BackgroundProps {
  type: SportType;
  isPortrait?: boolean;
}

export function TacticalBackground({ type, isPortrait }: BackgroundProps) {
  if (type === 'chalkboard') {
    return (
      <div className="absolute inset-0 bg-[#2b3a42]">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')]" />
      </div>
    );
  }

  // 기본적으로 공통된 그린 필드 스타일
  const isGreenField = ['soccer', 'futsal', 'jokgu', 'tennis'].includes(type);
  const isWoodCourt = ['basketball', 'volleyball', 'badminton'].includes(type);

  return (
    <div className={`absolute inset-0 flex items-center justify-center p-4 overflow-hidden
      ${isGreenField ? 'bg-[#2e7d32]' : ''}
      ${isWoodCourt ? 'bg-[#d2a679]' : ''}
    `}>
      {/* 
        세로(Portrait) 모드일 경우: 
        화면은 1600x2400(세로장방형)이지만, 코트는 가로(2400x1600)로 그리고 90도 회전시켜서 딱 맞춥니다.
      */}
      <div 
        className={`relative border-4 border-white/80 box-border flex items-center justify-center transition-transform ${isPortrait ? 'rotate-90' : ''}`}
        style={{
          width: isPortrait ? '140%' : '95%',
          aspectRatio: '3/2'
        }}
      >
        
        {/* 축구 / 풋살 */}
        {(type === 'soccer' || type === 'futsal') && (
          <>
            {/* Center Line */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l-4 border-white/80" />
            {/* Center Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-4 border-white/80" />
            
            {/* Penalty Areas */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[15%] h-[40%] border-4 border-l-0 border-white/80" />
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[15%] h-[40%] border-4 border-r-0 border-white/80" />
            
            {/* Goal Areas */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[6%] h-[20%] border-4 border-l-0 border-white/80" />
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[6%] h-[20%] border-4 border-r-0 border-white/80" />
            
            {/* Goals */}
            <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-2 h-[10%] bg-white/50" />
            <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-2 h-[10%] bg-white/50" />
          </>
        )}

        {/* 농구 */}
        {type === 'basketball' && (
          <>
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l-4 border-white/80" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-4 border-white/80" />
            
            {/* 3-point lines (Simplified arcs) */}
            <div className="absolute top-0 bottom-0 left-0 w-[30%] border-4 border-l-0 border-white/80 rounded-r-full" />
            <div className="absolute top-0 bottom-0 right-0 w-[30%] border-4 border-r-0 border-white/80 rounded-l-full" />
            
            {/* Keys (Paint) */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[15%] h-[40%] bg-blue-600/30 border-4 border-l-0 border-white/80" />
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[15%] h-[40%] bg-blue-600/30 border-4 border-r-0 border-white/80" />
          </>
        )}

        {/* 배구 */}
        {type === 'volleyball' && (
          <>
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l-[6px] border-white" />
            <div className="absolute top-0 bottom-0 left-[33.3%] border-l-4 border-white/60" />
            <div className="absolute top-0 bottom-0 right-[33.3%] border-l-4 border-white/60" />
          </>
        )}

        {/* 족구 */}
        {type === 'jokgu' && (
          <>
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l-[6px] border-white" />
            <div className="absolute top-1/2 left-0 right-0 border-t-2 border-white/30" />
          </>
        )}

        {/* 배드민턴 */}
        {type === 'badminton' && (
          <>
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l-[6px] border-white" />
            {/* Service lines */}
            <div className="absolute top-0 bottom-0 left-[20%] border-l-2 border-white/80" />
            <div className="absolute top-0 bottom-0 right-[20%] border-l-2 border-white/80" />
            
            {/* Doubles sidelines */}
            <div className="absolute top-[10%] bottom-[10%] left-0 right-0 border-y-2 border-white/80" />
            
            {/* Center line */}
            <div className="absolute top-[10%] bottom-[10%] left-[20%] w-[30%] border-b-2 border-white/80 -translate-y-[1px]" />
            <div className="absolute top-[10%] bottom-[10%] right-[20%] w-[30%] border-b-2 border-white/80 -translate-y-[1px]" />
          </>
        )}

        {/* 테니스 */}
        {type === 'tennis' && (
          <div className="absolute inset-0 bg-[#388e3c]">
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l-[6px] border-white" />
            {/* Service boxes */}
            <div className="absolute top-[15%] bottom-[15%] left-[25%] right-[25%] border-4 border-white/80" />
            <div className="absolute top-[15%] bottom-[15%] left-[25%] right-[25%] border-t-0 border-b-0 border-l-0 border-r-0">
               <div className="absolute top-1/2 left-0 right-0 border-t-4 border-white/80 -translate-y-[2px]" />
            </div>
            {/* Doubles sidelines */}
            <div className="absolute top-[15%] bottom-[15%] left-0 right-0 border-y-4 border-white/80" />
          </div>
        )}

        {/* 야구 */}
        {type === 'baseball' && (
          <div className="absolute inset-0 bg-[#2e7d32] overflow-hidden flex items-center justify-center">
            <svg 
              viewBox="0 0 100 100" 
              className={`w-full h-full max-w-full max-h-full ${isPortrait ? '-rotate-90' : ''}`} 
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Infield Dirt (Large circle) */}
              <circle cx="50" cy="60" r="28" fill="#d2a679" />
              
              {/* Infield Grass (Inner Diamond) */}
              <path d="M 50 82 L 72 60 L 50 38 L 28 60 Z" fill="#2e7d32" />
              
              {/* Dirt around bases */}
              <circle cx="50" cy="85" r="5" fill="#d2a679" /> {/* Home */}
              <circle cx="75" cy="60" r="4" fill="#d2a679" /> {/* 1B */}
              <circle cx="50" cy="35" r="4" fill="#d2a679" /> {/* 2B */}
              <circle cx="25" cy="60" r="4" fill="#d2a679" /> {/* 3B */}

              {/* Foul Lines */}
              <path d="M 50 85 L 5 40" stroke="white" strokeWidth="0.5" fill="none" />
              <path d="M 50 85 L 95 40" stroke="white" strokeWidth="0.5" fill="none" />
              
              {/* Outfield Fence */}
              <path d="M 5 40 Q 50 -5 95 40" stroke="white" strokeWidth="0.5" fill="none" strokeDasharray="1,1" />

              {/* Base paths */}
              <path d="M 50 85 L 75 60 L 50 35 L 25 60 Z" stroke="white" strokeWidth="0.5" fill="none" />
              
              {/* Pitcher's Mound */}
              <circle cx="50" cy="60" r="3" fill="#a67c52" />
              <rect x="49" y="59.5" width="2" height="1" fill="white" />
              
              {/* Bases */}
              <polygon points="50,85 51.5,83.5 51.5,82 48.5,82 48.5,83.5" fill="white" />
              <rect x="73.5" y="58.5" width="3" height="3" fill="white" transform="rotate(45 75 60)" />
              <rect x="48.5" y="33.5" width="3" height="3" fill="white" transform="rotate(45 50 35)" />
              <rect x="23.5" y="58.5" width="3" height="3" fill="white" transform="rotate(45 25 60)" />
              
              {/* Batter's boxes */}
              <rect x="46" y="82.5" width="2" height="4" stroke="white" strokeWidth="0.3" fill="none" />
              <rect x="52" y="82.5" width="2" height="4" stroke="white" strokeWidth="0.3" fill="none" />
            </svg>
          </div>
        )}

      </div>
    </div>
  );
}
