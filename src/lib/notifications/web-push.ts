import webpush from 'web-push';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@grigobio.co.kr';

if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
} else {
    console.warn('VAPID keys are not set. Push notifications will not work.');
}

export interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: {
        url?: string;
        [key: string]: any;
    };
    tag?: string;
    renotify?: boolean;
    silent?: boolean;
}

export class WebPushService {
    static async sendNotification(subscription: any, payload: PushPayload) {
        try {
            const result = await webpush.sendNotification(
                subscription,
                JSON.stringify(payload)
            );
            return { success: true, result };
        } catch (error: any) {
            console.error('Push Notification Error:', error);
            // 404 or 410 means subscription is expired or invalid
            if (error.statusCode === 404 || error.statusCode === 410) {
                return { success: false, error: 'expired', details: error };
            }
            return { success: false, error: error.message, details: error };
        }
    }
}
