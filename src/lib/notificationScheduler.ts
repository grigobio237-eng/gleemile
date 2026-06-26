import NotificationSchedule from '@/models/NotificationSchedule';
import NotificationTemplate from '@/models/NotificationTemplate';
import User from '@/models/User';
import CustomerSegment from '@/models/CustomerSegment';
import { connectDB } from '@/lib/db';
import { NotificationTemplateEngine } from './notificationTemplateEngine';
import { NotificationService } from './notificationService';
import * as cron from 'node-cron';

export interface ScheduleData {
  templateId: string;
  name: string;
  description?: string;
  type: 'immediate' | 'scheduled' | 'recurring' | 'triggered';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  schedule?: {
    immediate?: boolean;
    scheduledAt?: Date;
    recurring?: {
      pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
      interval: number;
      daysOfWeek?: number[];
      dayOfMonth?: number;
      time: string;
      timezone?: string;
      endDate?: Date;
    };
    trigger?: {
      event: string;
      conditions: { [key: string]: any };
    };
  };
  target: {
    type: 'all' | 'segment' | 'individual' | 'query';
    segments?: string[];
    userIds?: string[];
    query?: { [key: string]: any };
  };
  message: {
    subject?: string;
    title: string;
    content: string;
    htmlContent?: string;
    variables: { [key: string]: any };
    channels: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
      inApp?: boolean;
    };
  };
  execution?: {
    batchSize?: number;
    delayBetweenBatches?: number;
    maxRetries?: number;
    retryInterval?: number;
    timeout?: number;
  };
}

export class NotificationScheduler {
  private static cronJobs: Map<string, any> = new Map();

