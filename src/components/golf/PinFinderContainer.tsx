import React, { useState, useMemo } from 'react';
import PinCameraView from './PinCameraView';
import PinHUDDisplay from './PinHUDDisplay';
import { useLocationAndSensors } from './useLocationAndSensors';
import { calculateGPSMetrics } from './PinPhysicsEngine';
import { TargetPin, PinResult } from '@/types/pin';
import { X, Navigation } from 'lucide-react';

interface Props {
  onClose: () => void;
}

// 테스트용 임시 타겟 (임의의 좌표)
const MOCK_TARGET: TargetPin = {
  id: 'target-1',
  name: '1번 홀 그린 중앙',
  location: {
    latitude: 37.123456, 
    longitude: 127.123456,
    altitude: 50.0 
  }
};

export default function PinFinderContainer({ onClose }: Props) {
  const { sensorData, location, hasPermission, requestPermission } = useLocationAndSensors();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [targetPin] = useState<TargetPin>(MOCK_TARGET);

  const result: PinResult | null = useMemo(() => {
    if (!hasPermission || !location) return null;
    return calculateGPSMetrics(location, targetPin.location);
  }, [hasPermission, location, targetPin]);

  // 방위각 오차 계산 (AR 화살표용)
  const bearingDiff = useMemo(() => {
    if (!result) return 0;
    // 사용자가 바라보는 방향(heading)과 목표물의 방위각(bearing) 차이
    let diff = result.bearing - sensorData.heading;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return diff;
  }, [result, sensorData.heading]);

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-white mb-2">권한 필요</h2>
        <p className="text-slate-300 mb-6">스마트 핀 파인더는 위치 정보(GPS)와 기기 방향 센서를 사용합니다.</p>
        <button 
          onClick={requestPermission}
          className="bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl mb-4"
        >
          권한 허용하기
        </button>
        <button onClick={onClose} className="text-slate-400 font-bold px-6 py-3">
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden touch-none">
      {/* Top Navigation */}
      <div className="absolute top-0 inset-x-0 z-40 p-4 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
        <button 
          onClick={onClose}
          className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="bg-black/40 backdrop-blur-md rounded-full px-4 py-2 text-white border border-white/20 shadow-sm text-sm font-medium">
          목표: {targetPin.name}
        </div>
      </div>

      {/* AR HUD Compass Indicator */}
      {result && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none flex flex-col items-center">
          <div 
            className="w-24 h-24 rounded-full border border-white/30 flex items-center justify-center relative transition-transform duration-300 ease-out"
            style={{ transform: `rotate(${bearingDiff}deg)` }}
          >
            <Navigation className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] -translate-y-5" fill="currentColor" />
          </div>
          {Math.abs(bearingDiff) < 5 ? (
            <div className="text-emerald-400 font-bold mt-3 text-sm drop-shadow-md bg-black/40 px-3 py-1 rounded">정확히 조준됨</div>
          ) : (
            <div className="text-white/70 font-medium mt-3 text-xs drop-shadow-md bg-black/40 px-3 py-1 rounded">
              {bearingDiff > 0 ? `우측으로 ${Math.abs(bearingDiff).toFixed(0)}도` : `좌측으로 ${Math.abs(bearingDiff).toFixed(0)}도`}
            </div>
          )}
        </div>
      )}

      {/* HUD Layer (결과 카드) */}
      <PinHUDDisplay result={result} />

      {/* Camera Layer */}
      <PinCameraView isFrozen={false} onFreezeToggle={() => {}} zoomLevel={zoomLevel} />

      {/* 십자선(Reticle) - GPS 뷰파인더에서는 중앙 크로스헤어만 표시 */}
      <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
        <div className="w-8 h-8 relative">
          <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/50 -translate-x-1/2" />
          <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/50 -translate-y-1/2" />
        </div>
      </div>

      {/* 줌(Zoom) 컨트롤 버튼 */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-[110]">
        {[1, 2, 3].map(level => (
          <button
            key={level}
            onClick={() => setZoomLevel(level)}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg backdrop-blur-md transition-all border ${
              zoomLevel === level 
                ? 'bg-emerald-500 text-white border-emerald-400 scale-110' 
                : 'bg-black/40 text-white/70 border-white/20 hover:bg-black/60'
            }`}
          >
            {level}x
          </button>
        ))}
      </div>
    </div>
  );
}
