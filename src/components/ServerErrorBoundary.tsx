/**
 * 서버 컴포넌트 렌더링 에러를 처리하는 에러 바운더리
 * 클라이언트 사이드에서 서버 에러를 감지하고 처리합니다.
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ServerErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ServerErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ServerErrorBoundary extends Component<ServerErrorBoundaryProps, ServerErrorBoundaryState> {
  constructor(props: ServerErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ServerErrorBoundaryState {
    // 다음 렌더링에서 fallback UI를 표시하도록 상태를 업데이트합니다.
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Server Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // 에러 콜백 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 서버 컴포넌트 렌더링 에러인지 확인
    if (error.message.includes('Server Components render') || 
        error.message.includes('server-side exception')) {
      console.error('🚨 서버 컴포넌트 렌더링 에러 감지됨');
      console.error('에러 상세:', error);
      console.error('에러 정보:', errorInfo);
      
      // 에러 정보를 로컬 스토리지에 저장 (디버깅용)
      try {
        localStorage.setItem('serverError', JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        }));
      } catch (e) {
        console.error('로컬 스토리지 저장 실패:', e);
      }
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // 페이지 새로고침
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback UI를 렌더링할 수 있습니다.
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h2 className="font-semibold text-obsidian mb-2 text-xl">
                서버 오류가 발생했습니다
              </h2>
              
              <p className="text-obsidian mb-6">
                페이지를 로드하는 중 서버에서 오류가 발생했습니다. 
                잠시 후 다시 시도해주세요.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary transition-colors duration-200"
                >
                  페이지 새로고침
                </button>
                
                <button
                  onClick={() => window.history.back()}
                  className="w-full bg-gray-200 text-obsidian py-2 px-4 rounded-md hover:bg-gray-300 transition-colors duration-200"
                >
                  이전 페이지로 돌아가기
                </button>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-foreground/70 hover:text-obsidian">
                    개발자 정보 (개발 환경에서만 표시)
                  </summary>
                  <div className="mt-2 p-4 bg-gray-100 rounded-md text-xs">
                    <pre className="whitespace-pre-wrap break-all">
                      {this.state.error.message}
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ServerErrorBoundary;
