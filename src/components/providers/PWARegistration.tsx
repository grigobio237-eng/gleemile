'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PWARegistration() {
  const { data: session } = useSession();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && session?.user) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('PWA Service Worker registered with scope:', registration.scope);

          // 푸시 구독 확인 및 자동 갱신 로직
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const subscription = await registration.pushManager.getSubscription();
            
            if (!subscription) {
              const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
              if (publicKey) {
                const newSubscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(publicKey)
                });

                await fetch('/api/notifications/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newSubscription)
                });
                console.log('Push notification subscribed');
              }
            } else {
              // 기존 구독 정보 서버 갱신 (유저 매핑 보장)
              await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
              });
            }
          }
        } catch (error) {
          console.error('PWA/Push Registration failed:', error);
        }
      });
    }
  }, [session]);

  return null;
}
