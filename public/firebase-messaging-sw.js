// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// 앱 환경 변수(env)는 빌드 타임에 주입되므로, SW에서는 URL 파라미터나 고정 설정값을 사용해야 합니다.
// 여기서는 보편적인 초기화 방식을 사용합니다. 
// 만약 프로젝트 ID가 동적으로 바뀐다면 별도 SW 빌드 파이프라인이 필요할 수 있습니다.
// 일단 Next.js 환경에서 통용되는 표준 firebase 설정 객체를 넣어야 합니다.
// (보안적으로 API Key 등은 public 설정이므로 노출되어도 무방합니다.)

const urlParams = new URLSearchParams(location.search);

const firebaseConfig = {
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId')
};

// Vercel 환경 변수가 서비스 워커에 자동으로 치환되지 않기 때문에, 
// 일반적으로는 url parameter(sw.js?apiKey=...)로 넘겨주거나,
// Firebase Hosting 서버에서 자동으로 인식하는 방식을 씁니다.
// 현 MVP에서는 임시로 fallback 방식을 사용하거나, firebase init을 시도합니다.

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification?.title || '글리마일';
    const notificationOptions = {
      body: payload.notification?.body || '새로운 메시지가 도착했습니다.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.log('Firebase SW init error:', error);
}

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  // 알림 클릭 시 포커스할 URL
  const targetUrl = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 탭이 이미 열려있으면 포커스
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // 아니면 새 탭 열기
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
