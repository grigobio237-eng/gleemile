export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

// 두 벡터 사이의 각도를 계산 (atan2 활용)
export const calculateAngle = (
  a: Landmark, // 시작점 (예: 골반)
  b: Landmark, // 중심점 (예: 무릎)
  c: Landmark  // 끝점 (예: 발목)
): number => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
};

// 스쿼트 상태 분석 로직
export const analyzeSquat = (landmarks: Landmark[]) => {
  const hip = landmarks[23];   // 좌측 골반
  const knee = landmarks[25];  // 좌측 무릎
  const ankle = landmarks[27]; // 좌측 발목

  if (!hip || !knee || !ankle) {
    return { state: 'UNKNOWN', angle: 180 };
  }

  const angle = calculateAngle(hip, knee, ankle);

  // 로직: 170도 이상이면 '서 있는 상태', 90도 이하이면 '스쿼트 완료'
  if (angle > 170) return { state: 'UP', angle };
  if (angle < 90) return { state: 'DOWN', angle };
  return { state: 'MOVING', angle };
};
