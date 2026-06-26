import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'order' | 'payment' | 'shipping' | 'promotion' | 'newsletter' | 'system' | 'marketing' | 'partner' | 'admin';
  category: 'info' | 'success' | 'warning' | 'error' | 'urgent';
  title: string;
  message: string;
  data?: any; // 추가 데이터 (주문번호, 링크 등)

  // 알림 채널
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };

  // 전송 상태
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;

  // 전송 결과
  deliveryResults?: {
    email?: {
      success: boolean;
      error?: string;
      sentAt: Date;
    };
    push?: {
      success: boolean;
      error?: string;
      sentAt: Date;
    };
    sms?: {
      success: boolean;
      error?: string;
      sentAt: Date;
    };
    inApp?: {
      success: boolean;
      sentAt: Date;
    };
  };

  // 우선순위 (1-10, 높을수록 우선)
  priority: number;

  // 만료 시간
  expiresAt?: Date;

  // 액션 버튼
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
    style?: 'primary' | 'secondary' | 'danger';
  }>;

  // 메타데이터
  tags: string[];
  source: string; // 알림을 생성한 시스템/사용자
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['order', 'payment', 'shipping', 'promotion', 'newsletter', 'system', 'marketing', 'partner', 'admin'],
    required: true
  },
  category: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'urgent'],
    default: 'info'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  data: {
    type: Schema.Types.Mixed
  },

  // 알림 채널
  channels: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    inApp: {
      type: Boolean,
      default: true
    }
  },

  // 전송 상태
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
    default: 'pending'
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  readAt: {
    type: Date
  },

  // 전송 결과
  deliveryResults: {
    email: {
      success: Boolean,
      error: String,
      sentAt: Date
    },
    push: {
      success: Boolean,
      error: String,
      sentAt: Date
    },
    sms: {
      success: Boolean,
      error: String,
      sentAt: Date
    },
    inApp: {
      success: Boolean,
      sentAt: Date
    }
  },

  // 우선순위
  priority: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },

  // 만료 시간
  expiresAt: {
    type: Date
  },

  // 액션 버튼
  actions: [{
    label: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true
    },
    url: String,
    style: {
      type: String,
      enum: ['primary', 'secondary', 'danger'],
      default: 'primary'
    }
  }],

  // 메타데이터
  tags: [{
    type: String,
    trim: true
  }],
  source: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// 인덱스 설정
NotificationSchema.index({ userId: 1, status: 1 });
NotificationSchema.index({ userId: 1, type: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, priority: -1 });
// TTL 인덱스: 만료된 알림 자동 삭제 (설정된 만료 시간에 즉시 삭제)
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 가상 필드: 읽지 않은 알림 여부
NotificationSchema.virtual('isUnread').get(function () {
  return this.status !== 'read' && !this.readAt;
});

// 가상 필드: 만료 여부
NotificationSchema.virtual('isExpired').get(function () {
  return this.expiresAt && this.expiresAt < new Date();
});

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);











