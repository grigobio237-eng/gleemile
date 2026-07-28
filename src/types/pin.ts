export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  altitude: number; // 고도 (m)
}

export interface TargetPin {
  id: string;
  name: string;
  location: GeoCoordinates;
}

export interface PinResult {
  horizontalDistance: number; // 수평거리 (m)
  elevation: number;          // 고저차 (m)
  adjustedDistance: number;   // 보정거리 (m)
  bearing: number;            // 목표물 방위각 (deg)
}
