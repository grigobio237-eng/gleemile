import { PinSettings, PinResult } from '@/types/pin';

/**
 * 깃대의 높이 비율과 카메라의 피치 각도를 기반으로 샷 거리와 고저차를 계산하는 물리 엔진
 */

// 스마트폰 카메라의 보편적인 세로 화각 상수 (FOV-y)
// 기기별로 다를 수 있으나 약 55도 ~ 60도 부근. 라디안으로 변환된 K_fov 값을 상수화
// tan(FOV_Y/2) * 2 방식의 근사치를 사용하거나, 화각에 대한 실험적 상수를 적용.
// 여기서는 일반적인 스마트폰 광각(1x) 세로 화각 기준 상수 (약 0.8) 적용
const K_FOV = 0.8; 

export function calculatePinMetrics(
  topY: number, 
  bottomY: number, 
  containerHeight: number,
  pitchDeg: number,
  settings: PinSettings
): PinResult | null {
  const { pinHeight } = settings;

  // 1. 화면 내 깃대 픽셀 높이 비율 (r)
  const pixelHeight = Math.abs(bottomY - topY);
  if (pixelHeight <= 0 || containerHeight <= 0) return null;

  const r = pixelHeight / containerHeight;

  // 2. 깃대 비례식 기반 직선거리 (D_los)
  // D_los = H_pin / (r * K_fov)
  const straightDistance = pinHeight / (r * K_FOV);

  // 3. 기울기 센서 기반 고저차 (Elevation) 및 수평거리 (D_flat)
  const pitchRad = pitchDeg * (Math.PI / 180);
  
  // 피치 각도에 따른 고저차: D_los * sin(pitch)
  const elevation = straightDistance * Math.sin(pitchRad);
  
  // 수평거리: D_los * cos(pitch)
  const flatDistance = straightDistance * Math.cos(pitchRad);

  // 4. 슬로프 보정 거리 (D_adj)
  // k_club 계수: 오르막 1.0, 내리막 0.8
  const kClub = elevation > 0 ? 1.0 : 0.8;
  const adjustedDistance = flatDistance + (elevation * kClub);

  return {
    straightDistance: Number(straightDistance.toFixed(1)),
    elevation: Number(elevation.toFixed(1)),
    adjustedDistance: Number(adjustedDistance.toFixed(1))
  };
}
