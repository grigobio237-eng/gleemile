export type IPIP60Domain = 'N' | 'E' | 'O' | 'A' | 'C';

export interface IPIP60Question {
    id: number;
    facetCode: string; // N1, E3, etc.
    facetName: string; // 불안, 주장성, etc.
    domain: IPIP60Domain;
    text: string;
    textEn: string;
    isReverse: boolean;
}

export const IPIP60_QUESTIONS: IPIP60Question[] = [
    // --- Neuroticism (신경증) [1-12] ---
    { id: 1, domain: 'N', facetCode: 'N1', facetName: '불안', textEn: 'Worry about things.', text: '나는 평소에 걱정이 많은 편이다.', isReverse: false },
    { id: 2, domain: 'N', facetCode: 'N1', facetName: '불안', textEn: 'Am relaxed most of the time.', text: '나는 대체로 느긋하고 편안한 편이다.', isReverse: true },
    { id: 3, domain: 'N', facetCode: 'N2', facetName: '분노', textEn: 'Get angry easily.', text: '나는 쉽게 화를 내는 편이다.', isReverse: false },
    { id: 4, domain: 'N', facetCode: 'N2', facetName: '분노', textEn: 'Rarely get irritated.', text: '나는 좀처럼 짜증을 내지 않는다.', isReverse: true },
    { id: 5, domain: 'N', facetCode: 'N3', facetName: '우울', textEn: 'Often feel blue.', text: '종종 기분이 우울하거나 처진다.', isReverse: false },
    { id: 6, domain: 'N', facetCode: 'N3', facetName: '우울', textEn: 'Feel comfortable with myself.', text: '나는 내 자신에 대해 편안함과 만족감을 느낀다.', isReverse: true },
    { id: 7, domain: 'N', facetCode: 'N4', facetName: '자의식', textEn: 'Am afraid that I will do the wrong thing.', text: '혹시 실수하지 않을까, 잘못된 행동을 할까 봐 두려워한다.', isReverse: false },
    { id: 8, domain: 'N', facetCode: 'N4', facetName: '자의식', textEn: 'Am not easily embarrassed.', text: '나는 남들 앞에서 쉽게 당황하지 않는다.', isReverse: true },
    { id: 9, domain: 'N', facetCode: 'N5', facetName: '충동성', textEn: 'Often eat too much.', text: '종종 과식하거나 폭식하는 경향이 있다.', isReverse: false },
    { id: 10, domain: 'N', facetCode: 'N5', facetName: '충동성', textEn: 'Am able to control my cravings.', text: '나는 강한 욕구가 생겨도 잘 참을 수 있다.', isReverse: true },
    { id: 11, domain: 'N', facetCode: 'N6', facetName: '취약성', textEn: 'Panic easily.', text: '나는 당황하면 쉽게 패닉 상태에 빠진다.', isReverse: false },
    { id: 12, domain: 'N', facetCode: 'N6', facetName: '취약성', textEn: 'Remain calm under pressure.', text: '압박감이 심한 상황에서도 침착함을 유지한다.', isReverse: true },

    // --- Extraversion (외향성) [13-24] ---
    { id: 13, domain: 'E', facetCode: 'E1', facetName: '친밀감', textEn: 'Make friends easily.', text: '나는 처음 보는 사람과도 금방 친구가 된다.', isReverse: false },
    { id: 14, domain: 'E', facetCode: 'E1', facetName: '친밀감', textEn: 'Keep others at a distance.', text: '나는 사람들과 적당한 거리를 두는 편이다.', isReverse: true },
    { id: 15, domain: 'E', facetCode: 'E2', facetName: '사교성', textEn: 'Love large parties.', text: '나는 많은 사람이 모이는 파티나 시끌벅적한 모임을 좋아한다.', isReverse: false },
    { id: 16, domain: 'E', facetCode: 'E2', facetName: '사교성', textEn: 'Prefer to be alone.', text: '나는 혼자 있는 시간을 더 좋아한다.', isReverse: true },
    { id: 17, domain: 'E', facetCode: 'E3', facetName: '주장성', textEn: 'Take charge.', text: '나는 모임이나 프로젝트를 주도적으로 이끄는 편이다.', isReverse: false },
    { id: 18, domain: 'E', facetCode: 'E3', facetName: '주장성', textEn: 'Wait for others to lead the way.', text: '다른 사람이 나서서 이끌어 주기를 기다리는 편이다.', isReverse: true },
    { id: 19, domain: 'E', facetCode: 'E4', facetName: '활동성', textEn: 'Am always busy.', text: '나는 항상 무언가를 하며 바쁘게 지낸다.', isReverse: false },
    { id: 20, domain: 'E', facetCode: 'E4', facetName: '활동성', textEn: 'Like to take it easy.', text: '나는 여유롭고 느긋하게 지내는 것을 좋아한다.', isReverse: true },
    { id: 21, domain: 'E', facetCode: 'E5', facetName: '흥미추구', textEn: 'Love excitement.', text: '나는 자극적이고 흥미진진한 일을 좋아한다.', isReverse: false },
    { id: 22, domain: 'E', facetCode: 'E5', facetName: '흥미추구', textEn: 'Dislike loud music.', text: '나는 시끄러운 음악이나 소란스러운 환경을 싫어한다.', isReverse: true },
    { id: 23, domain: 'E', facetCode: 'E6', facetName: '명랑함', textEn: 'Radiate joy.', text: '나는 주변 사람들에게 즐거움을 전파한다.', isReverse: false },
    { id: 24, domain: 'E', facetCode: 'E6', facetName: '명랑함', textEn: 'Seldom joke around.', text: '나는 좀처럼 농담을 하거나 장난치지 않는다.', isReverse: true },

    // --- Openness (개방성) [25-36] ---
    { id: 25, domain: 'O', facetCode: 'O1', facetName: '상상력', textEn: 'Have a vivid imagination.', text: '나는 상상력이 매우 풍부하다.', isReverse: false },
    { id: 26, domain: 'O', facetCode: 'O1', facetName: '상상력', textEn: 'Seldom daydream.', text: '나는 공상에 잠기는 일이 거의 없다.', isReverse: true },
    { id: 27, domain: 'O', facetCode: 'O2', facetName: '예술적 관심', textEn: 'See beauty in things that others might not notice.', text: '나는 남들이 무심코 지나치는 것에서 아름다움을 발견하곤 한다.', isReverse: false },
    { id: 28, domain: 'O', facetCode: 'O2', facetName: '예술적 관심', textEn: 'Do not like art.', text: '나는 미술관이나 예술 작품에는 별 관심이 없다.', isReverse: true },
    { id: 29, domain: 'O', facetCode: 'O3', facetName: '감수성', textEn: 'Experience my emotions intensely.', text: '나는 기쁨이나 슬픔 같은 감정을 깊고 강렬하게 느낀다.', isReverse: false },
    { id: 30, domain: 'O', facetCode: 'O3', facetName: '감수성', textEn: 'Seldom get emotional.', text: '나는 좀처럼 감정적이 되지 않는다.', isReverse: true },
    { id: 31, domain: 'O', facetCode: 'O4', facetName: '모험심', textEn: 'Prefer variety to routine.', text: '나는 반복적인 일상보다는 변화와 다양함을 선호한다.', isReverse: false },
    { id: 32, domain: 'O', facetCode: 'O4', facetName: '모험심', textEn: 'Dislike changes.', text: '나는 환경이나 방식이 바뀌는 것을 싫어한다.', isReverse: true },
    { id: 33, domain: 'O', facetCode: 'O5', facetName: '지성', textEn: 'Like to solve complex problems.', text: '나는 복잡한 문제를 깊이 생각해서 해결하는 것을 좋아한다.', isReverse: false },
    { id: 34, domain: 'O', facetCode: 'O5', facetName: '지성', textEn: 'Avoid philosophical discussions.', text: '나는 추상적이거나 철학적인 토론은 피하는 편이다.', isReverse: true },
    { id: 35, domain: 'O', facetCode: 'O6', facetName: '진보성', textEn: 'Tend to vote for liberal political candidates.', text: '나는 사회적으로 진보적인 가치를 지지하는 편이다.', isReverse: false },
    { id: 36, domain: 'O', facetCode: 'O6', facetName: '진보성', textEn: 'Believe in one true religion.', text: '오직 하나의 진정한 종교나 신념만이 옳다고 믿는다.', isReverse: true },

    // --- Agreeableness (우호성) [37-48] ---
    { id: 37, domain: 'A', facetCode: 'A1', facetName: '신뢰', textEn: 'Trust others.', text: '나는 기본적으로 사람들을 믿는 편이다.', isReverse: false },
    { id: 38, domain: 'A', facetCode: 'A1', facetName: '신뢰', textEn: 'Distrust people.', text: '나는 사람들의 의도를 의심하고 경계하는 편이다.', isReverse: true },
    { id: 39, domain: 'A', facetCode: 'A2', facetName: '도덕성', textEn: 'Would never cheat on my taxes.', text: '나는 아무리 사소한 것이라도 규칙을 어기거나 속이지 않는다.', isReverse: false },
    { id: 40, domain: 'A', facetCode: 'A2', facetName: '도덕성', textEn: 'Use flattery to get ahead.', text: '성공을 위해서라면 윗사람에게 아부도 할 수 있다.', isReverse: true },
    { id: 41, domain: 'A', facetCode: 'A3', facetName: '이타성', textEn: 'Love to help others.', text: '나는 남을 돕는 것에서 기쁨을 느낀다.', isReverse: false },
    { id: 42, domain: 'A', facetCode: 'A3', facetName: '이타성', textEn: 'Turn my back on others.', text: '나는 타인의 곤란한 사정에 별로 개입하고 싶지 않다.', isReverse: true },
    { id: 43, domain: 'A', facetCode: 'A4', facetName: '협조성', textEn: 'Dislike direct conflict.', text: '나는 얼굴 붉히는 갈등 상황을 극도로 싫어한다.', isReverse: false },
    { id: 44, domain: 'A', facetCode: 'A4', facetName: '협조성', textEn: 'Love a good fight.', text: '나는 논쟁이나 싸움을 피하지 않고 오히려 즐긴다.', isReverse: true },
    { id: 45, domain: 'A', facetCode: 'A5', facetName: '겸손', textEn: 'Dislike being the center of attention.', text: '나는 사람들로부터 주목받는 것을 부담스러워한다.', isReverse: false },
    { id: 46, domain: 'A', facetCode: 'A5', facetName: '겸손', textEn: 'Think highly of myself.', text: '나는 내가 남들보다 꽤 괜찮은 사람이라고 생각한다.', isReverse: true },
    { id: 47, domain: 'A', facetCode: 'A6', facetName: '공감', textEn: 'Sympathize with the homeless.', text: '나는 어려운 처지에 있는 사람들을 보면 마음이 아프다.', isReverse: false },
    { id: 48, domain: 'A', facetCode: 'A6', facetName: '공감', textEn: 'Feel little concern for others.', text: '나는 타인의 문제에 대해 별로 신경 쓰지 않는다.', isReverse: true },

    // --- Conscientiousness (성실성) [49-60] ---
    { id: 49, domain: 'C', facetCode: 'C1', facetName: '자기도능감', textEn: 'Complete tasks successfully.', text: '나는 맡은 일을 훌륭하게 완수해낼 자신이 있다.', isReverse: false },
    { id: 50, domain: 'C', facetCode: 'C1', facetName: '자기도능감', textEn: 'Misjudge situations.', text: '나는 종종 상황 판단을 잘못하거나 실수를 한다.', isReverse: true },
    { id: 51, domain: 'C', facetCode: 'C2', facetName: '질서정연', textEn: 'Like order.', text: '나는 주변이 항상 정리정돈되어 있어야 마음이 편하다.', isReverse: false },
    { id: 52, domain: 'C', facetCode: 'C2', facetName: '질서정연', textEn: 'Leave my belongings around.', text: '나는 물건을 쓰고 나서 아무 데나 두는 편이다.', isReverse: true },
    { id: 53, domain: 'C', facetCode: 'C3', facetName: '의무감', textEn: 'Keep my promises.', text: '나는 한 번 한 약속은 무슨 일이 있어도 지키려 노력한다.', isReverse: false },
    { id: 54, domain: 'C', facetCode: 'C3', facetName: '의무감', textEn: 'Break my promises.', text: '나는 상황에 따라 약속을 어길 때도 있다.', isReverse: true },
    { id: 55, domain: 'C', facetCode: 'C4', facetName: '성취노력', textEn: 'Work hard.', text: '나는 목표를 달성하기 위해 정말 열심히 일한다.', isReverse: false },
    { id: 56, domain: 'C', facetCode: 'C4', facetName: '성취노력', textEn: 'Do just enough work to get by.', text: '나는 딱 혼나지 않을 만큼만, 필요한 만큼만 일한다.', isReverse: true },
    { id: 57, domain: 'C', facetCode: 'C5', facetName: '자기절제', textEn: 'Get chores done right away.', text: '나는 해야 할 일이 생기면 미루지 않고 즉시 처리한다.', isReverse: false },
    { id: 58, domain: 'C', facetCode: 'C5', facetName: '자기절제', textEn: 'Waste my time.', text: '나는 딴짓을 하느라 시간을 낭비할 때가 많다.', isReverse: true },
    { id: 60, domain: 'C', facetCode: 'C6', facetName: '신중함', textEn: 'Think before I act.', text: '나는 말이나 행동을 하기 전에 결과를 미리 생각한다.', isReverse: false },
    { id: 59, domain: 'C', facetCode: 'C6', facetName: '신중함', textEn: 'Rush into things.', text: '나는 깊게 생각하기보다 일단 저지르고 보는 편이다.', isReverse: true },
];
