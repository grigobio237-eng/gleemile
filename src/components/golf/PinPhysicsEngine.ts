import { GeoCoordinates, PinResult } from '@/types/pin';

/**
 * GPS 좌표(하버사인 공식) 기반으로 대상까지의 수평 거리, 고저차, 방위각을 계산합니다.
 */
export function calculateGPSMetrics(
  userLoc: GeoCoordinates | null,
  targetLoc: GeoCoordinates | null
): PinResult | null {
  if (!userLoc || !targetLoc) return null;

  const R = 6371e3; // 지구 반경 (미터)
  const lat1 = (userLoc.latitude * Math.PI) / 180;
  const lat2 = (targetLoc.latitude * Math.PI) / 180;
  const deltaLat = ((targetLoc.latitude - userLoc.latitude) * Math.PI) / 180;
  const deltaLon = ((targetLoc.longitude - userLoc.longitude) * Math.PI) / 180;

  // 1. 하버사인 수평거리 계산
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const horizontalDistance = R * c;

  // 2. 방위각 (Bearing) 계산
  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  // 3. 고저차 연산 및 데드존 필터링
  const rawElevation = targetLoc.altitude - userLoc.altitude;
  const elevation = Math.abs(rawElevation) < 0.3 ? 0 : Number(rawElevation.toFixed(1));

  // 4. 슬로프 보정 추천 거리 (오르막 k=1.0, 내리막 k=0.8)
  const slopeFactor = elevation >= 0 ? 1.0 : 0.8;
  const adjustedDistance = Math.round(horizontalDistance + (elevation * slopeFactor));

  return {
    horizontalDistance: Math.round(horizontalDistance),
    elevation,
    adjustedDistance,
    bearing: Math.round(bearing)
  };
}
