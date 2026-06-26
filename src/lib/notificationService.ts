import mongoose from 'mongoose';
import Notification from '@/models/Notification';
import NotificationSettings from '@/models/NotificationSettings';
import User from '@/models/User';
import { sendEmail } from './email';
import { sendPushNotification } from './pushNotification';
import { sendSMS } from './sms';

export interface NotificationData {
  userId: string;
  type: 'order' | 'payment' | 'shipping' | 'promotion' | 'newsletter' | 'system' | 'marketing' | 'partner' | 'admin';
  category: 'info' | 'success' | 'warning' | 'error' | 'urgent';
  title: string;
  message: string;
  data?: any;
  priority?: number;
  expiresAt?: Date;
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
  tags?: string[];
  source: string;
}

export class NotificationService {
  // 알림 생성 및 전송
  static async sendNotification(data: NotificationData): Promise<boolean> {
    try {
      // 사용자 알림 설정 조회
      const settings = await NotificationSettings.findOne({ userId: data.userId });
      if (!settings) {
        // 기본 설정 생성
        await NotificationSettings.create({
          userId: data.userId,
          email: { enabled: true, frequency: 'immediate' },
          push: { enabled: true, frequency: 'immediate' },
          sms: { enabled: false, frequency: 'daily' },
          inApp: { enabled: true, frequency: 'immediate' }
        });
        return await this.sendNotification(data);
      }

      // 알림 생성
      const notification = new Notification({
        ...data,
        channels: this.getChannelsForType(settings, data.type),
        priority: data.priority || 5
      });

      await notification.save();

      // 채널별 전송
      const results = await this.sendToChannels(notification, settings);

      // 전송 결과 업데이트
      notification.deliveryResults = results;
      notification.status = this.getOverallStatus(results);
      notification.sentAt = new Date();
      
      if (notification.status === 'delivered') {
        notification.deliveredAt = new Date();
      }

      await notification.save();

      return notification.status !== 'failed';

    } catch (error) {
      console.error('Notification sending error:', error);
      return false;
    }
  }

