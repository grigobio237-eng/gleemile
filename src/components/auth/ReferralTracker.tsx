'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReferralTracker() {
    const searchParams = useSearchParams();

    useEffect(() => {
        let ref = searchParams?.get('ref');
        
        if (!ref && typeof window !== 'undefined') {
            ref = localStorage.getItem('referralCode');
        }

        if (ref) {
            // 7일간 유효한 쿠키 설정
            const expires = new Date();
            expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000));
            document.cookie = `referral_code=${ref}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        }
    }, [searchParams]);

    return null;
}
