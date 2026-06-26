/**
 * 회복 태그 → 검색 키워드 매핑
 * Airtable 연동 전 로컬 데이터로 사용
 */

export interface RecoveryTag {
    id: string;
    name: string;
    emoji: string;
    keywords: string[];
    description: string;
}

// 회복 태그 정의
export const RECOVERY_TAGS: Record<string, RecoveryTag> = {
    sleep_lack: {
        id: 'sleep_lack',
        name: '수면부족',
        emoji: '😴',
        keywords: ['숙면베개', '아로마디퓨저', '수면보조', '멜라토닌', '숙면', '수면안대', '백색소음기'],
        description: '수면의 질이 떨어지거나 수면 시간이 부족한 상태'
    },
    chronic_fatigue: {
        id: 'chronic_fatigue',
        name: '만성피로',
        emoji: '😩',
        keywords: ['비타민B', '피로회복', '마사지건', '스트레칭밴드', '에너지부스터', '홍삼', '비타민C'],
        description: '지속적인 피로감이 누적된 상태'
    },
    swelling: {
        id: 'swelling',
        name: '붓기관리',
        emoji: '🤰',
        keywords: ['림프마사지', '압박스타킹', '족욕기', '붓기제거', '레그마사지', '냉찜질팩'],
        description: '림프 순환이 안되거나 부종이 있는 상태'
    },
    mental_care: {
        id: 'mental_care',
        name: '멘탈케어',
        emoji: '🧘',
        keywords: ['명상쿠션', '힐링사운드', '스트레스볼', '아로마캔들', '명상앱', '요가매트'],
        description: '정서적 안정이 필요한 상태'
    },
    stress: {
        id: 'stress',
        name: '스트레스',
        emoji: '😤',
        keywords: ['안마의자', '명상앱', '릴렉싱티', '목욕소금', '안마기', '디퓨저'],
        description: '스트레스가 과도하게 누적된 상태'
    },
    muscle_pain: {
        id: 'muscle_pain',
        name: '근육통',
        emoji: '💪',
        keywords: ['마사지건', '근육이완', '찜질팩', '폼롤러', '스트레칭', '파스'],
        description: '근육이 뭉치거나 통증이 있는 상태'
    },
    eye_fatigue: {
        id: 'eye_fatigue',
        name: '눈피로',
        emoji: '👁️',
        keywords: ['눈마사지기', '눈찜질팩', '블루라이트차단', '루테인', '안구건조', '눈보호대'],
        description: '장시간 화면 노출 등으로 눈이 피로한 상태'
    },
    concentration: {
        id: 'concentration',
        name: '집중력저하',
        emoji: '🎯',
        keywords: ['집중력', '오메가3', '브레인푸드', '백색소음', '포모도로', '오메가369'],
        description: '집중력이 떨어지거나 주의력이 분산되는 상태'
    }
};

// 태그 목록 반환
export function getAllTags(): RecoveryTag[] {
    return Object.values(RECOVERY_TAGS);
}

// 태그 ID로 태그 조회
export function getTagById(tagId: string): RecoveryTag | undefined {
    return RECOVERY_TAGS[tagId];
}

// 태그 이름으로 태그 조회
export function getTagByName(tagName: string): RecoveryTag | undefined {
    return Object.values(RECOVERY_TAGS).find(tag => tag.name === tagName);
}

// 태그에서 검색 키워드 추출
export function getKeywordsFromTags(tagIds: string[]): string[] {
    const keywords: Set<string> = new Set();

    for (const tagId of tagIds) {
        const tag = RECOVERY_TAGS[tagId];
        if (tag) {
            tag.keywords.forEach(keyword => keywords.add(keyword));
        }
    }

    return Array.from(keywords);
}

// 회복 점수에 따른 추천 태그 반환
export function getRecommendedTagsByScore(score: number): string[] {
    if (score >= 70) {
        // 높은 점수: 유지/관리 목적
        return ['concentration', 'mental_care'];
    } else if (score >= 40) {
        // 중간 점수: 회복 필요
        return ['chronic_fatigue', 'stress', 'muscle_pain'];
    } else {
        // 낮은 점수: 긴급 회복 필요
        return ['sleep_lack', 'chronic_fatigue', 'mental_care'];
    }
}

// UI 필터용 태그 목록
export function getFilterTags(): Array<{ id: string; label: string; emoji: string }> {
    return [
        { id: 'sleep_lack', label: '수면부족', emoji: '😴' },
        { id: 'chronic_fatigue', label: '만성피로', emoji: '😩' },
        { id: 'swelling', label: '붓기관리', emoji: '🤰' },
        { id: 'mental_care', label: '멘탈케어', emoji: '🧘' },
        { id: 'stress', label: '스트레스', emoji: '😤' },
        { id: 'muscle_pain', label: '근육통', emoji: '💪' },
        { id: 'eye_fatigue', label: '눈피로', emoji: '👁️' },
        { id: 'concentration', label: '집중력저하', emoji: '🎯' }
    ];
}

export default {
    RECOVERY_TAGS,
    getAllTags,
    getTagById,
    getTagByName,
    getKeywordsFromTags,
    getRecommendedTagsByScore,
    getFilterTags
};
