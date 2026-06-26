// 구조화된 로깅 시스템
import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogCategory = 'api' | 'auth' | 'database' | 'cache' | 'security' | 'performance' | 'system';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private logDir: string;
  private maxFileSize: number;
  private maxFiles: number;
  private currentLogFile: string;
  private logLevel: LogLevel;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.maxFiles = 10;
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.currentLogFile = this.getLogFileName();
    
    // Vercel 서버리스 환경에서는 파일 로깅 비활성화
    if (process.env.VERCEL !== '1') {
      this.ensureLogDirectory();
    }
  }

  // 로그 디렉토리 생성
  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // 로그 파일명 생성
  private getLogFileName(): string {
    const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
    return path.join(this.logDir, `app-${date}.log`);
  }

  // 로그 레벨 확인
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  // 로그 파일 로테이션
  private rotateLogFile() {
    // Vercel 서버리스 환경에서는 로테이션 건너뛰기
    if (process.env.VERCEL === '1') {
      return;
    }
    
    if (!fs.existsSync(this.currentLogFile)) return;

    const stats = fs.statSync(this.currentLogFile);
    if (stats.size < this.maxFileSize) return;

    // 기존 로그 파일들을 순차적으로 이름 변경
    for (let i = this.maxFiles - 1; i > 0; i--) {
      const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
      const oldFile = path.join(this.logDir, `app-${date}.log.${i}`);
      const newFile = path.join(this.logDir, `app-${date}.log.${i + 1}`);
      
      if (fs.existsSync(oldFile)) {
        fs.renameSync(oldFile, newFile);
      }
    }

    // 현재 로그 파일을 .1로 변경
    const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
    const rotatedFile = path.join(this.logDir, `app-${date}.log.1`);
    fs.renameSync(this.currentLogFile, rotatedFile);

    // 새로운 로그 파일 생성
    this.currentLogFile = this.getLogFileName();
  }

  // 로그 엔트리 생성
  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    context?: {
      userId?: string;
      requestId?: string;
      ip?: string;
      userAgent?: string;
      duration?: number;
      statusCode?: number;
      error?: Error;
    }
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace(' ', 'T'),
      level,
      category,
      message,
    };

    if (data) entry.data = data;
    if (context?.userId) entry.userId = context.userId;
    if (context?.requestId) entry.requestId = context.requestId;
    if (context?.ip) entry.ip = context.ip;
    if (context?.userAgent) entry.userAgent = context.userAgent;
    if (context?.duration) entry.duration = context.duration;
    if (context?.statusCode) entry.statusCode = context.statusCode;
    if (context?.error) {
      entry.error = {
        name: context.error.name,
        message: context.error.message,
        stack: context.error.stack,
      };
    }

    return entry;
  }

  // 로그 파일에 쓰기
  private writeToFile(entry: LogEntry) {
    // Vercel 서버리스 환경에서는 파일 로깅 비활성화
    if (process.env.VERCEL === '1') {
      return;
    }
    
    try {
      this.rotateLogFile();
      
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.currentLogFile, logLine);
    } catch (error) {
      console.error('로그 파일 쓰기 실패:', error);
    }
  }

  // 콘솔에 출력
  private writeToConsole(entry: LogEntry) {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      fatal: '\x1b[35m', // Magenta
    };

    const reset = '\x1b[0m';
    const color = colors[entry.level];
    const timestamp = entry.timestamp.split('T')[1].split('.')[0];
    
    console.log(
      `${color}[${timestamp}] ${entry.level.toUpperCase()}${reset} ` +
      `${entry.category.toUpperCase()}: ${entry.message}` +
      (entry.data ? ` ${JSON.stringify(entry.data)}` : '') +
      (entry.error ? ` Error: ${entry.error.message}` : '')
    );
  }

  // 기본 로그 메서드
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    context?: {
      userId?: string;
      requestId?: string;
      ip?: string;
      userAgent?: string;
      duration?: number;
      statusCode?: number;
      error?: Error;
    }
  ) {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, category, message, data, context);
    
    // 콘솔 출력
    this.writeToConsole(entry);
    
    // 파일 출력
    this.writeToFile(entry);
  }

  // 공개 메서드들
  debug(category: LogCategory, message: string, data?: any, context?: any) {
    this.log('debug', category, message, data, context);
  }

  info(category: LogCategory, message: string, data?: any, context?: any) {
    this.log('info', category, message, data, context);
  }

  warn(category: LogCategory, message: string, data?: any, context?: any) {
    this.log('warn', category, message, data, context);
  }

  error(category: LogCategory, message: string, error?: Error, data?: any, context?: any) {
    this.log('error', category, message, data, { ...context, error });
  }

  fatal(category: LogCategory, message: string, error?: Error, data?: any, context?: any) {
    this.log('fatal', category, message, data, { ...context, error });
  }

  // API 요청 로깅
  logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: {
      userId?: string;
      requestId?: string;
      ip?: string;
      userAgent?: string;
    }
  ) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.log(level, 'api', `${method} ${url}`, {
      method,
      url,
      statusCode,
      duration,
    }, {
      ...context,
      statusCode,
      duration,
    });
  }

  // 인증 로깅
  logAuth(action: string, success: boolean, context?: {
    userId?: string;
    ip?: string;
    userAgent?: string;
    error?: Error;
  }) {
    const level = success ? 'info' : 'warn';
    const message = `인증 ${action} ${success ? '성공' : '실패'}`;
    
    this.log(level, 'auth', message, {
      action,
      success,
    }, context);
  }

  // 데이터베이스 로깅
  logDatabase(operation: string, duration: number, success: boolean, error?: Error) {
    const level = success ? 'info' : 'error';
    const message = `데이터베이스 ${operation} ${success ? '성공' : '실패'}`;
    
    this.log(level, 'database', message, {
      operation,
      duration,
      success,
    }, { error, duration });
  }

  // 캐시 로깅
  logCache(operation: string, key: string, hit: boolean, duration?: number) {
    const level = 'info';
    const message = `캐시 ${operation} ${hit ? '히트' : '미스'}`;
    
    this.log(level, 'cache', message, {
      operation,
      key,
      hit,
      duration,
    }, { duration });
  }

  // 보안 로깅
  logSecurity(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: {
    userId?: string;
    ip?: string;
    userAgent?: string;
    details?: any;
  }) {
    const level = severity === 'critical' ? 'fatal' : 
                  severity === 'high' ? 'error' : 
                  severity === 'medium' ? 'warn' : 'info';
    
    this.log(level, 'security', `보안 이벤트: ${event}`, {
      event,
      severity,
      details: context?.details,
    }, context);
  }

  // 성능 로깅
  logPerformance(metric: string, value: number, threshold?: number) {
    const level = threshold && value > threshold ? 'warn' : 'info';
    const message = `성능 메트릭: ${metric}`;
    
    this.log(level, 'performance', message, {
      metric,
      value,
      threshold,
    });
  }

  // 시스템 로깅
  logSystem(event: string, data?: any) {
    this.log('info', 'system', event, data);
  }

  // 로그 파일 목록 조회
  getLogFiles(): string[] {
    // Vercel 서버리스 환경에서는 빈 배열 반환
    if (process.env.VERCEL === '1') {
      return [];
    }
    
    try {
      return fs.readdirSync(this.logDir)
        .filter(file => file.startsWith('app-') && file.endsWith('.log'))
        .sort()
        .reverse();
    } catch (error) {
      return [];
    }
  }

  // 로그 파일 읽기
  readLogFile(filename: string, lines: number = 100): string[] {
    // Vercel 서버리스 환경에서는 빈 배열 반환
    if (process.env.VERCEL === '1') {
      return [];
    }
    
    try {
      const filePath = path.join(this.logDir, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      const logLines = content.split('\n').filter(line => line.trim());
      return logLines.slice(-lines);
    } catch (error) {
      return [];
    }
  }

  // 로그 레벨 설정
  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  // 로그 디렉토리 정리 (오래된 로그 파일 삭제)
  cleanupLogs(daysToKeep: number = 30) {
    // Vercel 서버리스 환경에서는 정리 작업 건너뛰기
    if (process.env.VERCEL === '1') {
      return;
    }
    
    try {
      const files = fs.readdirSync(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      files.forEach(file => {
        if (file.startsWith('app-') && file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            this.info('system', `오래된 로그 파일 삭제: ${file}`);
          }
        }
      });
    } catch (error) {
      this.error('system', '로그 정리 실패', error as Error);
    }
  }
}

// 싱글톤 인스턴스
const logger = new Logger();

// 로깅 미들웨어
export function loggingMiddleware(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    logger.info('api', `요청 시작: ${req.method} ${req.nextUrl.pathname}`, {
      method: req.method,
      url: req.nextUrl.pathname,
      query: req.nextUrl.searchParams.toString(),
    }, {
      requestId,
      ip,
      userAgent,
    });

    try {
      const response = await handler(req);
      const duration = Date.now() - startTime;

      logger.logApiRequest(
        req.method,
        req.nextUrl.pathname,
        response.status,
        duration,
        {
          requestId,
          ip,
          userAgent,
        }
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('api', `요청 실패: ${req.method} ${req.nextUrl.pathname}`, error as Error, {
        method: req.method,
        url: req.nextUrl.pathname,
        duration,
      }, {
        requestId,
        ip,
        userAgent,
      });

      throw error;
    }
  };
}

export default logger;
