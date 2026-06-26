/**
 * API URL 생성 유틸리티
 * 프로덕션 환경에서 localhost 호출 문제를 해결하기 위한 유틸리티 함수들
 */

/**
 * API 엔드포인트의 전체 URL을 생성합니다.
 * 환경변수 NEXT_PUBLIC_SITE_URL이 설정되어 있으면 사용하고,
 * 없으면 현재 window.location.origin을 사용합니다.
 * 
 * @param endpoint API 엔드포인트 경로 (예: '/api/admin/auth/verify')
 * @returns 완전한 API URL
 */
export function getApiUrl(endpoint: string): string {
  // 클라이언트 사이드에서만 실행
  if (typeof window === 'undefined') {
    // 서버 사이드에서는 환경변수만 사용
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return `${baseUrl}${endpoint}`;
  }

  // 클라이언트 사이드에서는 환경변수 우선, 없으면 현재 origin 사용
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  return `${baseUrl}${endpoint}`;
}

/**
 * 관리자 API 엔드포인트의 전체 URL을 생성합니다.
 * 
 * @param endpoint 관리자 API 엔드포인트 경로 (예: '/auth/verify')
 * @returns 완전한 관리자 API URL
 */
export function getAdminApiUrl(endpoint: string): string {
  return getApiUrl(`/api/admin${endpoint}`);
}

/**
 * 일반 API 엔드포인트의 전체 URL을 생성합니다.
 * 
 * @param endpoint API 엔드포인트 경로 (예: '/products')
 * @returns 완전한 API URL
 */
export function getPublicApiUrl(endpoint: string): string {
  return getApiUrl(`/api${endpoint}`);
}

/**
 * 환경 정보를 로깅합니다. (디버깅용)
 */
export function logEnvironmentInfo(): void {
  if (typeof window !== 'undefined') {
    console.log('Environment Info:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      windowOrigin: window.location.origin,
      userAgent: window.navigator.userAgent.substring(0, 50) + '...'
    });
  }
}
