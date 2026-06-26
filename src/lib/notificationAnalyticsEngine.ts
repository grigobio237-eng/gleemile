import NotificationAnalytics from '@/models/NotificationAnalytics';
import NotificationTemplate from '@/models/NotificationTemplate';
import NotificationSchedule from '@/models/NotificationSchedule';
import User from '@/models/User';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  type?: string;
  category?: string;
  status?: string;
  templateId?: string;
  scheduleId?: string;
  userId?: string;
  deviceType?: string;
  country?: string;
  utmSource?: string;
  utmCampaign?: string;
}

export interface AnalyticsMetrics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  totalFailed: number;
  totalBounced: number;
  totalUnsubscribed: number;
  
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  
  averageDeliveryTime: number;
  averageOpenTime: number;
  averageClickTime: number;
  averageConversionTime: number;
  
  totalRevenue: number;
  averageRevenuePerNotification: number;
  averageRevenuePerConversion: number;
}

export interface TimeSeriesData {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  failed: number;
  revenue: number;
}

export interface DeviceAnalytics {
  deviceType: string;
  count: number;
  percentage: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

export interface LocationAnalytics {
  country: string;
  region?: string;
  city?: string;
  count: number;
  percentage: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

export interface CampaignAnalytics {
  utmSource: string;
  utmMedium?: string;
  utmCampaign?: string;
  count: number;
  percentage: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
}

export class NotificationAnalyticsEngine {
  // 기본 메트릭 조회
  static async getMetrics(filters: AnalyticsFilters = {}): Promise<AnalyticsMetrics> {
    try {
      await connectDB();
      
      const matchStage: any = {};
      
      if (filters.startDate || filters.endDate) {
        matchStage.sentAt = {};
        if (filters.startDate) matchStage.sentAt.$gte = filters.startDate;
        if (filters.endDate) matchStage.sentAt.$lte = filters.endDate;
      }
      
      if (filters.type) matchStage.type = filters.type;
      if (filters.category) matchStage.category = filters.category;
      if (filters.status) matchStage.status = filters.status;
      if (filters.templateId) matchStage.templateId = new mongoose.Types.ObjectId(filters.templateId);
      if (filters.scheduleId) matchStage.scheduleId = new mongoose.Types.ObjectId(filters.scheduleId);
      if (filters.userId) matchStage.userId = new mongoose.Types.ObjectId(filters.userId);
      if (filters.deviceType) matchStage['analytics.deviceType'] = filters.deviceType;
      if (filters.country) matchStage['analytics.country'] = filters.country;
      if (filters.utmSource) matchStage['analytics.utmSource'] = filters.utmSource;
      if (filters.utmCampaign) matchStage['analytics.utmCampaign'] = filters.utmCampaign;
      
      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalSent: { $sum: 1 },
            totalDelivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            totalOpened: { $sum: { $cond: [{ $eq: ['$status', 'opened'] }, 1, 0] } },
            totalClicked: { $sum: { $cond: [{ $eq: ['$status', 'clicked'] }, 1, 0] } },
            totalConverted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
            totalFailed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            totalBounced: { $sum: { $cond: [{ $eq: ['$status', 'bounced'] }, 1, 0] } },
            totalUnsubscribed: { $sum: { $cond: [{ $eq: ['$status', 'unsubscribed'] }, 1, 0] } },
            averageDeliveryTime: { $avg: '$analytics.deliveryTime' },
            averageOpenTime: { $avg: '$analytics.openTime' },
            averageClickTime: { $avg: '$analytics.clickTime' },
            averageConversionTime: { $avg: '$analytics.conversionTime' },
            totalRevenue: { $sum: '$metadata.revenue' }
          }
        }
      ];
      
      const result = await NotificationAnalytics.aggregate(pipeline);
      const metrics = result[0] || {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalConverted: 0,
        totalFailed: 0,
        totalBounced: 0,
        totalUnsubscribed: 0,
        averageDeliveryTime: 0,
        averageOpenTime: 0,
        averageClickTime: 0,
        averageConversionTime: 0,
        totalRevenue: 0
      };
      
