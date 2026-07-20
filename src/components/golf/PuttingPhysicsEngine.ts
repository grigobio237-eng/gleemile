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
  // pitchDeg가 0이면 정면, 음수면 아래를 보는 상태 (폰 화면이 위를 향하도록 눕히면 pitch는 달라질 수 있으나, 일반적으로 후면 카메라로 땅을 볼 때 기준)
  // 스마트폰을 세운 상태(0도)에서 바닥(90도)으로 기울일 때를 기준으로 함
  // 기기마다 방향이 다를 수 있으므로 절대값 혹은 적절한 오프셋 적용 필요. 여기선 간단히 삼각함수로 구현
  const pitchRad = Math.abs(pitchDeg) * (Math.PI / 180);
  
  // H * tan(pitch) -> 공이 있는 곳에서 홀컵까지의 수평 거리
  // 단, 스마트폰을 내리꽂듯이 볼 때 각도가 너무 작으면 무한대가 되므로 최소 각도 제한
  const safePitch = Math.max(pitchRad, 0.01);
  const rawDistance = userHeight * Math.tan(safePitch);

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
