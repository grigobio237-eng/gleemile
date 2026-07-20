import React, { useRef, useEffect } from 'react';

interface Props {
  pitch: number;
  roll: number;
}

export default function ARCanvasOverlay({ pitch, roll }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // 캔버스 리사이즈 (디바이스 픽셀 비율 적용)
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }

      const w = canvas.width;
      const h = canvas.height;
      
      ctx.clearRect(0, 0, w, h);

      // 1. 화면 중앙 십자선 (Crosshair)
      const cx = w / 2;
      const cy = h / 2;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // 수평선
      ctx.moveTo(cx - 30, cy);
      ctx.lineTo(cx + 30, cy);
      // 수직선
      ctx.moveTo(cx, cy - 30);
      ctx.lineTo(cx, cy + 30);
      ctx.stroke();

      // 2. 수평 가이드선 (Level Line) - roll 각도에 따라 기울어짐
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((roll * Math.PI) / 180);
      
      // 수평이 맞으면 초록색, 아니면 노란색/빨간색 표시
      const isLevel = Math.abs(roll) < 2;
      ctx.strokeStyle = isLevel ? 'rgba(34, 197, 94, 0.9)' : 'rgba(234, 179, 8, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-100, 0);
      ctx.lineTo(100, 0);
      ctx.stroke();
      
      ctx.restore();

      // 3. 베지에 곡선을 이용한 가상의 AR 궤적 라인 그리기 (Pitch/Roll 시각화)
      // roll 값에 따라 목표 지점이 화면 좌우로 휘어지게 표현
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)'; // emerald-500
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 10]);

      // 시작점 (화면 하단 중앙)
      const startX = w / 2;
      const startY = h;
      
      // 끝점 (화면 중앙 근처, crosshair 보다 약간 아래)
      // roll 값에 비례하여 끝점을 좌우로 이동시킴 (간단한 시각적 효과)
      const endX = cx + roll * 5; 
      const endY = cy + 50;

      // 제어점 (곡선의 휨 정도)
      const cpX = cx + roll * 10;
      const cpY = (startY + endY) / 2;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(cpX, cpY, endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 타겟 홀컵 표시
      ctx.beginPath();
      ctx.arc(endX, endY, 15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [pitch, roll]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10 pointer-events-none w-full h-full"
    />
  );
}
