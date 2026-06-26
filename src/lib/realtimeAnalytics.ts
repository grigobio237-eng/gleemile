import AnalyticsEvent from '@/models/AnalyticsEvent';
import User from '@/models/User';
import Order from '@/models/Order';
import Newsletter from '@/models/Newsletter';
import Coupon from '@/models/Coupon';
import Promotion from '@/models/Promotion';
import ABTest from '@/models/ABTest';
import CustomerSegment from '@/models/CustomerSegment';

export interface RealtimeMetrics {
  // 실시간 지표
  activeUsers: number;
  pageViews: number;
  events: number;
  conversions: number;
  revenue: number;
  
  // 시간별 지표 (최근 24시간)
  hourlyMetrics: Array<{
    hour: string;
    users: number;
    pageViews: number;
    events: number;
    conversions: number;
    revenue: number;
  }>;
  
  // 채널별 성과
  channelPerformance: Array<{
    channel: string;
    users: number;
    pageViews: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
  }>;
  
  // 디바이스별 성과
  devicePerformance: Array<{
    device: string;
    users: number;
    pageViews: number;
    conversions: number;
    revenue: number;
  }>;
  
  // 지역별 성과
  locationPerformance: Array<{
    country: string;
    users: number;
    pageViews: number;
    conversions: number;
    revenue: number;
  }>;
  
  // 인기 페이지
  topPages: Array<{
    page: string;
    title: string;
    views: number;
    uniqueViews: number;
    avgTimeOnPage: number;
    bounceRate: number;
  }>;
  
  // 인기 검색어
  topSearchTerms: Array<{
    term: string;
    searches: number;
    results: number;
    avgResults: number;
  }>;
  
  // 마케팅 캠페인 성과
  campaignPerformance: Array<{
    campaign: string;
    source: string;
    medium: string;
    users: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
    costPerConversion: number;
  }>;
  
  // A/B 테스트 성과
  abTestPerformance: Array<{
    testName: string;
    variant: string;
    users: number;
    conversions: number;
    conversionRate: number;
    lift: number;
  }>;
  
  // 세그먼트별 성과
  segmentPerformance: Array<{
    segmentName: string;
    users: number;
    conversions: number;
    revenue: number;
    avgOrderValue: number;
    conversionRate: number;
  }>;
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: string[];
  eventCategories?: string[];
  userIds?: string[];
  sessionIds?: string[];
  deviceTypes?: string[];
  countries?: string[];
  utmSources?: string[];
  utmCampaigns?: string[];
  segmentIds?: string[];
  abTestIds?: string[];
}

export class RealtimeAnalyticsEngine {
  // 실시간 지표 계산
  static async getRealtimeMetrics(filters: AnalyticsFilters = {}): Promise<RealtimeMetrics> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // 기본 필터 설정
      const baseFilter = this.buildFilter(filters);
      const recentFilter = { ...baseFilter, timestamp: { $gte: oneHourAgo } };
      const dailyFilter = { ...baseFilter, timestamp: { $gte: twentyFourHoursAgo } };
      
      // 실시간 지표 계산 (에러 처리 추가)
      const [
        activeUsers,
        pageViews,
        events,
        conversions,
        revenue,
        hourlyMetrics,
        channelPerformance,
        devicePerformance,
        locationPerformance,
        topPages,
        topSearchTerms,
        campaignPerformance,
        abTestPerformance,
        segmentPerformance
      ] = await Promise.all([
        this.getActiveUsers(recentFilter).catch(() => 0),
        this.getPageViews(recentFilter).catch(() => 0),
        this.getEvents(recentFilter).catch(() => 0),
        this.getConversions(recentFilter).catch(() => 0),
        this.getRevenue(recentFilter).catch(() => 0),
        this.getHourlyMetrics(dailyFilter).catch(() => []),
        this.getChannelPerformance(dailyFilter).catch(() => []),
        this.getDevicePerformance(dailyFilter).catch(() => []),
        this.getLocationPerformance(dailyFilter).catch(() => []),
        this.getTopPages(dailyFilter).catch(() => []),
        this.getTopSearchTerms(dailyFilter).catch(() => []),
        this.getCampaignPerformance(dailyFilter).catch(() => []),
        this.getABTestPerformance(dailyFilter).catch(() => []),
        this.getSegmentPerformance(dailyFilter).catch(() => [])
      ]);
      
