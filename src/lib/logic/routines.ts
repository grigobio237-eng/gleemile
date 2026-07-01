// Removed import from HeroScanner
export interface RoutineAction {
  text: string;
  icon: string;
  category?: string;
}

const ROUTINE_POOL: Record<string, RoutineAction[]> = {
  'ECO-ZENITH': [ // 70-100점 (고점)
    { text: '물 한 컵 마시기', icon: '🥛' },
    { text: '오늘 마감시간 정하기', icon: '⏰' },
    { text: '자기 전 화면 멀리하기', icon: '📱' },
    { text: '심호흡 3분 하기', icon: '🧘' },
    { text: '내일의 첫 행동 기록하기', icon: '📝' },
    { text: '바른 자세 유지 10분', icon: '✨' },
    { text: '창가에서 햇볕 5분 쬐기', icon: '☀️' },
    { text: '오늘의 감사 일기 한 줄', icon: '🙏' },
    { text: '가벼운 전신 스트레칭', icon: '🙆' }
  ],
  'RECOVERY-MID': [ // 40-69점 (중점)
    { text: '책상 한 곳 정리하기', icon: '🧹' },
    { text: '오늘 한 일 체크하기', icon: '✅' },
    { text: '10분 가벼운 산책', icon: '🚶' },
    { text: '비타민/영양제 챙기기', icon: '💊' },
    { text: '주변 소음 차단하고 명상', icon: '🎧' },
    { text: '따뜻한 차 한 잔 마시기', icon: '🍵' },
    { text: '허리 스트레칭 5분', icon: '🤸' },
    { text: '좋아하는 음악 1곡 감상', icon: '🎵' },
    { text: '미지근한 물로 세안하기', icon: '🧼' }
  ],
  'DEEP-SURGE': [ // 0-39점 (저점/집중필요)
    { text: '물 2잔 더 마시기', icon: '💧' },
    { text: '늦은 야식 줄이기', icon: '🚫' },
    { text: '단백질 한 끼 챙기기', icon: '🍗' },
    { text: '30분 일찍 잠자리에 들기', icon: '🛌' },
    { text: '모든 알림 끄고 5분 휴식', icon: '🔇' },
    { text: '눈 마사지 2분 하기', icon: '👀' },
    { text: '카페인 대신 물 섭취', icon: '🥤' },
    { text: '어두운 조명에서 휴식', icon: '🕯️' },
    { text: '발목 돌리기 20회', icon: '🦶' }
  ]
};

/**
 // 점수와 Youniqle 엔진 데이터를 기반으로 최적의 3가지 루틴을 생성합니다.
 */
export function generateDynamicRoutines(
  score: number, 
  analysisData?: any | null
): RoutineAction[] {
  // 1. 점수 기반 레벨 결정
  let level = 'DEEP-SURGE';
  if (score >= 70) level = 'ECO-ZENITH';
  else if (score >= 40) level = 'RECOVERY-MID';

  const pool = [...ROUTINE_POOL[level]];
  const result: RoutineAction[] = [];



  // 3. 나머지 항목은 풀에서 랜덤하게 채우기 (중복 방지)
  // 매일 같은 루틴을 보지 않도록 날짜 기반 시드나 단순 랜덤 사용
  const shuffled = pool.sort(() => 0.5 - Math.random());
  
  for (const action of shuffled) {
    if (result.length >= 3) break;
    // 텍스트가 겹치지 않는 항목만 추가
    if (!result.some(r => r.text === action.text)) {
      result.push(action);
    }
  }

  // 4. 부족한 경우 (극히 드묾) 기본 항목 추가
  while (result.length < 3) {
    result.push({ text: '한 줄 감정 기록하기', icon: '✍️' });
  }

  return result.slice(0, 3);
}

/**
 * 점수에 따른 리듬 유형 명칭 반환 (일관성 유지)
 */
export function getRhythmTypeInfo(score: number) {
  if (score >= 70) {
    return {
      type: '정리 회복형',
      description: '무너진 것이 아니라 정리할 신호가 보이는 흐름입니다.',
      color: 'bg-chapter-accent'
    };
  } else if (score >= 40) {
    return {
      type: '식사 불균형형',
      description: '식사 시간과 영양 밸런스가 컨디션에 영향을 주는 흐름입니다.',
      color: 'bg-status-amber'
    };
  } else {
    return {
      type: '수면 흔들림형',
      description: '피곤함보다 수면 리듬과 회복감이 함께 흔들리는 흐름입니다.',
      color: 'bg-obsidian'
    };
  }
}
