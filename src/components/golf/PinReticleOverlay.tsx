import React, { useState, useEffect } from 'react';

interface Props {
  isFrozen: boolean;
  onReticleChange: (topY: number, bottomY: number, containerHeight: number) => void;
}

export default function PinReticleOverlay({ isFrozen, onReticleChange }: Props) {
  const [topY, setTopY] = useState(200);
  const [bottomY, setBottomY] = useState(400);
  const [containerHeight, setContainerHeight] = useState(0);
  const [activeLine, setActiveLine] = useState<'top' | 'bottom' | null>(null);

  useEffect(() => {
    // 초기 렌더링 시 컨테이너 높이 구하고 기본값 세팅
    const h = window.innerHeight;
    setContainerHeight(h);
    setTopY(h * 0.3);
    setBottomY(h * 0.7);
  }, []);

  useEffect(() => {
    if (containerHeight > 0) {
      onReticleChange(topY, bottomY, containerHeight);
    }
  }, [topY, bottomY, containerHeight, onReticleChange]);

  const handleTouchStart = (e: React.TouchEvent, line: 'top' | 'bottom') => {
    if (!isFrozen) return; // Freeze 상태에서만 드래그 가능
    // 터치 시 스크롤 등 방지 (컨테이너에 touch-none 클래스 적용되어 있음)
    setActiveLine(line);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isFrozen || !activeLine) return;
    const y = e.touches[0].clientY;
    
    if (activeLine === 'top') {
      if (y < bottomY - 20) setTopY(y); // 최소 간격 20px
    } else {
      if (y > topY + 20) setBottomY(y);
    }
  };

  const handleTouchEnd = () => {
    setActiveLine(null);
  };

  return (
    <div 
      className="absolute inset-0 z-20 pointer-events-auto touch-none"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 십자선 중앙 (참고용) */}
      <div className="absolute top-1/2 left-1/2 w-4 h-4 border-2 border-white/50 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none" />

      {/* 깃대 상단선 */}
      <div 
        className="absolute w-full h-12 flex items-center justify-center cursor-ns-resize -translate-y-1/2"
        style={{ top: topY }}
        onTouchStart={(e) => handleTouchStart(e, 'top')}
      >
        <div className={`w-3/4 max-w-sm h-0.5 shadow-sm transition-colors ${activeLine === 'top' ? 'bg-amber-400' : 'bg-emerald-400'}`}>
           <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur font-bold">깃대 상단</div>
        </div>
      </div>

      {/* 깃대 하단선 */}
      <div 
        className="absolute w-full h-12 flex items-center justify-center cursor-ns-resize -translate-y-1/2"
        style={{ top: bottomY }}
        onTouchStart={(e) => handleTouchStart(e, 'bottom')}
      >
        <div className={`w-3/4 max-w-sm h-0.5 shadow-sm transition-colors ${activeLine === 'bottom' ? 'bg-amber-400' : 'bg-emerald-400'}`}>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur font-bold">깃대 바닥</div>
        </div>
      </div>

      {/* 세로 연결 가이드선 (투명) */}
      <div 
        className="absolute left-1/2 w-px bg-white/30 pointer-events-none border-l border-dashed border-white/50"
        style={{ top: topY, height: bottomY - topY }}
      />

      {!isFrozen && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/60 text-xs bg-black/40 px-3 py-1.5 rounded-full pointer-events-none font-bold">
          화면을 고정하고 선을 조절하세요
        </div>
      )}
    </div>
  );
}
