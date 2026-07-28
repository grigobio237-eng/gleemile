import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PinCameraView from './PinCameraView';
import PuttingReticleOverlay from './PuttingReticleOverlay';
import HUDDisplay from './HUDDisplay';
import { useDeviceSensors } from './useDeviceSensors';
import { calculatePuttingMetrics } from './PuttingPhysicsEngine';
import { PuttingSettings, PuttingResult } from '@/types/golf';
import { X, Settings2, RotateCcw } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function PuttingAssistantContainer({ onClose }: Props) {
  const { data: sensorData, hasPermission, requestPermission, resetZero } = useDeviceSensors();
  const [settings, setSettings] = useState<PuttingSettings>({
    userHeight: 1.6, // 이제 거리 계산에는 쓰이지 않지만 인터페이스 호환을 위해 유지
    greenSpeed: 2.5
  });
  
  const [showSettings, setShowSettings] = useState(false);
  
  // 화면 멈춤 상태 관리
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenPitch, setFrozenPitch] = useState<number | null>(null);
  const [frozenRoll, setFrozenRoll] = useState<number | null>(null);

  // 줌 레벨 상태 관리
  const [zoomLevel, setZoomLevel] = useState(1);

  // 레티클 (조준선) 상태 관리
  const [leftX, setLeftX] = useState(0);
  const [rightX, setRightX] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const toggleFreeze = () => {
    if (!isFrozen) {
      setFrozenPitch(sensorData.pitch);
      setFrozenRoll(sensorData.roll);
    }
    setIsFrozen(!isFrozen);
  };

  const handleReticleChange = useCallback((l: number, r: number, w: number) => {
    setLeftX(l);
    setRightX(r);
    setContainerWidth(w);
  }, []);

  // 센서 데이터 기반 실시간(또는 고정) 퍼팅 수치 계산
  const result: PuttingResult | null = useMemo(() => {
    if (!hasPermission || containerWidth === 0) return null;
    
    const activeRoll = (isFrozen && frozenRoll !== null) ? frozenRoll : sensorData.roll;
    
    return calculatePuttingMetrics(
      leftX, 
      rightX, 
      containerWidth, 
      activeRoll, 
      settings,
      zoomLevel
    );
  }, [hasPermission, containerWidth, isFrozen, frozenRoll, sensorData.roll, leftX, rightX, settings, zoomLevel]);

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-white mb-2">센서 접근 권한 필요</h2>
        <p className="text-slate-300 mb-6">스마트 퍼팅 어시스턴트는 기기의 방향 센서를 사용합니다.</p>
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
          className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 shadow-sm transition-colors hover:bg-black/60"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Modal (Overlay) */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-[120] bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 w-64 shadow-2xl animate-in fade-in duration-200">
          <h3 className="text-white font-bold mb-3 text-sm">환경 설정</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/70 block mb-1">그린 스피드</label>
              <select 
                value={settings.greenSpeed}
                onChange={(e) => setSettings(prev => ({ ...prev, greenSpeed: Number(e.target.value) }))}
                className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
              >
                <option value={2.0} className="text-black">느림 (2.0m)</option>
                <option value={2.5} className="text-black">보통 (2.5m)</option>
                <option value={2.8} className="text-black">약간 빠름 (2.8m)</option>
                <option value={3.2} className="text-black">빠름 (3.2m)</option>
              </select>
            </div>
            
            <div className="pt-2 border-t border-white/10">
              <button 
                onClick={() => {
                  resetZero();
                  setShowSettings(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-2 rounded-lg border border-white/20 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> 자이로 영점 리셋 (평지)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layers */}
      <PinCameraView 
        isFrozen={isFrozen} 
        onFreezeToggle={toggleFreeze} 
        onZoomChange={setZoomLevel}
      />
      <PuttingReticleOverlay 
        isFrozen={isFrozen} 
        onReticleChange={handleReticleChange} 
      />
      
      <div className={`transition-opacity duration-300 ${showSettings ? 'opacity-30' : 'opacity-100'}`}>
        <HUDDisplay result={result} roll={isFrozen && frozenRoll !== null ? frozenRoll : sensorData.roll} />
      </div>

      {/* 화면 고정 버튼 (Freeze Toggle) - 최상단 배치 */}
      <div className="absolute bottom-6 inset-x-0 flex justify-center z-[110]">
        <button
          onClick={toggleFreeze}
          className={`px-8 py-4 rounded-full font-bold text-base shadow-2xl backdrop-blur-xl transition-all border-2 ${
            isFrozen 
              ? 'bg-amber-500 text-white border-amber-400' 
              : 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600'
          }`}
        >
          {isFrozen ? '분석 화면 해제' : '분석을 위해 화면 멈춤'}
        </button>
      </div>
    </div>
  );
}
