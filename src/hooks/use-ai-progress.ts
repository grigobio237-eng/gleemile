import { useState, useEffect, useCallback } from 'react';

/**
 * AI 분석 진행 상황을 시뮬레이션하는 훅입니다.
 * 0%에서 시작하여 타겟(보통 90-95%)까지 부드럽게 증가하다가,
 * 실제 처리가 완료되면 100%로 도달하도록 돕습니다.
 */
export function useAIProgress(active: boolean, initialProgress = 5) {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('초기화 중...');

  const messages = [
    'gleemile 엔진 연결 중...',
    '이미지 특징 데이터 추출 중...',
    'gleemile 회복 패턴 매칭 중...',
    '개인 맞춤형 결과 조합 중...',
    '거의 다 되었습니다...',
    '최적화된 조언 생성 중...'
  ];

  useEffect(() => {
    if (!active) {
      setProgress(0);
      setStatusMessage(messages[0]);
      return;
    }

    setProgress(initialProgress);
    let currentProgress = initialProgress;
    let messageIdx = 0;

    // Use a tighter interval (100ms) for ultra-smooth 60fps movement
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          // Beyond 90%, advance extremely slowly (fine-grained sub-percent movement to avoid freeze feel)
          const next = prev + 0.05;
          return Math.min(99.9, next);
        }

        // 1% ~ 75%: slow and deliberate scanning feel for professional depth and trust
        if (prev < 75) {
          return prev + 0.8;
        }

        // 75% ~ 90%: accelerates gracefully as dynamic insights build up!
        const acceleration = 0.8 + ((prev - 75) / 15) * 1.5; 
        return Math.min(90, prev + acceleration);
      });
    }, 100);

    const messageInterval = setInterval(() => {
      messageIdx = (messageIdx + 1) % messages.length;
      setStatusMessage(messages[messageIdx]);
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [active, initialProgress]);

  const finish = useCallback(() => {
    // When finished, rapidly fill the bar from its current progress to 100% at 60fps for maximum satisfaction
    let increment = 4;
    const finishInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(finishInterval);
          setStatusMessage('완료!');
          return 100;
        }
        return prev + increment;
      });
    }, 16);
  }, []);

  return { progress, statusMessage, finish };
}
