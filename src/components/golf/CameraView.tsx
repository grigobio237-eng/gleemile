import React, { useRef, useEffect, useState } from 'react';

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setupCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('카메라 API를 지원하지 않는 브라우저입니다.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // 후면 카메라 우선
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setError('카메라 접근 권한이 없거나 오류가 발생했습니다.');
      }
    }

    setupCamera();

    return () => {
      // 컴포넌트 언마운트 시 스트림 정리
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 bg-black overflow-hidden flex items-center justify-center">
      {error ? (
        <div className="text-white text-center p-4 bg-red-500/20 rounded-xl backdrop-blur-sm">
          <p className="font-bold">{error}</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
