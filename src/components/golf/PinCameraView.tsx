import React, { useRef, useEffect, useState } from 'react';

interface Props {
  isFrozen: boolean;
  onFreezeToggle: () => void;
}

export default function PinCameraView({ isFrozen, onFreezeToggle }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setupCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('카메라 API를 지원하지 않는 브라우저입니다.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('카메라 권한이 없거나 오류가 발생했습니다.');
      }
    }

    setupCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
    };
  }, []);

  // Freeze(캡처) 시 캔버스에 현재 프레임 그리기
  useEffect(() => {
    if (isFrozen && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    }
  }, [isFrozen]);

  return (
    <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden touch-none">
      {error ? (
        <div className="text-white text-sm bg-red-500/20 px-4 py-2 rounded-lg">{error}</div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isFrozen ? 'opacity-0' : 'opacity-100'}`}
          />
          {/* 정지된 화면을 보여줄 캔버스 */}
          <canvas 
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${isFrozen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          />
        </>
      )}
      
      {/* 화면 고정 버튼 (Freeze Toggle) */}
      <div className="absolute bottom-32 inset-x-0 flex justify-center z-40">
        <button
          onClick={onFreezeToggle}
          className={`px-6 py-3 rounded-full font-bold text-sm shadow-xl backdrop-blur-md transition-all border ${
            isFrozen 
              ? 'bg-amber-500 text-white border-amber-400' 
              : 'bg-white/20 text-white border-white/40 hover:bg-white/30'
          }`}
        >
          {isFrozen ? '고정 해제하기 (라이브)' : '조준을 위해 화면 고정하기'}
        </button>
      </div>
    </div>
  );
}
