export interface PinSettings {
  pinHeight: number;        // 규격 깃대 높이 (기본값: 2.1m)
  invertTilt?: boolean;     // 센서 기울기 반전 여부
}

export interface PinResult {
  horizontalDistance: number; // 수평거리 (m)
  elevation: number;          // 고저차 (▲/▼ m)
  adjustedDistance: number;   // 추천 보정거리 (m)
}
