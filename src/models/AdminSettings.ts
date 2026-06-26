import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminSettings extends Document {
  general: {
    siteName: string;
    siteDescription: string;
    siteLogo?: string;
    siteFavicon?: string;
    defaultLanguage: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    currencySymbol: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
  };
  security: {
    enableTwoFactor: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    requireStrongPassword: boolean;
    passwordMinLength: number;
    enableCaptcha: boolean;
    allowedFileTypes: string[];
    maxFileSize: number;
    enableRateLimiting: boolean;
    rateLimitWindow: number;
    rateLimitMax: number;
  };
  notifications: {
    emailNotifications: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    smtpSecure: boolean;
    fromEmail: string;
    fromName: string;
    adminEmails: string[];
    orderNotifications: boolean;
    userNotifications: boolean;
    systemNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
  };
  payment: {
    defaultPaymentMethod: string;
    enablePaypal: boolean;
    paypalClientId: string;
    paypalClientSecret: string;
    enableStripe: boolean;
    stripePublishableKey: string;
    stripeSecretKey: string;
    enableNicepay: boolean;
    nicepayMid: string;
    nicepaySecretKey: string;
    enableEscrow: boolean;
    escrowCommission: number;
    enableRefund: boolean;
    refundPeriod: number;
  };
  business: {
    companyName: string;
    businessNumber: string;
    ceoName: string;
    address: string;
    phone: string;
    email: string;
    taxRate: number;
    shippingCost: number;
    freeShippingThreshold: number;
    returnPolicy: string;
    privacyPolicy: string;
    termsOfService: string;
    commissionRate: number;
    partnerApprovalRequired: boolean;
    autoApprovePartners: boolean;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    googleAnalyticsId: string;
    googleTagManagerId: string;
    facebookPixelId: string;
    enableSitemap: boolean;
    enableRobotsTxt: boolean;
    canonicalUrl: string;
  };
  performance: {
    enableCaching: boolean;
    cacheDuration: number;
    enableImageOptimization: boolean;
    enableLazyLoading: boolean;
    enableCompression: boolean;
    maxConcurrentRequests: number;
    enableCdn: boolean;
    cdnUrl: string;
  };
  backup: {
    enableAutoBackup: boolean;
    backupFrequency: string;
    backupRetention: number;
    backupLocation: string;
    enableDatabaseBackup: boolean;
    enableFileBackup: boolean;
    backupNotifications: boolean;
  };
  ai: {
    availableTextModels: string[];
    availableImageModels: string[];
    lastModelRefresh?: Date;
    activeTextTier1?: string;
    activeTextTier2?: string;
    activeTextTier3?: string;
  };
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSettingsSchema = new Schema<IAdminSettings>({
  general: {
    siteName: {
      type: String,
      required: true,
      default: 'Youniqle'
    },
    siteDescription: {
      type: String,
      required: true,
      default: '프리미엄 온라인 쇼핑 플랫폼'
    },
    siteLogo: {
      type: String,
      default: ''
    },
    siteFavicon: {
      type: String,
      default: ''
    },
    defaultLanguage: {
      type: String,
      enum: ['ko', 'en', 'zh'],
      default: 'ko'
    },
    timezone: {
      type: String,
      default: 'Asia/Seoul'
    },
    dateFormat: {
      type: String,
      default: 'YYYY-MM-DD'
    },
    currency: {
      type: String,
      enum: ['KRW', 'USD', 'EUR'],
      default: 'KRW'
    },
    currencySymbol: {
      type: String,
      default: '₩'
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      default: '현재 시스템 점검 중입니다. 잠시 후 다시 방문해 주세요.'
    }
  },
  security: {
    enableTwoFactor: {
      type: Boolean,
      default: false
    },
    sessionTimeout: {
      type: Number,
      default: 60,
      min: 5,
      max: 480
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: 3,
      max: 10
    },
    lockoutDuration: {
      type: Number,
      default: 30,
      min: 5,
      max: 1440
    },
    requireStrongPassword: {
      type: Boolean,
      default: true
    },
    passwordMinLength: {
      type: Number,
      default: 8,
      min: 6,
      max: 20
    },
    enableCaptcha: {
      type: Boolean,
      default: false
    },
    allowedFileTypes: [{
      type: String,
      enum: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar']
    }],
    maxFileSize: {
      type: Number,
      default: 10,
      min: 1,
      max: 100
    },
    enableRateLimiting: {
      type: Boolean,
      default: true
    },
    rateLimitWindow: {
      type: Number,
      default: 15,
      min: 1,
      max: 60
    },
    rateLimitMax: {
      type: Number,
      default: 100,
      min: 10,
      max: 1000
    }
  },
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smtpHost: {
      type: String,
      default: 'smtp.gmail.com'
    },
    smtpPort: {
      type: Number,
      default: 587,
      min: 1,
      max: 65535
    },
    smtpUser: {
      type: String,
      default: ''
    },
    smtpPassword: {
      type: String,
      default: ''
    },
    smtpSecure: {
      type: Boolean,
      default: true
    },
    fromEmail: {
      type: String,
      default: 'noreply@youniqle.com'
    },
    fromName: {
      type: String,
      default: 'Youniqle'
    },
    adminEmails: [{
      type: String,
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: '올바른 이메일 형식이 아닙니다.'
      }
    }],
    orderNotifications: {
      type: Boolean,
      default: true
    },
    userNotifications: {
      type: Boolean,
      default: true
    },
    systemNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: false
    },
    smsNotifications: {
      type: Boolean,
      default: false
    }
  },
  payment: {
    defaultPaymentMethod: {
      type: String,
      enum: ['card', 'bank', 'paypal', 'nicepay'],
      default: 'card'
    },
    enablePaypal: {
      type: Boolean,
      default: false
    },
    paypalClientId: {
      type: String,
      default: ''
    },
    paypalClientSecret: {
      type: String,
      default: ''
    },
    enableStripe: {
      type: Boolean,
      default: false
    },
    stripePublishableKey: {
      type: String,
      default: ''
    },
    stripeSecretKey: {
      type: String,
      default: ''
    },
    enableNicepay: {
      type: Boolean,
      default: true
    },
    nicepayMid: {
      type: String,
      default: ''
    },
    nicepaySecretKey: {
      type: String,
      default: ''
    },
    enableEscrow: {
      type: Boolean,
      default: true
    },
    escrowCommission: {
      type: Number,
      default: 3.5,
      min: 0,
      max: 10
    },
    enableRefund: {
      type: Boolean,
      default: true
    },
    refundPeriod: {
      type: Number,
      default: 7,
      min: 1,
      max: 30
    }
  },
  business: {
    companyName: {
      type: String,
      default: '주식회사 사피에넷'
    },
    businessNumber: {
      type: String,
      default: '000-00-00000'
    },
    ceoName: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: 'admin@youniqle.com',
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: '올바른 이메일 형식이 아닙니다.'
      }
    },
    taxRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 50
    },
    shippingCost: {
      type: Number,
      default: 3000,
      min: 0
    },
    freeShippingThreshold: {
      type: Number,
      default: 50000,
      min: 0
    },
    returnPolicy: {
      type: String,
      default: ''
    },
    privacyPolicy: {
      type: String,
      default: ''
    },
    termsOfService: {
      type: String,
      default: ''
    },
    commissionRate: {
      type: Number,
      default: 5,
      min: 0,
      max: 20
    },
    partnerApprovalRequired: {
      type: Boolean,
      default: true
    },
    autoApprovePartners: {
      type: Boolean,
      default: false
    }
  },
  seo: {
    metaTitle: {
      type: String,
      default: 'Youniqle - 프리미엄 온라인 쇼핑',
      maxlength: 60
    },
    metaDescription: {
      type: String,
      default: '최고 품질의 상품을 합리적인 가격에 만나보세요',
      maxlength: 160
    },
    metaKeywords: {
      type: String,
      default: '쇼핑, 온라인, 프리미엄, 상품'
    },
    googleAnalyticsId: {
      type: String,
      default: ''
    },
    googleTagManagerId: {
      type: String,
      default: ''
    },
    facebookPixelId: {
      type: String,
      default: ''
    },
    enableSitemap: {
      type: Boolean,
      default: true
    },
    enableRobotsTxt: {
      type: Boolean,
      default: true
    },
    canonicalUrl: {
      type: String,
      default: 'https://youniqle.com'
    }
  },
  performance: {
    enableCaching: {
      type: Boolean,
      default: true
    },
    cacheDuration: {
      type: Number,
      default: 3600,
      min: 300,
      max: 86400
    },
    enableImageOptimization: {
      type: Boolean,
      default: true
    },
    enableLazyLoading: {
      type: Boolean,
      default: true
    },
    enableCompression: {
      type: Boolean,
      default: true
    },
    maxConcurrentRequests: {
      type: Number,
      default: 100,
      min: 10,
      max: 1000
    },
    enableCdn: {
      type: Boolean,
      default: false
    },
    cdnUrl: {
      type: String,
      default: ''
    }
  },
  backup: {
    enableAutoBackup: {
      type: Boolean,
      default: true
    },
    backupFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    backupRetention: {
      type: Number,
      default: 30,
      min: 7,
      max: 365
    },
    backupLocation: {
      type: String,
      default: '/backup'
    },
    enableDatabaseBackup: {
      type: Boolean,
      default: true
    },
    enableFileBackup: {
      type: Boolean,
      default: true
    },
    backupNotifications: {
      type: Boolean,
      default: true
    }
  },
  ai: {
    availableTextModels: [String],
    availableImageModels: [String],
    lastModelRefresh: {
      type: Date,
      default: Date.now
    },
    activeTextTier1: String,
    activeTextTier2: String,
    activeTextTier3: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 인덱스 생성
AdminSettingsSchema.index({ createdAt: -1 });

export default mongoose.models.AdminSettings || mongoose.model<IAdminSettings>('AdminSettings', AdminSettingsSchema);
