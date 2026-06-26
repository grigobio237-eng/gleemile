import { useEffect, useState } from 'react';
import { requestFCMToken } from '@/lib/firebase/messaging';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export function useFCMToken(userId?: string) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const initFCM = async () => {
      try {
        const fcmToken = await requestFCMToken();
        if (fcmToken) {
          setToken(fcmToken);
          // Firestore users/{userId}/fcmTokens/{fcmToken} 에 업서트
          const tokenRef = doc(db, 'users', userId, 'fcmTokens', fcmToken);
          await setDoc(tokenRef, {
            token: fcmToken,
            deviceInfo: navigator.userAgent,
            lastUpdatedAt: serverTimestamp()
          }, { merge: true });
        }
      } catch (err) {
        console.error('FCM Hook Init Error', err);
      }
    };

    initFCM();
  }, [userId]);

  return token;
}
