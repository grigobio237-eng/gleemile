import { useState, useEffect, useCallback } from 'react';

interface SensorData {
  pitch: number;
  roll: number;
}

export function useDeviceSensors() {
  const [data, setData] = useState<SensorData>({ pitch: 0, roll: 0 });
  const [zeroOffset, setZeroOffset] = useState<SensorData>({ pitch: 0, roll: 0 });
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestPermission = useCallback(async () => {
    let granted = false;
    // iOS 13+ 기기 권한 요청
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        granted = permissionState === 'granted';
      } catch (error) {
        console.error(error);
        granted = false;
      }
    } else {
      // non iOS 13+ devices
      granted = true;
    }
    setHasPermission(granted);
  }, []);

  const resetZero = useCallback(() => {
    setZeroOffset(prev => ({
      pitch: 0, 
      roll: data.roll + prev.roll
    }));
  }, [data.roll]);

  // 센서 로직 (EMA 필터 적용)
  useEffect(() => {
    if (hasPermission === null) {
      if (typeof (window as any).DeviceOrientationEvent?.requestPermission !== 'function') {
        setHasPermission(true);
      } else {
        setHasPermission(false);
      }
      return;
    }

    if (!hasPermission) return;

    let prevPitch: number | null = null;
    let prevRoll: number | null = null;
    const alpha = 0.15; // 지수 이동 평균 보정 계수

    const handleOrientation = (event: any) => {
      const rawPitch = event.beta || 0;
      const rawRoll = event.gamma || 0;

      // 지수 이동 평균(EMA) Low-Pass Filter 적용
      const filteredPitch = prevPitch === null ? rawPitch : prevPitch + alpha * (rawPitch - prevPitch);
      const filteredRoll = prevRoll === null ? rawRoll : prevRoll + alpha * (rawRoll - prevRoll);

      prevPitch = filteredPitch;
      prevRoll = filteredRoll;

      setData({
        pitch: filteredPitch,
        roll: filteredRoll - zeroOffset.roll
      });
    };

    if ('ondeviceorientationabsolute' in window) {
      (window as any).addEventListener('deviceorientationabsolute', handleOrientation);
    } else {
      (window as any).addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      if ('ondeviceorientationabsolute' in window) {
        (window as any).removeEventListener('deviceorientationabsolute', handleOrientation);
      } else {
        (window as any).removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, [hasPermission, zeroOffset.roll]);

  return { data, hasPermission, requestPermission, resetZero };
}
