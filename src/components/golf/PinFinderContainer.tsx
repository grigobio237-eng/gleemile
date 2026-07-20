import React, { useState, useEffect, useMemo } from 'react';
import PinCameraView from './PinCameraView';
import PinReticleOverlay from './PinReticleOverlay';
import PinHUDDisplay from './PinHUDDisplay';
import { useDeviceSensors } from './useDeviceSensors';
import { calculatePinMetrics } from './PinPhysicsEngine';
import { PinSettings, PinResult } from '@/types/pin';
import { X, Settings2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function PinFinderContainer({ onClose }: Props) {
  const { data: sensorData, hasPermission, requestPermission } = useDeviceSensors();
  const [isFrozen, setIsFrozen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [settings, setSettings] = useState<PinSettings>({
    pinHeight: 2.13
  });

  const [reticleData, setReticleData] = useState({ topY: 0, bottomY: 0, containerHeight: 0 });

  // 멈춤(Freeze) 상태일 때는 Pitch 각도를 고정시켜서 고저차 연산이 흔들리지 않게 하는 것이 좋습니다.
  // 이 데모에서는 편의상 실시간 Pitch를 사용하거나, Freeze 당시의 Pitch를 저장해둘 수 있습니다.
  const [frozenPitch, setFrozenPitch] = useState<number | null>(null);

  const toggleFreeze = () => {
    if (!isFrozen) {
      setFrozenPitch(sensorData.pitch);
    }
    setIsFrozen(!isFrozen);
  };

  const result: PinResult | null = useMemo(() => {
    if (!hasPermission || reticleData.containerHeight === 0) return null;
    
    // 화면이 고정된 상태라면, 고정할 때의 피치 각도를 사용 (정확한 고저차 측정 위함)
    const activePitch = (isFrozen && frozenPitch !== null) ? frozenPitch : sensorData.pitch;

    return calculatePinMetrics(
      reticleData.topY, 
      reticleData.bottomY, 
      reticleData.containerHeight, 
      activePitch, 
      settings
    );
  }, [hasPermission, reticleData, sensorData.pitch, isFrozen, frozenPitch, settings]);

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-white mb-2">센서 접근 권한 필요</h2>
        <p className="text-slate-300 mb-6">스마트 핀 파인더는 기기의 방향 센서를 사용합니다.</p>
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
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 shadow-sm"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Modal (Overlay) */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-50 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 w-64 shadow-2xl">
          <h3 className="text-white font-bold mb-3 text-sm">깃대 설정</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/70 block mb-1">깃대 높이</label>
              <select 
                value={settings.pinHeight}
                onChange={(e) => setSettings(prev => ({ ...prev, pinHeight: Number(e.target.value) }))}
                className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
              >
                <option value={1.8}>숏핀 (1.8m)</option>
                <option value={2.13}>표준 (2.13m / 7피트)</option>
                <option value={2.4}>롱핀 (2.4m)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* HUD Layer (결과 카드) */}
      <PinHUDDisplay result={result} />

      {/* Camera & Freeze Layer */}
      <PinCameraView isFrozen={isFrozen} onFreezeToggle={toggleFreeze} />

      {/* Reticle Overlay Layer (상하단 조준) */}
      <PinReticleOverlay 
        isFrozen={isFrozen} 
        onReticleChange={(topY, bottomY, h) => setReticleData({ topY, bottomY, containerHeight: h })} 
      />
    </div>
  );
}
