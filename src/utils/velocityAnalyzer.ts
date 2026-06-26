import { Landmark } from './poseAnalyzer';

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

// 이전 프레임의 위치와 시간을 저장하는 클래스
export class VelocityTracker {
  private prevPoint: Point | null = null;

  // 특정 관절의 속도(pixel/sec) 계산
  calculateVelocity(currentPoint: Landmark): number {
    const now = Date.now();
    
    if (!this.prevPoint) {
      this.prevPoint = { x: currentPoint.x, y: currentPoint.y, timestamp: now };
      return 0;
    }

    // 거리 계산 (픽셀 단위)
    const dx = currentPoint.x - this.prevPoint.x;
    const dy = currentPoint.y - this.prevPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 시간 계산 (초 단위)
    const dt = (now - this.prevPoint.timestamp) / 1000;
    
    // 속도 (distance / time)
    const velocity = distance / (dt || 0.001);

    // 상태 업데이트
    this.prevPoint = { x: currentPoint.x, y: currentPoint.y, timestamp: now };
    
    return velocity;
  }
}
