const CACHE_NAME = 'gleemile-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ── 1. GET 이외의 요청은 서비스 워커가 개입하지 않음 ──
  if (event.request.method !== 'GET') return;

  // ── 1-1. http/https가 아닌 스킴은 Cache API 미지원 (chrome-extension 등) ──
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return;

  // ── 2. 서비스 워커가 가로채면 안 되는 외부 요청 패턴 ──
  const bypassPatterns = [
    'firestore.googleapis.com',   // Firestore 스트리밍 (Listen/channel)
    'www.googleapis.com',         // Google API
    'securetoken.googleapis.com', // Firebase Auth 토큰
    'identitytoolkit.googleapis.com', // Firebase Auth
    'www.google.com/images',      // Google 추적 픽셀 (cleardot.gif)
    'cdn.jsdelivr.net',           // CDN 폰트 (Pretendard)
    'fonts.googleapis.com',       // Google Fonts
    'fonts.gstatic.com',          // Google Fonts 에셋
    'www.gstatic.com',            // Firebase SDK 스크립트
    'apis.google.com',            // Google 로그인 등
  ];

  if (bypassPatterns.some((pattern) => url.href.includes(pattern))) {
    return; // 브라우저 기본 네트워크로 위임 (event.respondWith 호출 안 함)
  }

  // ── 3. 동일 출처(same-origin) GET 요청만 캐시 전략 적용 ──
  //    Network-First: 네트워크 응답이 오면 사용, 실패 시 캐시 폴백
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 유효한 응답만 캐시에 저장
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          // 캐시에도 없으면 빈 Response 대신 오프라인 폴백 반환
          if (cachedResponse) return cachedResponse;

          // HTML 내비게이션 요청이면 캐시된 루트 페이지 반환
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }

          // 그 외: 네트워크 에러 응답 (브라우저가 자체 에러 처리)
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' }),
          });
        });
      })
  );
});
