import { useState, useEffect, useCallback } from 'react';
import { GeoCoordinates } from '@/types/pin';

interface SensorData {
  pitch: number;
  roll: number;
  heading: number; // 방위각 (0~360)
}

export function useLocationAndSensors() {
  const [sensorData, setSensorData] = useState<SensorData>({ pitch: 0, roll: 0, heading: 0 });
  const [location, setLocation] = useState<GeoCoordinates | null>(null);
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

    if (granted) {
      // GPS 권한 요청 (브라우저에서 팝업)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(() => {}, () => {}, { enableHighAccuracy: true });
      }
    }
  }, []);

  // 센서 로직
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
    let prevHeading: number | null = null;
    const alpha = 0.15; // 필터 보정 계수

    const handleOrientation = (event: any) => {
      const rawPitch = event.beta || 0;
      const rawRoll = event.gamma || 0;
      
      // 나침반 방위각: iOS는 webkitCompassHeading, Android는 absolute alpha
      let rawHeading = event.webkitCompassHeading || event.alpha || 0;
      if (rawHeading < 0) rawHeading += 360;

      // 지수 이동 평균(EMA) Low-Pass Filter 적용
      const filteredPitch = prevPitch === null ? rawPitch : prevPitch + alpha * (rawPitch - prevPitch);
      const filteredRoll = prevRoll === null ? rawRoll : prevRoll + alpha * (rawRoll - prevRoll);

      // 방위각 필터 (360도 경계선 보정)
      let diffHeading = rawHeading - (prevHeading || rawHeading);
      if (diffHeading > 180) diffHeading -= 360;
      if (diffHeading < -180) diffHeading += 360;
      
      let filteredHeading = prevHeading === null ? rawHeading : (prevHeading + alpha * diffHeading);
      if (filteredHeading < 0) filteredHeading += 360;
      if (filteredHeading >= 360) filteredHeading -= 360;

      prevPitch = filteredPitch;
      prevRoll = filteredRoll;
      prevHeading = filteredHeading;

      setSensorData({
        pitch: filteredPitch,
        roll: filteredRoll,
        heading: filteredHeading
      });
    };

    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation);
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      if ('ondeviceorientationabsolute' in window) {
        window.removeEventListener('deviceorientationabsolute', handleOrientation);
      } else {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, [hasPermission]);

  // GPS 로직
  useEffect(() => {
    if (!hasPermission || !navigator.geolocation) return;

    let prevAlt: number | null = null;
    const alphaAlt = 0.15;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const rawAlt = pos.coords.altitude || 0;
        const filteredAlt = prevAlt === null ? rawAlt : prevAlt + alphaAlt * (rawAlt - prevAlt);
        prevAlt = filteredAlt;

        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitude: filteredAlt
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [hasPermission]);

  return { sensorData, location, hasPermission, requestPermission };
}
