import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationSettings extends Document {
  userId: mongoose.Types.ObjectId;

  // 채널별 설정
  channels: {
    email: {
      enabled: boolean;
      frequency: 'immediate' | 'daily' | 'weekly' | 'never';
      quietHours: {
        enabled: boolean;
        start: string; // HH:MM 형식
        end: string;   // HH:MM 형식
        timezone: string;
      };
    };
    push: {
      enabled: boolean;
      frequency: 'immediate' | 'daily' | 'weekly' | 'never';
      quietHours: {
        enabled: boolean;
        start: string;
        end: string;
        timezone: string;
      };
    };
    sms: {
      enabled: boolean;
      frequency: 'immediate' | 'daily' | 'weekly' | 'never';
      quietHours: {
        enabled: boolean;
        start: string;
        end: string;
        timezone: string;
      };
    };
    inApp: {
      enabled: boolean;
      frequency: 'immediate' | 'daily' | 'weekly' | 'never';
    };
  };

  // 알림 타입별 설정
  types: {
    order: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
    payment: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
    shipping: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
    promotion: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
    newsletter: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
    system: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
    marketing: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
    partner: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
    admin: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
  };

  // 긴급 알림 설정
  urgentNotifications: {
    enabled: boolean;
    channels: string[]; // ['email', 'push', 'sms']
    bypassQuietHours: boolean;
  };

  // 알림 요약 설정
  digest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    time: string; // HH:MM 형식
    timezone: string;
    types: string[]; // 요약에 포함할 알림 타입들
  };

  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSettingsSchema = new Schema<INotificationSettings>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // 채널별 설정
  channels: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      frequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly', 'never'],
        default: 'immediate'
      },
      quietHours: {
        enabled: {
          type: Boolean,
          default: false
        },
        start: {
          type: String,
          default: '22:00'
        },
        end: {
          type: String,
          default: '08:00'
        },
        timezone: {
          type: String,
          default: 'Asia/Seoul'
        }
      }
    },
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      frequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly', 'never'],
        default: 'immediate'
      },
      quietHours: {
        enabled: {
          type: Boolean,
          default: true
        },
        start: {
          type: String,
          default: '22:00'
        },
        end: {
          type: String,
          default: '08:00'
        },
        timezone: {
          type: String,
          default: 'Asia/Seoul'
        }
      }
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      frequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly', 'never'],
        default: 'never'
      },
      quietHours: {
        enabled: {
          type: Boolean,
          default: true
        },
        start: {
          type: String,
          default: '22:00'
        },
        end: {
          type: String,
          default: '08:00'
        },
        timezone: {
          type: String,
          default: 'Asia/Seoul'
        }
      }
    },
    inApp: {
      enabled: {
        type: Boolean,
        default: true
      },
      frequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly', 'never'],
        default: 'immediate'
      }
    }
  },

  // 알림 타입별 설정
  types: {
    order: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true }
    },
    payment: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true }
    },
    shipping: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true }
    },
    promotion: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true }
    },
    newsletter: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: false }
    },
    system: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true }
    },
    marketing: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true }
    },
    partner: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true }
    },
    admin: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true }
    }
  },

  // 긴급 알림 설정
  urgentNotifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    channels: [{
      type: String,
      enum: ['email', 'push', 'sms'],
      default: ['email', 'push']
    }],
    bypassQuietHours: {
      type: Boolean,
      default: true
    }
  },

  // 알림 요약 설정
  digest: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'daily'
    },
    time: {
      type: String,
      default: '09:00'
    },
    timezone: {
      type: String,
      default: 'Asia/Seoul'
    },
    types: [{
      type: String,
      enum: ['order', 'payment', 'shipping', 'promotion', 'newsletter', 'system', 'marketing', 'partner', 'admin']
    }]
  }
}, {
  timestamps: true
});

// 기본 설정 생성
NotificationSettingsSchema.statics.createDefault = function (userId: string) {
  return new this({
    userId,
    // 기본 설정은 스키마 기본값 사용
  });
};

export default mongoose.models.NotificationSettings || mongoose.model<INotificationSettings>('NotificationSettings', NotificationSettingsSchema);