      // 비율 계산
      const deliveryRate = metrics.totalSent > 0 ? (metrics.totalDelivered / metrics.totalSent) * 100 : 0;
      const openRate = metrics.totalDelivered > 0 ? (metrics.totalOpened / metrics.totalDelivered) * 100 : 0;
      const clickRate = metrics.totalOpened > 0 ? (metrics.totalClicked / metrics.totalOpened) * 100 : 0;
      const conversionRate = metrics.totalClicked > 0 ? (metrics.totalConverted / metrics.totalClicked) * 100 : 0;
      const bounceRate = metrics.totalSent > 0 ? (metrics.totalBounced / metrics.totalSent) * 100 : 0;
      const unsubscribeRate = metrics.totalSent > 0 ? (metrics.totalUnsubscribed / metrics.totalSent) * 100 : 0;
      
      return {
        ...metrics,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
        unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
        averageRevenuePerNotification: metrics.totalSent > 0 ? metrics.totalRevenue / metrics.totalSent : 0,
        averageRevenuePerConversion: metrics.totalConverted > 0 ? metrics.totalRevenue / metrics.totalConverted : 0
      };
    } catch (error) {
      console.error('Get metrics error:', error);
      throw error;
    }
  }

  // 시계열 데이터 조회
  static async getTimeSeriesData(
    filters: AnalyticsFilters = {},
    groupBy: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<TimeSeriesData[]> {
    try {
      await connectDB();
      
      const matchStage: any = {};
      
      if (filters.startDate || filters.endDate) {
        matchStage.sentAt = {};
        if (filters.startDate) matchStage.sentAt.$gte = filters.startDate;
        if (filters.endDate) matchStage.sentAt.$lte = filters.endDate;
      }
      
      if (filters.type) matchStage.type = filters.type;
      if (filters.category) matchStage.category = filters.category;
      if (filters.templateId) matchStage.templateId = new mongoose.Types.ObjectId(filters.templateId);
      if (filters.scheduleId) matchStage.scheduleId = new mongoose.Types.ObjectId(filters.scheduleId);
      
      let dateFormat: string;
      switch (groupBy) {
        case 'hour':
          dateFormat = '%Y-%m-%d %H:00:00';
          break;
        case 'day':
          dateFormat = '%Y-%m-%d';
          break;
        case 'week':
          dateFormat = '%Y-%U';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          break;
        default:
          dateFormat = '%Y-%m-%d';
      }
      
      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: {
              $dateToString: {
                format: dateFormat,
                date: '$sentAt'
              }
            },
            sent: { $sum: 1 },
            delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            opened: { $sum: { $cond: [{ $eq: ['$status', 'opened'] }, 1, 0] } },
            clicked: { $sum: { $cond: [{ $eq: ['$status', 'clicked'] }, 1, 0] } },
            converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            revenue: { $sum: '$metadata.revenue' }
          }
        },
        { $sort: { _id: 1 as const } }
      ];
      
      const result = await NotificationAnalytics.aggregate(pipeline);
      
      return result.map(item => ({
        date: item._id,
        sent: item.sent,
        delivered: item.delivered,
        opened: item.opened,
        clicked: item.clicked,
        converted: item.converted,
        failed: item.failed,
        revenue: item.revenue || 0
      }));
    } catch (error) {
      console.error('Get time series data error:', error);
      throw error;
    }
  }

  // 디바이스별 분석
  static async getDeviceAnalytics(filters: AnalyticsFilters = {}): Promise<DeviceAnalytics[]> {
    try {
      await connectDB();
      
      const matchStage: any = {};
      
      if (filters.startDate || filters.endDate) {
        matchStage.sentAt = {};
        if (filters.startDate) matchStage.sentAt.$gte = filters.startDate;
        if (filters.endDate) matchStage.sentAt.$lte = filters.endDate;
      }
      
      if (filters.type) matchStage.type = filters.type;
      if (filters.category) matchStage.category = filters.category;
      if (filters.templateId) matchStage.templateId = new mongoose.Types.ObjectId(filters.templateId);
      if (filters.scheduleId) matchStage.scheduleId = new mongoose.Types.ObjectId(filters.scheduleId);
      
      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: '$analytics.deviceType',
            count: { $sum: 1 },
            delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            opened: { $sum: { $cond: [{ $eq: ['$status', 'opened'] }, 1, 0] } },
            clicked: { $sum: { $cond: [{ $eq: ['$status', 'clicked'] }, 1, 0] } },
            converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } }
          }
        },
        {
          $addFields: {
            deviceType: { $ifNull: ['$_id', 'unknown'] }
          }
        },
        { $sort: { count: -1 as const } }
      ];
      
      const result = await NotificationAnalytics.aggregate(pipeline);
      const total = result.reduce((sum, item) => sum + item.count, 0);
      
      return result.map(item => ({
        deviceType: item.deviceType,
        count: item.count,
        percentage: total > 0 ? Math.round((item.count / total) * 100 * 100) / 100 : 0,
        deliveryRate: item.count > 0 ? Math.round((item.delivered / item.count) * 100 * 100) / 100 : 0,
        openRate: item.delivered > 0 ? Math.round((item.opened / item.delivered) * 100 * 100) / 100 : 0,
        clickRate: item.opened > 0 ? Math.round((item.clicked / item.opened) * 100 * 100) / 100 : 0,
        conversionRate: item.clicked > 0 ? Math.round((item.converted / item.clicked) * 100 * 100) / 100 : 0
      }));
    } catch (error) {
      console.error('Get device analytics error:', error);
      throw error;
    }
  }

  // 위치별 분석
  static async getLocationAnalytics(filters: AnalyticsFilters = {}): Promise<LocationAnalytics[]> {
    try {
      await connectDB();
      
      const matchStage: any = {};
      
      if (filters.startDate || filters.endDate) {
        matchStage.sentAt = {};
        if (filters.startDate) matchStage.sentAt.$gte = filters.startDate;
        if (filters.endDate) matchStage.sentAt.$lte = filters.endDate;
      }
      
      if (filters.type) matchStage.type = filters.type;
      if (filters.category) matchStage.category = filters.category;
      if (filters.templateId) matchStage.templateId = new mongoose.Types.ObjectId(filters.templateId);
      if (filters.scheduleId) matchStage.scheduleId = new mongoose.Types.ObjectId(filters.scheduleId);
      
      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: {
              country: '$analytics.country',
              region: '$analytics.region',
              city: '$analytics.city'
            },
            count: { $sum: 1 },
            delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            opened: { $sum: { $cond: [{ $eq: ['$status', 'opened'] }, 1, 0] } },
            clicked: { $sum: { $cond: [{ $eq: ['$status', 'clicked'] }, 1, 0] } },
            converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } }
          }
        },
        {
          $addFields: {
            country: { $ifNull: ['$_id.country', 'unknown'] },
            region: '$_id.region',
            city: '$_id.city'
          }
        },
        { $sort: { count: -1 as const } },
        { $limit: 50 }
      ];
      
      const result = await NotificationAnalytics.aggregate(pipeline);
      const total = result.reduce((sum, item) => sum + item.count, 0);
      
      return result.map(item => ({
        country: item.country,
        region: item.region,
        city: item.city,
        count: item.count,
        percentage: total > 0 ? Math.round((item.count / total) * 100 * 100) / 100 : 0,
        deliveryRate: item.count > 0 ? Math.round((item.delivered / item.count) * 100 * 100) / 100 : 0,
        openRate: item.delivered > 0 ? Math.round((item.opened / item.delivered) * 100 * 100) / 100 : 0,
        clickRate: item.opened > 0 ? Math.round((item.clicked / item.opened) * 100 * 100) / 100 : 0,
        conversionRate: item.clicked > 0 ? Math.round((item.converted / item.clicked) * 100 * 100) / 100 : 0
      }));
    } catch (error) {
      console.error('Get location analytics error:', error);
      throw error;
    }
  }

  // 캠페인별 분석
  static async getCampaignAnalytics(filters: AnalyticsFilters = {}): Promise<CampaignAnalytics[]> {
    try {
      await connectDB();
      
      const matchStage: any = {};
      
      if (filters.startDate || filters.endDate) {
        matchStage.sentAt = {};
        if (filters.startDate) matchStage.sentAt.$gte = filters.startDate;
        if (filters.endDate) matchStage.sentAt.$lte = filters.endDate;
      }
      
      if (filters.type) matchStage.type = filters.type;
      if (filters.category) matchStage.category = filters.category;
      if (filters.templateId) matchStage.templateId = new mongoose.Types.ObjectId(filters.templateId);
      if (filters.scheduleId) matchStage.scheduleId = new mongoose.Types.ObjectId(filters.scheduleId);
      
      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: {
              utmSource: '$analytics.utmSource',
              utmMedium: '$analytics.utmMedium',
              utmCampaign: '$analytics.utmCampaign'
            },
            count: { $sum: 1 },
            delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            opened: { $sum: { $cond: [{ $eq: ['$status', 'opened'] }, 1, 0] } },
            clicked: { $sum: { $cond: [{ $eq: ['$status', 'clicked'] }, 1, 0] } },
            converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
            revenue: { $sum: '$metadata.revenue' }
          }
        },
        {
          $addFields: {
            utmSource: { $ifNull: ['$_id.utmSource', 'unknown'] },
            utmMedium: '$_id.utmMedium',
            utmCampaign: '$_id.utmCampaign'
          }
        },
        { $sort: { count: -1 as const } },
        { $limit: 50 }
      ];
      
      const result = await NotificationAnalytics.aggregate(pipeline);
      const total = result.reduce((sum, item) => sum + item.count, 0);
      
      return result.map(item => ({
        utmSource: item.utmSource,
        utmMedium: item.utmMedium,
        utmCampaign: item.utmCampaign,
        count: item.count,
        percentage: total > 0 ? Math.round((item.count / total) * 100 * 100) / 100 : 0,
        deliveryRate: item.count > 0 ? Math.round((item.delivered / item.count) * 100 * 100) / 100 : 0,
        openRate: item.delivered > 0 ? Math.round((item.opened / item.delivered) * 100 * 100) / 100 : 0,
        clickRate: item.opened > 0 ? Math.round((item.clicked / item.opened) * 100 * 100) / 100 : 0,
        conversionRate: item.clicked > 0 ? Math.round((item.converted / item.clicked) * 100 * 100) / 100 : 0,
        revenue: item.revenue || 0
      }));
    } catch (error) {
      console.error('Get campaign analytics error:', error);
      throw error;
    }
  }

  // 템플릿별 분석
  static async getTemplateAnalytics(filters: AnalyticsFilters = {}): Promise<any[]> {
    try {
      await connectDB();
      
      const matchStage: any = {};
      
      if (filters.startDate || filters.endDate) {
        matchStage.sentAt = {};
        if (filters.startDate) matchStage.sentAt.$gte = filters.startDate;
        if (filters.endDate) matchStage.sentAt.$lte = filters.endDate;
      }
      
      if (filters.type) matchStage.type = filters.type;
      if (filters.category) matchStage.category = filters.category;
      if (filters.templateId) matchStage.templateId = new mongoose.Types.ObjectId(filters.templateId);
      if (filters.scheduleId) matchStage.scheduleId = new mongoose.Types.ObjectId(filters.scheduleId);
      
      const pipeline = [
        { $match: matchStage },
        {
          $lookup: {
            from: 'notification_templates',
            localField: 'templateId',
            foreignField: '_id',
            as: 'template'
          }
        },
        {
          $unwind: {
            path: '$template',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: '$templateId',
            templateName: { $first: '$template.name' },
            templateType: { $first: '$template.type' },
            templateCategory: { $first: '$template.category' },
            count: { $sum: 1 },
            delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            opened: { $sum: { $cond: [{ $eq: ['$status', 'opened'] }, 1, 0] } },
            clicked: { $sum: { $cond: [{ $eq: ['$status', 'clicked'] }, 1, 0] } },
            converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
            revenue: { $sum: '$metadata.revenue' }
          }
        },
        { $sort: { count: -1 as const } }
      ];
      
      const result = await NotificationAnalytics.aggregate(pipeline);
      const total = result.reduce((sum, item) => sum + item.count, 0);
      
      return result.map(item => ({
        templateId: item._id,
        templateName: item.templateName || 'Unknown',
        templateType: item.templateType || 'unknown',
        templateCategory: item.templateCategory || 'unknown',
        count: item.count,
        percentage: total > 0 ? Math.round((item.count / total) * 100 * 100) / 100 : 0,
        deliveryRate: item.count > 0 ? Math.round((item.delivered / item.count) * 100 * 100) / 100 : 0,
        openRate: item.delivered > 0 ? Math.round((item.opened / item.delivered) * 100 * 100) / 100 : 0,
        clickRate: item.opened > 0 ? Math.round((item.clicked / item.opened) * 100 * 100) / 100 : 0,
        conversionRate: item.clicked > 0 ? Math.round((item.converted / item.clicked) * 100 * 100) / 100 : 0,
        revenue: item.revenue || 0
      }));
    } catch (error) {
      console.error('Get template analytics error:', error);
      throw error;
    }
  }

  // 이벤트 추적
  static async trackEvent(
    notificationId: string,
    userId: string,
    eventType: 'delivered' | 'opened' | 'clicked' | 'converted' | 'failed' | 'bounced' | 'unsubscribed',
    metadata: any = {}
  ): Promise<void> {
    try {
      await connectDB();
      
      const analytics = await NotificationAnalytics.findOne({
        notificationId: new mongoose.Types.ObjectId(notificationId),
        userId: new mongoose.Types.ObjectId(userId)
      });
      
      if (!analytics) {
        console.warn(`Analytics record not found for notification ${notificationId} and user ${userId}`);
        return;
      }
      
      const updateData: any = {
        status: eventType,
        updatedAt: new Date()
      };
      
      switch (eventType) {
        case 'delivered':
          updateData.deliveredAt = new Date();
          break;
        case 'opened':
          updateData.openedAt = new Date();
          updateData['analytics.openCount'] = (analytics.analytics.openCount || 0) + 1;
          break;
        case 'clicked':
          updateData.clickedAt = new Date();
          updateData['analytics.clickCount'] = (analytics.analytics.clickCount || 0) + 1;
          break;
        case 'converted':
          updateData.convertedAt = new Date();
          updateData['analytics.conversionCount'] = (analytics.analytics.conversionCount || 0) + 1;
          break;
        case 'failed':
          updateData.error = metadata.error || 'Unknown error';
          break;
      }
      
      // 메타데이터 업데이트
      if (metadata.deviceType) updateData['analytics.deviceType'] = metadata.deviceType;
      if (metadata.browser) updateData['analytics.browser'] = metadata.browser;
      if (metadata.os) updateData['analytics.os'] = metadata.os;
      if (metadata.country) updateData['analytics.country'] = metadata.country;
      if (metadata.region) updateData['analytics.region'] = metadata.region;
      if (metadata.city) updateData['analytics.city'] = metadata.city;
      if (metadata.timezone) updateData['analytics.timezone'] = metadata.timezone;
      if (metadata.referrer) updateData['analytics.referrer'] = metadata.referrer;
      if (metadata.utmSource) updateData['analytics.utmSource'] = metadata.utmSource;
      if (metadata.utmMedium) updateData['analytics.utmMedium'] = metadata.utmMedium;
      if (metadata.utmCampaign) updateData['analytics.utmCampaign'] = metadata.utmCampaign;
      if (metadata.utmTerm) updateData['analytics.utmTerm'] = metadata.utmTerm;
      if (metadata.utmContent) updateData['analytics.utmContent'] = metadata.utmContent;
      if (metadata.revenue) updateData['metadata.revenue'] = metadata.revenue;
      
      await NotificationAnalytics.findByIdAndUpdate(analytics._id, updateData);
    } catch (error) {
      console.error('Track event error:', error);
      throw error;
    }
  }

  // 분석 데이터 생성
  static async createAnalyticsRecord(
    notificationId: string,
    scheduleId: string | null,
    templateId: string | null,
    userId: string,
    type: string,
    category: string,
    metadata: any = {}
  ): Promise<any> {
    try {
      await connectDB();
      
      const analytics = new NotificationAnalytics({
        notificationId: new mongoose.Types.ObjectId(notificationId),
        scheduleId: scheduleId ? new mongoose.Types.ObjectId(scheduleId) : undefined,
        templateId: templateId ? new mongoose.Types.ObjectId(templateId) : undefined,
        userId: new mongoose.Types.ObjectId(userId),
        type,
        category,
        status: 'sent',
        analytics: {
          deliveryTime: 0,
          openCount: 0,
          clickCount: 0,
          conversionCount: 0,
          ...metadata.analytics
        },
        metadata: metadata.metadata || {}
      });
      
      await analytics.save();
      return analytics;
    } catch (error) {
      console.error('Create analytics record error:', error);
      throw error;
    }
  }
}
