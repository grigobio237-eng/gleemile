export interface PuttingSettings {
  userHeight: number;       // 눈높이 (m), 기본값 1.6
  greenSpeed: number;       // 그린스피드 (m), 기본값 2.5
}

export interface PuttingResult {
  rawDistance: number;      // 측정 거리 (m)
  elevation: number;        // 고저차 (cm)
  targetDistance: number;   // 최종 쳐야 할 보정 거리 (m)
  aimDirection: 'LEFT' | 'RIGHT' | 'STRAIGHT';
  cupOffset: number;        // 조준할 컵 수 (예: 1.5)
  aimCm: number;            // 센티미터 환산값 (cm)
}
