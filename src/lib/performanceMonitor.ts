import { NextRequest, NextResponse } from 'next/server';
import { getCacheManager } from './cache';
import { getDatabaseOptimizer } from './dbOptimizer';

export interface PerformanceMetric {
  id: string;
  timestamp: Date;
  type: 'api_request' | 'database_query' | 'cache_operation' | 'external_api';
  name: string;
  duration: number;
  status: 'success' | 'error' | 'warning';
  metadata: {
    method?: string;
    url?: string;
    userId?: string;
    query?: any;
    cacheHit?: boolean;
    error?: string;
    memoryUsage?: number;
    cpuUsage?: number;
    documentsExamined?: number;
    documentsReturned?: number;
    indexUsed?: string;
    key?: string;
    service?: string;
    endpoint?: string;
    statusCode?: number;
  };
}

export interface PerformanceAlert {
  id: string;
  timestamp: Date;
  type: 'slow_query' | 'high_error_rate' | 'memory_usage' | 'cache_miss_rate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  metadata: any;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private thresholds = {
    slowQuery: 1000, // 1초
    highErrorRate: 0.1, // 10%
    memoryUsage: 0.8, // 80%
    cacheMissRate: 0.5 // 50%
  };

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // 메트릭 기록
  public recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      id: this.generateId(),
      timestamp: new Date(),
      ...metric
    };

    this.metrics.push(fullMetric);

    // 메트릭이 너무 많아지면 오래된 것들 제거
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }

    // 알림 체크
    this.checkAlerts(fullMetric);

    // 프로덕션에서는 실제 모니터링 시스템으로 전송
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringSystem(fullMetric);
    }
  }

  // API 요청 메트릭 기록
  public recordApiRequest(
    req: NextRequest,
    res: NextResponse,
    duration: number,
    userId?: string
  ): void {
    const status = res.status >= 400 ? 'error' : 'success';
    
    this.recordMetric({
      type: 'api_request',
      name: `${req.method} ${req.nextUrl.pathname}`,
      duration,
      status,
      metadata: {
        method: req.method,
        url: req.nextUrl.href,
        userId,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: process.cpuUsage().user / 1000000 // seconds
      }
    });
  }

  // 데이터베이스 쿼리 메트릭 기록
  public recordDatabaseQuery(
    collection: string,
    operation: string,
    duration: number,
    documentsExamined: number,
    documentsReturned: number,
    indexUsed?: string,
    error?: string
  ): void {
    const status = error ? 'error' : 'success';
    
    this.recordMetric({
      type: 'database_query',
      name: `${operation} on ${collection}`,
      duration,
      status,
      metadata: {
        query: { collection, operation },
        documentsExamined: documentsExamined,
        documentsReturned: documentsReturned,
        indexUsed: indexUsed,
        error: error
      }
    });
  }

  // 캐시 작업 메트릭 기록
  public recordCacheOperation(
    operation: string,
    key: string,
    duration: number,
    cacheHit: boolean,
    error?: string
  ): void {
    const status = error ? 'error' : 'success';
    
    this.recordMetric({
      type: 'cache_operation',
      name: `Cache ${operation}`,
      duration,
      status,
      metadata: {
        key,
        cacheHit,
        error
      }
    });
  }

  // 외부 API 호출 메트릭 기록
  public recordExternalApi(
    service: string,
    endpoint: string,
    duration: number,
    statusCode: number,
    error?: string
  ): void {
    const status = statusCode >= 400 ? 'error' : 'success';
    
    this.recordMetric({
      type: 'external_api',
      name: `${service} ${endpoint}`,
      duration,
      status,
      metadata: {
        service,
        endpoint,
        statusCode,
        error
      }
    });
  }

  // 알림 체크
  private checkAlerts(metric: PerformanceMetric): void {
    // 느린 쿼리 체크
    if (metric.type === 'database_query' && metric.duration > this.thresholds.slowQuery) {
      this.createAlert({
        type: 'slow_query',
        severity: metric.duration > this.thresholds.slowQuery * 2 ? 'high' : 'medium',
        message: `Slow database query detected: ${metric.name} took ${metric.duration}ms`,
        threshold: this.thresholds.slowQuery,
        currentValue: metric.duration,
        metadata: metric.metadata
      });
    }

    // 에러율 체크
    if (metric.status === 'error') {
      const recentMetrics = this.getRecentMetrics(5 * 60 * 1000); // 최근 5분
      const errorRate = recentMetrics.filter(m => m.status === 'error').length / recentMetrics.length;
      
      if (errorRate > this.thresholds.highErrorRate) {
        this.createAlert({
          type: 'high_error_rate',
          severity: errorRate > this.thresholds.highErrorRate * 2 ? 'critical' : 'high',
          message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
          threshold: this.thresholds.highErrorRate,
          currentValue: errorRate,
          metadata: { recentMetrics: recentMetrics.length }
        });
      }
    }

    // 메모리 사용량 체크
    if (metric.metadata.memoryUsage) {
      const memoryUsageRatio = metric.metadata.memoryUsage / (1024 * 1024); // GB로 변환
      
      if (memoryUsageRatio > this.thresholds.memoryUsage) {
        this.createAlert({
          type: 'memory_usage',
          severity: memoryUsageRatio > 0.9 ? 'critical' : 'high',
          message: `High memory usage detected: ${metric.metadata.memoryUsage.toFixed(2)}MB`,
          threshold: this.thresholds.memoryUsage * 1024 * 1024,
          currentValue: metric.metadata.memoryUsage,
          metadata: { memoryUsageRatio }
        });
      }
    }
  }

  // 알림 생성
  private createAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp'>): void {
    const fullAlert: PerformanceAlert = {
      id: this.generateId(),
      timestamp: new Date(),
      ...alert
    };

    this.alerts.push(fullAlert);

    // 알림이 너무 많아지면 오래된 것들 제거
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500);
    }

    // 프로덕션에서는 실제 알림 시스템으로 전송
    if (process.env.NODE_ENV === 'production') {
      this.sendAlert(fullAlert);
    }
  }

  // 최근 메트릭 조회
  public getRecentMetrics(timeWindow: number = 5 * 60 * 1000): PerformanceMetric[] {
    const cutoff = new Date(Date.now() - timeWindow);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  // 메트릭 통계 조회
  public getMetricsStats(timeWindow: number = 60 * 60 * 1000): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    slowQueries: number;
    cacheHitRate: number;
    topSlowQueries: Array<{ name: string; avgDuration: number; count: number }>;
  } {
    const recentMetrics = this.getRecentMetrics(timeWindow);
    
    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowQueries: 0,
        cacheHitRate: 0,
        topSlowQueries: []
      };
    }

    const totalRequests = recentMetrics.length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
    const errorRate = recentMetrics.filter(m => m.status === 'error').length / totalRequests;
    const slowQueries = recentMetrics.filter(m => m.duration > this.thresholds.slowQuery).length;
    
    const cacheMetrics = recentMetrics.filter(m => m.type === 'cache_operation');
    const cacheHitRate = cacheMetrics.length > 0 
      ? cacheMetrics.filter(m => m.metadata.cacheHit).length / cacheMetrics.length 
      : 0;

    // 느린 쿼리 상위 5개
    const queryMetrics = recentMetrics.filter(m => m.type === 'database_query');
    const queryStats = queryMetrics.reduce((acc, m) => {
      if (!acc[m.name]) {
        acc[m.name] = { totalDuration: 0, count: 0 };
      }
      acc[m.name].totalDuration += m.duration;
      acc[m.name].count += 1;
      return acc;
    }, {} as Record<string, { totalDuration: number; count: number }>);

    const topSlowQueries = Object.entries(queryStats)
      .map(([name, stats]) => ({
        name,
        avgDuration: stats.totalDuration / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5);

    return {
      totalRequests,
      averageResponseTime,
      errorRate,
      slowQueries,
      cacheHitRate,
      topSlowQueries
    };
  }

  // 알림 조회
  public getAlerts(severity?: 'low' | 'medium' | 'high' | 'critical', limit: number = 100): PerformanceAlert[] {
    let filteredAlerts = this.alerts;
    
    if (severity) {
      filteredAlerts = this.alerts.filter(a => a.severity === severity);
    }
    
    return filteredAlerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // 성능 대시보드 데이터
  public async getDashboardData(): Promise<{
    metrics: any;
    alerts: PerformanceAlert[];
    systemHealth: any;
  }> {
    const [metrics, alerts, systemHealth] = await Promise.all([
      this.getMetricsStats(),
      this.getAlerts(undefined, 20),
      this.getSystemHealth()
    ]);

    return {
      metrics,
      alerts,
      systemHealth
    };
  }

  // 시스템 상태 조회
  public async getSystemHealth(): Promise<{
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    uptime: number;
    cache: any;
    database: any;
  }> {
    const memoryUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    
    const cacheManager = getCacheManager();
    const dbOptimizer = getDatabaseOptimizer();
    
    const [cacheStats, dbStats] = await Promise.all([
      cacheManager.getStats(),
      dbOptimizer.getPerformanceMetrics()
    ]);

    return {
      memory: {
        used: memoryUsage.heapUsed,
        total: totalMemory,
        percentage: (memoryUsage.heapUsed / totalMemory) * 100
      },
      uptime: process.uptime(),
      cache: cacheStats,
      database: dbStats
    };
  }

  // 임계값 설정
  public setThresholds(thresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  // 메트릭 초기화
  public clearMetrics(): void {
    this.metrics = [];
  }

  // 알림 초기화
  public clearAlerts(): void {
    this.alerts = [];
  }

  // ID 생성
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // 모니터링 시스템으로 전송 (실제 구현에서는 외부 서비스 사용)
  private sendToMonitoringSystem(metric: PerformanceMetric): void {
    // 예: DataDog, New Relic, CloudWatch 등으로 전송
    console.log('Sending metric to monitoring system:', metric);
  }

  // 알림 전송 (실제 구현에서는 이메일, 슬랙 등으로 전송)
  private sendAlert(alert: PerformanceAlert): void {
    // 예: Slack, Discord, 이메일 등으로 알림 전송
    console.warn('Performance Alert:', alert);
  }
}

// 미들웨어 함수
export function createPerformanceMiddleware() {
  const monitor = PerformanceMonitor.getInstance();

  return (req: NextRequest, res: NextResponse, startTime: number = Date.now()) => {
    const duration = Date.now() - startTime;
    const userId = req.headers.get('x-user-id') || undefined;
    
    monitor.recordApiRequest(req, res, duration, userId);
  };
}

// 데이터베이스 쿼리 래퍼
export function wrapDatabaseQuery<T>(
  collection: string,
  operation: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const monitor = PerformanceMonitor.getInstance();
  const startTime = Date.now();

  return queryFn()
    .then(result => {
      const duration = Date.now() - startTime;
      monitor.recordDatabaseQuery(collection, operation, duration, 0, 0);
      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      monitor.recordDatabaseQuery(collection, operation, duration, 0, 0, undefined, error.message);
      throw error;
    });
}

// 캐시 작업 래퍼
export function wrapCacheOperation<T>(
  operation: string,
  key: string,
  operationFn: () => Promise<T>
): Promise<T> {
  const monitor = PerformanceMonitor.getInstance();
  const startTime = Date.now();

  return operationFn()
    .then(result => {
      const duration = Date.now() - startTime;
      monitor.recordCacheOperation(operation, key, duration, true);
      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      monitor.recordCacheOperation(operation, key, duration, false, error.message);
      throw error;
    });
}

export default PerformanceMonitor;
