import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationSchedule extends Document {
  templateId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  type: 'immediate' | 'scheduled' | 'recurring' | 'triggered';
  status: 'pending' | 'sending' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // 스케줄링 설정
  schedule: {
    immediate?: boolean;
    scheduledAt?: Date;
    recurring?: {
      pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
      interval: number;
      daysOfWeek?: number[];
      dayOfMonth?: number;
      time: string; // HH:MM format
      timezone: string;
      endDate?: Date;
    };
    trigger?: {
      event: string;
      conditions: {
        [key: string]: any;
      };
    };
  };
  
  // 대상 설정
  target: {
    type: 'all' | 'segment' | 'individual' | 'query';
    segments?: mongoose.Types.ObjectId[];
    userIds?: string[];
    query?: {
      [key: string]: any;
    };
    count?: number;
    estimatedCount?: number;
  };
  
  // 메시지 설정
  message: {
    subject?: string;
    title: string;
    content: string;
    htmlContent?: string;
    variables: {
      [key: string]: any;
    };
    channels: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
      inApp?: boolean;
    };
  };
  
  // 실행 설정
  execution: {
    batchSize: number;
    delayBetweenBatches: number; // milliseconds
    maxRetries: number;
    retryInterval: number; // minutes
    timeout: number; // minutes
  };
  
  // 통계
  stats: {
    totalTargets: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    failed: number;
    pending: number;
    startTime?: Date;
    endTime?: Date;
    duration?: number; // milliseconds
  };
  
  // 결과
  results: {
    success: boolean;
    error?: string;
    logs: Array<{
      timestamp: Date;
      level: 'info' | 'warn' | 'error';
      message: string;
      data?: any;
    }>;
  };
  
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  metadata: {
    [key: string]: any;
  };
}

const NotificationScheduleSchema = new Schema<INotificationSchedule>({
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'NotificationTemplate',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    required: true,
    enum: ['immediate', 'scheduled', 'recurring', 'triggered'],
    default: 'immediate'
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'sending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  schedule: {
    immediate: {
      type: Boolean,
      default: false
    },
    scheduledAt: {
      type: Date
    },
    recurring: {
      pattern: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'custom']
      },
      interval: {
        type: Number,
        min: 1,
        default: 1
      },
      daysOfWeek: [{
        type: Number,
        min: 0,
        max: 6
      }],
      dayOfMonth: {
        type: Number,
        min: 1,
        max: 31
      },
      time: {
        type: String,
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      timezone: {
        type: String,
        default: 'Asia/Seoul'
      },
      endDate: {
        type: Date
      }
    },
    trigger: {
      event: {
        type: String,
        trim: true
      },
      conditions: {
        type: Map,
        of: Schema.Types.Mixed
      }
    }
  },
  
  target: {
    type: {
      type: String,
      required: true,
      enum: ['all', 'segment', 'individual', 'query'],
      default: 'all'
    },
    segments: [{
      type: Schema.Types.ObjectId,
      ref: 'CustomerSegment'
    }],
    userIds: [{
      type: String,
      trim: true
    }],
    query: {
      type: Map,
      of: Schema.Types.Mixed
    },
    count: {
      type: Number,
      min: 0
    },
    estimatedCount: {
      type: Number,
      min: 0
    }
  },
  
  message: {
    subject: {
      type: String,
      trim: true,
      maxlength: 200
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    htmlContent: {
      type: String,
      trim: true
    },
    variables: {
      type: Map,
      of: Schema.Types.Mixed
    },
    channels: {
      email: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: false
      },
      sms: {
        type: Boolean,
        default: false
      },
      inApp: {
        type: Boolean,
        default: false
      }
    }
  },
  
  execution: {
    batchSize: {
      type: Number,
      min: 1,
      max: 1000,
      default: 100
    },
    delayBetweenBatches: {
      type: Number,
      min: 0,
      max: 60000,
      default: 1000
    },
    maxRetries: {
      type: Number,
      min: 0,
      max: 10,
      default: 3
    },
    retryInterval: {
      type: Number,
      min: 1,
      max: 1440,
      default: 30
    },
    timeout: {
      type: Number,
      min: 1,
      max: 1440,
      default: 60
    }
  },
  
  stats: {
    totalTargets: {
      type: Number,
      default: 0,
      min: 0
    },
    sent: {
      type: Number,
      default: 0,
      min: 0
    },
    delivered: {
      type: Number,
      default: 0,
      min: 0
    },
    opened: {
      type: Number,
      default: 0,
      min: 0
    },
    clicked: {
      type: Number,
      default: 0,
      min: 0
    },
    converted: {
      type: Number,
      default: 0,
      min: 0
    },
    failed: {
      type: Number,
      default: 0,
      min: 0
    },
    pending: {
      type: Number,
      default: 0,
      min: 0
    },
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number,
      min: 0
    }
  },
  
  results: {
    success: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      trim: true
    },
    logs: [{
      timestamp: {
        type: Date,
        default: Date.now
      },
      level: {
        type: String,
        enum: ['info', 'warn', 'error'],
        required: true
      },
      message: {
        type: String,
        required: true,
        trim: true
      },
      data: {
        type: Schema.Types.Mixed
      }
    }]
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'notification_schedules'
});

// 인덱스
NotificationScheduleSchema.index({ templateId: 1, status: 1 });
NotificationScheduleSchema.index({ status: 1, priority: -1, createdAt: 1 });
NotificationScheduleSchema.index({ 'schedule.scheduledAt': 1 });
NotificationScheduleSchema.index({ 'schedule.recurring.pattern': 1 });
NotificationScheduleSchema.index({ createdBy: 1, createdAt: -1 });
NotificationScheduleSchema.index({ createdAt: -1 });

// 미들웨어
NotificationScheduleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // 통계 계산
  if (this.stats.startTime && this.stats.endTime) {
    this.stats.duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();
  }
  
  next();
});

export default mongoose.models.NotificationSchedule || mongoose.model<INotificationSchedule>('NotificationSchedule', NotificationScheduleSchema);















