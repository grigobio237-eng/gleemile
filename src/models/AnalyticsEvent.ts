import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  eventType: 'page_view' | 'click' | 'conversion' | 'purchase' | 'email_open' | 'email_click' | 'newsletter_subscribe' | 'newsletter_unsubscribe' | 'coupon_use' | 'promotion_view' | 'ab_test_view' | 'ab_test_conversion' | 'search' | 'add_to_cart' | 'remove_from_cart' | 'checkout_start' | 'checkout_complete' | 'custom';
  eventCategory: 'marketing' | 'ecommerce' | 'user_behavior' | 'system' | 'ab_test';
  userId?: mongoose.Types.ObjectId;
  sessionId: string;
  timestamp: Date;
  
  // 이벤트 데이터
  eventData: {
    // 페이지 뷰
    pageUrl?: string;
    pageTitle?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    
    // 클릭 이벤트
    clickElement?: string;
    clickText?: string;
    clickUrl?: string;
    clickPosition?: { x: number; y: number };
    
    // 전환 이벤트
    conversionValue?: number;
    conversionCurrency?: string;
    conversionType?: string;
    
    // 구매 이벤트
    orderId?: mongoose.Types.ObjectId;
    productId?: mongoose.Types.ObjectId;
    productName?: string;
    productCategory?: string;
    productPrice?: number;
    quantity?: number;
    totalAmount?: number;
    
    // 이메일 이벤트
    emailId?: string;
    emailSubject?: string;
    emailCampaign?: string;
    emailTemplate?: string;
    
    // 뉴스레터 이벤트
    newsletterId?: mongoose.Types.ObjectId;
    newsletterName?: string;
    
    // 쿠폰 이벤트
    couponId?: mongoose.Types.ObjectId;
    couponCode?: string;
    discountAmount?: number;
    
    // 프로모션 이벤트
    promotionId?: mongoose.Types.ObjectId;
    promotionName?: string;
    promotionType?: string;
    
    // A/B 테스트 이벤트
    abTestId?: mongoose.Types.ObjectId;
    abTestName?: string;
    variantName?: string;
    
    // 검색 이벤트
    searchQuery?: string;
    searchResults?: number;
    searchFilters?: Record<string, any>;
    
    // 장바구니 이벤트
    cartId?: string;
    cartItems?: Array<{
      productId: mongoose.Types.ObjectId;
      productName: string;
      quantity: number;
      price: number;
    }>;
    
    // 체크아웃 이벤트
    checkoutStep?: string;
    paymentMethod?: string;
    shippingMethod?: string;
    
    // 사용자 정의 이벤트
    customData?: Record<string, any>;
  };
  
  // 사용자 정보 (스냅샷)
  userInfo: {
    isLoggedIn: boolean;
    userType?: 'guest' | 'user' | 'partner' | 'admin';
    registrationDate?: Date;
    lastLoginDate?: Date;
    totalSpent?: number;
    orderCount?: number;
    segmentIds?: mongoose.Types.ObjectId[];
  };
  
  // 디바이스 정보
  deviceInfo: {
    userAgent: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    screenResolution: string;
    viewportSize: string;
    language: string;
    timezone: string;
  };
  
  // 위치 정보
  locationInfo: {
    ipAddress: string;
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  
  // 성능 정보
  performanceInfo: {
    pageLoadTime?: number;
    domContentLoadedTime?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    firstInputDelay?: number;
    cumulativeLayoutShift?: number;
  };
  
  // 마케팅 정보
  marketingInfo: {
    campaignId?: string;
    campaignName?: string;
    adGroupId?: string;
    adGroupName?: string;
    keyword?: string;
    creativeId?: string;
    placementId?: string;
    network?: string;
  };
  
  // 세션 정보
  sessionInfo: {
    sessionStartTime: Date;
    sessionDuration?: number;
    pageViews: number;
    events: number;
    isNewSession: boolean;
    isBounce: boolean;
    exitPage?: string;
  };
  
  // 메타데이터
  metadata: {
    source: 'web' | 'mobile_app' | 'api' | 'email' | 'sms' | 'push';
    version: string;
    environment: 'development' | 'staging' | 'production';
    processed: boolean;
    processedAt?: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsEventSchema: Schema = new Schema({
  eventType: {
    type: String,
    enum: ['page_view', 'click', 'conversion', 'purchase', 'email_open', 'email_click', 'newsletter_subscribe', 'newsletter_unsubscribe', 'coupon_use', 'promotion_view', 'ab_test_view', 'ab_test_conversion', 'search', 'add_to_cart', 'remove_from_cart', 'checkout_start', 'checkout_complete', 'custom'],
    required: true
  },
  eventCategory: {
    type: String,
    enum: ['marketing', 'ecommerce', 'user_behavior', 'system', 'ab_test'],
    required: true
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  
  eventData: {
    pageUrl: { type: String },
    pageTitle: { type: String },
    referrer: { type: String },
    utmSource: { type: String },
    utmMedium: { type: String },
    utmCampaign: { type: String },
    utmTerm: { type: String },
    utmContent: { type: String },
    clickElement: { type: String },
    clickText: { type: String },
    clickUrl: { type: String },
    clickPosition: {
      x: { type: Number },
      y: { type: Number }
    },
    conversionValue: { type: Number },
    conversionCurrency: { type: String },
    conversionType: { type: String },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String },
    productCategory: { type: String },
    productPrice: { type: Number },
    quantity: { type: Number },
    totalAmount: { type: Number },
    emailId: { type: String },
    emailSubject: { type: String },
    emailCampaign: { type: String },
    emailTemplate: { type: String },
    newsletterId: { type: Schema.Types.ObjectId, ref: 'Newsletter' },
    newsletterName: { type: String },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    couponCode: { type: String },
    discountAmount: { type: Number },
    promotionId: { type: Schema.Types.ObjectId, ref: 'Promotion' },
    promotionName: { type: String },
    promotionType: { type: String },
    abTestId: { type: Schema.Types.ObjectId, ref: 'ABTest' },
    abTestName: { type: String },
    variantName: { type: String },
    searchQuery: { type: String },
    searchResults: { type: Number },
    searchFilters: { type: Schema.Types.Mixed },
    cartId: { type: String },
    cartItems: [{
      productId: { type: Schema.Types.ObjectId, ref: 'Product' },
      productName: { type: String },
      quantity: { type: Number },
      price: { type: Number }
    }],
    checkoutStep: { type: String },
    paymentMethod: { type: String },
    shippingMethod: { type: String },
    customData: { type: Schema.Types.Mixed }
  },
  
  userInfo: {
    isLoggedIn: { type: Boolean, default: false },
    userType: { type: String, enum: ['guest', 'user', 'partner', 'admin'] },
    registrationDate: { type: Date },
    lastLoginDate: { type: Date },
    totalSpent: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    segmentIds: [{ type: Schema.Types.ObjectId, ref: 'CustomerSegment' }]
  },
  
  deviceInfo: {
    userAgent: { type: String, required: true },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
      required: true
    },
    browser: { type: String },
    browserVersion: { type: String },
    os: { type: String },
    osVersion: { type: String },
    screenResolution: { type: String },
    viewportSize: { type: String },
    language: { type: String },
    timezone: { type: String }
  },
  
  locationInfo: {
    ipAddress: { type: String, required: true },
    country: { type: String },
    region: { type: String },
    city: { type: String },
    latitude: { type: Number },
    longitude: { type: Number }
  },
  
  performanceInfo: {
    pageLoadTime: { type: Number },
    domContentLoadedTime: { type: Number },
    firstContentfulPaint: { type: Number },
    largestContentfulPaint: { type: Number },
    firstInputDelay: { type: Number },
    cumulativeLayoutShift: { type: Number }
  },
  
  marketingInfo: {
    campaignId: { type: String },
    campaignName: { type: String },
    adGroupId: { type: String },
    adGroupName: { type: String },
    keyword: { type: String },
    creativeId: { type: String },
    placementId: { type: String },
    network: { type: String }
  },
  
  sessionInfo: {
    sessionStartTime: { type: Date, required: true },
    sessionDuration: { type: Number },
    pageViews: { type: Number, default: 1 },
    events: { type: Number, default: 1 },
    isNewSession: { type: Boolean, default: true },
    isBounce: { type: Boolean, default: false },
    exitPage: { type: String }
  },
  
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile_app', 'api', 'email', 'sms', 'push'],
      default: 'web'
    },
    version: { type: String, default: '1.0.0' },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'production'
    },
    processed: { type: Boolean, default: false },
    processedAt: { type: Date }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 인덱스 설정
AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 });
AnalyticsEventSchema.index({ eventCategory: 1, timestamp: -1 });
AnalyticsEventSchema.index({ userId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ sessionId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ timestamp: -1 });
AnalyticsEventSchema.index({ 'eventData.utmSource': 1, 'eventData.utmCampaign': 1 });
AnalyticsEventSchema.index({ 'deviceInfo.deviceType': 1, timestamp: -1 });
AnalyticsEventSchema.index({ 'locationInfo.country': 1, timestamp: -1 });
AnalyticsEventSchema.index({ 'metadata.processed': 1, timestamp: -1 });

export default mongoose.models.AnalyticsEvent || mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);















