import { getKSTDate } from './date';

// Streak and Checklist Management
export interface DailyChecklist {
    diagnosis: boolean;      // 리듬체크 완료
    aiAdvice: boolean;       // Youniqle 조언 확인
    routine: boolean;        // 오늘의 루틴 완수
    content: boolean;        // 회복 콘텐츠 읽기
    utility: boolean;        // 유틸리티 사용
    mealScan: boolean;       // 식단 스캔
    soundTherapy: boolean;   // 사운드 테라피
    postureScan: boolean;    // 자세 스캔
    meditation: boolean;     // 명상
}

export interface UserProgress {
    lastCheckDate: string;
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
    todayChecklist: DailyChecklist;
}

const STORAGE_KEY = 'youniqle_user_progress';

export function getUserProgress(): UserProgress {
    if (typeof window === 'undefined') {
        return getDefaultProgress();
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        return getDefaultProgress();
    }

    try {
        const progress: UserProgress = JSON.parse(stored);

        // Check if it's a new day (KST-aware)
        const today = getKSTDate();
        if (progress.lastCheckDate !== today) {
            // New day - check streak
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = getKSTDate(yesterday);

            if (progress.lastCheckDate === yesterdayStr) {
                // Consecutive day - increment streak
                progress.currentStreak += 1;
                if (progress.currentStreak > progress.longestStreak) {
                    progress.longestStreak = progress.currentStreak;
                }
            } else if (progress.lastCheckDate < yesterdayStr) {
                // Streak broken
                progress.currentStreak = 1;
            }

            // Reset daily checklist
            progress.todayChecklist = {
                diagnosis: false,
                aiAdvice: false,
                routine: false,
                content: false,
                utility: false,
                mealScan: false,
                soundTherapy: false,
                postureScan: false,
                meditation: false
            };

            progress.lastCheckDate = today;
            saveUserProgress(progress);
        }

        return progress;
    } catch (e) {
        console.error('Failed to parse user progress:', e);
        return getDefaultProgress();
    }
}

export function saveUserProgress(progress: UserProgress): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function updateChecklist(item: keyof DailyChecklist, points: number = 0): UserProgress {
    const progress = getUserProgress();
    progress.todayChecklist[item] = true;
    progress.totalPoints += points;
    saveUserProgress(progress);
    return progress;
}

export function getChecklistProgress(tier: TierType = 'NONE'): { completed: number; total: number; percentage: number } {
    const progress = getUserProgress();
    const checklist = progress.todayChecklist;
    const tierItems = getTierChecklist(tier);
    
    const completed = tierItems.filter(item => checklist[item.id as keyof DailyChecklist]).length;
    const total = tierItems.length;
    
    return {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
}

function getDefaultProgress(): UserProgress {
    const today = getKSTDate();
    return {
        lastCheckDate: today,
        currentStreak: 1,
        longestStreak: 1,
        totalPoints: 0,
        todayChecklist: {
            diagnosis: false,
            aiAdvice: false,
            routine: false,
            content: false,
            utility: false,
            mealScan: false,
            soundTherapy: false,
            postureScan: false,
            meditation: false
        }
    };
}

// ── 티어별 맞춤 체크리스트 ──────────────────────────
export interface TierChecklistItem {
    id: string;
    label: string;
    emoji: string;
    charImg: string;
    points: number;
}

export type TierType = 'NONE' | 'RESET' | 'REBORN' | 'RESTART' | 'BLACK';

const BASE_CHECKLIST: TierChecklistItem[] = [
    { id: 'diagnosis', label: '오늘의 리듬체크', emoji: '✨', charImg: '/images/characters/char_diagnosis.png', points: 2 },
    { id: 'aiAdvice', label: 'Youniqle 조언 확인', emoji: '💡', charImg: '/images/characters/char_qr.png', points: 1 },
    { id: 'routine', label: '오늘의 루틴 완수', emoji: '⚡', charImg: '/images/characters/char_todo.png', points: 2 },
    { id: 'utility', label: '유틸리티 1회 사용', emoji: '🔧', charImg: '/images/characters/char_unit.png', points: 1 },
];

const EXTENDED_CHECKLIST: TierChecklistItem[] = [
    ...BASE_CHECKLIST,
    { id: 'content', label: '회복 콘텐츠 읽기', emoji: '📖', charImg: '/images/characters/char_dday.png', points: 1 },
    { id: 'mealScan', label: '식단 스캔 기록', emoji: '🥗', charImg: '/images/characters/char_scanner.png', points: 2 },
];

const PREMIUM_CHECKLIST: TierChecklistItem[] = [
    ...EXTENDED_CHECKLIST,
    { id: 'soundTherapy', label: '사운드 테라피 10분', emoji: '🎧', charImg: '/images/characters/char_sound.png', points: 3 },
    { id: 'postureScan', label: '자세 밸런스 분석', emoji: '🧍', charImg: '/images/characters/char_posture.png', points: 3 },
];

export function getTierChecklist(tier: TierType): TierChecklistItem[] {
    switch (tier) {
        case 'BLACK':
            return PREMIUM_CHECKLIST;
        case 'RESTART':
            return EXTENDED_CHECKLIST;
        case 'REBORN':
        case 'RESET':
        case 'NONE':
        default:
            return BASE_CHECKLIST;
    }
}
