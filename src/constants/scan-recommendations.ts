/**
 * Scan Recommendations Data Set
 * Matches scan metrics to specific habits and exercises.
 */

export interface ActionTip {
    title: string;
    description: string;
    habits: string[];
    exercises: {
        title: string;
        visualType: 'IMAGE' | 'WEBTOON';
        link: string;
    }[];
}

export const POSTURE_RECOMMENDATIONS: Record<string, ActionTip> = {
    'TURTLE_NECK_HIGH': {
        title: '거북목 집중 교정 프로토콜',
        description: '현재 목 각도가 정상 범위를 벗어나 있습니다. 경추 정렬을 위한 즉각적인 조치가 필요합니다.',
        habits: [
            '스마트폰 사용 시 눈높이로 들어 올리기',
            '30분마다 벽에 등을 대고 자세 체크하기',
            '모니터 상단을 눈높이에 맞추기'
        ],
        exercises: [
            { title: '치노턱(Chin-tuck) 스트레칭', visualType: 'WEBTOON', link: '/recovery/posture/turtle-neck-1' },
            { title: '벽 어깨 펴기 스트레칭', visualType: 'IMAGE', link: '/recovery/posture/shoulder-wall' }
        ]
    },
    'SHOULDER_IMBALANCE': {
        title: '어깨 대칭 밸런스 프로토콜',
        description: '좌우 어깨 높이 차이가 감지되었습니다. 골반 정렬과 함께 어깨 회전근 관리가 필요합니다.',
        habits: [
            '가방 한쪽으로만 매지 않기',
            '다리 꼬고 앉는 습관 지양하기',
            '전화 통화 시 어깨에 끼우지 않기'
        ],
        exercises: [
            { title: '수건 활용 어깨 회전 운동', visualType: 'WEBTOON', link: '/recovery/posture/shoulder-balance' }
        ]
    },
    'NORMAL': {
        title: '바른 자세 유지 프로토콜',
        description: '아주 훌륭한 자세를 유지하고 계십니다! 현재 컨디션을 유지하기 위한 예방 지침입니다.',
        habits: [
            '매시간 5분간 가벼운 보행',
            '수분 섭취를 통한 근막 탄성 유지'
        ],
        exercises: [
            { title: '전신 이완 스트레칭', visualType: 'IMAGE', link: '/recovery/posture/general-relaxation' }
        ]
    }
};

export const MEAL_INSIGHTS = {
    LOW_PROTEIN: {
        advice: '현재 단백질 섭취량이 목표치보다 낮습니다. 근육 회복과 대사 활성화를 위해 단백질 비중을 높여보세요.',
        suggestion: '기존 식단에 달걀, 닭가슴살 혹은 식물성 단백질(두부)을 한 종류 추가하는 것을 권장합니다.'
    },
    HIGH_CARB: {
        advice: '탄수화물 비중이 상대적으로 높습니다. 혈당 안정화와 지속적인 에너지를 위해 복합 탄수화물로의 전환이 필요합니다.',
        suggestion: '흰 쌀밥 대신 잡곡밥이나 퀴노아를 활용하고, 식이섬유(채소)를 먼저 섭취하는 거꾸로 식사법을 시도해보세요.'
    },
    BALANCED: {
        advice: '아주 균형 잡힌 영양 성분입니다! 오늘의 에너지 레벨을 하루 종일 일정하게 유지할 수 있습니다.',
        suggestion: '식후 가벼운 10분 산책으로 소화 효율을 더욱 높여보세요.'
    }
};
