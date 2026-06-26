// 알림 시스템
import nodemailer from 'nodemailer';
import logger from './logger';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertType = 'performance' | 'security' | 'error' | 'system' | 'business';

interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: any;
}

interface NotificationChannel {
  id: string;
  name: string;
  enabled: boolean;
  config: any;
}

interface NotificationRule {
  id: string;
  name: string;
  conditions: {
    type?: AlertType;
    severity?: AlertSeverity;
    keywords?: string[];
  };
  channels: string[];
  cooldown: number; // 알림 간격 (ms)
  lastSent?: Date;
}

class NotificationService {
  private alerts: Alert[] = [];
  private channels: Map<string, NotificationChannel> = new Map();
  private rules: NotificationRule[] = [];
  private emailTransporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeChannels();
    this.initializeRules();
    this.initializeEmail();
  }

  // 알림 채널 초기화
  private initializeChannels() {
    // 콘솔 채널
    this.channels.set('console', {
      id: 'console',
      name: '콘솔 알림',
      enabled: true,
      config: {},
    });

    // 이메일 채널
    this.channels.set('email', {
      id: 'email',
      name: '이메일 알림',
      enabled: process.env.EMAIL_ENABLED === 'true',
      config: {
        to: process.env.ALERT_EMAIL || 'admin@youniqle.com',
        from: process.env.SMTP_FROM || 'noreply@youniqle.com',
      },
    });

    // 웹훅 채널
    this.channels.set('webhook', {
      id: 'webhook',
      name: '웹훅 알림',
      enabled: process.env.WEBHOOK_ENABLED === 'true',
      config: {
        url: process.env.WEBHOOK_URL,
        secret: process.env.WEBHOOK_SECRET,
      },
    });
  }

  // 알림 규칙 초기화
  private initializeRules() {
    this.rules = [
      {
        id: 'critical_alerts',
        name: '치명적 알림',
        conditions: {
          severity: 'critical',
        },
        channels: ['console', 'email', 'webhook'],
        cooldown: 0, // 즉시 전송
      },
      {
        id: 'high_security',
        name: '높은 보안 이벤트',
        conditions: {
          type: 'security',
          severity: 'high',
        },
        channels: ['console', 'email'],
        cooldown: 300000, // 5분
      },
      {
        id: 'performance_issues',
        name: '성능 문제',
        conditions: {
          type: 'performance',
          severity: 'high',
        },
        channels: ['console'],
        cooldown: 600000, // 10분
      },
      {
        id: 'system_errors',
        name: '시스템 오류',
        conditions: {
          type: 'error',
          severity: 'medium',
        },
        channels: ['console'],
        cooldown: 300000, // 5분
      },
    ];
  }

  // 이메일 초기화
  private initializeEmail() {
    if (process.env.EMAIL_ENABLED === 'true' && process.env.SMTP_HOST) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  // 알림 생성
  createAlert(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    metadata?: any
  ): string {
    const alert: Alert = {
      id: this.generateAlertId(),
      type,
      severity,
      title,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata,
    };

    this.alerts.push(alert);
    logger.warn('system', `알림 생성: ${title}`, { alert });

    // 알림 전송
    this.processAlert(alert);

    return alert.id;
  }

  // 알림 ID 생성
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  // 알림 처리
  private async processAlert(alert: Alert) {
    const applicableRules = this.rules.filter(rule => this.matchesRule(alert, rule));
    
    for (const rule of applicableRules) {
      if (this.shouldSendNotification(rule)) {
        await this.sendNotification(alert, rule);
        rule.lastSent = new Date();
      }
    }
  }

  // 규칙 매칭 확인
  private matchesRule(alert: Alert, rule: NotificationRule): boolean {
    const { conditions } = rule;
    
    if (conditions.type && alert.type !== conditions.type) return false;
    if (conditions.severity && alert.severity !== conditions.severity) return false;
    if (conditions.keywords) {
      const message = `${alert.title} ${alert.message}`.toLowerCase();
      const hasKeyword = conditions.keywords.some(keyword => 
        message.includes(keyword.toLowerCase())
      );
      if (!hasKeyword) return false;
    }
    
    return true;
  }

  // 알림 전송 여부 확인
  private shouldSendNotification(rule: NotificationRule): boolean {
    if (!rule.lastSent) return true;
    
    const now = new Date();
    const timeSinceLastSent = now.getTime() - rule.lastSent.getTime();
    
    return timeSinceLastSent >= rule.cooldown;
  }

  // 알림 전송
  private async sendNotification(alert: Alert, rule: NotificationRule) {
    for (const channelId of rule.channels) {
      const channel = this.channels.get(channelId);
      if (!channel || !channel.enabled) continue;

      try {
        await this.sendToChannel(alert, channel);
        logger.info('system', `알림 전송 성공: ${channel.name}`, { alert, channel });
      } catch (error) {
        logger.error('system', `알림 전송 실패: ${channel.name}`, error as Error, { alert, channel });
      }
    }
  }

  // 채널별 알림 전송
  private async sendToChannel(alert: Alert, channel: NotificationChannel) {
    switch (channel.id) {
      case 'console':
        this.sendToConsole(alert);
        break;
      case 'email':
        await this.sendToEmail(alert, channel);
        break;
      case 'webhook':
        await this.sendToWebhook(alert, channel);
        break;
    }
  }

  // 콘솔 알림
  private sendToConsole(alert: Alert) {
    const colors = {
      low: '\x1b[36m',    // Cyan
      medium: '\x1b[33m', // Yellow
      high: '\x1b[31m',   // Red
      critical: '\x1b[35m', // Magenta
    };

    const reset = '\x1b[0m';
    const color = colors[alert.severity];
    const timestamp = alert.timestamp.toISOString();

    console.log(
      `\n${color}🚨 ${alert.severity.toUpperCase()} 알림${reset}\n` +
      `시간: ${timestamp}\n` +
      `유형: ${alert.type}\n` +
      `제목: ${alert.title}\n` +
      `내용: ${alert.message}\n` +
      `ID: ${alert.id}\n` +
      `${'='.repeat(50)}\n`
    );
  }

  // 이메일 알림
  private async sendToEmail(alert: Alert, channel: NotificationChannel) {
    if (!this.emailTransporter) {
      throw new Error('이메일 전송기가 초기화되지 않았습니다.');
    }

    const subject = `[${alert.severity.toUpperCase()}] ${alert.title}`;
    const html = this.generateEmailTemplate(alert);

    await this.emailTransporter.sendMail({
      from: channel.config.from,
      to: channel.config.to,
      subject,
      html,
    });
  }

  // 이메일 템플릿 생성
  private generateEmailTemplate(alert: Alert): string {
    const severityColors = {
      low: '#36a2eb',
      medium: '#ffcd56',
      high: '#ff6384',
      critical: '#9c27b0',
    };

    const color = severityColors[alert.severity];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>시스템 알림</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background-color: ${color}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .alert-info { background-color: #f8f9fa; border-left: 4px solid ${color}; padding: 15px; margin: 15px 0; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 시스템 알림</h1>
            <p>${alert.severity.toUpperCase()} - ${alert.type.toUpperCase()}</p>
          </div>
          <div class="content">
            <h2>${alert.title}</h2>
            <div class="alert-info">
              <p><strong>시간:</strong> ${alert.timestamp.toLocaleString('ko-KR')}</p>
              <p><strong>유형:</strong> ${alert.type}</p>
              <p><strong>심각도:</strong> ${alert.severity}</p>
              <p><strong>알림 ID:</strong> ${alert.id}</p>
            </div>
            <h3>상세 내용</h3>
            <p>${alert.message}</p>
            ${alert.metadata ? `
              <h3>추가 정보</h3>
              <pre style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto;">
${JSON.stringify(alert.metadata, null, 2)}
              </pre>
            ` : ''}
          </div>
          <div class="footer">
            <p>이 알림은 Youniqle 시스템에서 자동으로 생성되었습니다.</p>
            <p>관리자 패널에서 더 자세한 정보를 확인할 수 있습니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // 웹훅 알림
  private async sendToWebhook(alert: Alert, channel: NotificationChannel) {
    const payload = {
      text: `🚨 ${alert.severity.toUpperCase()} 알림`,
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        fields: [
          { title: '제목', value: alert.title, short: false },
          { title: '내용', value: alert.message, short: false },
          { title: '유형', value: alert.type, short: true },
          { title: '심각도', value: alert.severity, short: true },
          { title: '시간', value: alert.timestamp.toISOString(), short: true },
          { title: 'ID', value: alert.id, short: true },
        ],
      }],
    };

    const response = await fetch(channel.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channel.config.secret}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`웹훅 전송 실패: ${response.status} ${response.statusText}`);
    }
  }

  // 심각도별 색상
  private getSeverityColor(severity: AlertSeverity): string {
    const colors = {
      low: '#36a2eb',
      medium: '#ffcd56',
      high: '#ff6384',
      critical: '#9c27b0',
    };
    return colors[severity];
  }

  // 알림 해결
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date();

    logger.info('system', `알림 해결: ${alert.title}`, { alert });
    return true;
  }

  // 알림 조회
  getAlerts(limit: number = 100, resolved?: boolean): Alert[] {
    let filtered = this.alerts;
    
    if (resolved !== undefined) {
      filtered = filtered.filter(alert => alert.resolved === resolved);
    }
    
    return filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // 알림 통계
  getAlertStats() {
    const total = this.alerts.length;
    const resolved = this.alerts.filter(a => a.resolved).length;
    const unresolved = total - resolved;
    
    const bySeverity = this.alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<AlertSeverity, number>);

    const byType = this.alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<AlertType, number>);

    return {
      total,
      resolved,
      unresolved,
      bySeverity,
      byType,
    };
  }

  // 채널 관리
  addChannel(channel: NotificationChannel) {
    this.channels.set(channel.id, channel);
  }

  updateChannel(channelId: string, updates: Partial<NotificationChannel>) {
    const channel = this.channels.get(channelId);
    if (channel) {
      Object.assign(channel, updates);
    }
  }

  removeChannel(channelId: string) {
    this.channels.delete(channelId);
  }

  // 규칙 관리
  addRule(rule: NotificationRule) {
    this.rules.push(rule);
  }

  updateRule(ruleId: string, updates: Partial<NotificationRule>) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
    }
  }

  removeRule(ruleId: string) {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  // 알림 정리 (오래된 알림 삭제)
  cleanupAlerts(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const initialCount = this.alerts.length;
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffDate);
    
    const removedCount = initialCount - this.alerts.length;
    if (removedCount > 0) {
      logger.info('system', `오래된 알림 ${removedCount}개 정리 완료`);
    }
  }
}

// 싱글톤 인스턴스
const notificationService = new NotificationService();

// 편의 함수들
export function createAlert(
  type: AlertType,
  severity: AlertSeverity,
  title: string,
  message: string,
  metadata?: any
): string {
  return notificationService.createAlert(type, severity, title, message, metadata);
}

export function resolveAlert(alertId: string): boolean {
  return notificationService.resolveAlert(alertId);
}

export function getAlerts(limit?: number, resolved?: boolean): Alert[] {
  return notificationService.getAlerts(limit, resolved);
}

export function getAlertStats() {
  return notificationService.getAlertStats();
}

export default notificationService;
