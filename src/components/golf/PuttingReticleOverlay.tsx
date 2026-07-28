import React, { useState, useEffect } from 'react';

interface Props {
  isFrozen: boolean;
  onReticleChange: (leftX: number, rightX: number, containerWidth: number) => void;
}

export default function PuttingReticleOverlay({ isFrozen, onReticleChange }: Props) {
  const [leftX, setLeftX] = useState(100);
  const [rightX, setRightX] = useState(300);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeLine, setActiveLine] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    // 초기 렌더링 시 컨테이너 너비 구하고 기본값 세팅
    const w = window.innerWidth;
    setContainerWidth(w);
    // 홀컵 너비를 잡기 위해 화면 중앙 즈음에 기본 배치
    setLeftX(w * 0.35);
    setRightX(w * 0.65);
  }, []);

  useEffect(() => {
    if (containerWidth > 0) {
      onReticleChange(leftX, rightX, containerWidth);
    }
  }, [leftX, rightX, containerWidth, onReticleChange]);

  const handleTouchStart = (e: React.TouchEvent, line: 'left' | 'right') => {
    setActiveLine(line);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!activeLine) return;
    const x = e.touches[0].clientX;
    
    if (activeLine === 'left') {
      if (x < rightX - 20) setLeftX(x); // 최소 간격 20px
    } else {
      if (x > leftX + 20) setRightX(x);
    }
  };

  const handleTouchEnd = () => {
    setActiveLine(null);
  };

  return (
    <div 
      className={`absolute inset-0 z-20 touch-none ${isFrozen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 틸트 가이드선 (고정된 수평선) */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-sky-400/80 -translate-y-1/2 pointer-events-none flex justify-center">
        <div className="absolute -top-6 text-sky-400 text-[10px] bg-black/60 px-2 py-0.5 rounded font-bold">자이로 틸트 가이드 (지면 경사에 평행하게 맞추세요)</div>
      </div>

      {/* 홀컵 좌측선 */}
      <div 
        className={`absolute top-0 bottom-0 w-12 flex items-center justify-center -translate-x-1/2 ${isFrozen ? 'cursor-ew-resize pointer-events-auto' : 'pointer-events-none'}`}
        style={{ left: leftX }}
        onTouchStart={(e) => handleTouchStart(e, 'left')}
      >
        <div className={`h-1/2 max-h-[300px] w-0.5 shadow-sm transition-colors ${activeLine === 'left' ? 'bg-amber-400' : 'bg-emerald-400'}`}>
           <div className="absolute top-1/4 -translate-y-1/2 -left-12 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur font-bold whitespace-nowrap">홀컵 좌측</div>
        </div>
      </div>

      {/* 홀컵 우측선 */}
      <div 
        className={`absolute top-0 bottom-0 w-12 flex items-center justify-center -translate-x-1/2 ${isFrozen ? 'cursor-ew-resize pointer-events-auto' : 'pointer-events-none'}`}
        style={{ left: rightX }}
        onTouchStart={(e) => handleTouchStart(e, 'right')}
      >
        <div className={`h-1/2 max-h-[300px] w-0.5 shadow-sm transition-colors ${activeLine === 'right' ? 'bg-amber-400' : 'bg-emerald-400'}`}>
          <div className="absolute top-1/4 -translate-y-1/2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur font-bold whitespace-nowrap">홀컵 우측</div>
        </div>
      </div>

      {/* 가로 연결 가이드선 (투명 점선) */}
      <div 
        className="absolute top-1/2 h-px bg-white/30 pointer-events-none border-t border-dashed border-white/50 -translate-y-1/2"
        style={{ left: leftX, width: rightX - leftX }}
      />
    </div>
  );
}
