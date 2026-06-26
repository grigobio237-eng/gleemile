export const DAILY_THEMES: Record<number, { theme: string; keywords: string }> = {
    1: { theme: 'Start & Energy', keywords: '주말 후유증, 한 주의 시작, 에너지 레벨, 월요병 극복' }, // 월
    2: { theme: 'Focus & Flow', keywords: '업무 몰입, 집중력, 뇌 피로도, 생산성' }, // 화
    3: { theme: 'Balance & Stress', keywords: '주중 스트레스, 감정 조절, 숨 고르기, 밸런스' }, // 수
    4: { theme: 'Body & Tension', keywords: '축적된 육체 피로, 어깨/목 통증, 자세, 신체 긴장' }, // 목
    5: { theme: 'Review & Relieve', keywords: '한 주 마무리, 긴장 완화, 보상 심리, 수고했음' }, // 금
    6: { theme: 'Deep Rest', keywords: '늦잠, 진정한 휴식, 디지털 디톡스, 재충전' }, // 토
    0: { theme: 'Prepare & Mind', keywords: '내일 준비, 불안 관리, 수면 리듬, 마음가짐' }  // 일
};
