import mongoose from 'mongoose';
import ABTest from '@/models/ABTest';
import ABTestEvent from '@/models/ABTestEvent';
import { connectDB } from '@/lib/db';

/**
 * A/B 테스트 데이터 접근 및 집계를 위한 통합 서비스
 */
export class TestingService {
  /**
   * 테스트 식별자를 기반으로 참여자 및 전환 데이터를 집계합니다.
   */
  static async getAggregateStats(testId: string) {
    await connectDB();
    
    return await ABTestEvent.aggregate([
      { $match: { testId: new mongoose.Types.ObjectId(testId) } },
      {
        $group: {
          _id: '$variantName',
          participants: { $addToSet: '$userId' },
          conversions: {
            $sum: {
              $cond: [{ $eq: ['$eventType', 'conversion'] }, 1, 0]
            }
          },
          views: {
            $sum: {
              $cond: [{ $eq: ['$eventType', 'view'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          variantName: '$_id',
          participantCount: { $size: '$participants' },
          conversions: 1,
          views: 1
        }
      }
    ]);
  }

  /**
   * 새로운 테스트 이벤트를 기록합니다.
   */
  static async recordEvent(data: {
    testId: string;
    userId: string;
    variantName: string;
    eventType: 'view' | 'click' | 'conversion';
    metadata?: any;
  }) {
    await connectDB();
    const event = new ABTestEvent({
      ...data,
      sessionId: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date()
    });
    return await event.save();
  }

  /**
   * 특정 테스트의 상태를 업데이트합니다.
   */
  static async updateTestStatus(testId: string, status: string, winner?: string) {
    await connectDB();
    return await ABTest.findByIdAndUpdate(testId, {
      status,
      winner,
      ...(status === 'completed' ? { endDate: new Date() } : {})
    });
  }
}
