import webpush from 'web-push';

// VAPID 키 설정 (환경변수에서 가져오기)
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || ''
};

// Web Push 설정
if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    'mailto:admin@youniqle.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationData {
  userId: string;
  title: string;
  body: string;
  data?: any;
  icon?: string;
  badge?: string;
  image?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  renotify?: boolean;
}

// 푸시 알림 전송
export async function sendPushNotification(data: PushNotificationData): Promise<{success: boolean, error?: string}> {
  try {
    // 사용자의 푸시 구독 정보 조회 (실제 구현에서는 데이터베이스에서 조회)
    const subscription = await getPushSubscription(data.userId);
    
    if (!subscription) {
      return {
        success: false,
        error: '푸시 구독 정보를 찾을 수 없습니다.'
      };
    }

    // 푸시 알림 페이로드 구성
    const payload = JSON.stringify({
      title: data.title,
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      image: data.image,
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      tag: data.tag || 'youniqle-notification',
      renotify: data.renotify || false
    });

    // 푸시 알림 전송
    await webpush.sendNotification(subscription, payload);

    return { success: true };

  } catch (error) {
    console.error('Push notification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '푸시 알림 전송에 실패했습니다.'
    };
  }
}

// 다중 사용자에게 푸시 알림 전송
export async function sendBulkPushNotification(
  userIds: string[],
  title: string,
  body: string,
  data?: any
): Promise<{success: number, failed: number, errors: string[]}> {
  const results = await Promise.allSettled(
    userIds.map(userId => 
      sendPushNotification({ userId, title, body, data })
    )
  );

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      success++;
    } else {
      failed++;
      const error = result.status === 'rejected' 
        ? result.reason.message 
        : result.value.error;
      errors.push(`User ${userIds[index]}: ${error}`);
    }
  });

  return { success, failed, errors };
}

// 푸시 구독 저장
export async function savePushSubscription(
  userId: string,
  subscription: PushSubscription
): Promise<boolean> {
  try {
    // 실제 구현에서는 데이터베이스에 저장
    // 예: await PushSubscription.create({ userId, subscription })
    console.log(`Push subscription saved for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Save push subscription error:', error);
    return false;
  }
}

// 푸시 구독 조회
export async function getPushSubscription(userId: string): Promise<PushSubscription | null> {
  try {
    // 실제 구현에서는 데이터베이스에서 조회
    // 예: const subscription = await PushSubscription.findOne({ userId });
    // return subscription ? subscription.subscription : null;
    
    // 임시로 null 반환 (실제 구현 필요)
    return null;
  } catch (error) {
    console.error('Get push subscription error:', error);
    return null;
  }
}

// 푸시 구독 삭제
export async function deletePushSubscription(userId: string): Promise<boolean> {
  try {
    // 실제 구현에서는 데이터베이스에서 삭제
    // 예: await PushSubscription.deleteOne({ userId });
    console.log(`Push subscription deleted for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Delete push subscription error:', error);
    return false;
  }
}

// VAPID 공개 키 조회 (클라이언트에서 사용)
export function getVapidPublicKey(): string {
  return vapidKeys.publicKey;
}

// 푸시 알림 템플릿
export const PushTemplates = {
  orderConfirmed: (orderNumber: string) => ({
    title: '주문이 확인되었습니다',
    body: `주문번호 ${orderNumber}의 주문이 확인되었습니다.`,
    data: { orderNumber, type: 'order' }
  }),

  orderShipped: (orderNumber: string, trackingNumber?: string) => ({
    title: '배송이 시작되었습니다',
    body: `주문번호 ${orderNumber}의 상품이 배송되었습니다.`,
    data: { orderNumber, trackingNumber, type: 'shipping' }
  }),

  orderDelivered: (orderNumber: string) => ({
    title: '배송이 완료되었습니다',
    body: `주문번호 ${orderNumber}의 상품이 배송 완료되었습니다.`,
    data: { orderNumber, type: 'shipping' }
  }),

  paymentReceived: (orderNumber: string, amount: number) => ({
    title: '결제가 완료되었습니다',
    body: `주문번호 ${orderNumber}의 결제가 완료되었습니다. (${amount.toLocaleString()}원)`,
    data: { orderNumber, amount, type: 'payment' }
  }),

  promotionAvailable: (promotionName: string) => ({
    title: '새로운 프로모션이 시작되었습니다',
    body: `${promotionName} 프로모션을 확인해보세요!`,
    data: { promotionName, type: 'promotion' }
  }),

  newsletterReceived: (subject: string) => ({
    title: '뉴스레터가 도착했습니다',
    body: `${subject} - 최신 소식을 확인해보세요!`,
    data: { subject, type: 'newsletter' }
  }),

  systemMaintenance: (message: string) => ({
    title: '시스템 점검 안내',
    body: message,
    data: { type: 'system' },
    requireInteraction: true
  }),

  urgentAlert: (title: string, message: string) => ({
    title,
    body: message,
    data: { type: 'urgent' },
    requireInteraction: true,
    renotify: true
  })
};
