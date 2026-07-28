import { PinSettings, PinResult } from '@/types/pin';

/**
 * 깃대의 높이 비율과 카메라의 피치 각도를 기반으로 샷 거리와 고저차를 계산하는 물리 엔진
 */

// 스마트폰 카메라의 보편적인 세로 화각 상수 (FOV-y)
// 기기별로 다를 수 있으나 약 55도 ~ 60도 부근. 라디안으로 변환된 K_fov 값을 상수화
// tan(FOV_Y/2) * 2 방식의 근사치를 사용하거나, 화각에 대한 실험적 상수를 적용.
// 기본값 0.88 적용 (settings.fovConstant) 

export function calculatePinMetrics(
  topY: number, 
  bottomY: number, 
  containerHeight: number,
  pitchDeg: number,
  settings: PinSettings,
  zoomLevel: number = 1
): PinResult | null {
  const { pinHeight, userCameraHeight, fovConstant = 0.88, invertTilt = false } = settings;

  const pixelHeight = Math.abs(bottomY - topY);
  if (pixelHeight <= 0 || containerHeight <= 0) return null;

  const pixelRatio = pixelHeight / containerHeight;

  // 1. 센서 틸트 각도 보정 (수평 0도 기준, 아래로 숙이면 양수)
  let rawTilt = 90 - pitchDeg;
  if (invertTilt) rawTilt = -rawTilt;
  const tiltRad = (rawTilt * Math.PI) / 180;

  // 2. 픽셀 비율 기반 직선거리 계산 (D_pixel)
  const adjustedRatio = pixelRatio / zoomLevel;
  const dPixel = pinHeight / (adjustedRatio * fovConstant);

  // 3. 센서 각도 기반 근거리 바닥 거리 계산 (D_ground)
  // 내려다보는 각도가 유효할 때 (0.05rad ≈ 3도 이상 숙였을 때)
  let dGround = dPixel;
  if (tiltRad > 0.05) {
    dGround = userCameraHeight / Math.tan(tiltRad);
  }

  // 4. 거리에 따른 신뢰도 가중치 융합 (30m 기준)
  const weight = Math.max(0, Math.min(1, 1 - dPixel / 30)); 
  const horizontalDistance = weight * dGround + (1 - weight) * (dPixel * Math.cos(tiltRad));

  // 5. 지형 고저차(Elevation) 정밀 계산
  // 카메라 눈높이(userCameraHeight) 효과 제거
  const rawElevation = userCameraHeight - (horizontalDistance * Math.tan(tiltRad));
  // 소수점 1자리 노이즈 필터링 (0.3m 이내는 평지 0m 처리)
  const elevation = Math.abs(rawElevation) < 0.3 ? 0 : Number(rawElevation.toFixed(1));

  // 6. 직선거리 계산
  const straightDistance = Math.sqrt(Math.pow(horizontalDistance, 2) + Math.pow(elevation, 2));

  // 7. 슬로프 보정 추천 거리 (오르막 k=1.0, 내리막 k=0.8)
  const slopeFactor = elevation >= 0 ? 1.0 : 0.8;
  const adjustedDistance = Math.round(horizontalDistance + (elevation * slopeFactor));

  return {
    straightDistance: Math.round(straightDistance),
    horizontalDistance: Math.round(horizontalDistance),
    elevation,
    adjustedDistance,
  };
}
