'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

export type EventType = 
    | 'view' 
    | 'click' 
    | 'add_to_cart' 
    | 'purchase' 
    | 'search' 
    | 'sound_therapy_start'
    | 'sound_therapy_stop'
    | 'recommendation_view'
    | 'recommendation_click'
    | 'time_on_page';

interface LogOptions {
    itemId?: string;
    itemType?: 'product' | 'content' | 'category' | 'brand';
    itemData?: any;
    behaviorData?: any;
    metadata?: any;
}

export function useActivityTracker() {
    const { data: session } = useSession();
    const pathname = usePathname();

    const trackEvent = useCallback(async (eventType: EventType, options: LogOptions = {}) => {
        try {
            const body = {
                eventType,
                itemId: options.itemId,
                itemType: options.itemType,
                itemData: options.itemData,
                behaviorData: options.behaviorData,
                context: {
                    pageUrl: window.location.href,
                    pathname,
                    deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
                    language: navigator.language,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    screenResolution: `${window.innerWidth}x${window.innerHeight}`
                },
                metadata: options.metadata
            };

            // Use fetch with keepalive to ensure logs are sent even if page is closing
            fetch('/api/user/behavior', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                keepalive: true
            }).catch(err => console.error('[Tracker] Log failed:', err));

        } catch (error) {
            console.error('[Tracker] Tracking error:', error);
        }
    }, [pathname]);

    return { trackEvent };
}
