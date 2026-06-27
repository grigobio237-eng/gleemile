'use client';

import React from 'react';
import { 
  WellnessBlock, 
  isWellnessCheckBlock, 
  isSleepLogBlock, 
  isRecoveryScoreBlock, 
  isDailyQuestionBlock,
  isRecoveryReportBlock,
  isUserMoodBlock
} from '@/types/wellness';

// 위젯 임포트
import { WellnessCheckWidget } from './widgets/WellnessCheckWidget';
import { SleepLogWidget } from './widgets/SleepLogWidget';
import { RecoveryScoreWidget } from './widgets/RecoveryScoreWidget';
import { DailyQuestionWidget } from './widgets/DailyQuestionWidget';
import { RecoveryReportWidget } from './widgets/RecoveryReportWidget';
import { UserMoodWidget } from './widgets/UserMoodWidget';

interface Props {
  block: WellnessBlock;
}

/**
 * 웰니스 위젯 팩토리 (중앙 라우터)
 * 들어오는 block의 type을 정밀하게 판별(Type Guard)하여 전용 하위 위젯으로 분기 렌더링합니다.
 * 이를 통해 런타임에 잘못된 필드 참조로 인한 에러(White Screen)를 원천 차단합니다.
 */
export function WellnessWidgetFactory({ block }: Props) {
  // 1. 일간 웰니스 점검
  if (isWellnessCheckBlock(block)) {
    return <WellnessCheckWidget block={block} />;
  }
  
  // 2. 수면 로그
  if (isSleepLogBlock(block)) {
    return <SleepLogWidget block={block} />;
  }
  
  // 3. 회복 점수 및 문진
  if (isRecoveryScoreBlock(block)) {
    return <RecoveryScoreWidget block={block} />;
  }
  
  // 4. 설문/진단 제출지
  if (isDailyQuestionBlock(block)) {
    return <DailyQuestionWidget block={block} />;
  }

  // 5. 주간/월간 회복 리포트
  if (isRecoveryReportBlock(block)) {
    return <RecoveryReportWidget block={block} />;
  }

  // 6. 간편 감정 기록
  if (isUserMoodBlock(block)) {
    return <UserMoodWidget block={block} />;
  }

  // 7. 알 수 없는 블록 타입에 대한 Fallback 방어
  return (
    <div className="p-4 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs font-bold">
      지원하지 않는 웰니스 블록 타입입니다: {(block as any).type}
    </div>
  );
}
