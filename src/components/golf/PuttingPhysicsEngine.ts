import { PuttingResult, PuttingSettings } from '@/types/golf';

/**
 * 골프 퍼팅에 필요한 거리, 고저차, 에이밍을 계산하는 물리 엔진
 */

const CUP_DIAMETER_CM = 10.8;

// Pitch와 Roll을 기반으로 퍼팅 보정 값 계산
export function calculatePuttingMetrics(
  pitchDeg: number, 
  rollDeg: number, 
  settings: PuttingSettings
): PuttingResult {
  const { userHeight, greenSpeed } = settings;

  // 1. 거리 (D) 연산
  // 스마트폰을 세워서 들고 있을 때 pitch(beta)는 90도입니다.
  // 땅(홀컵)을 향해 폰을 기울이면 pitch가 90도에서 180도(또는 0도)로 변합니다.
  // 지면을 향한 하향 각도(depression angle) = |pitch - 90|
  const depressionAngleDeg = Math.abs(pitchDeg - 90);
  const depressionAngleRad = depressionAngleDeg * (Math.PI / 180);
  
  // 너무 작거나 큰 각도 예외 처리 (0도면 무한대이므로 최소 1도 보장)
  const safeDepressionRad = Math.max(depressionAngleRad, 0.017); 
  
  // 높이 h에서 하향 각도 theta로 바닥을 볼 때 수평 거리는 d = h / tan(theta)
  const rawDistance = userHeight / Math.tan(safeDepressionRad);

  // 2. 고저차 (E) 연산
  // 이 예제에서는 단순화를 위해 기기가 향하는 방향과 수평 센서(roll/pitch) 조합에서 고저차 추정은 제한적일 수 있으나,
  // 설계서에 따라 고저차 E를 가상의 값 또는 추가 계산을 통해 도출한다고 가정합니다.
  // 여기서는 단순히 기본값 0으로 두고, 외부에서 계산되거나 센서 기믹으로 추정한다고 가정합니다.
  // (실제 기획에서는 고저차 계산에 대한 정확한 수식이 누락되어 있으므로 임시로 0 처리)
  const elevation = 0; // cm 단위
  
  const slopeK = elevation > 0 ? 10 : 8; 
  // 오르막 1cm당 0.1m(10cm), 내리막 1cm당 0.08m(8cm)
  const adjustedDistance = rawDistance + (elevation * slopeK) / 100;

  // 3. 에이밍 컵 수 연산
  const rollRad = rollDeg * (Math.PI / 180);
  // 그린 스피드 상수 f(V_green). 예: 2.5m면 2.5 비율 그대로 사용
  const greenFactor = greenSpeed;
  
  // lateral offset (cm) = D(m) * sin(roll) * f(V) * 100(cm 변환을 위해 계수 조정)
  const lateralOffsetCm = rawDistance * Math.sin(rollRad) * greenFactor * 100;

  // offset > 0 (슬라이스 라이) -> 좌측 조준
  // offset < 0 (훅 라이) -> 우측 조준
  let aimDirection: 'LEFT' | 'RIGHT' | 'STRAIGHT' = 'STRAIGHT';
  if (lateralOffsetCm > 1) {
    aimDirection = 'LEFT'; // 홀컵 좌측을 봐야 함
  } else if (lateralOffsetCm < -1) {
    aimDirection = 'RIGHT'; // 홀컵 우측을 봐야 함
  }

  const absOffsetCm = Math.abs(lateralOffsetCm);
  const targetCups = absOffsetCm / CUP_DIAMETER_CM;

  return {
    rawDistance: Number(rawDistance.toFixed(2)),
    elevation: elevation,
    targetDistance: Number(adjustedDistance.toFixed(2)),
    aimDirection,
    cupOffset: Number(targetCups.toFixed(1)),
    aimCm: Number(absOffsetCm.toFixed(1))
  };
}
