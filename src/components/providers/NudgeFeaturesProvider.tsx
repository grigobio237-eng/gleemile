'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic imports to reduce initial bundle size




const TimeBasedMessage = dynamic(
    () => import('@/components/nudge/TimeBasedMessage'),
    { ssr: false }
);



interface NudgeFeaturesProviderProps {
    children: React.ReactNode;
    enablePomodoro?: boolean;
    enableTimeBasedMessage?: boolean;
}

// Pages where nudge features should be disabled
const EXCLUDED_PATHS = [
    '/admin',
    '/auth',
    '/checkout',
    '/payment',
    '/order-success',
    '/order-failed',
    '/order-cancelled',
];

export default function NudgeFeaturesProvider({
    children,
    enablePomodoro = false,
    enableTimeBasedMessage = true,
}: NudgeFeaturesProviderProps) {
    const pathname = usePathname();
    const [showPomodoro, setShowPomodoro] = useState(false);
    const [showTimeMessage, setShowTimeMessage] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Check if current path should have nudge features
    const isExcludedPath = EXCLUDED_PATHS.some((path) => pathname?.startsWith(path));

    useEffect(() => {
        setMounted(true);

        // Check if user has seen the diagnosis (gate passed)
        const hasPassedGate = localStorage.getItem('recovery_last_check');

        // Show pomodoro after gate is passed and some time has passed
        if (hasPassedGate && enablePomodoro) {
            const pomodoroTimer = setTimeout(() => {
                setShowPomodoro(true);
            }, 5000); // Show after 5 seconds

            return () => clearTimeout(pomodoroTimer);
        }
    }, [enablePomodoro]);

    useEffect(() => {
        // Show time-based message after some delay
        if (enableTimeBasedMessage && mounted && !isExcludedPath) {
            const messageTimer = setTimeout(() => {
                setShowTimeMessage(true);
            }, 10000); // Show after 10 seconds

            return () => clearTimeout(messageTimer);
        }
    }, [enableTimeBasedMessage, mounted, isExcludedPath]);

    // Don't render nudge features on excluded paths
    if (isExcludedPath || !mounted) {
        return <>{children}</>;
    }

    return (
        <>
            {children}

            {/* Time-based Message Popup */}
            {showTimeMessage && (
                <TimeBasedMessage
                    variant="popup"
                    showLossAversion
                    onDismiss={() => setShowTimeMessage(false)}
                />
            )}
        </>
    );
}
