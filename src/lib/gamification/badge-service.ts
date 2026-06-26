import dbConnect from '@/lib/db';
import { Badge, UserBadge } from '@/models/Badge';
import RecoveryScore from '@/models/RecoveryScore';

export class BadgeService {
    /**
     * 사용자의 성취도를 평가하여 새로운 뱃지를 수여합니다.
     */
    static async checkAndAwardBadges(userId: string) {
        await dbConnect();
        
        let allBadges = await Badge.find();
        
        // 뱃지가 하나도 없으면 초기 시딩 진행
        if (allBadges.length === 0) {
            await this.seedBadges();
            allBadges = await Badge.find();
        }

        const earnedUserBadges = await UserBadge.find({ userId });
        const earnedBadgeIds = earnedUserBadges.map(ub => ub.badgeId.toString());
        
        const newEarnedBadges = [];

        for (const badge of allBadges) {
            if (earnedBadgeIds.includes(badge._id.toString())) continue;

            const isEligible = await this.evaluateCriteria(userId, badge);
            if (isEligible) {
                // Use findOneAndUpdate with upsert to prevent race conditions
                const result = await UserBadge.findOneAndUpdate(
                    { userId, badgeId: badge._id },
                    { $setOnInsert: { userId, badgeId: badge._id, earnedAt: new Date() } },
                    { upsert: true, new: true, rawResult: true }
                );
                
                // If the document was upserted (newly created), it's a new badge
                if (!result.lastErrorObject?.updatedExisting) {
                    newEarnedBadges.push(badge);
                }
            }
        }

        return newEarnedBadges;
    }

    private static async evaluateCriteria(userId: string, badge: any): Promise<boolean> {
        const { type, value } = badge.criteria;

        switch (type) {
            case 'checkin_count': {
                const count = await RecoveryScore.countDocuments({ userId });
                return count >= value;
            }

            case 'streak_days': {
                const scores = await RecoveryScore.find({ userId }).sort({ date: -1 }).limit(value);
                if (scores.length < value) return false;
                
                // 간단한 연속성 체크 (날짜 차이 계산)
                for (let i = 0; i < scores.length - 1; i++) {
                    const d1 = new Date(scores[i].date);
                    const d2 = new Date(scores[i+1].date);
                    const diff = (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
                    if (diff > 1) return false;
                }
                return true;
            }

            case 'percentile': {
                // 최근 기록이 상위 X% 이내인지 체크 (통계 데이터 필요)
                // 현재는 구현 간소화를 위해 항상 false 반환 또는 특정 점수 이상으로 대체 가능
                const lastScore = await RecoveryScore.findOne({ userId }).sort({ date: -1 });
                return lastScore ? lastScore.totalScore >= (100 - value) : false;
            }

            case 'time_of_day': {
                const lastScore = await RecoveryScore.findOne({ userId }).sort({ createdAt: -1 });
                if (!lastScore) return false;
                const hour = new Date(lastScore.createdAt).getHours();
                if (badge.code === 'early_bird') return hour < value;
                if (badge.code === 'night_owl') return hour >= value;
                return false;
            }

            default:
                return false;
        }
    }

    /**
     * 초기 뱃지 데이터 세팅
     */
    static async seedBadges() {
        await dbConnect();
        const initialBadges = [
            {
                code: 'first_step',
                name: '회복의 첫걸음',
                description: '첫 번째 60초 리듬체크를 완료했습니다.',
                icon: '🌱',
                category: 'achievement',
                rarity: 'common',
                criteria: { type: 'checkin_count', value: 1 }
            },
            {
                code: 'streak_3',
                name: '삼일천하 극복',
                description: '3일 연속으로 회복 리듬을 기록했습니다.',
                icon: '🔥',
                category: 'streak',
                rarity: 'common',
                criteria: { type: 'streak_days', value: 3 }
            },
            {
                code: 'streak_7',
                name: '일주일의 기적',
                description: '7일 연속으로 회복 리듬을 기록했습니다.',
                icon: '🌈',
                category: 'streak',
                rarity: 'rare',
                criteria: { type: 'streak_days', value: 7 }
            },
            {
                code: 'recovery_master',
                name: '회복 마스터',
                description: '회복 점수 90점 이상을 달성했습니다.',
                icon: '🏆',
                category: 'achievement',
                rarity: 'epic',
                criteria: { type: 'percentile', value: 10 }
            },
            {
                code: 'early_bird',
                name: '부지런한 아침',
                description: '오전 8시 이전에 회복 리듬을 체크했습니다.',
                icon: '🌅',
                category: 'special',
                rarity: 'rare',
                criteria: { type: 'time_of_day', value: 8 }
            }
        ];

        for (const b of initialBadges) {
            await Badge.findOneAndUpdate({ code: b.code }, b, { upsert: true });
        }
    }
}
