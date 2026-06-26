import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'member' | 'partner' | 'admin' | 'superadmin';
  grade: 'cedar' | 'rooter' | 'bloomer' | 'glower' | 'ecosoul' | 'reset' | 'reborn' | 'restart' | 'black';
  cachedUnifiedInsight?: {
    title: string;
    description: string;
    suggestion: string;
    habits: string[];
    updatedAt: Date;
  } | null;
  tier: 'RESET' | 'REBORN' | 'RESTART' | 'BLACK'; // 접근 권한 등급
  points: number;
  gender?: 'male' | 'female' | 'other';
  referralCode?: string; // 추천인 아이디
  referredBy?: string; // 추천받은 사용자의 추천인 코드 (원 초대자)
  isNavigator: boolean; // 네비게이터(영업사원) 승인 여부
  recentNavigator?: string; // 가장 최근에 방문/스캔한 네비게이터 코드 (진료 시나리오용 분리)
  provider?: 'local' | 'google' | 'kakao' | 'naver';
  providerId?: string;
  marketingConsent: boolean;
  termsAcceptedAt?: Date;
  privacyAcceptedAt?: Date;
  sensitiveInfoAcceptedAt?: Date;
  thirdPartyAcceptedAt?: Date;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  addresses: Array<{
    _id?: mongoose.Types.ObjectId;
    label: string;
    recipient: string;
    phone: string;
    zip: string;
    addr1: string;
    addr2?: string;
    isDefault: boolean;
  }>;
  wishlist: Array<{
    productId: mongoose.Types.ObjectId;
    addedAt: Date;
  }>;
  // 파트너 관련 필드
  partnerStatus: 'none' | 'pending' | 'approved' | 'rejected' | 'suspended';
  partnerApplication?: {
    partnerType?: 'medical' | 'commerce' | 'trainer' | 'business';
    businessName: string;
    businessNumber: string;
    businessAddress: string;
    businessPhone: string;
    businessDescription: string;
    bankAccount: string;
    bankName: string;
    accountHolder: string;
    businessRegistrationImage?: string; // 사업자등록증 이미지
    bankStatementImage?: string; // 통장사본 이미지
    appliedAt: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    rejectedReason?: string;
    approvedBy?: mongoose.Types.ObjectId;
  };
  partnerSettings?: {
    commissionRate: number; // 수수료율 (기본 10%)
    autoApproval: boolean; // 주문 자동 승인 여부
    notificationEmail: string; // 알림 받을 이메일
    notificationPhone: string; // 알림 받을 전화번호
    emailNotifications?: {
      newOrder: boolean;
      lowStock: boolean;
      paymentReceived: boolean;
      systemUpdates: boolean;
    };
    businessHours?: {
      monday: { open: string; close: string; isOpen: boolean };
      tuesday: { open: string; close: string; isOpen: boolean };
      wednesday: { open: string; close: string; isOpen: boolean };
      thursday: { open: string; close: string; isOpen: boolean };
      friday: { open: string; close: string; isOpen: boolean };
      saturday: { open: string; close: string; isOpen: boolean };
      sunday: { open: string; close: string; isOpen: boolean };
    };
    autoReplyMessage?: string;
    autoReplyEnabled?: boolean;
    shopLogo?: string;
    shopBanner?: string;
  };
  directorProfile?: {
    license?: string;
    career?: string;
    description?: string;
  };
  partnerStats?: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
    lastSettlementAt?: Date;
  };
  notificationSettings?: {
    email: {
      order: boolean;
      shipping: boolean;
      coupon: boolean;
      point: boolean;
      promotion: boolean;
      newsletter: boolean;
    };
    sms: {
      order: boolean;
      shipping: boolean;
      coupon: boolean;
      promotion: boolean;
    };
    push: {
      order: boolean;
      shipping: boolean;
      coupon: boolean;
      point: boolean;
      promotion: boolean;
    };
  };
  paymentMethods?: Array<{
    cardType: 'visa' | 'mastercard' | 'amex' | 'other';
    cardHolder: string;
    expiryMonth: string;
    expiryYear: string;
    encryptedCardNumber: string;
    last4: string;
    isDefault: boolean;
  }>;
  isDeleted?: boolean;
  deletedAt?: Date;
  deleteReason?: {
    reason: string;
    reasonDetail?: string;
    deletedAt: Date;
  };
  subscription?: {
    status: 'active' | 'inactive';
    plan: 'lounge_chat';
    expiresAt: Date;
  };
  passInfo?: {
    type: 'NONE' | 'RESET' | 'REBORN' | 'RESTART' | 'BLACK';
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    startDate?: Date;
    endDate?: Date;
    purchaseDate?: Date;
    navigatorId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  diagnosisResults?: Array<{
    type: 'free' | 'deep' | 'daily';
    scores: Record<string, number>;
    totalScore: number;
    metadata?: any;
    createdAt: Date;
  }>;
  scanTimeline?: Array<{
    type: 'MEAL' | 'SPACE' | 'STATE' | 'POSTURE' | 'POST_OP';
    imageUrl: string;
    score: number;
    summary: string;
    metrics: any;
    createdAt: Date;
  }>;
  dailyStats?: {
    scannerCount: number;
    diagnosisCount: number;
    webtoonCount: number;
    lastResetDate: Date;
  };
  gamification?: {
    lastSnapDate?: Date;
    currentStreak: number;
    highestStreak: number;
    todayCategories: string[];
  };
  medicationHistory?: string[]; // 복용 중인 약물 및 식품 히스토리
  issuedCertificates?: Array<{
    cycleNumber: number;
    issuedAt: Date;
    metadata?: any;
  }>;
  // 모임 플랫폼 연동
  mileRole?: 'director' | 'leader' | 'member' | 'supporter' | null;
  activeTeamId?: mongoose.Types.ObjectId | null;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: function () {
      return this.provider === 'local';
    },
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  avatar: {
    type: String,
  },
  role: {
    type: String,
    enum: ['member', 'partner', 'admin', 'superadmin'],
    default: 'member',
  },
  grade: {
    type: String,
    enum: ['cedar', 'rooter', 'bloomer', 'glower', 'ecosoul', 'reset', 'reborn', 'restart', 'black'],
    default: 'cedar',
  },
  tier: {
    type: String,
    enum: ['RESET', 'REBORN', 'RESTART', 'BLACK'],
    default: 'RESET',
  },
  points: {
    type: Number,
    default: 0,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true, // null 값은 인덱스에서 제외
  },
  referredBy: {
    type: String, // 회원가입 시점에만 등록되는 영구적인 원 초대자
  },
  isNavigator: {
    type: Boolean,
    default: false, // 기본적으로는 네비게이터(영업사원) 아님
  },
  recentNavigator: {
    type: String, // 가장 최근 스캔한 네비게이터 코드
  },
  provider: {
    type: String,
    enum: ['local', 'google', 'kakao', 'naver'],
    default: 'local',
  },
  providerId: {
    type: String,
  },
  marketingConsent: {
    type: Boolean,
    default: false,
  },
  termsAcceptedAt: {
    type: Date,
  },
  privacyAcceptedAt: {
    type: Date,
  },
  sensitiveInfoAcceptedAt: {
    type: Date,
  },
  thirdPartyAcceptedAt: {
    type: Date,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
  },
  emailVerificationExpires: {
    type: Date,
  },
  addresses: [{
    label: { type: String, required: true },
    recipient: { type: String, required: true },
    phone: { type: String, required: false },
    zip: { type: String, required: true },
    addr1: { type: String, required: true },
    addr2: { type: String },
    isDefault: { type: Boolean, default: false }
  }],
  wishlist: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    addedAt: { type: Date, default: Date.now },
  }],
  // 파트너 관련 필드
  partnerStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected', 'suspended'],
    default: 'none'
  },
  partnerApplication: {
    partnerType: {
      type: String,
      enum: ['medical', 'commerce', 'trainer', 'business'],
      default: 'commerce'
    },
    businessName: { type: String, trim: true },
    businessNumber: { type: String, trim: true },
    businessAddress: { type: String, trim: true },
    businessPhone: { type: String, trim: true },
    businessDescription: { type: String, trim: true },
    bankAccount: { type: String, trim: true },
    bankName: { type: String, trim: true },
    accountHolder: { type: String, trim: true },
    businessRegistrationImage: { type: String, trim: true },
    bankStatementImage: { type: String, trim: true },
    appliedAt: { type: Date },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectedReason: { type: String, trim: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  partnerSettings: {
    commissionRate: { type: Number, default: 10, min: 0, max: 50 },
    autoApproval: { type: Boolean, default: false },
    notificationEmail: { type: String, trim: true },
    notificationPhone: { type: String, trim: true },
    emailNotifications: {
      newOrder: { type: Boolean, default: true },
      lowStock: { type: Boolean, default: true },
      paymentReceived: { type: Boolean, default: true },
      systemUpdates: { type: Boolean, default: true }
    },
    businessHours: {
      type: Map,
      of: new Schema({
        open: { type: String, default: '09:00' },
        close: { type: String, default: '18:00' },
        isOpen: { type: Boolean, default: true }
      }, { _id: false })
    },
    autoReplyMessage: { type: String, trim: true },
    autoReplyEnabled: { type: Boolean, default: false },
    shopLogo: { type: String, trim: true },
    shopBanner: { type: String, trim: true }
  },
  directorProfile: {
    license: { type: String },
    career: { type: String },
    description: { type: String }
  },
  partnerStats: {
    totalProducts: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalCommission: { type: Number, default: 0 },
    lastSettlementAt: { type: Date }
  },
  notificationSettings: {
    email: {
      order: { type: Boolean, default: true },
      shipping: { type: Boolean, default: true },
      coupon: { type: Boolean, default: true },
      point: { type: Boolean, default: true },
      promotion: { type: Boolean, default: false },
      newsletter: { type: Boolean, default: false },
    },
    sms: {
      order: { type: Boolean, default: true },
      shipping: { type: Boolean, default: true },
      coupon: { type: Boolean, default: false },
      promotion: { type: Boolean, default: false },
    },
    push: {
      order: { type: Boolean, default: true },
      shipping: { type: Boolean, default: true },
      coupon: { type: Boolean, default: true },
      point: { type: Boolean, default: true },
      promotion: { type: Boolean, default: false },
    },
  },
  paymentMethods: [{
    cardType: { type: String, enum: ['visa', 'mastercard', 'amex', 'other'], default: 'other' },
    cardHolder: { type: String, required: true },
    expiryMonth: { type: String, required: true },
    expiryYear: { type: String, required: true },
    encryptedCardNumber: { type: String, required: true },
    last4: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  }],
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deleteReason: {
    reason: { type: String },
    reasonDetail: { type: String },
    deletedAt: { type: Date },
  },
  subscription: {
    status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
    plan: { type: String, enum: ['lounge_chat'] },
    expiresAt: { type: Date }
  },
  passInfo: {
    type: { type: String, enum: ['NONE', 'RESET', 'REBORN', 'RESTART', 'BLACK'], default: 'NONE' },
    status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'], default: 'ACTIVE' },
    startDate: { type: Date },
    endDate: { type: Date },
    purchaseDate: { type: Date },
    navigatorId: { type: String }
  },
  diagnosisResults: [{
    type: { type: String, enum: ['free', 'deep', 'daily'], required: true },
    scores: { type: Map, of: Number },
    totalScore: { type: Number },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
  }],
  scanTimeline: [{
    type: { type: String, enum: ['MEAL', 'SPACE', 'STATE', 'POSTURE', 'POST_OP'], required: true },
    imageUrl: { type: String, required: true },
    score: { type: Number },
    summary: { type: String },
    metrics: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
  }],
  cachedUnifiedInsight: {
    title: { type: String },
    description: { type: String },
    suggestion: { type: String },
    habits: [{ type: String }],
    updatedAt: { type: Date }
  },
  dailyStats: {
    scannerCount: { type: Number, default: 0 },
    diagnosisCount: { type: Number, default: 0 },
    webtoonCount: { type: Number, default: 0 },
    completedRoutines: [{ type: String }], // Track which of the 3 daily routines are done
    lastResetDate: { type: Date, default: Date.now }
  },
  gamification: {
    lastSnapDate: { type: Date },
    currentStreak: { type: Number, default: 0 },
    highestStreak: { type: Number, default: 0 },
    todayCategories: [{ type: String }]
  },
  medicationHistory: [{ type: String, trim: true }],
  issuedCertificates: [{
    cycleNumber: { type: Number, required: true },
    issuedAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed }
  }],
  // 모임 플랫폼 연동
  mileRole: {
    type: String,
    enum: ['director', 'leader', 'member', 'supporter', null],
    default: null,
  },
  activeTeamId: {
    type: Schema.Types.ObjectId,
    ref: 'MileTeam',
    default: null,
  }
}, {
  timestamps: true,
});

// 저장 전 추천 코드 자동 생성 (누락 방지)
UserSchema.pre('save', function(this: any, next) {
  if (!this.referralCode) {
    const idStr = this._id.toString();
    const base = idStr.slice(-6).toUpperCase();
    this.referralCode = `RF${base}`;
    console.log(`[Model/User] Generated missing referralCode: ${this.referralCode} for ${this.email}`);
  }
  next();
});

// 멤버십 등급 및 티어 자동 동기화 훅
UserSchema.pre('save', function(this: any, next) {
  if (this.isModified('passInfo.type')) {
    const passType = this.passInfo?.type || 'NONE';
    
    // Tier 동기화 (대문자)
    if (['RESET', 'REBORN', 'RESTART', 'BLACK'].includes(passType)) {
      this.tier = passType;
    } else {
      this.tier = 'RESET';
    }

    // Grade 동기화 (소문자)
    // 기존 성장형 등급(cedar 등)을 덮어쓰지 않기 위해 멤버십 관련 타입일 때만 동기화
    if (['RESET', 'REBORN', 'RESTART', 'BLACK'].includes(passType)) {
      this.grade = passType.toLowerCase();
    }
  }
  next();
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

