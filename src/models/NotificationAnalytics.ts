import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationAnalytics extends Document {
  notificationId: mongoose.Types.ObjectId;
  scheduleId?: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'email' | 'push' | 'sms' | 'in_app';
  category: 'order' | 'payment' | 'delivery' | 'promotion' | 'system' | 'marketing' | 'security';
  
  // 전송 정보
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  convertedAt?: Date;
  
  // 상태
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'converted' | 'failed' | 'bounced' | 'unsubscribed';
  error?: string;
  
  // 분석 데이터
  analytics: {
    // 전송 분석
    deliveryTime: number; // milliseconds
    openTime?: number; // milliseconds from sent
    clickTime?: number; // milliseconds from sent
    conversionTime?: number; // milliseconds from sent
    
    // 사용자 행동
    openCount: number;
    clickCount: number;
    conversionCount: number;
    
    // 디바이스 정보
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    browser?: string;
    os?: string;
    
    // 위치 정보
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    
    // 참조 정보
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
  };
  
  // 메타데이터
  metadata: {
    [key: string]: any;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const NotificationAnalyticsSchema = new Schema<INotificationAnalytics>({
  notificationId: {
    type: Schema.Types.ObjectId,
    ref: 'Notification',
    required: true
  },
  scheduleId: {
    type: Schema.Types.ObjectId,
    ref: 'NotificationSchedule'
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'NotificationTemplate'
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['email', 'push', 'sms', 'in_app']
  },
  category: {
    type: String,
    required: true,
    enum: ['order', 'payment', 'delivery', 'promotion', 'system', 'marketing', 'security']
  },
  
  sentAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  deliveredAt: {
    type: Date
  },
  openedAt: {
    type: Date
  },
  clickedAt: {
    type: Date
  },
  convertedAt: {
    type: Date
  },
  
  status: {
    type: String,
    required: true,
    enum: ['sent', 'delivered', 'opened', 'clicked', 'converted', 'failed', 'bounced', 'unsubscribed'],
    default: 'sent'
  },
  error: {
    type: String,
    trim: true
  },
  
  analytics: {
    deliveryTime: {
      type: Number,
      default: 0,
      min: 0
    },
    openTime: {
      type: Number,
      min: 0
    },
    clickTime: {
      type: Number,
      min: 0
    },
    conversionTime: {
      type: Number,
      min: 0
    },
    openCount: {
      type: Number,
      default: 0,
      min: 0
    },
    clickCount: {
      type: Number,
      default: 0,
      min: 0
    },
    conversionCount: {
      type: Number,
      default: 0,
      min: 0
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet']
    },
    browser: {
      type: String,
      trim: true
    },
    os: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      maxlength: 2
    },
    region: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    timezone: {
      type: String,
      trim: true
    },
    referrer: {
      type: String,
      trim: true
    },
    utmSource: {
      type: String,
      trim: true
    },
    utmMedium: {
      type: String,
      trim: true
    },
    utmCampaign: {
      type: String,
      trim: true
    },
    utmTerm: {
      type: String,
      trim: true
    },
    utmContent: {
      type: String,
      trim: true
    }
  },
  
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'notification_analytics'
});

// 인덱스
NotificationAnalyticsSchema.index({ notificationId: 1 });
NotificationAnalyticsSchema.index({ scheduleId: 1 });
NotificationAnalyticsSchema.index({ templateId: 1 });
NotificationAnalyticsSchema.index({ userId: 1 });
NotificationAnalyticsSchema.index({ type: 1, category: 1 });
NotificationAnalyticsSchema.index({ status: 1, sentAt: -1 });
NotificationAnalyticsSchema.index({ sentAt: -1 });
NotificationAnalyticsSchema.index({ 'analytics.deviceType': 1 });
NotificationAnalyticsSchema.index({ 'analytics.country': 1 });
NotificationAnalyticsSchema.index({ createdAt: -1 });

// 미들웨어
NotificationAnalyticsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // 전송 시간 계산
  if (this.deliveredAt) {
    this.analytics.deliveryTime = this.deliveredAt.getTime() - this.sentAt.getTime();
  }
  
  // 열람 시간 계산
  if (this.openedAt) {
    this.analytics.openTime = this.openedAt.getTime() - this.sentAt.getTime();
  }
  
  // 클릭 시간 계산
  if (this.clickedAt) {
    this.analytics.clickTime = this.clickedAt.getTime() - this.sentAt.getTime();
  }
  
  // 전환 시간 계산
  if (this.convertedAt) {
    this.analytics.conversionTime = this.convertedAt.getTime() - this.sentAt.getTime();
  }
  
  next();
});

export default mongoose.models.NotificationAnalytics || mongoose.model<INotificationAnalytics>('NotificationAnalytics', NotificationAnalyticsSchema);















