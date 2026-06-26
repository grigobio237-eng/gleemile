import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app } from '../firebase';

export async function requestFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('이 브라우저는 알림을 지원하지 않습니다.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('알림 권한이 거부되었습니다.');
      return null;
    }

    const messaging = getMessaging(app);

    // 환경 변수 기반으로 서비스 워커 등록 (Vercel 정적 파일 캐시 우회)
    const swUrl = `/firebase-messaging-sw.js?apiKey=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}&projectId=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}&messagingSenderId=${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}&appId=${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}`;
    const registration = await navigator.serviceWorker.register(swUrl);
    
    // 환경 변수 VAPID Key 필요
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('VAPID KEY가 설정되지 않았습니다.');
      return null;
    }

    const currentToken = await getToken(messaging, { 
      vapidKey, 
      serviceWorkerRegistration: registration 
    });

    if (currentToken) {
      return currentToken;
    } else {
      console.warn('FCM 토큰 발급에 실패했습니다.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
    return null;
  }
}
