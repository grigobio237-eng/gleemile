import AutomationRule from '@/models/AutomationRule';
import AutomationExecution from '@/models/AutomationExecution';
import User from '@/models/User';
import CustomerSegment from '@/models/CustomerSegment';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { sendEmail } from './email';
import { sendSMS } from './sms';
import { sendPushNotification } from './pushNotification';

export interface AutomationTrigger {
  type: 'event' | 'schedule' | 'condition' | 'webhook' | 'api';
  data: any;
  timestamp: Date;
}

export interface AutomationContext {
  userId?: string;
  user?: any;
  event?: any;
  order?: any;
  product?: any;
  segment?: any;
  customData?: any;
}

export class AutomationEngine {
  private static instance: AutomationEngine;
  private isRunning = false;
  private executionQueue: Array<{
    ruleId: string;
    context: AutomationContext;
    trigger: AutomationTrigger;
  }> = [];

  static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine();
    }
    return AutomationEngine.instance;
  }

  // 자동화 규칙 실행
  async executeRule(ruleId: string, context: AutomationContext, trigger: AutomationTrigger): Promise<void> {
    try {
      const rule = await AutomationRule.findById(ruleId);
      if (!rule || !rule.isActive) {
        return;
      }

      // 실행 조건 확인
      if (!await this.checkExecutionConditions(rule, context)) {
        return;
      }

      // 실행 제한 확인
      if (!await this.checkExecutionLimits(rule)) {
        return;
      }

      // 실행 대상 결정
      const targets = await this.determineTargets(rule, context);
      if (targets.length === 0) {
        return;
      }

      // 실행 로그 생성
      const execution = await this.createExecutionLog(rule, trigger, targets);

      // 액션 실행
      await this.executeActions(rule, targets, context, execution);

    } catch (error) {
      console.error('Automation rule execution error:', error);
    }
  }

  // 이벤트 기반 트리거 처리
  async handleEvent(eventType: string, eventData: any, context: AutomationContext): Promise<void> {
    const rules = await AutomationRule.find({
      isActive: true,
      'triggers.type': 'event',
      'triggers.eventType': eventType
    }).sort({ priority: -1 });

    for (const rule of rules) {
      if (await this.evaluateTriggerConditions(rule, eventData, context)) {
        await this.executeRule(rule._id.toString(), context, {
          type: 'event',
          data: { eventType, eventData },
          timestamp: new Date()
        });
      }
    }
  }

  // 스케줄 기반 트리거 처리
  async handleSchedule(): Promise<void> {
    const now = new Date();
    const rules = await AutomationRule.find({
      isActive: true,
      'triggers.type': 'schedule'
    });

    for (const rule of rules) {
      if (await this.evaluateScheduleTrigger(rule, now)) {
        await this.executeRule(rule._id.toString(), {}, {
          type: 'schedule',
          data: { scheduleType: rule.triggers.schedule?.type },
          timestamp: now
        });
      }
    }
  }

  // 조건 기반 트리거 처리
  async handleConditionCheck(): Promise<void> {
    const rules = await AutomationRule.find({
      isActive: true,
      'triggers.type': 'condition'
    });

    for (const rule of rules) {
      if (await this.evaluateConditionTrigger(rule)) {
        await this.executeRule(rule._id.toString(), {}, {
          type: 'condition',
          data: {},
          timestamp: new Date()
        });
      }
    }
  }

  // 실행 조건 확인
  private async checkExecutionConditions(rule: any, context: AutomationContext): Promise<boolean> {
    // 사용자 조건 확인
    if (rule.conditions.userConditions && context.user) {
      for (const condition of rule.conditions.userConditions) {
        if (!await this.evaluateCondition(condition, context.user)) {
          return false;
        }
      }
    }

    // 제품 조건 확인
    if (rule.conditions.productConditions && context.product) {
      for (const condition of rule.conditions.productConditions) {
        if (!await this.evaluateCondition(condition, context.product)) {
          return false;
        }
      }
    }

    // 주문 조건 확인
    if (rule.conditions.orderConditions && context.order) {
      for (const condition of rule.conditions.orderConditions) {
        if (!await this.evaluateCondition(condition, context.order)) {
          return false;
        }
      }
    }

    // 행동 조건 확인
    if (rule.conditions.behaviorConditions && context.user) {
      const behaviorData = await this.getBehaviorData(context.user._id);
      for (const condition of rule.conditions.behaviorConditions) {
        if (!await this.evaluateCondition(condition, behaviorData)) {
          return false;
        }
      }
    }

    // 시간 조건 확인
    if (rule.conditions.timeConditions) {
      const timeData = this.getTimeData();
      for (const condition of rule.conditions.timeConditions) {
        if (!await this.evaluateCondition(condition, timeData)) {
          return false;
        }
      }
    }

    return true;
  }

  // 실행 제한 확인
  private async checkExecutionLimits(rule: any): Promise<boolean> {
    const now = new Date();
    
    // 최대 실행 횟수 확인
    if (rule.execution.maxExecutions) {
      const executionCount = await AutomationExecution.countDocuments({
        ruleId: rule._id,
        'metadata.startedAt': { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      });
      
      if (executionCount >= rule.execution.maxExecutions) {
        return false;
      }
    }

    // 실행 제한 확인
    if (rule.execution.executionLimit) {
      const executionCount = await AutomationExecution.countDocuments({
        ruleId: rule._id,
        'metadata.startedAt': { $gte: new Date(now.getTime() - 60 * 60 * 1000) }
      });
      
      if (executionCount >= rule.execution.executionLimit) {
        return false;
      }
    }

    // 쿨다운 기간 확인
    if (rule.execution.cooldownPeriod && rule.stats.lastExecutedAt) {
      const cooldownEnd = new Date(rule.stats.lastExecutedAt.getTime() + rule.execution.cooldownPeriod * 60 * 1000);
      if (now < cooldownEnd) {
        return false;
      }
    }

    // 시간 윈도우 확인
    if (rule.execution.timeWindow) {
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        timeZone: rule.execution.timeWindow.timezone 
      });
      
      if (currentTime < rule.execution.timeWindow.start || currentTime > rule.execution.timeWindow.end) {
        return false;
      }
    }

    // 요일 확인
    if (rule.execution.daysOfWeek && rule.execution.daysOfWeek.length > 0) {
      const currentDay = now.getDay();
      if (!rule.execution.daysOfWeek.includes(currentDay)) {
        return false;
      }
    }

    return true;
  }

  // 실행 대상 결정
  private async determineTargets(rule: any, context: AutomationContext): Promise<any[]> {
    const targets: any[] = [];

    // 사용자 ID 기반
    if (context.userId) {
      const user = await User.findById(context.userId);
      if (user) targets.push(user);
    }

    // 세그먼트 기반
    if (rule.targets?.segmentIds) {
      const segmentUsers = await User.find({
        'segmentIds': { $in: rule.targets.segmentIds }
      });
      targets.push(...segmentUsers);
    }

    // 이메일 주소 기반
    if (rule.targets?.emailAddresses) {
      const emailUsers = await User.find({
        email: { $in: rule.targets.emailAddresses }
      });
      targets.push(...emailUsers);
    }

    // 전화번호 기반
    if (rule.targets?.phoneNumbers) {
      const phoneUsers = await User.find({
        phone: { $in: rule.targets.phoneNumbers }
      });
      targets.push(...phoneUsers);
    }

    return targets;
  }

  // 실행 로그 생성
  private async createExecutionLog(rule: any, trigger: AutomationTrigger, targets: any[]): Promise<any> {
    const execution = new AutomationExecution({
      ruleId: rule._id,
      ruleName: rule.name,
      triggerType: trigger.type,
      triggerData: trigger.data,
      targets: {
        userIds: targets.map(t => t._id),
        emailAddresses: targets.map(t => t.email).filter(Boolean),
        phoneNumbers: targets.map(t => t.phone).filter(Boolean)
      },
      status: 'pending',
      progress: {
        total: targets.length,
        completed: 0,
        failed: 0,
        percentage: 0
      },
      results: {
        successful: 0,
        failed: 0,
        skipped: 0,
        errors: []
      },
      executedActions: [],
      executionConfig: {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 300000,
        parallel: true,
        batchSize: 100
      },
      metadata: {
        startedAt: new Date(),
        executedBy: rule.metadata.createdBy,
        environment: rule.metadata.environment,
        version: rule.metadata.version
      }
    });

    await execution.save();
    return execution;
  }

  // 액션 실행
  private async executeActions(rule: any, targets: any[], context: AutomationContext, execution: any): Promise<void> {
    try {
      execution.status = 'running';
      await execution.save();

      for (const action of rule.actions) {
        const actionResult = await this.executeAction(action, targets, context, execution);
        
        execution.executedActions.push({
          actionType: action.type,
          actionName: action.name,
          status: actionResult.status,
          startTime: actionResult.startTime,
          endTime: actionResult.endTime,
          duration: actionResult.duration,
          result: actionResult.result,
          error: actionResult.error,
          targetCount: targets.length,
          successCount: actionResult.successCount,
          failureCount: actionResult.failureCount
        });
      }

      execution.status = 'completed';
      execution.metadata.completedAt = new Date();
      execution.metadata.duration = execution.metadata.completedAt.getTime() - execution.metadata.startedAt.getTime();
      
      await execution.save();

      // 규칙 통계 업데이트
      await this.updateRuleStats(rule._id, execution);

    } catch (error) {
      execution.status = 'failed';
      execution.results.errors.push({
        target: 'system',
        action: 'execution',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
      await execution.save();
    }
  }

  // 개별 액션 실행
  private async executeAction(action: any, targets: any[], context: AutomationContext, execution: any): Promise<any> {
    const startTime = new Date();
    let result: any = {};
    let successCount = 0;
    let failureCount = 0;

    try {
      switch (action.type) {
        case 'email':
          result = await this.executeEmailAction(action, targets, context);
          break;
        case 'sms':
          result = await this.executeSMSAction(action, targets, context);
          break;
        case 'push':
          result = await this.executePushAction(action, targets, context);
          break;
        case 'coupon':
          result = await this.executeCouponAction(action, targets, context);
          break;
        case 'promotion':
          result = await this.executePromotionAction(action, targets, context);
          break;
        case 'segment':
          result = await this.executeSegmentAction(action, targets, context);
          break;
        case 'tag':
          result = await this.executeTagAction(action, targets, context);
          break;
        case 'webhook':
          result = await this.executeWebhookAction(action, targets, context);
          break;
        case 'api':
          result = await this.executeAPIAction(action, targets, context);
          break;
        case 'delay':
          result = await this.executeDelayAction(action, targets, context);
          break;
        case 'condition':
          result = await this.executeConditionAction(action, targets, context);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      successCount = result.successCount || 0;
      failureCount = result.failureCount || 0;

    } catch (error) {
      failureCount = targets.length;
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    return {
      status: failureCount === 0 ? 'completed' : 'failed',
      startTime,
      endTime,
      duration,
      result,
      successCount,
      failureCount
    };
  }

  // 이메일 액션 실행
  private async executeEmailAction(action: any, targets: any[], context: AutomationContext): Promise<any> {
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const target of targets) {
      try {
        const emailData = {
          to: target.email,
          subject: action.settings.emailSubject,
          html: action.settings.emailContent,
          template: action.settings.emailTemplate
        };

        await sendEmail(emailData.to, emailData.subject, emailData.html);
        results.push({ target: target.email, status: 'success' });
        successCount++;
      } catch (error) {
        results.push({ 
          target: target.email, 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        failureCount++;
      }
    }

    return { results, successCount, failureCount };
  }

  // SMS 액션 실행
  private async executeSMSAction(action: any, targets: any[], context: AutomationContext): Promise<any> {
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const target of targets) {
      try {
        if (target.phone) {
          await sendSMS({
            to: target.phone,
            message: action.settings.smsContent
          });
          results.push({ target: target.phone, status: 'success' });
          successCount++;
        }
      } catch (error) {
        results.push({ 
          target: target.phone, 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        failureCount++;
      }
    }

    return { results, successCount, failureCount };
  }

  // 푸시 액션 실행
  private async executePushAction(action: any, targets: any[], context: AutomationContext): Promise<any> {
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const target of targets) {
      try {
        await sendPushNotification({
          userId: target._id,
          title: action.settings.pushTitle,
          body: action.settings.pushBody,
          data: action.settings.pushData,
          image: action.settings.pushImage,
          actions: action.settings.pushAction
        });
        results.push({ target: target._id, status: 'success' });
        successCount++;
      } catch (error) {
        results.push({ 
          target: target._id, 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        failureCount++;
      }
    }

    return { results, successCount, failureCount };
  }

  // 쿠폰 액션 실행
  private async executeCouponAction(action: any, targets: any[], context: AutomationContext): Promise<any> {
    // 쿠폰 생성 및 발급 로직
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const target of targets) {
      try {
        // 쿠폰 생성 로직 구현
        results.push({ target: target._id, status: 'success' });
        successCount++;
      } catch (error) {
        results.push({ 
          target: target._id, 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        failureCount++;
      }
    }

    return { results, successCount, failureCount };
  }

  // 프로모션 액션 실행
  private async executePromotionAction(action: any, targets: any[], context: AutomationContext): Promise<any> {
    // 프로모션 생성 및 적용 로직
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const target of targets) {
      try {
        // 프로모션 생성 로직 구현
        results.push({ target: target._id, status: 'success' });
        successCount++;
      } catch (error) {
        results.push({ 
          target: target._id, 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        failureCount++;
      }
    }

    return { results, successCount, failureCount };
  }

  // 세그먼트 액션 실행
  private async executeSegmentAction(action: any, targets: any[], context: AutomationContext): Promise<any> {
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const target of targets) {
      try {
        if (action.settings.segmentAction === 'add') {
          await User.findByIdAndUpdate(target._id, {
            $addToSet: { segmentIds: action.settings.segmentId }
          });
        } else if (action.settings.segmentAction === 'remove') {
          await User.findByIdAndUpdate(target._id, {
            $pull: { segmentIds: action.settings.segmentId }
          });
        } else if (action.settings.segmentAction === 'replace') {
          await User.findByIdAndUpdate(target._id, {
            segmentIds: [action.settings.segmentId]
          });
        }
        
        results.push({ target: target._id, status: 'success' });
        successCount++;
      } catch (error) {
        results.push({ 
          target: target._id, 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        failureCount++;
      }
    }

    return { results, successCount, failureCount };
  }

  // 태그 액션 실행
  private async executeTagAction(action: any, targets: any[], context: AutomationContext): Promise<any> {
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const target of targets) {
      try {
        if (action.settings.tagAction === 'add') {
          await User.findByIdAndUpdate(target._id, {
            $addToSet: { tags: { $each: action.settings.tags } }
          });
        } else if (action.settings.tagAction === 'remove') {
          await User.findByIdAndUpdate(target._id, {
            $pull: { tags: { $in: action.settings.tags } }
          });
        } else if (action.settings.tagAction === 'replace') {
          await User.findByIdAndUpdate(target._id, {
            tags: action.settings.tags
          });
        }
        
        results.push({ target: target._id, status: 'success' });
        successCount++;
      } catch (error) {
        results.push({ 
          target: target._id, 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        failureCount++;
      }
    }

    return { results, successCount, failureCount };
  }

  // 웹훅 액션 실행
  private async executeWebhookAction(action: any, targets: any[], context: AutomationContext): Promise<any> {
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    try {
      const response = await fetch(action.settings.webhookUrl, {
        method: action.settings.webhookMethod || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...action.settings.webhookHeaders
        },
        body: JSON.stringify({
          targets,
          context,
          ...action.settings.webhookBody
        })
      });

      if (response.ok) {
        results.push({ target: 'webhook', status: 'success' });
        successCount = targets.length;
      } else {
        results.push({ target: 'webhook', status: 'failed', error: 'Webhook failed' });
        failureCount = targets.length;
      }
    } catch (error) {
      results.push({ 
        target: 'webhook', 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      failureCount = targets.length;
    }

    return { results, successCount, failureCount };
  }

  // API 액션 실행
  private async executeAPIAction(action: any, targets: any[], context: AutomationContext): Promise<any> {
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    try {
      const response = await fetch(action.settings.apiEndpoint, {
        method: action.settings.apiMethod || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...action.settings.apiHeaders
        },
        body: JSON.stringify({
          targets,
          context,
          ...action.settings.apiBody
        })
      });

      if (response.ok) {
        results.push({ target: 'api', status: 'success' });
        successCount = targets.length;
      } else {
        results.push({ target: 'api', status: 'failed', error: 'API call failed' });
        failureCount = targets.length;
      }
    } catch (error) {
      results.push({ 
        target: 'api', 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      failureCount = targets.length;
    }

    return { results, successCount, failureCount };
  }

  // 지연 액션 실행
  private async executeDelayAction(action: any, targets: any[], context: AutomationContext): Promise<any> {
    const delayMs = (action.settings.delay || 0) * 60 * 1000; // 분을 밀리초로 변환
    
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    return { results: [], successCount: targets.length, failureCount: 0 };
  }

  // 조건 액션 실행
  private async executeConditionAction(action: any, targets: any[], context: AutomationContext): Promise<any> {
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const target of targets) {
      try {
        let shouldExecute = true;
        
        if (action.settings.conditions) {
          for (const condition of action.settings.conditions) {
            if (!await this.evaluateCondition(condition, target)) {
              shouldExecute = false;
              break;
            }
          }
        }

        if (shouldExecute) {
          results.push({ target: target._id, status: 'success' });
          successCount++;
        } else {
          results.push({ target: target._id, status: 'skipped' });
        }
      } catch (error) {
        results.push({ 
          target: target._id, 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        failureCount++;
      }
    }

    return { results, successCount, failureCount };
  }

  // 조건 평가
  private async evaluateCondition(condition: any, data: any): Promise<boolean> {
    const fieldValue = this.getFieldValue(data, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'not_contains':
        return !String(fieldValue).includes(String(condition.value));
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
      case 'between':
        return Array.isArray(condition.value) && 
               condition.value.length === 2 && 
               Number(fieldValue) >= Number(condition.value[0]) && 
               Number(fieldValue) <= Number(condition.value[1]);
      case 'is_null':
        return fieldValue === null;
      case 'is_not_null':
        return fieldValue !== null;
      default:
        return false;
    }
  }

  // 필드 값 가져오기
  private getFieldValue(data: any, field: string): any {
    const fields = field.split('.');
    let value = data;
    
    for (const f of fields) {
      if (value && typeof value === 'object') {
        value = value[f];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  // 트리거 조건 평가
  private async evaluateTriggerConditions(rule: any, eventData: any, context: AutomationContext): Promise<boolean> {
    if (!rule.triggers.conditions || rule.triggers.conditions.length === 0) {
      return true;
    }

    for (const condition of rule.triggers.conditions) {
      if (!await this.evaluateCondition(condition, { ...eventData, ...context })) {
        return false;
      }
    }

    return true;
  }

  // 스케줄 트리거 평가
  private async evaluateScheduleTrigger(rule: any, now: Date): Promise<boolean> {
    const schedule = rule.triggers.schedule;
    if (!schedule) return false;

    switch (schedule.type) {
      case 'daily':
        return this.isTimeMatch(now, schedule.time);
      case 'weekly':
        return this.isTimeMatch(now, schedule.time) && 
               schedule.days && schedule.days.includes(now.getDay());
      case 'monthly':
        return this.isTimeMatch(now, schedule.time) && 
               schedule.days && schedule.days.includes(now.getDate());
      case 'custom':
        // Cron 표현식 처리 (구현 필요)
        return false;
      default:
        return false;
    }
  }

  // 조건 트리거 평가
  private async evaluateConditionTrigger(rule: any): Promise<boolean> {
    // 조건 기반 트리거 로직 구현
    return false;
  }

  // 시간 매치 확인
  private isTimeMatch(now: Date, time: string): boolean {
    const [hours, minutes] = time.split(':').map(Number);
    return now.getHours() === hours && now.getMinutes() === minutes;
  }

  // 행동 데이터 가져오기
  private async getBehaviorData(userId: string): Promise<any> {
    const events = await AnalyticsEvent.find({ userId }).sort({ timestamp: -1 }).limit(100);
    
    return {
      pageViews: events.filter(e => e.eventType === 'page_view').length,
      sessionDuration: this.calculateSessionDuration(events),
      cartAbandonment: this.calculateCartAbandonment(events),
      searchQueries: events.filter(e => e.eventType === 'search').length,
      emailOpens: events.filter(e => e.eventType === 'email_open').length,
      emailClicks: events.filter(e => e.eventType === 'email_click').length,
      lastActivity: events[0]?.timestamp
    };
  }

  // 세션 지속시간 계산
  private calculateSessionDuration(events: any[]): number {
    if (events.length < 2) return 0;
    
    const firstEvent = events[events.length - 1];
    const lastEvent = events[0];
    
    return lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime();
  }

  // 장바구니 이탈률 계산
  private calculateCartAbandonment(events: any[]): number {
    const cartEvents = events.filter(e => 
      e.eventType === 'add_to_cart' || e.eventType === 'remove_from_cart'
    );
    
    if (cartEvents.length === 0) return 0;
    
    const addToCartEvents = cartEvents.filter(e => e.eventType === 'add_to_cart');
    const checkoutEvents = events.filter(e => e.eventType === 'checkout_complete');
    
    return addToCartEvents.length > 0 ? 
      (addToCartEvents.length - checkoutEvents.length) / addToCartEvents.length : 0;
  }

  // 시간 데이터 가져오기
  private getTimeData(): any {
    const now = new Date();
    
    return {
      timeOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
      dayOfMonth: now.getDate(),
      month: now.getMonth() + 1,
      season: this.getSeason(now),
      holiday: this.isHoliday(now)
    };
  }

  // 계절 계산
  private getSeason(date: Date): string {
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  // 휴일 확인
  private isHoliday(date: Date): boolean {
    // 한국 휴일 로직 구현 (간단한 예시)
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // 신정, 설날, 어린이날, 현충일, 광복절, 추석, 개천절, 한글날, 성탄절 등
    const holidays = [
      { month: 1, day: 1 },   // 신정
      { month: 5, day: 5 },   // 어린이날
      { month: 6, day: 6 },   // 현충일
      { month: 8, day: 15 },  // 광복절
      { month: 10, day: 3 },  // 개천절
      { month: 10, day: 9 },  // 한글날
      { month: 12, day: 25 }  // 성탄절
    ];
    
    return holidays.some(h => h.month === month && h.day === day);
  }

  // 규칙 통계 업데이트
  private async updateRuleStats(ruleId: string, execution: any): Promise<void> {
    await AutomationRule.findByIdAndUpdate(ruleId, {
      $inc: {
        'stats.totalExecutions': 1,
        'stats.successfulExecutions': execution.results.successful,
        'stats.failedExecutions': execution.results.failed
      },
      $set: {
        'stats.lastExecutedAt': execution.metadata.startedAt,
        'stats.averageExecutionTime': execution.metadata.duration,
        'stats.successRate': execution.results.successful / (execution.results.successful + execution.results.failed) * 100
      }
    });
  }
}
