import User from '@/models/User';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Content from '@/models/Content';

/**
 * 프로젝트 전반의 분석 및 통계 로직을 담당하는 통합 서비스
 */
export class AnalyticsService {
  /**
   * 시작 날짜를 기준으로 이전 기간의 시작 날짜와 종료 날짜를 계산합니다.
   */
  static getPeriodDates(range: string) {
    const now = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      case '90d': startDate.setDate(now.getDate() - 90); break;
      case '1y': startDate.setFullYear(now.getFullYear() - 1); break;
      default: startDate.setDate(now.getDate() - 30);
    }

    const periodDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const prevStartDate = new Date(startDate);
    prevStartDate.setTime(prevStartDate.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    const prevEndDate = new Date(startDate);

    return { startDate, now, prevStartDate, prevEndDate };
  }

  /**
   * 두 값 사이의 성장률을 계산합니다.
   */
  static calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * 지정된 상태의 주문 총액(매출)을 계산합니다.
   */
  static async getRevenue(startDate?: Date, endDate?: Date) {
    const match: any = { 
        status: { $in: ['confirmed', 'preparing', 'shipped', 'delivered'] } 
    };
    if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = startDate;
        if (endDate) match.createdAt.$lt = endDate;
    }

    const result = await Order.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    return result[0]?.total || 0;
  }

  /**
   * 사용자 활동 요약 통계를 조회합니다.
   */
  static async getUserStats() {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          avgSessionTime: { $avg: { $ifNull: ['$sessionTime', 0] } },
          bounceRate: { $avg: { $ifNull: ['$bounceRate', 0] } },
          conversionRate: { $avg: { $ifNull: ['$conversionRate', 0] } }
        }
      }
    ]);

    return {
      avgSessionTime: Math.round(stats[0]?.avgSessionTime || 0),
      bounceRate: Math.round(stats[0]?.bounceRate || 0),
      conversionRate: Math.round(stats[0]?.conversionRate || 0)
    };
  }
}
