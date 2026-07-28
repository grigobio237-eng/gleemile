import { PuttingResult, PuttingSettings } from '@/types/golf';

/**
 * 골프 퍼팅에 필요한 거리, 고저차, 에이밍을 계산하는 물리 엔진 v2.0
 */

const CUP_DIAMETER_M = 0.108; // 10.8cm (전 세계 표준 규격)
const FOV_CONSTANT = 0.88; // 스마트폰 카메라 평균 FOV 상수 (수평 화각 기준)

export function calculatePuttingMetrics(
  leftX: number,
  rightX: number,
  containerWidth: number,
  rollDeg: number, 
  settings: PuttingSettings,
  zoomLevel: number = 1
): PuttingResult {
  const { greenSpeed } = settings;

  // 1. 거리 연산 (Posture-Free Hole Cup Triangulation)
  const pixelWidth = Math.abs(rightX - leftX);
  
  let rawDistance = 0;
  if (pixelWidth > 0 && containerWidth > 0) {
    const pixelRatio = pixelWidth / containerWidth;
    const adjustedRatio = pixelRatio / zoomLevel;
    // 거리가 무한대가 되는 것을 방지
    const safeRatio = Math.max(adjustedRatio, 0.001);
    rawDistance = CUP_DIAMETER_M / (safeRatio * FOV_CONSTANT);
  }

  // 2. 에이밍 컵 수 연산 (Gyro Tilt Guide)
  // 대표님 공식: tan(자이로 Roll 각도) × 홀컵 거리 = 꺾이는 오프셋
  const rollRad = rollDeg * (Math.PI / 180);
  
  // 기하학적 계산에 그린 스피드 상수(보통 2.5)를 곱해 현실적인 휨 정도 보정
  const greenFactor = greenSpeed;
  
  // lateral offset (cm) = D(m) * tan(roll) * f(V) * 100
  const lateralOffsetCm = rawDistance * Math.tan(rollRad) * greenFactor * 100;

  // offset > 0 (슬라이스 라이) -> 좌측 조준
  // offset < 0 (훅 라이) -> 우측 조준
  let aimDirection: 'LEFT' | 'RIGHT' | 'STRAIGHT' = 'STRAIGHT';
  if (lateralOffsetCm > 1.5) {
    aimDirection = 'LEFT';
  } else if (lateralOffsetCm < -1.5) {
    aimDirection = 'RIGHT';
  }

  const absOffsetCm = Math.abs(lateralOffsetCm);
  // 홀컵 지름(10.8cm)으로 나누어 '컵' 단위로 변환
  const targetCups = absOffsetCm / 10.8;

  return {
    rawDistance: Number(rawDistance.toFixed(2)),
    elevation: 0, // UI 간소화를 위해 고저차 미사용
    targetDistance: Number(rawDistance.toFixed(2)),
    aimDirection,
    cupOffset: Number(targetCups.toFixed(1)),
    aimCm: Number(absOffsetCm.toFixed(1))
  };
}
