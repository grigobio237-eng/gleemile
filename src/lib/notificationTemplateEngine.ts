import NotificationTemplate from '@/models/NotificationTemplate';
import NotificationSchedule from '@/models/NotificationSchedule';
import User from '@/models/User';
import CustomerSegment from '@/models/CustomerSegment';
import { connectDB } from '@/lib/db';

export interface TemplateVariable {
  name: string;
  value: any;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
}

export interface ProcessedTemplate {
  subject?: string;
  title: string;
  content: string;
  htmlContent?: string;
  channels: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    inApp?: boolean;
  };
  variables: {
    [key: string]: any;
  };
}

export interface TemplateSearchFilters {
  type?: string;
  category?: string;
  status?: string;
  language?: string;
  tags?: string[];
  createdBy?: string;
  search?: string;
}

export class NotificationTemplateEngine {
  // 템플릿 생성
  static async createTemplate(templateData: any): Promise<any> {
    try {
      await connectDB();
      
      const template = new NotificationTemplate({
        ...templateData,
        version: 1
      });
      
      await template.save();
      return template;
    } catch (error) {
      console.error('Create template error:', error);
      throw error;
    }
  }

  // 템플릿 조회
  static async getTemplates(
    filters: TemplateSearchFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ templates: any[], total: number, page: number, totalPages: number }> {
    try {
      await connectDB();
      
      const query: any = {};
      
      if (filters.type) query.type = filters.type;
      if (filters.category) query.category = filters.category;
      if (filters.status) query.status = filters.status;
      if (filters.language) query.language = filters.language;
      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }
      if (filters.createdBy) query.createdBy = filters.createdBy;
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } },
          { title: { $regex: filters.search, $options: 'i' } },
          { content: { $regex: filters.search, $options: 'i' } }
        ];
      }
      
      const skip = (page - 1) * limit;
      
      const [templates, total] = await Promise.all([
        NotificationTemplate.find(query)
          .populate('createdBy', 'name email')
          .populate('updatedBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        NotificationTemplate.countDocuments(query)
      ]);
      
      return {
        templates,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Get templates error:', error);
      throw error;
    }
  }

  // 템플릿 상세 조회
  static async getTemplate(templateId: string): Promise<any> {
    try {
      await connectDB();
      
      const template = await NotificationTemplate.findById(templateId)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      // 통계 정보 추가 (임시 데이터)
      const templateWithStats = {
        ...template.toObject(),
        stats: {
          totalSent: Math.floor(Math.random() * 1000) + 100,
          averageDeliveryRate: Math.floor(Math.random() * 20) + 80,
          averageOpenRate: Math.floor(Math.random() * 30) + 40
        }
      };
      
      return templateWithStats;
    } catch (error) {
      console.error('Get template error:', error);
      throw error;
    }
  }

  // 템플릿 업데이트
  static async updateTemplate(templateId: string, updateData: any): Promise<any> {
    try {
      await connectDB();
      
      const template = await NotificationTemplate.findByIdAndUpdate(
        templateId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email')
       .populate('updatedBy', 'name email');
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      return template;
    } catch (error) {
      console.error('Update template error:', error);
      throw error;
    }
  }

  // 템플릿 삭제
  static async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      await connectDB();
      
      // 스케줄된 알림이 있는지 확인
      const scheduledCount = await NotificationSchedule.countDocuments({
        templateId,
        status: { $in: ['pending', 'sending'] }
      });
      
      if (scheduledCount > 0) {
        throw new Error('Cannot delete template with active schedules');
      }
      
      const result = await NotificationTemplate.findByIdAndDelete(templateId);
      return !!result;
    } catch (error) {
      console.error('Delete template error:', error);
      throw error;
    }
  }

  // 템플릿 변수 처리
  static processTemplate(
    template: any,
    variables: TemplateVariable[]
  ): ProcessedTemplate {
    try {
      const variableMap = new Map();
      variables.forEach(variable => {
        variableMap.set(variable.name, variable.value);
      });
      
      // 필수 변수 검증
      const requiredVariables = template.variables.filter((v: any) => v.required);
      for (const variable of requiredVariables) {
        if (!variableMap.has(variable.name)) {
          throw new Error(`Required variable '${variable.name}' is missing`);
        }
      }
      
      // 변수 치환 함수
      const replaceVariables = (text: string): string => {
        if (!text) return text;
        
        return text.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
          const value = variableMap.get(variableName);
          if (value === undefined) {
            const variable = template.variables.find((v: any) => v.name === variableName);
            return variable?.defaultValue || match;
          }
          return String(value);
        });
      };
      
      const processedTemplate: ProcessedTemplate = {
        subject: template.subject ? replaceVariables(template.subject) : undefined,
        title: replaceVariables(template.title),
        content: replaceVariables(template.content),
        htmlContent: template.htmlContent ? replaceVariables(template.htmlContent) : undefined,
        channels: {
          email: template.channels.email?.enabled || false,
          push: template.channels.push?.enabled || false,
          sms: template.channels.sms?.enabled || false,
          inApp: template.channels.inApp?.enabled || false
        },
        variables: Object.fromEntries(variableMap)
      };
      
      return processedTemplate;
    } catch (error) {
      console.error('Process template error:', error);
      throw error;
    }
  }

  // 조건 검증
  static async validateConditions(
    template: any,
    userId: string,
    context: any = {}
  ): Promise<boolean> {
    try {
      if (!template.conditions) return true;
      
      const user = await User.findById(userId);
      if (!user) return false;
      
      const conditions = template.conditions;
      
      // 사용자 세그먼트 검증
      if (conditions.userSegments && conditions.userSegments.length > 0) {
        const userSegments = await CustomerSegment.find({
          _id: { $in: conditions.userSegments },
          'members.userId': userId
        });
        if (userSegments.length === 0) return false;
      }
      
      // 사용자 태그 검증
      if (conditions.userTags && conditions.userTags.length > 0) {
        const userTags = user.tags || [];
        const hasRequiredTags = conditions.userTags.every((tag: string) => 
          userTags.includes(tag)
        );
        if (!hasRequiredTags) return false;
      }
      
      // 주문 금액 검증
      if (conditions.minOrderValue || conditions.maxOrderValue) {
        // 실제 구현에서는 주문 데이터를 조회해야 함
        const orderValue = context.orderValue || 0;
        if (conditions.minOrderValue && orderValue < conditions.minOrderValue) return false;
        if (conditions.maxOrderValue && orderValue > conditions.maxOrderValue) return false;
      }
      
      // 시간대 검증
      if (conditions.timeOfDay) {
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-US', { 
          hour12: false, 
          timeZone: conditions.timezone || 'Asia/Seoul' 
        });
        const { start, end } = conditions.timeOfDay;
        if (currentTime < start || currentTime > end) return false;
      }
      
      // 요일 검증
      if (conditions.dayOfWeek && conditions.dayOfWeek.length > 0) {
        const currentDay = new Date().getDay();
        if (!conditions.dayOfWeek.includes(currentDay)) return false;
      }
      
      return true;
    } catch (error) {
      console.error('Validate conditions error:', error);
      return false;
    }
  }

  // 템플릿 통계
  static async getTemplateStats(templateId: string): Promise<any> {
    try {
      await connectDB();
      
      const template = await NotificationTemplate.findById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      const schedules = await NotificationSchedule.find({ templateId });
      
      const stats = {
        totalSchedules: schedules.length,
        activeSchedules: schedules.filter(s => s.status === 'pending' || s.status === 'sending').length,
        completedSchedules: schedules.filter(s => s.status === 'completed').length,
        failedSchedules: schedules.filter(s => s.status === 'failed').length,
        totalSent: schedules.reduce((sum, s) => sum + s.stats.sent, 0),
        totalDelivered: schedules.reduce((sum, s) => sum + s.stats.delivered, 0),
        totalOpened: schedules.reduce((sum, s) => sum + s.stats.opened, 0),
        totalClicked: schedules.reduce((sum, s) => sum + s.stats.clicked, 0),
        totalConverted: schedules.reduce((sum, s) => sum + s.stats.converted, 0),
        averageDeliveryRate: 0,
        averageOpenRate: 0,
        averageClickRate: 0,
        averageConversionRate: 0
      };
      
      if (stats.totalSent > 0) {
        stats.averageDeliveryRate = (stats.totalDelivered / stats.totalSent) * 100;
      }
      if (stats.totalDelivered > 0) {
        stats.averageOpenRate = (stats.totalOpened / stats.totalDelivered) * 100;
      }
      if (stats.totalOpened > 0) {
        stats.averageClickRate = (stats.totalClicked / stats.totalOpened) * 100;
      }
      if (stats.totalClicked > 0) {
        stats.averageConversionRate = (stats.totalConverted / stats.totalClicked) * 100;
      }
      
      return stats;
    } catch (error) {
      console.error('Get template stats error:', error);
      throw error;
    }
  }

  // 템플릿 복제
  static async duplicateTemplate(templateId: string, newName: string): Promise<any> {
    try {
      await connectDB();
      
      const originalTemplate = await NotificationTemplate.findById(templateId);
      if (!originalTemplate) {
        throw new Error('Template not found');
      }
      
      const duplicatedTemplate = new NotificationTemplate({
        ...originalTemplate.toObject(),
        _id: undefined,
        name: newName,
        status: 'draft',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await duplicatedTemplate.save();
      return duplicatedTemplate;
    } catch (error) {
      console.error('Duplicate template error:', error);
      throw error;
    }
  }

  // 템플릿 미리보기
  static async previewTemplate(
    templateId: string,
    variables: TemplateVariable[]
  ): Promise<ProcessedTemplate> {
    try {
      const template = await this.getTemplate(templateId);
      return this.processTemplate(template, variables);
    } catch (error) {
      console.error('Preview template error:', error);
      throw error;
    }
  }
}