  // 스케줄 생성
  static async createSchedule(scheduleData: ScheduleData, createdBy: string): Promise<any> {
    try {
      await connectDB();
      
      const template = await NotificationTemplate.findById(scheduleData.templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      // 대상 사용자 수 계산
      const targetCount = await this.calculateTargetCount(scheduleData.target);
      
      const schedule = new NotificationSchedule({
        ...scheduleData,
        createdBy,
        stats: {
          totalTargets: targetCount,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
          failed: 0,
          pending: targetCount
        }
      });
      
      await schedule.save();
      
      // 즉시 실행
      if (scheduleData.type === 'immediate') {
        await this.executeSchedule(schedule._id.toString());
      }
      // 예약 실행
      else if (scheduleData.type === 'scheduled' && scheduleData.schedule?.scheduledAt) {
        await this.scheduleExecution(schedule._id.toString(), scheduleData.schedule.scheduledAt);
      }
      // 반복 실행
      else if (scheduleData.type === 'recurring' && scheduleData.schedule?.recurring) {
        await this.scheduleRecurring(schedule._id.toString(), scheduleData.schedule.recurring);
      }
      
      return schedule;
    } catch (error) {
      console.error('Create schedule error:', error);
      throw error;
    }
  }

  // 대상 사용자 수 계산
  private static async calculateTargetCount(target: ScheduleData['target']): Promise<number> {
    try {
      switch (target.type) {
        case 'all':
          return await User.countDocuments({ status: 'active' });
        
        case 'segment':
          if (!target.segments || target.segments.length === 0) return 0;
          const segments = await CustomerSegment.find({ _id: { $in: target.segments } });
          return segments.reduce((sum, segment) => sum + segment.members.length, 0);
        
        case 'individual':
          return target.userIds?.length || 0;
        
        case 'query':
          if (!target.query) return 0;
          return await User.countDocuments(target.query);
        
        default:
          return 0;
      }
    } catch (error) {
      console.error('Calculate target count error:', error);
      return 0;
    }
  }

  // 대상 사용자 조회
  private static async getTargetUsers(target: ScheduleData['target']): Promise<any[]> {
    try {
      switch (target.type) {
        case 'all':
          return await User.find({ status: 'active' }).select('_id email name phone');
        
        case 'segment':
          if (!target.segments || target.segments.length === 0) return [];
          const segments = await CustomerSegment.find({ _id: { $in: target.segments } });
          const userIds = segments.flatMap(segment => segment.members.map((member: any) => member.userId));
          return await User.find({ _id: { $in: userIds } }).select('_id email name phone');
        
        case 'individual':
          if (!target.userIds || target.userIds.length === 0) return [];
          return await User.find({ _id: { $in: target.userIds } }).select('_id email name phone');
        
        case 'query':
          if (!target.query) return [];
          return await User.find(target.query).select('_id email name phone');
        
        default:
          return [];
      }
    } catch (error) {
      console.error('Get target users error:', error);
      return [];
    }
  }

  // 스케줄 실행
  static async executeSchedule(scheduleId: string): Promise<any> {
    try {
      await connectDB();
      
      const schedule = await NotificationSchedule.findById(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }
      
      if (schedule.status !== 'pending') {
        throw new Error('Schedule is not in pending status');
      }
      
      // 상태 업데이트
      schedule.status = 'sending';
      schedule.startedAt = new Date();
      schedule.stats.startTime = new Date();
      await schedule.save();
      
      // 대상 사용자 조회
      const users = await this.getTargetUsers(schedule.target);
      
      // 템플릿 조회
      const template = await NotificationTemplate.findById(schedule.templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      // 배치 처리
      const batchSize = schedule.execution.batchSize;
      const delayBetweenBatches = schedule.execution.delayBetweenBatches;
      
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        
        // 배치 처리
        await this.processBatch(schedule, template, batch);
        
        // 배치 간 지연
        if (i + batchSize < users.length && delayBetweenBatches > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }
      
      // 완료 상태 업데이트
      schedule.status = 'completed';
      schedule.completedAt = new Date();
      schedule.stats.endTime = new Date();
      schedule.results.success = true;
      await schedule.save();
      
      return schedule;
    } catch (error) {
      console.error('Execute schedule error:', error);
      
      // 실패 상태 업데이트
      try {
        const schedule = await NotificationSchedule.findById(scheduleId);
        if (schedule) {
          schedule.status = 'failed';
          schedule.completedAt = new Date();
          schedule.stats.endTime = new Date();
          schedule.results.success = false;
          schedule.results.error = error instanceof Error ? error.message : 'Unknown error';
          await schedule.save();
        }
      } catch (updateError) {
        console.error('Update schedule error status error:', updateError);
      }
      
      throw error;
    }
  }

  // 배치 처리
  private static async processBatch(schedule: any, template: any, users: any[]): Promise<void> {
    try {
      for (const user of users) {
        try {
          // 조건 검증
          const isValid = await NotificationTemplateEngine.validateConditions(
            template,
            user._id.toString(),
            { orderValue: 0 } // 실제로는 주문 데이터를 조회해야 함
          );
          
          if (!isValid) {
            schedule.stats.failed++;
            continue;
          }
          
          // 변수 준비
          const variables = Object.entries(schedule.message.variables).map(([name, value]) => ({
            name,
            value,
            type: 'string' as const
          }));
          
          // 템플릿 처리
          const processedTemplate = NotificationTemplateEngine.processTemplate(template, variables);
          
          // 알림 전송
          const notificationData = {
            userId: user._id.toString(),
            title: processedTemplate.title,
            message: processedTemplate.content,
            category: template.category,
            type: 'marketing' as const,
            priority: schedule.priority,
            source: 'schedule',
            channels: {
              email: schedule.message.channels.email && processedTemplate.channels.email,
              push: schedule.message.channels.push && processedTemplate.channels.push,
              sms: schedule.message.channels.sms && processedTemplate.channels.sms,
              inApp: schedule.message.channels.inApp && processedTemplate.channels.inApp
            },
            metadata: {
              scheduleId: schedule._id.toString(),
              templateId: template._id.toString(),
              variables: processedTemplate.variables
            }
          };
          
          await NotificationService.sendNotification(notificationData);
          
          schedule.stats.sent++;
          schedule.stats.pending--;
          
        } catch (userError) {
          console.error(`Process user ${user._id} error:`, userError);
          schedule.stats.failed++;
          schedule.stats.pending--;
        }
      }
      
      await schedule.save();
    } catch (error) {
      console.error('Process batch error:', error);
      throw error;
    }
  }

  // 예약 실행 스케줄링
  private static async scheduleExecution(scheduleId: string, scheduledAt: Date): Promise<void> {
    try {
      const now = new Date();
      const delay = scheduledAt.getTime() - now.getTime();
      
      if (delay <= 0) {
        // 이미 시간이 지났으면 즉시 실행
        await this.executeSchedule(scheduleId);
        return;
      }
      
      // 타이머 설정
      setTimeout(async () => {
        try {
          await this.executeSchedule(scheduleId);
        } catch (error) {
          console.error('Scheduled execution error:', error);
        }
      }, delay);
      
    } catch (error) {
      console.error('Schedule execution error:', error);
      throw error;
    }
  }

  // 반복 실행 스케줄링
  private static async scheduleRecurring(scheduleId: string, recurring: any): Promise<void> {
    try {
      const { pattern, interval, daysOfWeek, dayOfMonth, time, timezone, endDate } = recurring;
      
      let cronExpression = '';
      
      switch (pattern) {
        case 'daily':
          cronExpression = `${time.split(':')[1]} ${time.split(':')[0]} * * *`;
          break;
        
        case 'weekly':
          if (daysOfWeek && daysOfWeek.length > 0) {
            const dayOfWeekStr = daysOfWeek.join(',');
            cronExpression = `${time.split(':')[1]} ${time.split(':')[0]} * * ${dayOfWeekStr}`;
          } else {
            cronExpression = `${time.split(':')[1]} ${time.split(':')[0]} * * 0`;
          }
          break;
        
        case 'monthly':
          cronExpression = `${time.split(':')[1]} ${time.split(':')[0]} ${dayOfMonth || 1} * *`;
          break;
        
        default:
          throw new Error('Unsupported recurring pattern');
      }
      
      // 크론 작업 생성
      const cronJob = cron.schedule(cronExpression, async () => {
        try {
          // 종료 날짜 확인
          if (endDate && new Date() > endDate) {
            this.cronJobs.get(scheduleId)?.stop();
            this.cronJobs.delete(scheduleId);
            return;
          }
          
          await this.executeSchedule(scheduleId);
        } catch (error) {
          console.error('Recurring execution error:', error);
        }
      }, {
        timezone: timezone || 'Asia/Seoul'
      });
      
      this.cronJobs.set(scheduleId, cronJob);
      
    } catch (error) {
      console.error('Schedule recurring error:', error);
      throw error;
    }
  }

  // 스케줄 조회
  static async getSchedules(
    filters: any = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ schedules: any[], total: number, page: number, totalPages: number }> {
    try {
      await connectDB();
      
      const query: any = {};
      
      if (filters.status) query.status = filters.status;
      if (filters.type) query.type = filters.type;
      if (filters.priority) query.priority = filters.priority;
      if (filters.createdBy) query.createdBy = filters.createdBy;
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }
      
      const skip = (page - 1) * limit;
      
      const [schedules, total] = await Promise.all([
        NotificationSchedule.find(query)
          .populate('templateId', 'name type category')
          .populate('createdBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        NotificationSchedule.countDocuments(query)
      ]);
      
      return {
        schedules,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Get schedules error:', error);
      throw error;
    }
  }

  // 스케줄 상세 조회
  static async getSchedule(scheduleId: string): Promise<any> {
    try {
      await connectDB();
      
      const schedule = await NotificationSchedule.findById(scheduleId)
        .populate('templateId', 'name type category')
        .populate('createdBy', 'name email');
      
      if (!schedule) {
        throw new Error('Schedule not found');
      }
      
      return schedule;
    } catch (error) {
      console.error('Get schedule error:', error);
      throw error;
    }
  }

  // 스케줄 업데이트
  static async updateSchedule(scheduleId: string, updateData: any): Promise<any> {
    try {
      await connectDB();
      
      const schedule = await NotificationSchedule.findById(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }
      
      if (schedule.status === 'sending') {
        throw new Error('Cannot update schedule while sending');
      }
      
      const updatedSchedule = await NotificationSchedule.findByIdAndUpdate(
        scheduleId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('templateId', 'name type category')
       .populate('createdBy', 'name email');
      
      return updatedSchedule;
    } catch (error) {
      console.error('Update schedule error:', error);
      throw error;
    }
  }

  // 스케줄 삭제
  static async deleteSchedule(scheduleId: string): Promise<boolean> {
    try {
      await connectDB();
      
      const schedule = await NotificationSchedule.findById(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }
      
      if (schedule.status === 'sending') {
        throw new Error('Cannot delete schedule while sending');
      }
      
      // 크론 작업 중지
      const cronJob = this.cronJobs.get(scheduleId);
      if (cronJob) {
        cronJob.stop();
        this.cronJobs.delete(scheduleId);
      }
      
      const result = await NotificationSchedule.findByIdAndDelete(scheduleId);
      return !!result;
    } catch (error) {
      console.error('Delete schedule error:', error);
      throw error;
    }
  }

  // 스케줄 일시정지
  static async pauseSchedule(scheduleId: string): Promise<any> {
    try {
      await connectDB();
      
      const schedule = await NotificationSchedule.findById(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }
      
      if (schedule.status !== 'pending') {
        throw new Error('Can only pause pending schedules');
      }
      
      // 크론 작업 중지
      const cronJob = this.cronJobs.get(scheduleId);
      if (cronJob) {
        cronJob.stop();
      }
      
      schedule.status = 'cancelled';
      await schedule.save();
      
      return schedule;
    } catch (error) {
      console.error('Pause schedule error:', error);
      throw error;
    }
  }

  // 스케줄 재시작
  static async resumeSchedule(scheduleId: string): Promise<any> {
    try {
      await connectDB();
      
      const schedule = await NotificationSchedule.findById(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }
      
      if (schedule.status !== 'cancelled') {
        throw new Error('Can only resume cancelled schedules');
      }
      
      schedule.status = 'pending';
      await schedule.save();
      
      // 스케줄 재시작
      if (schedule.type === 'immediate') {
        await this.executeSchedule(scheduleId);
      } else if (schedule.type === 'scheduled' && schedule.schedule?.scheduledAt) {
        await this.scheduleExecution(scheduleId, schedule.schedule.scheduledAt);
      } else if (schedule.type === 'recurring' && schedule.schedule?.recurring) {
        await this.scheduleRecurring(scheduleId, schedule.schedule.recurring);
      }
      
      return schedule;
    } catch (error) {
      console.error('Resume schedule error:', error);
      throw error;
    }
  }

  // 스케줄 통계
  static async getScheduleStats(scheduleId: string): Promise<any> {
    try {
      await connectDB();
      
      const schedule = await NotificationSchedule.findById(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }
      
      const stats = {
        ...schedule.stats,
        deliveryRate: schedule.stats.sent > 0 ? (schedule.stats.delivered / schedule.stats.sent) * 100 : 0,
        openRate: schedule.stats.delivered > 0 ? (schedule.stats.opened / schedule.stats.delivered) * 100 : 0,
        clickRate: schedule.stats.opened > 0 ? (schedule.stats.clicked / schedule.stats.opened) * 100 : 0,
        conversionRate: schedule.stats.clicked > 0 ? (schedule.stats.converted / schedule.stats.clicked) * 100 : 0
      };
      
      return stats;
    } catch (error) {
      console.error('Get schedule stats error:', error);
      throw error;
    }
  }
}