  // 사용자별 알림 목록 조회
  static async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: string,
    status?: string
  ) {
    const filter: any = { userId };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Notification.countDocuments(filter);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // 알림 읽음 처리
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { 
          status: 'read',
          readAt: new Date()
        },
        { new: true }
      );

      return !!notification;
    } catch (error) {
      console.error('Mark as read error:', error);
      return false;
    }
  }

  // 모든 알림 읽음 처리
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await Notification.updateMany(
        { userId, status: { $ne: 'read' } },
        { 
          status: 'read',
          readAt: new Date()
        }
      );

      return true;
    } catch (error) {
      console.error('Mark all as read error:', error);
      return false;
    }
  }

  // 읽지 않은 알림 개수 조회
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await Notification.countDocuments({
        userId,
        status: { $ne: 'read' }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  // 알림 설정 조회
  static async getNotificationSettings(userId: string) {
    try {
      let settings = await NotificationSettings.findOne({ userId });
      
      if (!settings) {
        settings = await NotificationSettings.create({
          userId: userId,
          email: { enabled: true, frequency: 'immediate' },
          push: { enabled: true, frequency: 'immediate' },
          sms: { enabled: false, frequency: 'daily' },
          inApp: { enabled: true, frequency: 'immediate' }
        });
      }

      return settings;
    } catch (error) {
      console.error('Get notification settings error:', error);
      return null;
    }
  }

  // 알림 설정 업데이트
  static async updateNotificationSettings(userId: string, settings: any): Promise<boolean> {
    try {
      await NotificationSettings.findOneAndUpdate(
        { userId },
        settings,
        { upsert: true, new: true }
      );

      return true;
    } catch (error) {
      console.error('Update notification settings error:', error);
      return false;
    }
  }

  // 알림 삭제
  static async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await Notification.deleteOne({
        _id: notificationId,
        userId
      });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('Delete notification error:', error);
      return false;
    }
  }

  // 만료된 알림 정리
  static async cleanupExpiredNotifications(): Promise<number> {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      return result.deletedCount;
    } catch (error) {
      console.error('Cleanup expired notifications error:', error);
      return 0;
    }
  }

  // 알림 통계 조회
  static async getNotificationStats(userId: string) {
    try {
      const stats = await Notification.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: {
              $sum: {
                $cond: [{ $ne: ['$status', 'read'] }, 1, 0]
              }
            },
            byType: {
              $push: {
                type: '$type',
                status: '$status'
              }
            }
          }
        }
      ]);

      return stats[0] || { total: 0, unread: 0, byType: [] };
    } catch (error) {
      console.error('Get notification stats error:', error);
      return { total: 0, unread: 0, byType: [] };
    }
  }

  // 타입별 채널 설정 조회
  private static getChannelsForType(settings: any, type: string) {
    const typeSettings = settings.types[type];
    if (!typeSettings) {
      return { email: true, push: true, sms: false, inApp: true };
    }

    return {
      email: typeSettings.email && settings.channels.email.enabled,
      push: typeSettings.push && settings.channels.push.enabled,
      sms: typeSettings.sms && settings.channels.sms.enabled,
      inApp: typeSettings.inApp && settings.channels.inApp.enabled
    };
  }

  // 채널별 전송
  private static async sendToChannels(notification: any, settings: any) {
    const results: any = {};

    // 이메일 전송
    if (notification.channels.email) {
      try {
        const user = await User.findById(notification.userId);
        if (user) {
          try {
            await this.sendEmailNotification(notification, user.email, user.name);
            results.email = {
              success: true,
              error: null,
              sentAt: new Date()
            };
          } catch (error) {
            results.email = {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              sentAt: new Date()
            };
          }
        }
      } catch (error) {
        results.email = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          sentAt: new Date()
        };
      }
    }

    // 푸시 알림 전송
    if (notification.channels.push) {
      try {
        const pushResult = await this.sendPushNotification(notification);
        results.push = {
          success: pushResult.success,
          error: pushResult.error,
          sentAt: new Date()
        };
      } catch (error) {
        results.push = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          sentAt: new Date()
        };
      }
    }

    // SMS 전송
    if (notification.channels.sms) {
      try {
        const user = await User.findById(notification.userId);
        if (user && user.phone) {
          const smsResult = await this.sendSMSNotification(notification, user.phone);
          results.sms = {
            success: smsResult.success,
            error: smsResult.error,
            sentAt: new Date()
          };
        }
      } catch (error) {
        results.sms = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          sentAt: new Date()
        };
      }
    }

    // 인앱 알림 (항상 성공으로 처리)
    if (notification.channels.inApp) {
      results.inApp = {
        success: true,
        sentAt: new Date()
      };
    }

    return results;
  }

  // 이메일 알림 전송
  private static async sendEmailNotification(notification: any, email: string, name: string) {
    const subject = `[Youniqle] ${notification.title}`;
    const html = this.generateEmailTemplate(notification, name);

    return await sendEmail(email, subject, html);
  }

  // 푸시 알림 전송
  private static async sendPushNotification(notification: any) {
    return await sendPushNotification({
      userId: notification.userId,
      title: notification.title,
      body: notification.message,
      data: notification.data
    });
  }

  // SMS 알림 전송
  private static async sendSMSNotification(notification: any, phone: string) {
    const message = `${notification.title}\n${notification.message}`;
    return await sendSMS({
      to: phone,
      message: message
    });
  }

  // 이메일 템플릿 생성
  private static generateEmailTemplate(notification: any, name: string): string {
    const categoryColors = {
      info: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      urgent: '#DC2626'
    };

    const color = categoryColors[notification.category as keyof typeof categoryColors] || '#3B82F6';

    return `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #3B82F6, #10B981); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Youniqle</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">프리미엄을 더 공정하게</p>
        </div>
        
        <div style="padding: 40px; background: #ffffff;">
          <div style="border-left: 4px solid ${color}; padding-left: 20px; margin-bottom: 20px;">
            <h2 style="color: #1F2937; margin: 0 0 10px 0; font-size: 24px;">${notification.title}</h2>
            <p style="color: #6B7280; font-size: 16px; line-height: 1.6; margin: 0;">${notification.message}</p>
          </div>
          
          ${notification.actions && notification.actions.length > 0 ? `
            <div style="text-align: center; margin: 30px 0;">
              ${notification.actions.map((action: any) => `
                <a href="${action.url || '#'}" 
                   style="display: inline-block; background: ${action.style === 'danger' ? '#EF4444' : action.style === 'secondary' ? '#6B7280' : '#3B82F6'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px;">
                  ${action.label}
                </a>
              `).join('')}
            </div>
          ` : ''}
        </div>
        
        <div style="background: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; font-size: 12px; margin: 0;">
            © 2024 Youniqle. All rights reserved.<br>
            서울특별시 강동구 고덕비즈밸리로 26 | 1577-0729
          </p>
        </div>
      </div>
    `;
  }

  // 전체 전송 상태 계산
  private static getOverallStatus(results: any): string {
    const hasSuccess = Object.values(results).some((result: any) => result.success);
    const hasFailure = Object.values(results).some((result: any) => !result.success);

    if (hasSuccess && !hasFailure) return 'delivered';
    if (hasSuccess && hasFailure) return 'sent';
    return 'failed';
  }
}
