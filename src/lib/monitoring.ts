// 실시간 성능 모니터링 시스템
import os from 'os';
import { NextRequest, NextResponse } from 'next/server';
import { getMemoryOptimizedSettings, isMemoryUsageHigh } from './memoryOptimizer';

interface PerformanceMetrics {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    loadAverage: number[];
    usage: number;
  };
  api: {
    responseTime: number;
    statusCode: number;
    endpoint: string;
    method: string;
  };
  cache: {
    hitRate: number;
    missCount: number;
    hitCount: number;
  };
  database: {
    connectionCount: number;
    queryTime: number;
  };
}

interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: PerformanceMetrics) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  cooldown: number; // 알림 간격 (ms)
  lastTriggered?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000; // 최대 저장 메트릭 수
  private alertRules: AlertRule[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeAlertRules();
  }

  // 알림 규칙 초기화
  private initializeAlertRules() {
    this.alertRules = [
      {
        id: 'high_memory_usage',
        name: '높은 메모리 사용률',
        condition: (metrics) => metrics.memory.percentage > 80,
        severity: 'high',
        message: '메모리 사용률이 높습니다.',
        cooldown: 300000, // 5분
      },
      {
        id: 'high_cpu_usage',
        name: '높은 CPU 사용률',
        condition: (metrics) => metrics.cpu.usage > 80,
        severity: 'high',
        message: 'CPU 사용률이 높습니다.',
        cooldown: 300000, // 5분
      },
      {
        id: 'slow_api_response',
        name: '느린 API 응답',
        condition: (metrics) => metrics.api.responseTime > 2000,
        severity: 'medium',
        message: 'API 응답 시간이 느립니다.',
        cooldown: 60000, // 1분
      },
      {
        id: 'low_cache_hit_rate',
        name: '낮은 캐시 히트율',
        condition: (metrics) => metrics.cache.hitRate < 50 && metrics.cache.hitCount + metrics.cache.missCount > 10,
        severity: 'medium',
        message: '캐시 히트율이 낮습니다.',
        cooldown: 300000, // 5분
      },
      {
        id: 'critical_memory_usage',
        name: '치명적 메모리 사용률',
        condition: (metrics) => metrics.memory.percentage > 95,
        severity: 'critical',
        message: '메모리 사용률이 치명적 수준입니다!',
        cooldown: 60000, // 1분
      },
    ];
  }

  // 모니터링 시작
  startMonitoring(intervalMs: number = 5000) {
    if (this.isMonitoring) return;

    // 메모리 최적화 설정 가져오기
    const memorySettings = getMemoryOptimizedSettings();
    
    if (!memorySettings.enableMonitoring) {
      console.log('⚠️ 메모리 사용률이 높아 모니터링 시스템을 비활성화합니다.');
      return;
    }

    this.isMonitoring = true;
    // 메모리 최적화된 간격 사용
    const optimizedInterval = memorySettings.monitoringInterval;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, optimizedInterval);

    console.log(`📊 성능 모니터링 시작 (간격: ${optimizedInterval}ms)`);
  }

  // 모니터링 중지
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('📊 성능 모니터링 중지');
  }

  // 메트릭 수집
  private collectMetrics() {
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memUsagePercent = (usedMemory / totalMemory) * 100;
    
    // 메모리 사용률이 95% 이상이면 메트릭 수집 중지
    if (memUsagePercent > 95) {
      console.log(`⚠️ 메모리 사용률이 ${memUsagePercent.toFixed(2)}%로 높아 메트릭 수집을 중지합니다.`);
      this.stopMonitoring();
      return;
    }

    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round((usedMemory / totalMemory) * 100 * 100) / 100,
      },
      cpu: {
        loadAverage: os.loadavg(),
        usage: this.calculateCpuUsage(),
      },
      api: {
        responseTime: 0, // API 호출 시 업데이트
        statusCode: 200,
        endpoint: '',
        method: '',
      },
      cache: {
        hitRate: this.calculateCacheHitRate(),
        missCount: 0,
        hitCount: 0,
      },
      database: {
        connectionCount: 0,
        queryTime: 0,
      },
    };

    this.metrics.push(metrics);

    // 메모리 사용률이 높을 때 메트릭 수를 더 적게 유지
    const maxMetrics = memUsagePercent > 85 ? 50 : this.maxMetrics;
    if (this.metrics.length > maxMetrics) {
      this.metrics = this.metrics.slice(-maxMetrics);
    }

    // 알림 체크
    this.checkAlerts(metrics);
  }

  // CPU 사용률 계산 (간단한 추정)
  private calculateCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    return Math.round(100 - (totalIdle / totalTick) * 100);
  }

  // 캐시 히트율 계산
  private calculateCacheHitRate(): number {
    const recentMetrics = this.metrics.slice(-10); // 최근 10개 메트릭
    if (recentMetrics.length === 0) return 0;

    const totalRequests = recentMetrics.reduce((sum, m) => sum + m.cache.hitCount + m.cache.missCount, 0);
    const totalHits = recentMetrics.reduce((sum, m) => sum + m.cache.hitCount, 0);

    return totalRequests > 0 ? Math.round((totalHits / totalRequests) * 100 * 100) / 100 : 0;
  }

  // 알림 체크
  private checkAlerts(metrics: PerformanceMetrics) {
    this.alertRules.forEach(rule => {
      if (rule.condition(metrics)) {
        const now = Date.now();
        const lastTriggered = rule.lastTriggered || 0;
        
        if (now - lastTriggered > rule.cooldown) {
          rule.lastTriggered = now;
          this.triggerAlert(rule, metrics);
        }
      }
    });
  }

  // 알림 트리거
  private triggerAlert(rule: AlertRule, metrics: PerformanceMetrics) {
    // 동적으로 메시지 생성
    let dynamicMessage = rule.message;
    if (rule.id === 'high_memory_usage' || rule.id === 'critical_memory_usage') {
      dynamicMessage = `메모리 사용률이 ${metrics.memory.percentage.toFixed(2)}%로 높습니다.`;
    } else if (rule.id === 'high_cpu_usage') {
      dynamicMessage = `CPU 사용률이 ${metrics.cpu.usage.toFixed(2)}%로 높습니다.`;
    } else if (rule.id === 'slow_api_response') {
      dynamicMessage = `API 응답 시간이 ${metrics.api.responseTime}ms로 느립니다.`;
    } else if (rule.id === 'low_cache_hit_rate') {
      dynamicMessage = `캐시 히트율이 ${metrics.cache.hitRate.toFixed(2)}%로 낮습니다.`;
    }

    const alert = {
      id: rule.id,
      name: rule.name,
      severity: rule.severity,
      message: dynamicMessage,
      timestamp: new Date().toISOString(),
      metrics: {
        memory: metrics.memory,
        cpu: metrics.cpu,
        api: metrics.api,
        cache: metrics.cache,
      },
    };

    console.log(`🚨 ${rule.severity.toUpperCase()} 알림: ${rule.name}`);
    console.log(`   ${dynamicMessage}`);
    console.log(`   메모리: ${metrics.memory.percentage}%`);
    console.log(`   CPU: ${metrics.cpu.usage}%`);
    console.log(`   캐시 히트율: ${metrics.cache.hitRate}%`);

    // 실제 알림 시스템과 연동 (이메일, 슬랙 등)
    this.sendAlert(alert);
  }

  // 알림 전송 (실제 구현 필요)
  private sendAlert(alert: any) {
    // TODO: 실제 알림 시스템과 연동
    // - 이메일 알림
    // - 슬랙 알림
    // - SMS 알림
    // - 웹훅 알림
  }

  // API 응답 시간 기록
  recordApiCall(endpoint: string, method: string, responseTime: number, statusCode: number) {
    if (this.metrics.length > 0) {
      const latestMetrics = this.metrics[this.metrics.length - 1];
      latestMetrics.api = {
        responseTime,
        statusCode,
        endpoint,
        method,
      };
    }
  }

  // 캐시 히트/미스 기록
  recordCacheHit() {
    if (this.metrics.length > 0) {
      const latestMetrics = this.metrics[this.metrics.length - 1];
      latestMetrics.cache.hitCount++;
    }
  }

  recordCacheMiss() {
    if (this.metrics.length > 0) {
      const latestMetrics = this.metrics[this.metrics.length - 1];
      latestMetrics.cache.missCount++;
    }
  }

  // 현재 상태 조회
  getCurrentStatus() {
    if (this.metrics.length === 0) return null;
    
    const latest = this.metrics[this.metrics.length - 1];
    const avgResponseTime = this.getAverageResponseTime();
    const avgCacheHitRate = this.calculateCacheHitRate();

    return {
      status: this.getOverallStatus(),
      memory: latest.memory,
      cpu: latest.cpu,
      api: {
        ...latest.api,
        averageResponseTime: avgResponseTime,
      },
      cache: {
        ...latest.cache,
        hitRate: avgCacheHitRate,
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  // 전체 상태 평가
  private getOverallStatus(): 'healthy' | 'warning' | 'critical' {
    if (this.metrics.length === 0) return 'healthy';

    const latest = this.metrics[this.metrics.length - 1];
    
    if (latest.memory.percentage > 95 || latest.cpu.usage > 95) {
      return 'critical';
    }
    
    if (latest.memory.percentage > 80 || latest.cpu.usage > 80 || latest.api.responseTime > 2000) {
      return 'warning';
    }
    
    return 'healthy';
  }

  // 평균 응답 시간 계산
  private getAverageResponseTime(): number {
    const recentMetrics = this.metrics.slice(-20); // 최근 20개
    const apiMetrics = recentMetrics.filter(m => m.api.responseTime > 0);
    
    if (apiMetrics.length === 0) return 0;
    
    const totalTime = apiMetrics.reduce((sum, m) => sum + m.api.responseTime, 0);
    return Math.round(totalTime / apiMetrics.length);
  }

  // 메트릭 히스토리 조회
  getMetricsHistory(limit: number = 100) {
    return this.metrics.slice(-limit);
  }

  // 알림 규칙 추가
  addAlertRule(rule: AlertRule) {
    this.alertRules.push(rule);
  }

  // 알림 규칙 제거
  removeAlertRule(ruleId: string) {
    this.alertRules = this.alertRules.filter(rule => rule.id !== ruleId);
  }

  // 메트릭 초기화
  clearMetrics() {
    this.metrics = [];
  }

  // 모니터링 상태 조회
  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}

// 싱글톤 인스턴스
const performanceMonitor = new PerformanceMonitor();

// 모니터링 미들웨어
export function monitoringMiddleware(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const endpoint = req.nextUrl.pathname;
    const method = req.method;

    try {
      const response = await handler(req);
      const responseTime = Date.now() - startTime;
      
      // API 호출 기록
      performanceMonitor.recordApiCall(endpoint, method, responseTime, response.status);
      
      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // 에러 발생 시에도 기록
      performanceMonitor.recordApiCall(endpoint, method, responseTime, 500);
      
      throw error;
    }
  };
}

// 헬스 체크 엔드포인트
export function createHealthCheckHandler() {
  return async (req: NextRequest): Promise<NextResponse> => {
    const status = performanceMonitor.getCurrentStatus();
    
    if (!status) {
      return NextResponse.json(
        { error: '모니터링 데이터가 없습니다.' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: status.status,
      timestamp: status.timestamp,
      uptime: status.uptime,
      memory: status.memory,
      cpu: status.cpu,
      api: status.api,
      cache: status.cache,
    });
  };
}

export default performanceMonitor;
