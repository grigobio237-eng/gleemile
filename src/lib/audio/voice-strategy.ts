/**
 * 개인화 오디오 가이드 보이스 매칭 전략
 * 유저의 성별과 리듬체크 결과(Mood)에 따라 최적의 프리미엄 목소리를 배정합니다.
 */

export type VoiceMood = 'CALM' | 'REFRESHING' | 'PROFESSIONAL';
export type UserGender = 'male' | 'female' | 'other';

interface VoiceConfig {
    voiceId: string;
    speakingRate: number;
    pitch: number;
    description: string;
}

const VOICE_STRATEGY: Record<UserGender, Record<VoiceMood, VoiceConfig>> = {
    male: {
        // 남성 유저에게는 여성의 목소리가 더 효과적
        CALM: {
            voiceId: 'ko-KR-Neural2-C',
            speakingRate: 0.85,
            pitch: -1.0,
            description: '차분하고 따뜻한 치유형 여성 음성 (Neural2)'
        },
        REFRESHING: {
            voiceId: 'ko-KR-Neural2-A',
            speakingRate: 1.0,
            pitch: 0.5,
            description: '밝고 생기 있는 에너지형 여성 음성 (Neural2)'
        },
        PROFESSIONAL: {
            voiceId: 'ko-KR-Neural2-B',
            speakingRate: 0.95,
            pitch: 0.0,
            description: '지적이 로 신뢰감 있는 전문가형 여성 음성 (Neural2)'
        }
    },
    female: {
        // 여성 유저에게는 남성의 목소리가 더 효과적
        CALM: {
            voiceId: 'ko-KR-Wavenet-D',
            speakingRate: 0.85,
            pitch: -2.0,
            description: '부드럽고 깊이 있는 치유형 남성 음성 (Wavenet)'
        },
        REFRESHING: {
            voiceId: 'ko-KR-Wavenet-C',
            speakingRate: 1.0,
            pitch: 1.0,
            description: '활기차고 상쾌한 에너지형 남성 음성 (Wavenet)'
        },
        PROFESSIONAL: {
            voiceId: 'ko-KR-Standard-D',
            speakingRate: 0.95,
            pitch: 0.0,
            description: '안정감 있고 명확한 전문가형 남성 음성 (Standard)'
        }
    },
    other: {
        // 성별 미지정 또는 기타의 경우 (기본 여성 보이스)
        CALM: {
            voiceId: 'ko-KR-Neural2-C',
            speakingRate: 0.85,
            pitch: -1.0,
            description: '차분형 기본 음성'
        },
        REFRESHING: {
            voiceId: 'ko-KR-Neural2-A',
            speakingRate: 1.0,
            pitch: 0.5,
            description: '상쾌형 기본 음성'
        },
        PROFESSIONAL: {
            voiceId: 'ko-KR-Neural2-B',
            speakingRate: 0.95,
            pitch: 0.0,
            description: '전문형 기본 음성'
        }
    }
};

/**
 * 성별과 기분에 맞는 보이스 설정을 반환합니다.
 */
export function getVoiceConfig(gender: UserGender = 'other', mood: VoiceMood = 'PROFESSIONAL'): VoiceConfig {
    const genderKey = VOICE_STRATEGY[gender] ? gender : 'other';
    return VOICE_STRATEGY[genderKey][mood];
}

/**
 * 리듬체크 결과 점수를 바탕으로 기분(Mood)을 판별합니다.
 */
export function determineMood(totalScore: number, scores: Record<string, number>): VoiceMood {
    // 1. 신경증(N) 또는 스트레스 관련 점수가 높으면 차분한 목소리 우선
    if (scores.N > 65 || (scores.mental !== undefined && scores.mental < 40)) {
        return 'CALM';
    }

    // 2. 외향성(E)이 너무 낮거나 전체 점수가 낮아 활력이 필요할 때
    if (scores.E < 35 || totalScore < 45) {
        return 'REFRESHING';
    }

    // 3. 기본은 신뢰감 있는 전문적인 목소리
    return 'PROFESSIONAL';
}
