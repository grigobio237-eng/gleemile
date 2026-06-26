export interface FullDiagnosisQuestion {
    id: number;
    text: string;
    facet: string;
    domain: 'Neuroticism' | 'Extraversion' | 'Openness' | 'Agreeableness' | 'Conscientiousness';
    domainChar: 'N' | 'E' | 'O' | 'A' | 'C';
    facetIndex: number; // 1-6
    key: '+' | '-';
    description?: string;
}

export const FULL_DIAGNOSIS_QUESTIONS: FullDiagnosisQuestion[] = [
    // Neuroticism (N) - 12 Questions
    { id: 1, text: '나는 평소에 걱정이 많은 편이다.', facet: 'N1: 불안', domain: 'Neuroticism', domainChar: 'N', facetIndex: 1, key: '+', description: '일반화된 불안 측정' },
    { id: 2, text: '나는 대체로 느긋하고 편안한 편이다.', facet: 'N1: 불안', domain: 'Neuroticism', domainChar: 'N', facetIndex: 1, key: '-', description: '이완 능력 측정' },
    { id: 3, text: '나는 쉽게 화를 내는 편이다.', facet: 'N2: 분노', domain: 'Neuroticism', domainChar: 'N', facetIndex: 2, key: '+', description: '정서적 반응성 측정' },
    { id: 4, text: '나는 좀처럼 짜증을 내지 않는다.', facet: 'N2: 분노', domain: 'Neuroticism', domainChar: 'N', facetIndex: 2, key: '-', description: '분노 조절 능력 측정' },
    { id: 5, text: '종종 기분이 우울하거나 처진다.', facet: 'N3: 우울', domain: 'Neuroticism', domainChar: 'N', facetIndex: 3, key: '+', description: '기분 저하 빈도 측정' },
    { id: 6, text: '나는 내 자신에 대해 편안함과 만족감을 느낀다.', facet: 'N3: 우울', domain: 'Neuroticism', domainChar: 'N', facetIndex: 3, key: '-', description: '자기 수용 측정' },
    { id: 7, text: '혹시 실수하지 않을까, 잘못된 행동을 할까 봐 두려워한다.', facet: 'N4: 자의식', domain: 'Neuroticism', domainChar: 'N', facetIndex: 4, key: '+', description: '사회적 수행 불안 측정' },
    { id: 8, text: '나는 남들 앞에서 쉽게 당황하지 않는다.', facet: 'N4: 자의식', domain: 'Neuroticism', domainChar: 'N', facetIndex: 4, key: '-', description: '사회적 대담성 측정' },
    { id: 9, text: '종종 과식하거나 폭식하는 경향이 있다.', facet: 'N5: 충동성', domain: 'Neuroticism', domainChar: 'N', facetIndex: 5, key: '+', description: '충동 조절 실패 측정' },
    { id: 10, text: '나는 강한 욕구가 생겨도 잘 참을 수 있다.', facet: 'N5: 충동성', domain: 'Neuroticism', domainChar: 'N', facetIndex: 5, key: '-', description: '지연 만족 능력 측정' },
    { id: 11, text: '나는 당황하면 쉽게 패닉 상태에 빠진다.', facet: 'N6: 취약성', domain: 'Neuroticism', domainChar: 'N', facetIndex: 6, key: '+', description: '스트레스 붕괴점 측정' },
    { id: 12, text: '압박감이 심한 상황에서도 침착함을 유지한다.', facet: 'N6: 취약성', domain: 'Neuroticism', domainChar: 'N', facetIndex: 6, key: '-', description: '회복탄력성 측정' },

    // Extraversion (E) - 12 Questions
    { id: 13, text: '나는 처음 보는 사람과도 금방 친구가 된다.', facet: 'E1: 친밀감', domain: 'Extraversion', domainChar: 'E', facetIndex: 1, key: '+', description: '사회적 접근성 측정' },
    { id: 14, text: '나는 사람들과 적당한 거리를 두는 편이다.', facet: 'E1: 친밀감', domain: 'Extraversion', domainChar: 'E', facetIndex: 1, key: '-', description: '정서적 거리두기 측정' },
    { id: 15, text: '나는 많은 사람이 모이는 파티나 시끌벅적한 모임을 좋아한다.', facet: 'E2: 사교성', domain: 'Extraversion', domainChar: 'E', facetIndex: 2, key: '+', description: '군중 선호도 측정' },
    { id: 16, text: '나는 혼자 있는 시간을 더 좋아한다.', facet: 'E2: 사교성', domain: 'Extraversion', domainChar: 'E', facetIndex: 2, key: '-', description: '고독에 대한 욕구 측정' },
    { id: 17, text: '나는 모임이나 프로젝트를 주도적으로 이끄는 편이다.', facet: 'E3: 주장성', domain: 'Extraversion', domainChar: 'E', facetIndex: 3, key: '+', description: '사회적 지배성 측정' },
    { id: 18, text: '다른 사람이 나서서 이끌어 주기를 기다리는 편이다.', facet: 'E3: 주장성', domain: 'Extraversion', domainChar: 'E', facetIndex: 3, key: '-', description: '수동성 및 추종성 측정' },
    { id: 19, text: '나는 항상 무언가를 하며 바쁘게 지낸다.', facet: 'E4: 활동성', domain: 'Extraversion', domainChar: 'E', facetIndex: 4, key: '+', description: '행동 템포 측정' },
    { id: 20, text: '나는 여유롭고 느긋하게 지내는 것을 좋아한다.', facet: 'E4: 활동성', domain: 'Extraversion', domainChar: 'E', facetIndex: 4, key: '-', description: '여유 추구 측정' },
    { id: 21, text: '나는 자극적이고 흥미진진한 일을 좋아한다.', facet: 'E5: 흥미추구', domain: 'Extraversion', domainChar: 'E', facetIndex: 5, key: '+', description: '감각 추구 성향 측정' },
    { id: 22, text: '나는 시끄러운 음악이나 소란스러운 환경을 싫어한다.', facet: 'E5: 흥미추구', domain: 'Extraversion', domainChar: 'E', facetIndex: 5, key: '-', description: '감각 과부하 회피 측정' },
    { id: 23, text: '나는 주변 사람들에게 즐거움을 전파한다.', facet: 'E6: 명랑함', domain: 'Extraversion', domainChar: 'E', facetIndex: 6, key: '+', description: '긍정 정서 표현 측정' },
    { id: 24, text: '나는 좀처럼 농담을 하거나 장난치지 않는다.', facet: 'E6: 명랑함', domain: 'Extraversion', domainChar: 'E', facetIndex: 6, key: '-', description: '진지함 측정' },

    // Openness (O) - 12 Questions
    { id: 25, text: '나는 상상력이 매우 풍부하다.', facet: 'O1: 상상력', domain: 'Openness', domainChar: 'O', facetIndex: 1, key: '+', description: '판타지 경향성 측정' },
    { id: 26, text: '나는 공상에 잠기는 일이 거의 없다.', facet: 'O1: 상상력', domain: 'Openness', domainChar: 'O', facetIndex: 1, key: '-', description: '현실 지향성 측정' },
    { id: 27, text: '나는 남들이 무심코 지나치는 것에서 아름다움을 발견하곤 한다.', facet: 'O2: 예술', domain: 'Openness', domainChar: 'O', facetIndex: 2, key: '+', description: '미적 몰입 측정' },
    { id: 28, text: '나는 미술관이나 예술 작품에는 별 관심이 없다.', facet: 'O2: 예술', domain: 'Openness', domainChar: 'O', facetIndex: 2, key: '-', description: '예술적 무관심 측정' },
    { id: 29, text: '나는 기쁨이나 슬픔 같은 감정을 깊고 강렬하게 느낀다.', facet: 'O3: 감수성', domain: 'Openness', domainChar: 'O', facetIndex: 3, key: '+', description: '정서적 깊이 측정' },
    { id: 30, text: '나는 좀처럼 감정적이 되지 않는다.', facet: 'O3: 감수성', domain: 'Openness', domainChar: 'O', facetIndex: 3, key: '-', description: '정서적 둔감화 측정' },
    { id: 31, text: '나는 반복적인 일상보다는 변화와 다양함을 선호한다.', facet: 'O4: 모험심', domain: 'Openness', domainChar: 'O', facetIndex: 4, key: '+', description: '새로움 추구 성향 측정' },
    { id: 32, text: '나는 환경이나 방식이 바뀌는 것을 싫어한다.', facet: 'O4: 모험심', domain: 'Openness', domainChar: 'O', facetIndex: 4, key: '-', description: '습관 고수 성향 측정' },
    { id: 33, text: '나는 복잡한 문제를 깊이 생각해서 해결하는 것을 좋아한다.', facet: 'O5: 지성', domain: 'Openness', domainChar: 'O', facetIndex: 5, key: '+', description: '인지적 욕구 측정' },
    { id: 34, text: '나는 추상적이거나 철학적인 토론은 피하는 편이다.', facet: 'O5: 지성', domain: 'Openness', domainChar: 'O', facetIndex: 5, key: '-', description: '반지성적 태도 측정' },
    { id: 35, text: '나는 사회적으로 진보적인 가치를 지지하는 편이다.', facet: 'O6: 진보성', domain: 'Openness', domainChar: 'O', facetIndex: 6, key: '+', description: '권위에 대한 도전 성향 측정' },
    { id: 36, text: '오직 하나의 진정한 종교나 신념만이 옳다고 믿는다.', facet: 'O6: 진보성', domain: 'Openness', domainChar: 'O', facetIndex: 6, key: '-', description: '독단주의 성향 측정' },

    // Agreeableness (A) - 12 Questions
    { id: 37, text: '나는 기본적으로 사람들을 믿는 편이다.', facet: 'A1: 신뢰', domain: 'Agreeableness', domainChar: 'A', facetIndex: 1, key: '+', description: '인간 본성 긍정 측정' },
    { id: 38, text: '나는 사람들의 의도를 의심하고 경계하는 편이다.', facet: 'A1: 신뢰', domain: 'Agreeableness', domainChar: 'A', facetIndex: 1, key: '-', description: '냉소주의 측정' },
    { id: 39, text: '나는 아무리 사소한 것이라도 규칙을 어기거나 속이지 않는다.', facet: 'A2: 도덕성', domain: 'Agreeableness', domainChar: 'A', facetIndex: 2, key: '+', description: '원칙 준수 성향 측정' },
    { id: 40, text: '성공을 위해서라면 윗사람에게 아부도 할 수 있다.', facet: 'A2: 도덕성', domain: 'Agreeableness', domainChar: 'A', facetIndex: 2, key: '-', description: '마키아벨리즘적 성향 측정' },
    { id: 41, text: '나는 남을 돕는 것에서 기쁨을 느낀다.', facet: 'A3: 이타성', domain: 'Agreeableness', domainChar: 'A', facetIndex: 3, key: '+', description: '능동적 자선 성향 측정' },
    { id: 42, text: '나는 타인의 곤란한 사정에 별로 개입하고 싶지 않다.', facet: 'A3: 이타성', domain: 'Agreeableness', domainChar: 'A', facetIndex: 3, key: '-', description: '이기심 측정' },
    { id: 43, text: '나는 얼굴 붉히는 갈등 상황을 극도로 싫어한다.', facet: 'A4: 협조성', domain: 'Agreeableness', domainChar: 'A', facetIndex: 4, key: '+', description: '갈등 회피 성향 측정' },
    { id: 44, text: '나는 논쟁이나 싸움을 피하지 않고 오히려 즐긴다.', facet: 'A4: 협조성', domain: 'Agreeableness', domainChar: 'A', facetIndex: 4, key: '-', description: '공격적 대립 성향 측정' },
    { id: 45, text: '나는 사람들로부터 주목받는 것을 부담스러워한다.', facet: 'A5: 겸손', domain: 'Agreeableness', domainChar: 'A', facetIndex: 5, key: '+', description: '자기 낮춤 태도 측정' },
    { id: 46, text: '나는 내가 남들보다 꽤 괜찮은 사람이라고 생각한다.', facet: 'A5: 겸손', domain: 'Agreeableness', domainChar: 'A', facetIndex: 5, key: '-', description: '나르시시즘적 우월감 측정' },
    { id: 47, text: '나는 어려운 처지에 있는 사람들을 보면 마음이 아프다.', facet: 'A6: 공감', domain: 'Agreeableness', domainChar: 'A', facetIndex: 6, key: '+', description: '정서적 공명 측정' },
    { id: 48, text: '나는 타인의 문제에 대해 별로 신경 쓰지 않는다.', facet: 'A6: 공감', domain: 'Agreeableness', domainChar: 'A', facetIndex: 6, key: '-', description: '무정함 측정' },

    // Conscientiousness (C) - 12 Questions
    { id: 49, text: '나는 맡은 일을 훌륭하게 완수해낼 자신이 있다.', facet: 'C1: 자기도능감', domain: 'Conscientiousness', domainChar: 'C', facetIndex: 1, key: '+', description: '유능감 측정' },
    { id: 50, text: '나는 종종 상황 판단을 잘못하거나 실수를 한다.', facet: 'C1: 자기도능감', domain: 'Conscientiousness', domainChar: 'C', facetIndex: 1, key: '-', description: '무능감 인식 측정' },
    { id: 51, text: '나는 주변이 항상 정리정돈되어 있어야 마음이 편하다.', facet: 'C2: 질서정연', domain: 'Conscientiousness', domainChar: 'C', facetIndex: 2, key: '+', description: '조직화 욕구 측정' },
    { id: 52, text: '나는 물건을 쓰고 나서 아무 데나 두는 편이다.', facet: 'C2: 질서정연', domain: 'Conscientiousness', domainChar: 'C', facetIndex: 2, key: '-', description: '무질서 성향 측정' },
    { id: 53, text: '나는 한 번 한 약속은 무슨 일이 있어도 지키려 노력한다.', facet: 'C3: 의무감', domain: 'Conscientiousness', domainChar: 'C', facetIndex: 3, key: '+', description: '도덕적 책무성 측정' },
    { id: 54, text: '나는 상황에 따라 약속을 어길 때도 있다.', facet: 'C3: 의무감', domain: 'Conscientiousness', domainChar: 'C', facetIndex: 3, key: '-', description: '기회주의적 태도 측정' },
    { id: 55, text: '나는 목표를 달성하기 위해 정말 열심히 일한다.', facet: 'C4: 성취노력', domain: 'Conscientiousness', domainChar: 'C', facetIndex: 4, key: '+', description: '투지 및 야망 측정' },
    { id: 56, text: '나는 딱 혼나지 않을 만큼만, 필요한 만큼만 일한다.', facet: 'C4: 성취노력', domain: 'Conscientiousness', domainChar: 'C', facetIndex: 4, key: '-', description: '최소 노력 성향 측정' },
    { id: 57, text: '나는 해야 할 일이 생기면 미루지 않고 즉시 처리한다.', facet: 'C5: 자기절제', domain: 'Conscientiousness', domainChar: 'C', facetIndex: 5, key: '+', description: '실행력 측정' },
    { id: 58, text: '나는 딴짓을 하느라 시간을 낭비할 때가 많다.', facet: 'C5: 자기절제', domain: 'Conscientiousness', domainChar: 'C', facetIndex: 5, key: '-', description: '지연 행동 측정' },
    { id: 59, text: '나는 말이나 행동을 하기 전에 결과를 미리 생각한다.', facet: 'C6: 신중함', domain: 'Conscientiousness', domainChar: 'C', facetIndex: 6, key: '+', description: '반추적 사고 측정' },
    { id: 60, text: '나는 깊게 생각하기보다 일단 저지르고 보는 편이다.', facet: 'C6: 신중함', domain: 'Conscientiousness', domainChar: 'C', facetIndex: 6, key: '-', description: '충동성 측정' }
];
