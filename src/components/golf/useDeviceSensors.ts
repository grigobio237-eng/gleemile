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
    // iOS 13+ 기기 권한 요청
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setHasPermission(true);
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error(error);
        setHasPermission(false);
      }
    } else {
      // non iOS 13+ devices
      setHasPermission(true);
    }
  }, []);

  const resetZero = useCallback(() => {
    // 현재 기울기를 영점으로 설정
    setZeroOffset({
      pitch: data.pitch + zeroOffset.pitch,
      roll: data.roll + zeroOffset.roll
    });
  }, [data, zeroOffset]);

  useEffect(() => {
    if (!hasPermission) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      // 기본적으로 event.beta는 앞뒤 기울기(pitch), event.gamma는 좌우 기울기(roll)
      let rawPitch = event.beta || 0;
      let rawRoll = event.gamma || 0;

      // 영점 오프셋을 적용한 값
      setData({
        pitch: rawPitch - zeroOffset.pitch,
        roll: rawRoll - zeroOffset.roll
      });
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [hasPermission, zeroOffset]);

  return { data, hasPermission, requestPermission, resetZero };
}
