export interface PinSettings {
  pinHeight: number; // 깃대 높이 (m), 기본값 2.13 (표준 7피트)
}

export interface PinResult {
  straightDistance: number; // 직선거리 (m)
  elevation: number;        // 고저차 (m, +오르막 / -내리막)
  adjustedDistance: number; // 최종 공략 보정거리 (m)
}