      return {
        activeUsers: activeUsers || 0,
        pageViews: pageViews || 0,
        events: events || 0,
        conversions: conversions || 0,
        revenue: revenue || 0,
        hourlyMetrics: hourlyMetrics || [],
        channelPerformance: channelPerformance || [],
        devicePerformance: devicePerformance || [],
        locationPerformance: locationPerformance || [],
        topPages: topPages || [],
        topSearchTerms: topSearchTerms || [],
        campaignPerformance: campaignPerformance || [],
        abTestPerformance: abTestPerformance || [],
        segmentPerformance: segmentPerformance || []
      };
    } catch (error) {
      console.error('Error in getRealtimeMetrics:', error);
      // 빈 데이터 반환
      return {
        activeUsers: 0,
        pageViews: 0,
        events: 0,
        conversions: 0,
        revenue: 0,
        hourlyMetrics: [],
        channelPerformance: [],
        devicePerformance: [],
        locationPerformance: [],
        topPages: [],
        topSearchTerms: [],
        campaignPerformance: [],
        abTestPerformance: [],
        segmentPerformance: []
      };
    }
  }
  
  // 필터 빌더
  private static buildFilter(filters: AnalyticsFilters): any {
    const filter: any = {};
    
    if (filters.startDate || filters.endDate) {
      filter.timestamp = {};
      if (filters.startDate) filter.timestamp.$gte = filters.startDate;
      if (filters.endDate) filter.timestamp.$lte = filters.endDate;
    }
    
    if (filters.eventTypes && filters.eventTypes.length > 0) {
      filter.eventType = { $in: filters.eventTypes };
    }
    
    if (filters.eventCategories && filters.eventCategories.length > 0) {
      filter.eventCategory = { $in: filters.eventCategories };
    }
    
    if (filters.userIds && filters.userIds.length > 0) {
      filter.userId = { $in: filters.userIds };
    }
    
    if (filters.sessionIds && filters.sessionIds.length > 0) {
      filter.sessionId = { $in: filters.sessionIds };
    }
    
    if (filters.deviceTypes && filters.deviceTypes.length > 0) {
      filter['deviceInfo.deviceType'] = { $in: filters.deviceTypes };
    }
    
    if (filters.countries && filters.countries.length > 0) {
      filter['locationInfo.country'] = { $in: filters.countries };
    }
    
    if (filters.utmSources && filters.utmSources.length > 0) {
      filter['eventData.utmSource'] = { $in: filters.utmSources };
    }
    
    if (filters.utmCampaigns && filters.utmCampaigns.length > 0) {
      filter['eventData.utmCampaign'] = { $in: filters.utmCampaigns };
    }
    
    return filter;
  }
  
  // 활성 사용자 수
  private static async getActiveUsers(filter: any): Promise<number> {
    const result = await AnalyticsEvent.aggregate([
      { $match: filter },
      { $group: { _id: '$userId' } },
      { $count: 'activeUsers' }
    ]);
    return result[0]?.activeUsers || 0;
  }
  
  // 페이지 뷰 수
  private static async getPageViews(filter: any): Promise<number> {
    return await AnalyticsEvent.countDocuments({
      ...filter,
      eventType: 'page_view'
    });
  }
  
  // 이벤트 수
  private static async getEvents(filter: any): Promise<number> {
    return await AnalyticsEvent.countDocuments(filter);
  }
  
  // 전환 수
  private static async getConversions(filter: any): Promise<number> {
    return await AnalyticsEvent.countDocuments({
      ...filter,
      eventType: { $in: ['conversion', 'purchase'] }
    });
  }
  
  // 매출
  private static async getRevenue(filter: any): Promise<number> {
    const result = await AnalyticsEvent.aggregate([
      { $match: { ...filter, eventType: 'purchase' } },
      { $group: { _id: null, total: { $sum: '$eventData.totalAmount' } } }
    ]);
    return result[0]?.total || 0;
  }
  
  // 시간별 지표
  private static async getHourlyMetrics(filter: any): Promise<any[]> {
    const result = await AnalyticsEvent.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            hour: { $hour: '$timestamp' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          users: { $addToSet: '$userId' },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] }
          },
          events: { $sum: 1 },
          conversions: {
            $sum: { $cond: [{ $in: ['$eventType', ['conversion', 'purchase']] }, 1, 0] }
          },
          revenue: { $sum: '$eventData.totalAmount' }
        }
      },
      {
        $project: {
          hour: { $concat: ['$_id.date', ' ', { $toString: '$_id.hour' }, ':00'] },
          users: { $size: '$users' },
          pageViews: 1,
          events: 1,
          conversions: 1,
          revenue: 1
        }
      },
      { $sort: { '_id.date': 1, '_id.hour': 1 } }
    ]);
    
    return result.map(item => ({
      hour: item.hour,
      users: item.users,
      pageViews: item.pageViews,
      events: item.events,
      conversions: item.conversions,
      revenue: item.revenue || 0
    }));
  }
  
  // 채널별 성과
  private static async getChannelPerformance(filter: any): Promise<any[]> {
    const result = await AnalyticsEvent.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            source: '$eventData.utmSource',
            medium: '$eventData.utmMedium'
          },
          users: { $addToSet: '$userId' },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] }
          },
          conversions: {
            $sum: { $cond: [{ $in: ['$eventType', ['conversion', 'purchase']] }, 1, 0] }
          },
          revenue: { $sum: '$eventData.totalAmount' }
        }
      },
      {
        $project: {
          channel: {
            $concat: [
              { $ifNull: ['$_id.source', 'Direct'] },
              ' / ',
              { $ifNull: ['$_id.medium', 'none'] }
            ]
          },
          users: { $size: '$users' },
          pageViews: 1,
          conversions: 1,
          revenue: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$pageViews', 0] },
              { $multiply: [{ $divide: ['$conversions', '$pageViews'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { revenue: -1 } }
    ]);
    
    return result;
  }
  
  // 디바이스별 성과
  private static async getDevicePerformance(filter: any): Promise<any[]> {
    const result = await AnalyticsEvent.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$deviceInfo.deviceType',
          users: { $addToSet: '$userId' },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] }
          },
          conversions: {
            $sum: { $cond: [{ $in: ['$eventType', ['conversion', 'purchase']] }, 1, 0] }
          },
          revenue: { $sum: '$eventData.totalAmount' }
        }
      },
      {
        $project: {
          device: '$_id',
          users: { $size: '$users' },
          pageViews: 1,
          conversions: 1,
          revenue: 1
        }
      },
      { $sort: { revenue: -1 } }
    ]);
    
    return result;
  }
  
  // 지역별 성과
  private static async getLocationPerformance(filter: any): Promise<any[]> {
    const result = await AnalyticsEvent.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$locationInfo.country',
          users: { $addToSet: '$userId' },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] }
          },
          conversions: {
            $sum: { $cond: [{ $in: ['$eventType', ['conversion', 'purchase']] }, 1, 0] }
          },
          revenue: { $sum: '$eventData.totalAmount' }
        }
      },
      {
        $project: {
          country: '$_id',
          users: { $size: '$users' },
          pageViews: 1,
          conversions: 1,
          revenue: 1
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);
    
    return result;
  }
  
  // 인기 페이지
  private static async getTopPages(filter: any): Promise<any[]> {
    const result = await AnalyticsEvent.aggregate([
      { $match: { ...filter, eventType: 'page_view' } },
      {
        $group: {
          _id: {
            page: '$eventData.pageUrl',
            title: '$eventData.pageTitle'
          },
          views: { $sum: 1 },
          uniqueViews: { $addToSet: '$userId' },
          avgTimeOnPage: { $avg: '$performanceInfo.pageLoadTime' },
          bounceEvents: {
            $sum: { $cond: [{ $eq: ['$sessionInfo.isBounce', true] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          page: '$_id.page',
          title: '$_id.title',
          views: 1,
          uniqueViews: { $size: '$uniqueViews' },
          avgTimeOnPage: { $round: ['$avgTimeOnPage', 2] },
          bounceRate: {
            $cond: [
              { $gt: ['$views', 0] },
              { $multiply: [{ $divide: ['$bounceEvents', '$views'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 10 }
    ]);
    
    return result;
  }
  
  // 인기 검색어
  private static async getTopSearchTerms(filter: any): Promise<any[]> {
    const result = await AnalyticsEvent.aggregate([
      { $match: { ...filter, eventType: 'search' } },
      {
        $group: {
          _id: '$eventData.searchQuery',
          searches: { $sum: 1 },
          totalResults: { $sum: '$eventData.searchResults' }
        }
      },
      {
        $project: {
          term: '$_id',
          searches: 1,
          results: '$totalResults',
          avgResults: { $round: [{ $divide: ['$totalResults', '$searches'] }, 2] }
        }
      },
      { $sort: { searches: -1 } },
      { $limit: 10 }
    ]);
    
    return result;
  }
  
  // 마케팅 캠페인 성과
  private static async getCampaignPerformance(filter: any): Promise<any[]> {
    const result = await AnalyticsEvent.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            campaign: '$eventData.utmCampaign',
            source: '$eventData.utmSource',
            medium: '$eventData.utmMedium'
          },
          users: { $addToSet: '$userId' },
          conversions: {
            $sum: { $cond: [{ $in: ['$eventType', ['conversion', 'purchase']] }, 1, 0] }
          },
          revenue: { $sum: '$eventData.totalAmount' }
        }
      },
      {
        $project: {
          campaign: '$_id.campaign',
          source: '$_id.source',
          medium: '$_id.medium',
          users: { $size: '$users' },
          conversions: 1,
          revenue: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$users', 0] },
              { $multiply: [{ $divide: ['$conversions', { $size: '$users' }] }, 100] },
              0
            ]
          },
          costPerConversion: 0 // 실제로는 광고 비용 데이터가 필요
        }
      },
      { $sort: { revenue: -1 } }
    ]);
    
    return result;
  }
  
  // A/B 테스트 성과
  private static async getABTestPerformance(filter: any): Promise<any[]> {
    const result = await AnalyticsEvent.aggregate([
      { $match: { ...filter, eventType: { $in: ['ab_test_view', 'ab_test_conversion'] } } },
      {
        $group: {
          _id: {
            testName: '$eventData.abTestName',
            variant: '$eventData.variantName'
          },
          users: { $addToSet: '$userId' },
          views: {
            $sum: { $cond: [{ $eq: ['$eventType', 'ab_test_view'] }, 1, 0] }
          },
          conversions: {
            $sum: { $cond: [{ $eq: ['$eventType', 'ab_test_conversion'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          testName: '$_id.testName',
          variant: '$_id.variantName',
          users: { $size: '$users' },
          conversions: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$views', 0] },
              { $multiply: [{ $divide: ['$conversions', '$views'] }, 100] },
              0
            ]
          },
          lift: 0 // 실제로는 대조군과의 비교가 필요
        }
      },
      { $sort: { conversionRate: -1 } }
    ]);
    
    return result;
  }
  
  // 세그먼트별 성과
  private static async getSegmentPerformance(filter: any): Promise<any[]> {
    const result = await AnalyticsEvent.aggregate([
      { $match: filter },
      { $unwind: { path: '$userInfo.segmentIds', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'customersegments',
          localField: 'userInfo.segmentIds',
          foreignField: '_id',
          as: 'segment'
        }
      },
      { $unwind: { path: '$segment', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$segment.name',
          users: { $addToSet: '$userId' },
          conversions: {
            $sum: { $cond: [{ $in: ['$eventType', ['conversion', 'purchase']] }, 1, 0] }
          },
          revenue: { $sum: '$eventData.totalAmount' }
        }
      },
      {
        $project: {
          segmentName: '$_id',
          users: { $size: '$users' },
          conversions: 1,
          revenue: 1,
          avgOrderValue: {
            $cond: [
              { $gt: ['$conversions', 0] },
              { $divide: ['$revenue', '$conversions'] },
              0
            ]
          },
          conversionRate: {
            $cond: [
              { $gt: [{ $size: '$users' }, 0] },
              { $multiply: [{ $divide: ['$conversions', { $size: '$users' }] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { revenue: -1 } }
    ]);
    
    return result;
  }
  
  // 이벤트 추적
  static async trackEvent(eventData: any): Promise<void> {
    try {
      const event = new AnalyticsEvent({
        ...eventData,
        timestamp: new Date(),
        metadata: {
          ...eventData.metadata,
          processed: false
        }
      });
      
      await event.save();
      
      // 비동기 처리 (실제로는 큐 시스템 사용)
      this.processEvent(event._id.toString());
    } catch (error) {
      console.error('Event tracking error:', error);
    }
  }
  
  // 이벤트 처리
  private static async processEvent(eventId: string): Promise<void> {
    try {
      // 이벤트 처리 로직 (세그먼트 업데이트, 알림 등)
      await AnalyticsEvent.findByIdAndUpdate(eventId, {
        'metadata.processed': true,
        'metadata.processedAt': new Date()
      });
    } catch (error) {
      console.error('Event processing error:', error);
    }
  }
}

