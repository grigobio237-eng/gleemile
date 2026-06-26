/**
 * WebView 감지 유틸리티
 * Google OAuth가 WebView에서 차단되는 문제를 해결하기 위한 유틸리티
 */

/**
 * 현재 환경이 WebView인지 확인합니다.
 * Google은 보안상의 이유로 WebView에서 OAuth 요청을 차단합니다.
 */
export const isWebView = (): boolean => {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // 1. Chrome Safe Guard: 크롬 브라우저 자체인 경우 (모바일 크롬 포함)
  // 안드로이드 WebView는 'Chrome/'이 포함되지만 반드시 '; wv)'가 함께 포함됩니다.
  // 일반 크롬 앱이나 데스크톱 크롬은 '; wv)'가 없습니다.
  const isChrome = /Chrome\//i.test(userAgent) && !/Safari\//i.test(userAgent) === false; // Safari/는 크롬 UA에도 포함됨
  const hasWebViewMarker = /; wv\)/i.test(userAgent) || /WebView/i.test(userAgent);
  
  // 진짜 크롬 브라우저라면 WebView가 아닌 것으로 우선 판정
  if (/Chrome\//i.test(userAgent) && !hasWebViewMarker) {
    return false;
  }

  // 2. WebView 감지 패턴 - 더 정교하게 수정
  const webViewPatterns = [
    /Version\/.*Chrome\/.*Mobile.*Safari\//i, // Android WebView 특정 패턴
    /; wv\)/i, // Android WebView Standard marker
    /WebView/i,
    /(iPhone|iPod|iPad)(?!.*Safari\/)/i, // iOS WebView (Safari가 아닌 경우)
    /Android.*(; wv\))/i, // Android WebView (버전 번호 0.0.0 충돌 방지)
    /FBAN|FBAV/i, // Facebook in-app browser
    /Line/i, // LINE in-app browser
    /NAVER/i, // Naver in-app browser
    /KAKAOTALK/i, // KakaoTalk in-app browser
  ];

  return webViewPatterns.some(pattern => pattern.test(userAgent));
};

/**
 * 외부 브라우저로 강제 전환을 시도합니다.
 * Android: Chrome Intent 사용
 * iOS: 안내 메시지 또는 클립보드 복사 유도 (제한적)
 */
export const openExternalBrowser = (targetUrl: string) => {
  if (typeof window === 'undefined') return;

  const userAgent = navigator.userAgent;
  const isAndroid = /Android/i.test(userAgent);
  
  // 크롬 브라우저 자체인지 확인 (크롬인데 오감지된 경우 대비)
  const isChrome = /Chrome/i.test(userAgent) && !/wv/i.test(userAgent);

  if (isAndroid && !isChrome) {
    // Android: Chrome으로 강제 오픈 (Intent Scheme)
    // S.browser_fallback_url은 크롬이 없을 경우 대비
    const urlWithoutProtocol = targetUrl.replace(/^https?:\/\//, '');
    const intentUrl = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(targetUrl)};end`;

    try {
      window.location.href = intentUrl;
    } catch (e) {
      window.location.href = targetUrl;
    }
  } else {
    // iOS 및 기타 또는 이미 크롬인 경우: 새 창 열기 시도
    window.location.href = targetUrl;
  }
};

/**
 * WebView 환경에서 OAuth 로그인을 처리합니다.
 * 외부 브라우저로 열기를 시도합니다.
 */
export const handleWebViewOAuth = async (
  provider: string,
  callbackUrl: string = '/'
): Promise<boolean> => {
  if (!isWebView()) {
    return false; // WebView가 아니면 일반 처리
  }

  const shouldContinue = window.confirm(
    '현재 앱 내 브라우저에서 접속 중입니다.\n\n' +
    'Google 로그인은 보안상의 이유로 시스템 브라우저(Chrome, Safari 등)에서만 가능합니다.\n\n' +
    '계속하시겠습니까? (권장: 브라우저에서 직접 열기)'
  );

  if (!shouldContinue) {
    return true; // 사용자가 취소함
  }

  // 외부 브라우저로 열기 시도
  try {
    const baseUrl = window.location.origin;
    const encodedCallbackUrl = encodeURIComponent(`${baseUrl}${callbackUrl}`);
    const authUrl = `${baseUrl}/api/auth/signin/${provider}?callbackUrl=${encodedCallbackUrl}`;

    openExternalBrowser(authUrl);
    return true;
  } catch (e) {
    console.error('Failed to open external browser:', e);
    return false;
  }
};
