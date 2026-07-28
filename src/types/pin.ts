export interface PinSettings {
  pinHeight: number; // 깃대 높이 (m), 기본값 2.13 (표준 7피트)
  userCameraHeight: number; // 사용자 눈높이 (m), 기본값 1.5
  fovConstant?: number; // 카메라 화각 보정 상수 (거리가 길게 나오면 증가, 짧게 나오면 감소)
  invertTilt?: boolean; // 기울기 센서 반전 여부 (오르막/내리막이 반대로 나올 때)
}

export interface PinResult {
  straightDistance: number; // 직선거리 (m)
  horizontalDistance: number; // 수평거리 (m)
  elevation: number;        // 고저차 (m, +오르막 / -내리막)
  adjustedDistance: number; // 최종 공략 보정거리 (m)
}
