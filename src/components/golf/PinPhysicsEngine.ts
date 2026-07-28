import { PinSettings, PinResult } from '@/types/pin';

/**
 * 자세 자유형(Posture-Free) 정밀 측정 엔진
 * 사용자 카메라 보유 높이에 의존하지 않고, 화면 내 깃대 픽셀 비례식으로 수평거리를 산출합니다.
 */
export function calculatePinMetrics(
  topY: number, 
  bottomY: number, 
  containerHeight: number,
  pitchDeg: number,
  settings: PinSettings,
  zoomLevel: number = 1
): PinResult | null {
  const { pinHeight, invertTilt = false } = settings;
  const fovConstant = 0.88; // 렌즈 화각 보정 상수 기본값 하드코딩 (Zero-Setup)

  const pixelHeight = Math.abs(bottomY - topY);
  if (pixelHeight <= 0 || containerHeight <= 0) return null;

  const pixelRatio = pixelHeight / containerHeight;

  // 1. 센서 틸트 각도 보정 (수평 0도 기준, 아래로 숙이면 양수)
  let rawTilt = 90 - pitchDeg;
  if (invertTilt) rawTilt = -rawTilt;
  const tiltRad = (rawTilt * Math.PI) / 180;

  // 2. 픽셀 비율 기반 직선거리 계산 (D_pixel)
  // 자세에 상관없이 오직 화각 대비 픽셀로만 거리를 산출합니다.
  const adjustedRatio = pixelRatio / zoomLevel;
  const horizontalDistance = pinHeight / (adjustedRatio * fovConstant);

  // 3. 지형 고저차(Elevation) 정밀 계산
  // 삼각함수: 고저차 = 수평거리 * tan(조준 각도)
  // 깃대 하단을 조준할 때의 각도를 사용하는 것이 원칙이나, 
  // 화면 고정(Freeze) 시점의 pitchDeg를 기준으로 연산합니다.
  const rawElevation = -(horizontalDistance * Math.tan(tiltRad));
  
  // 소수점 1자리 노이즈 필터링 (0.3m 이내는 평지 0m 처리)
  const elevation = Math.abs(rawElevation) < 0.3 ? 0 : Number(rawElevation.toFixed(1));

  // 4. 슬로프 보정 추천 거리 (오르막 k=1.0, 내리막 k=0.8)
  const slopeFactor = elevation >= 0 ? 1.0 : 0.8;
  const adjustedDistance = Math.round(horizontalDistance + (elevation * slopeFactor));

  return {
    horizontalDistance: Math.round(horizontalDistance),
    elevation,
    adjustedDistance,
  };
}
