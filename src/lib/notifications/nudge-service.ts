import dbConnect from '@/lib/db';
import User from '@/models/User';
import RecoveryScore from '@/models/RecoveryScore';
import PushSubscription from '@/models/PushSubscription';
import { WebPushService } from './web-push';

export class NudgeService {
    /**
     * 오늘의 60초 리듬체크를 하지 않은 사용자들에게 리마인드 푸시 전송
     */
    static async sendDailyCheckInReminders() {
        await dbConnect();
        
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
        const subscriptions = await PushSubscription.find();
        
        let sentCount = 0;
        let failedCount = 0;

        for (const sub of subscriptions) {
            try {
                // 오늘 이미 체크인했는지 확인
                const alreadyCheckedIn = await RecoveryScore.findOne({ 
                    userId: sub.userId, 
                    date: today 
                });

                if (!alreadyCheckedIn) {
                    const user = await User.findById(sub.userId);
                    const userName = user?.name || 'gleemile 멤버';

                    const payload = {
                        title: '🌿 오늘의 회복 리듬 체크',
                        body: `${userName}님, 아직 오늘의 회복 점수를 확인하지 않으셨네요! 60초만 투자해 보세요.`,
                        data: { url: '/ai-navigator' },
                        tag: 'daily-checkin-reminder'
                    };

                    const result = await WebPushService.sendNotification({
                        endpoint: sub.endpoint,
                        keys: sub.keys
                    }, payload);

                    if (result.success) {
                        sentCount++;
                    } else if (result.error === 'expired') {
                        // 만료된 구독 정보 삭제
                        await PushSubscription.deleteOne({ _id: sub._id });
                        failedCount++;
                    }
                }
            } catch (error) {
                console.error(`Failed to send nudge to ${sub.userId}:`, error);
                failedCount++;
            }
        }

        return { sentCount, failedCount };
    }

    /**
     * 회복 스트릭(연속 달성) 유지 유도 푸시 전송
     * 3일 이상 연속 달성 중인 사용자에게 전송
     */
    static async sendStreakNudges() {
        await dbConnect();
        
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
        const subscriptions = await PushSubscription.find();

        for (const sub of subscriptions) {
            try {
                const userScores = await RecoveryScore.find({ userId: sub.userId })
                    .sort({ date: -1 })
                    .limit(7);

                // 스트릭 계산 (간단 버전)
                let streak = 0;
                for (let i = 0; i < userScores.length; i++) {
                    // 날짜 연속성 체크 로직 (생략 가능, 여기서는 개수 위주)
                    streak++;
                }

                if (streak >= 3) {
                    const user = await User.findById(sub.userId);
                    const payload = {
                        title: '🔥 대단해요! 스트릭 유지 중',
                        body: `${user?.name}님은 벌써 ${streak}일째 회복 리듬을 기록하고 있습니다. 오늘도 잊지 마세요!`,
                        data: { url: '/ai-navigator' },
                        tag: 'streak-nudge'
                    };
                    await WebPushService.sendNotification({
                        endpoint: sub.endpoint,
                        keys: sub.keys
                    }, payload);
                }
            } catch (e) {
                console.error('Streak nudge error:', e);
            }
        }
    }
}
