import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationTemplate extends Document {
  name: string;
  description: string;
  type: 'email' | 'push' | 'sms' | 'in_app';
  category: 'order' | 'payment' | 'delivery' | 'promotion' | 'system' | 'marketing' | 'security';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  language: string;
  subject?: string;
  title: string;
  content: string;
  htmlContent?: string;
  variables: {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'array';
    required: boolean;
    description: string;
    defaultValue?: any;
  }[];
  channels: {
    email?: {
      enabled: boolean;
      template: string;
      fromName?: string;
      replyTo?: string;
    };
    push?: {
      enabled: boolean;
      icon?: string;
      image?: string;
      actions?: Array<{
        id: string;
        title: string;
        action: string;
      }>;
    };
    sms?: {
      enabled: boolean;
      from?: string;
    };
    inApp?: {
      enabled: boolean;
      icon?: string;
      color?: string;
      duration?: number;
    };
  };
  conditions?: {
    userSegments?: string[];
    userTags?: string[];
    minOrderValue?: number;
    maxOrderValue?: number;
    productCategories?: string[];
    timeOfDay?: {
      start: string;
      end: string;
    };
    dayOfWeek?: number[];
    timezone?: string;
  };
  scheduling?: {
    enabled: boolean;
    delay?: number; // minutes
    maxRetries?: number;
    retryInterval?: number; // minutes
    expiresAt?: Date;
  };
  analytics?: {
    trackOpens: boolean;
    trackClicks: boolean;
    trackConversions: boolean;
    conversionEvents?: string[];
  };
  status: 'active' | 'inactive' | 'draft';
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  tags: string[];
  metadata: {
    [key: string]: any;
  };
}

const NotificationTemplateSchema = new Schema<INotificationTemplate>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
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
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  language: {
    type: String,
    required: true,
    default: 'ko',
    maxlength: 10
  },
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
  variables: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ['string', 'number', 'date', 'boolean', 'array']
    },
    required: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200
    },
    defaultValue: {
      type: Schema.Types.Mixed
    }
  }],
  channels: {
    email: {
      enabled: {
        type: Boolean,
        default: false
      },
      template: {
        type: String,
        trim: true
      },
      fromName: {
        type: String,
        trim: true,
        maxlength: 100
      },
      replyTo: {
        type: String,
        trim: true,
        maxlength: 200
      }
    },
    push: {
      enabled: {
        type: Boolean,
        default: false
      },
      icon: {
        type: String,
        trim: true
      },
      image: {
        type: String,
        trim: true
      },
      actions: [{
        id: {
          type: String,
          required: true,
          trim: true
        },
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: 50
        },
        action: {
          type: String,
          required: true,
          trim: true
        }
      }]
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      from: {
        type: String,
        trim: true,
        maxlength: 20
      }
    },
    inApp: {
      enabled: {
        type: Boolean,
        default: false
      },
      icon: {
        type: String,
        trim: true
      },
      color: {
        type: String,
        trim: true,
        maxlength: 7
      },
      duration: {
        type: Number,
        min: 1000,
        max: 30000,
        default: 5000
      }
    }
  },
  conditions: {
    userSegments: [{
      type: String,
      trim: true
    }],
    userTags: [{
      type: String,
      trim: true
    }],
    minOrderValue: {
      type: Number,
      min: 0
    },
    maxOrderValue: {
      type: Number,
      min: 0
    },
    productCategories: [{
      type: String,
      trim: true
    }],
    timeOfDay: {
      start: {
        type: String,
        trim: true,
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      end: {
        type: String,
        trim: true,
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      }
    },
    dayOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    timezone: {
      type: String,
      trim: true,
      maxlength: 50
    }
  },
  scheduling: {
    enabled: {
      type: Boolean,
      default: false
    },
    delay: {
      type: Number,
      min: 0,
      max: 10080 // 7 days in minutes
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
      max: 1440, // 24 hours in minutes
      default: 30
    },
    expiresAt: {
      type: Date
    }
  },
  analytics: {
    trackOpens: {
      type: Boolean,
      default: true
    },
    trackClicks: {
      type: Boolean,
      default: true
    },
    trackConversions: {
      type: Boolean,
      default: false
    },
    conversionEvents: [{
      type: String,
      trim: true
    }]
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'draft'],
    default: 'draft'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
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
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'notification_templates'
});

// 인덱스
NotificationTemplateSchema.index({ name: 1, language: 1 }, { unique: true });
NotificationTemplateSchema.index({ type: 1, category: 1 });
NotificationTemplateSchema.index({ status: 1, createdAt: -1 });
NotificationTemplateSchema.index({ tags: 1 });
NotificationTemplateSchema.index({ 'conditions.userSegments': 1 });
NotificationTemplateSchema.index({ createdAt: -1 });

// 미들웨어
NotificationTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

export default mongoose.models.NotificationTemplate || mongoose.model<INotificationTemplate>('NotificationTemplate', NotificationTemplateSchema);















