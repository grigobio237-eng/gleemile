import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { NotificationService } from '@/lib/notificationService';
import { PromotionEngine } from '@/lib/promotionEngine';
// import { CouponValidator } from '@/lib/couponValidator';
import CustomerSegment from '@/models/CustomerSegment';
import SegmentMembership from '@/models/SegmentMembership';
import mongoose from 'mongoose';

export interface MarketingEvent {
  userId: string;
  eventType: 'page_view' | 'product_view' | 'add_to_cart' | 'remove_from_cart' | 'purchase' | 'abandon_cart' | 'login' | 'logout' | 'search' | 'wishlist_add' | 'wishlist_remove' | 'review_submit' | 'email_open' | 'email_click' | 'push_open' | 'push_click';
  timestamp: Date;
  metadata: {
    pageUrl?: string;
    productId?: string;
    categoryId?: string;
    searchQuery?: string;
    cartValue?: number;
    orderValue?: number;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
    location?: string;
    referrer?: string;
    sessionId?: string;
    [key: string]: any;
  };
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    eventType: string;
    conditions: {
      field: string;
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'in' | 'not_in';
      value: any;
    }[];
    cooldown?: number; // 분 단위
  };
  conditions: {
    userSegment?: string[];
    userTags?: string[];
    userBehavior?: {
      field: string;
      operator: string;
      value: any;
      timeWindow?: number; // 일 단위
    }[];
    timeRestrictions?: {
      startTime?: string; // HH:MM
      endTime?: string; // HH:MM
      daysOfWeek?: number[]; // 0-6 (일-토)
      timezone?: string;
    };
  };
  actions: {
    type: 'send_email' | 'send_push' | 'send_sms' | 'create_coupon' | 'apply_discount' | 'add_to_segment' | 'remove_from_segment' | 'add_tag' | 'remove_tag' | 'webhook' | 'delay';
    config: {
      templateId?: string;
      subject?: string;
      content?: string;
      couponCode?: string;
      discountValue?: number;
      discountType?: 'percentage' | 'fixed';
      segmentId?: string;
      tag?: string;
      webhookUrl?: string;
      delayMinutes?: number;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
    };
  }[];
  status: 'active' | 'inactive' | 'draft';
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  stats: {
    totalTriggers: number;
    totalActions: number;
    successRate: number;
    lastTriggered?: Date;
  };
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  userId: string;
  eventId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  actions: {
    type: string;
    config: any;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: any;
    error?: string;
    executedAt?: Date;
  }[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export class AdvancedMarketingAutomation {
  private static eventQueue: MarketingEvent[] = [];
  private static isProcessing = false;

  // 이벤트 큐에 이벤트 추가
  static async addEvent(event: MarketingEvent): Promise<void> {
    try {
      await connectDB();
      
      // 이벤트를 큐에 추가
      this.eventQueue.push(event);
      
      // 비동기로 처리 시작
      if (!this.isProcessing) {
        this.processEvents();
      }
      
      // 이벤트를 데이터베이스에 저장 (분석용)
      await this.saveEventToDatabase(event);
      
    } catch (error) {
      console.error('Error adding marketing event:', error);
    }
  }

  // 이벤트 처리
  private static async processEvents(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (!event) continue;
        
        await this.processEvent(event);
      }
    } catch (error) {
      console.error('Error processing marketing events:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // 개별 이벤트 처리
  private static async processEvent(event: MarketingEvent): Promise<void> {
    try {
      await connectDB();
      
      // 활성화된 자동화 규칙 조회
      const rules = await this.getActiveRules(event.eventType);
      
      for (const rule of rules) {
        // 트리거 조건 확인
        if (await this.checkTriggerConditions(rule, event)) {
          // 사용자 조건 확인
          if (await this.checkUserConditions(rule, event.userId)) {
            // 시간 제한 확인
            if (await this.checkTimeRestrictions(rule)) {
              // 쿨다운 확인
              if (await this.checkCooldown(rule, event.userId)) {
                // 자동화 실행
                await this.executeAutomation(rule, event);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing event:', error);
    }
  }

  // 활성화된 규칙 조회
  private static async getActiveRules(eventType: string): Promise<AutomationRule[]> {
    // 실제 구현에서는 데이터베이스에서 조회
    // 여기서는 예시 데이터 반환
    return [
      {
        id: '1',
        name: '장바구니 이탈 고객 재참여',
        description: '장바구니에 상품을 추가했지만 1시간 내에 구매하지 않은 고객에게 할인 쿠폰 발송',
        trigger: {
          eventType: 'abandon_cart',
          conditions: [
            { field: 'cartValue', operator: 'greater_than', value: 50000 }
          ],
          cooldown: 60 // 1시간
        },
        conditions: {
          userBehavior: [
            { field: 'purchaseCount', operator: 'greater_than', value: 0, timeWindow: 30 }
          ]
        },
        actions: [
          {
            type: 'create_coupon',
            config: {
              couponCode: 'CART10',
              discountValue: 10,
              discountType: 'percentage',
              priority: 'high'
            }
          },
          {
            type: 'send_email',
            config: {
              templateId: 'abandon_cart',
              subject: '장바구니에 담은 상품이 기다리고 있어요!',
              priority: 'high'
            }
          }
        ],
        status: 'active',
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        stats: {
          totalTriggers: 0,
          totalActions: 0,
          successRate: 0
        }
      }
    ];
  }

  // 트리거 조건 확인
  private static async checkTriggerConditions(rule: AutomationRule, event: MarketingEvent): Promise<boolean> {
    if (rule.trigger.eventType !== event.eventType) return false;
    
    for (const condition of rule.trigger.conditions) {
      const eventValue = event.metadata[condition.field];
      if (!this.evaluateCondition(eventValue, condition.operator, condition.value)) {
        return false;
      }
    }
    
    return true;
  }

  // 사용자 조건 확인
  private static async checkUserConditions(rule: AutomationRule, userId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) return false;
      
      // 세그먼트 조건 확인
      if (rule.conditions.userSegment && rule.conditions.userSegment.length > 0) {
        const userSegments = await this.getUserSegments(userId);
        const hasRequiredSegment = rule.conditions.userSegment.some(segmentId => 
          userSegments.includes(segmentId)
        );
        if (!hasRequiredSegment) return false;
      }
      
      // 사용자 행동 조건 확인
      if (rule.conditions.userBehavior && rule.conditions.userBehavior.length > 0) {
        for (const behavior of rule.conditions.userBehavior) {
          if (!await this.checkUserBehavior(userId, behavior)) {
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking user conditions:', error);
      return false;
    }
  }

  // 시간 제한 확인
  private static async checkTimeRestrictions(rule: AutomationRule): Promise<boolean> {
    if (!rule.conditions.timeRestrictions) return true;
    
    const now = new Date();
    const timezone = rule.conditions.timeRestrictions.timezone || 'Asia/Seoul';
    
    // 요일 확인
    if (rule.conditions.timeRestrictions.daysOfWeek) {
      const dayOfWeek = now.getDay();
      if (!rule.conditions.timeRestrictions.daysOfWeek.includes(dayOfWeek)) {
        return false;
      }
    }
    
    // 시간 확인
    if (rule.conditions.timeRestrictions.startTime && rule.conditions.timeRestrictions.endTime) {
      const currentTime = now.toLocaleTimeString('en-US', { 
        timeZone: timezone, 
        hour12: false 
      });
      if (currentTime < rule.conditions.timeRestrictions.startTime || 
          currentTime > rule.conditions.timeRestrictions.endTime) {
        return false;
      }
    }
    
    return true;
  }

  // 쿨다운 확인
  private static async checkCooldown(rule: AutomationRule, userId: string): Promise<boolean> {
    if (!rule.trigger.cooldown) return true;
    
    // 마지막 실행 시간 확인 (실제 구현에서는 데이터베이스에서 조회)
    const lastExecution = await this.getLastExecution(rule.id, userId);
    if (!lastExecution) return true;
    
    const cooldownMs = rule.trigger.cooldown * 60 * 1000;
    return Date.now() - lastExecution.getTime() > cooldownMs;
  }

  // 자동화 실행
  private static async executeAutomation(rule: AutomationRule, event: MarketingEvent): Promise<void> {
    try {
      const execution: AutomationExecution = {
        id: new mongoose.Types.ObjectId().toString(),
        ruleId: rule.id,
        userId: event.userId,
        eventId: (event as any).id || new mongoose.Types.ObjectId().toString(),
        status: 'running',
        actions: rule.actions.map(action => ({
          type: action.type,
          config: action.config,
          status: 'pending'
        })),
        startedAt: new Date()
      };

      // 각 액션 실행
      for (let i = 0; i < execution.actions.length; i++) {
        const action = execution.actions[i];
        action.status = 'running';
        
        try {
          await this.executeAction(action, event, rule);
          action.status = 'completed';
          action.executedAt = new Date();
        } catch (error) {
          action.status = 'failed';
          action.error = error instanceof Error ? error.message : 'Unknown error';
        }
      }

      // 실행 완료
      execution.status = 'completed';
      execution.completedAt = new Date();
      
      // 통계 업데이트
      await this.updateRuleStats(rule.id, true);
      
    } catch (error) {
      console.error('Error executing automation:', error);
    }
  }

  // 액션 실행
  private static async executeAction(action: any, event: MarketingEvent, rule: AutomationRule): Promise<void> {
    switch (action.type) {
      case 'send_email':
        await this.sendEmailAction(action, event);
        break;
      case 'send_push':
        await this.sendPushAction(action, event);
        break;
      case 'send_sms':
        await this.sendSmsAction(action, event);
        break;
      case 'create_coupon':
        await this.createCouponAction(action, event);
        break;
      case 'apply_discount':
        await this.applyDiscountAction(action, event);
        break;
      case 'add_to_segment':
        await this.addToSegmentAction(action, event);
        break;
      case 'remove_from_segment':
        await this.removeFromSegmentAction(action, event);
        break;
      case 'add_tag':
        await this.addTagAction(action, event);
        break;
      case 'remove_tag':
        await this.removeTagAction(action, event);
        break;
      case 'webhook':
        await this.webhookAction(action, event);
        break;
      case 'delay':
        await this.delayAction(action, event);
        break;
    }
  }

  // 이메일 액션
  private static async sendEmailAction(action: any, event: MarketingEvent): Promise<void> {
    await NotificationService.sendNotification({
      userId: event.userId,
      title: action.config.subject || '특별한 혜택을 확인해보세요!',
      message: action.config.content || '새로운 혜택이 준비되어 있습니다.',
      category: 'info',
      type: 'marketing',
      priority: action.config.priority || 'normal',
      source: 'automation',
    });
  }

  // 푸시 액션
  private static async sendPushAction(action: any, event: MarketingEvent): Promise<void> {
    await NotificationService.sendNotification({
      userId: event.userId,
      title: action.config.subject || '새로운 알림',
      message: action.config.content || '확인해보세요!',
      category: 'info',
      type: 'marketing',
      priority: action.config.priority || 'normal',
      source: 'automation',
    });
  }

  // SMS 액션
  private static async sendSmsAction(action: any, event: MarketingEvent): Promise<void> {
    await NotificationService.sendNotification({
      userId: event.userId,
      title: action.config.subject || 'SMS 알림',
      message: action.config.content || '새로운 소식이 있습니다.',
      category: 'info',
      type: 'marketing',
      priority: action.config.priority || 'normal',
      source: 'automation',
    });
  }

  // 쿠폰 생성 액션
  private static async createCouponAction(action: any, event: MarketingEvent): Promise<void> {
    // 실제 구현에서는 쿠폰 생성 API 호출
    console.log(`Creating coupon for user ${event.userId}:`, action.config);
  }

  // 할인 적용 액션
  private static async applyDiscountAction(action: any, event: MarketingEvent): Promise<void> {
    // 실제 구현에서는 할인 적용 로직
    console.log(`Applying discount for user ${event.userId}:`, action.config);
  }

  // 세그먼트 추가 액션
  private static async addToSegmentAction(action: any, event: MarketingEvent): Promise<void> {
    if (action.config.segmentId) {
      await SegmentMembership.create({
        userId: event.userId,
        segmentId: action.config.segmentId,
        joinedAt: new Date()
      });
    }
  }

  // 세그먼트 제거 액션
  private static async removeFromSegmentAction(action: any, event: MarketingEvent): Promise<void> {
    if (action.config.segmentId) {
      await SegmentMembership.deleteOne({
        userId: event.userId,
        segmentId: action.config.segmentId
      });
    }
  }

  // 태그 추가 액션
  private static async addTagAction(action: any, event: MarketingEvent): Promise<void> {
    if (action.config.tag) {
      await User.findByIdAndUpdate(event.userId, {
        $addToSet: { tags: action.config.tag }
      });
    }
  }

  // 태그 제거 액션
  private static async removeTagAction(action: any, event: MarketingEvent): Promise<void> {
    if (action.config.tag) {
      await User.findByIdAndUpdate(event.userId, {
        $pull: { tags: action.config.tag }
      });
    }
  }

  // 웹훅 액션
  private static async webhookAction(action: any, event: MarketingEvent): Promise<void> {
    if (action.config.webhookUrl) {
      // 실제 구현에서는 웹훅 호출
      console.log(`Sending webhook to ${action.config.webhookUrl}:`, event);
    }
  }

  // 지연 액션
  private static async delayAction(action: any, event: MarketingEvent): Promise<void> {
    if (action.config.delayMinutes) {
      // 실제 구현에서는 지연 큐 사용
      console.log(`Delaying action for ${action.config.delayMinutes} minutes`);
    }
  }

  // 유틸리티 메서드들
  private static evaluateCondition(value: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals': return value === expectedValue;
      case 'not_equals': return value !== expectedValue;
      case 'greater_than': return Number(value) > Number(expectedValue);
      case 'less_than': return Number(value) < Number(expectedValue);
      case 'contains': return String(value).includes(String(expectedValue));
      case 'not_contains': return !String(value).includes(String(expectedValue));
      case 'in': return Array.isArray(expectedValue) && expectedValue.includes(value);
      case 'not_in': return Array.isArray(expectedValue) && !expectedValue.includes(value);
      default: return false;
    }
  }

  private static async getUserSegments(userId: string): Promise<string[]> {
    const memberships = await SegmentMembership.find({ userId });
    return memberships.map(m => m.segmentId.toString());
  }

  private static async checkUserBehavior(userId: string, behavior: any): Promise<boolean> {
    // 실제 구현에서는 사용자 행동 데이터 분석
    return true;
  }

  private static async getLastExecution(ruleId: string, userId: string): Promise<Date | null> {
    // 실제 구현에서는 데이터베이스에서 조회
    return null;
  }

  private static async updateRuleStats(ruleId: string, success: boolean): Promise<void> {
    // 실제 구현에서는 통계 업데이트
  }

  private static async saveEventToDatabase(event: MarketingEvent): Promise<void> {
    // 실제 구현에서는 이벤트를 데이터베이스에 저장
  }
}
