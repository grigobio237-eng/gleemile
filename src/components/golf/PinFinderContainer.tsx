import React, { useState, useMemo } from 'react';
import PinCameraView from './PinCameraView';
import PinHUDDisplay from './PinHUDDisplay';
import PinReticleOverlay from './PinReticleOverlay';
import { useDeviceSensors } from './useDeviceSensors';
import { calculatePinMetrics } from './PinPhysicsEngine';
import { PinResult } from '@/types/pin';
import { X, Search } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function PinFinderContainer({ onClose }: Props) {
  const { data: sensorData, hasPermission, requestPermission } = useDeviceSensors();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenPitch, setFrozenPitch] = useState<number | null>(null);
  
  const [reticleData, setReticleData] = useState({ topY: 0, bottomY: 0, containerHeight: 0 });

  const toggleFreeze = () => {
    if (!isFrozen) {
      setFrozenPitch(sensorData.pitch);
    }
    setIsFrozen(!isFrozen);
  };

  const result: PinResult | null = useMemo(() => {
    if (!hasPermission || reticleData.containerHeight === 0) return null;
    
    // 화면 고정 상태면 고정할 때의 피치 사용, 아니면 실시간 피치
    const activePitch = (isFrozen && frozenPitch !== null) ? frozenPitch : sensorData.pitch;

    return calculatePinMetrics(
      reticleData.topY, 
      reticleData.bottomY, 
      reticleData.containerHeight, 
      activePitch, 
      { pinHeight: 2.1, invertTilt: false }, // 하드코딩
      zoomLevel
    );
  }, [hasPermission, reticleData, sensorData.pitch, isFrozen, frozenPitch, zoomLevel]);

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-white mb-2">센서 권한 필요</h2>
        <p className="text-slate-300 mb-6">스마트 핀 파인더는 카메라와 기기 방향 센서를 사용합니다.</p>
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

  // 조준선(Reticle) 영역 높이 (px)
  const reticleHeight = Math.abs(reticleData.bottomY - reticleData.topY);

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
        <div className="bg-black/40 backdrop-blur-md rounded-full px-4 py-2 text-white border border-white/20 shadow-sm text-sm font-medium flex items-center gap-2">
          <Search className="w-4 h-4" /> 1초 돋보기 조준
        </div>
      </div>

      {/* 돋보기 (Magnifier Zoom Overlay) */}
      {isFrozen && reticleHeight > 0 && (
        <div 
          className="absolute z-[45] pointer-events-none rounded-full border-4 border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.5)] overflow-hidden flex items-center justify-center"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '180px',
            height: '180px',
          }}
        >
          {/* 중앙 가이드라인 (선명하게) */}
          <div className="absolute w-full h-[1px] bg-emerald-400/80" />
          <div className="absolute h-full w-[1px] bg-emerald-400/80" />
          
          <div className="text-[10px] text-emerald-300 font-bold absolute bottom-4 bg-black/60 px-2 py-0.5 rounded">
            정밀 조준 확대
          </div>
        </div>
      )}

      {/* HUD Layer (결과 카드) - z-index 낮춤 */}
      <div className="z-30">
        <PinHUDDisplay result={result} />
      </div>

      {/* Camera Layer */}
      {/* 확대 렌더링 효과를 위해 카메라 뷰 자체를 스케일링 */}
      <div className={`absolute inset-0 transition-transform duration-300 pointer-events-none`} style={{ transform: isFrozen ? `scale(${zoomLevel + 0.5})` : 'scale(1)' }}>
        <PinCameraView isFrozen={isFrozen} onFreezeToggle={() => {}} zoomLevel={1} />
      </div>

      {/* Reticle Overlay Layer (상하단 조준) - HUD보다 높게 배치 */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        <PinReticleOverlay 
          isFrozen={isFrozen} 
          onReticleChange={(topY, bottomY, h) => setReticleData({ topY, bottomY, containerHeight: h })} 
        />
      </div>

      {/* 화면 고정 버튼 (Freeze Toggle) - z-index 최상위 배치 */}
      <div className="absolute bottom-12 inset-x-0 flex justify-center z-[110]">
        <button
          onClick={toggleFreeze}
          className={`px-8 py-4 rounded-full font-bold text-base shadow-2xl backdrop-blur-xl transition-all border-2 ${
            isFrozen 
              ? 'bg-amber-500 text-white border-amber-400' 
              : 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600'
          }`}
        >
          {isFrozen ? '조준 해제 (다시 찍기)' : '조준을 위해 화면 멈춤'}
        </button>
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
