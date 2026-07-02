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

  // 1. 실제 브라우저 Safe Guard: 먼저 정상 브라우저를 걸러냅니다.
  // Android WebView는 '; wv)' 마커가 있거나, Chrome이 없거나, SamsungBrowser가 없습니다.
  const hasWebViewMarker = /; wv\)/i.test(userAgent) || /\bWebView\b/i.test(userAgent);

  // 실제 크롬 브라우저 (갤럭시 S24 포함) — '; wv)' 마커가 없으면 정상 크롬
  const isRealChrome = /Chrome\//i.test(userAgent) && !hasWebViewMarker;

  // 삼성 인터넷 브라우저 — WebView가 아님
  const isSamsungBrowser = /SamsungBrowser\//i.test(userAgent);

  // 실제 Safari (iOS 기본 브라우저) — WebView가 아님
  const isRealSafari = /Safari\//i.test(userAgent) && /Version\//i.test(userAgent) && !/Chrome\//i.test(userAgent);

  // 정상 브라우저라면 즉시 false 반환
  if (isRealChrome || isSamsungBrowser || isRealSafari) {
    return false;
  }

  // 2. 이제 실제 WebView / 인앱브라우저 패턴 감지
  const webViewPatterns = [
    /; wv\)/i,             // Android WebView 표준 마커
    /\bWebView\b/i,        // 명시적 WebView 표기
    /(iPhone|iPod|iPad)(?!.*Safari\/)/i, // iOS WebView (Safari UA 없는 경우)
    /FBAN|FBAV/i,          // Facebook 인앱 브라우저
    /\bLine\b/i,           // LINE 인앱 브라우저
    /NAVER/i,              // 네이버 인앱 브라우저
    /KAKAOTALK/i,          // 카카오톡 인앱 브라우저
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

  // 정상 크롬 (갤럭시 크롬 포함): '; wv)' 마커 없으면 실제 크롬
  const isRealChrome = /Chrome\//i.test(userAgent) && !/; wv\)/i.test(userAgent);
  // 삼성 인터넷 브라우저
  const isSamsungBrowser = /SamsungBrowser\//i.test(userAgent);

  if (isAndroid && !isRealChrome && !isSamsungBrowser) {
    // 진짜 인앱브라우저(카카오, 네이버 등): Chrome Intent 스킴으로 강제 오픈
    const urlWithoutProtocol = targetUrl.replace(/^https?:\/\//, '');
    const intentUrl = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(targetUrl)};end`;

    try {
      window.location.href = intentUrl;
    } catch (e) {
      // intent:// 가 지원되지 않는 경우 일반 URL로 fallback
      window.location.href = targetUrl;
    }
  } else {
    // 실제 크롬, 삼성 인터넷, iOS Safari 등 정상 브라우저: 그냥 현재 창에서 열기
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
