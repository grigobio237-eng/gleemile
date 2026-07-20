import React, { useState, useEffect, useMemo } from 'react';
import CameraView from './CameraView';
import ARCanvasOverlay from './ARCanvasOverlay';
import HUDDisplay from './HUDDisplay';
import { useDeviceSensors } from './useDeviceSensors';
import { calculatePuttingMetrics } from './PuttingPhysicsEngine';
import { PuttingSettings, PuttingResult } from '@/types/golf';
import { X, Settings2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function PuttingAssistantContainer({ onClose }: Props) {
  const { data: sensorData, hasPermission, requestPermission, resetZero } = useDeviceSensors();
  const [settings, setSettings] = useState<PuttingSettings>({
    userHeight: 1.6,
    greenSpeed: 2.5
  });
  
  const [showSettings, setShowSettings] = useState(false);

  // 센서 데이터 기반 실시간 퍼팅 수치 계산
  const result: PuttingResult | null = useMemo(() => {
    if (!hasPermission) return null;
    return calculatePuttingMetrics(sensorData.pitch, sensorData.roll, settings);
  }, [sensorData, settings, hasPermission]);

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
      <div className="absolute top-0 inset-x-0 z-30 p-4 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
        <button 
          onClick={onClose}
          className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20"
        >
          <X className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Modal (Overlay) */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-40 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 w-64 shadow-2xl">
          <h3 className="text-white font-bold mb-3 text-sm">환경 설정</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/70 block mb-1">눈높이 (m)</label>
              <input 
                type="number" 
                step="0.05"
                value={settings.userHeight}
                onChange={(e) => setSettings(prev => ({ ...prev, userHeight: Number(e.target.value) }))}
                className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-white/70 block mb-1">그린 스피드</label>
              <select 
                value={settings.greenSpeed}
                onChange={(e) => setSettings(prev => ({ ...prev, greenSpeed: Number(e.target.value) }))}
                className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
              >
                <option value={2.0}>느림 (2.0m)</option>
                <option value={2.5}>보통 (2.5m)</option>
                <option value={2.8}>약간 빠름 (2.8m)</option>
                <option value={3.2}>빠름 (3.2m)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Layers */}
      <CameraView />
      <ARCanvasOverlay pitch={sensorData.pitch} roll={sensorData.roll} />
      <HUDDisplay 
        result={result} 
        onResetZero={resetZero}
        pitch={sensorData.pitch}
        roll={sensorData.roll}
      />
    </div>
  );
}
