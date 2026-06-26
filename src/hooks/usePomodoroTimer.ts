'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type TimerMode = 'focus' | 'break' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused';

interface PomodoroSettings {
    focusDuration: number; // in minutes
    breakDuration: number;
    longBreakDuration: number;
    sessionsBeforeLongBreak: number;
}

interface PomodoroState {
    mode: TimerMode;
    status: TimerStatus;
    timeRemaining: number; // in seconds
    completedSessions: number;
    totalFocusTime: number; // in seconds
    isMinimized: boolean;
}

interface UsePomodoroTimerReturn {
    // State
    mode: TimerMode;
    status: TimerStatus;
    timeRemaining: number;
    completedSessions: number;
    totalFocusTime: number;
    isMinimized: boolean;
    progress: number; // 0-100

    // Actions
    start: () => void;
    pause: () => void;
    resume: () => void;
    reset: () => void;
    skip: () => void;
    toggleMinimize: () => void;

    // Helpers
    formatTime: (seconds: number) => string;
    getModeLabel: () => string;
    getModeColor: () => string;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
};

const STORAGE_KEY = 'youniqle_pomodoro_state';

function loadState(): Partial<PomodoroState> | null {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load pomodoro state:', e);
    }
    return null;
}

function saveState(state: Partial<PomodoroState>) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save pomodoro state:', e);
    }
}

export function usePomodoroTimer(
    settings: Partial<PomodoroSettings> = {},
    onBreakStart?: () => void,
    onSessionComplete?: () => void
): UsePomodoroTimerReturn {
    const config = { ...DEFAULT_SETTINGS, ...settings };

    const [mode, setMode] = useState<TimerMode>('focus');
    const [status, setStatus] = useState<TimerStatus>('idle');
    const [timeRemaining, setTimeRemaining] = useState(config.focusDuration * 60);
    const [completedSessions, setCompletedSessions] = useState(0);
    const [totalFocusTime, setTotalFocusTime] = useState(0);
    const [isMinimized, setIsMinimized] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize from localStorage
    useEffect(() => {
        const savedState = loadState();
        if (savedState) {
            if (savedState.mode) setMode(savedState.mode);
            if (savedState.completedSessions) setCompletedSessions(savedState.completedSessions);
            if (savedState.totalFocusTime) setTotalFocusTime(savedState.totalFocusTime);
            if (savedState.isMinimized !== undefined) setIsMinimized(savedState.isMinimized);
            // Don't restore timeRemaining or status - always start fresh
        }

        // Create audio element for notification
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/sounds/notification.mp3');
            audioRef.current.volume = 0.5;
        }
    }, []);

    // Save state changes
    useEffect(() => {
        saveState({
            mode,
            completedSessions,
            totalFocusTime,
            isMinimized,
        });
    }, [mode, completedSessions, totalFocusTime, isMinimized]);

    // Timer logic
    useEffect(() => {
        if (status === 'running') {
            intervalRef.current = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        handleTimerComplete();
                        return 0;
                    }

                    // Track focus time
                    if (mode === 'focus') {
                        setTotalFocusTime((t) => t + 1);
                    }

                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [status, mode]);

    const playNotificationSound = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.play().catch(() => {
                // Audio play failed (user hasn't interacted with page)
            });
        }

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Youniqle 포모도로', {
                body: mode === 'focus' ? '집중 시간 완료! 휴식을 취하세요 🌟' : '휴식 끝! 다시 집중해볼까요? 💪',
                icon: '/icon-192x192.png',
            });
        }
    }, [mode]);

    const handleTimerComplete = useCallback(() => {
        playNotificationSound();

        if (mode === 'focus') {
            const newSessions = completedSessions + 1;
            setCompletedSessions(newSessions);

            // Check if long break
            if (newSessions % config.sessionsBeforeLongBreak === 0) {
                setMode('longBreak');
                setTimeRemaining(config.longBreakDuration * 60);
            } else {
                setMode('break');
                setTimeRemaining(config.breakDuration * 60);
            }

            onBreakStart?.();
            onSessionComplete?.();
        } else {
            // Break finished, back to focus
            setMode('focus');
            setTimeRemaining(config.focusDuration * 60);
        }

        setStatus('idle');
    }, [mode, completedSessions, config, playNotificationSound, onBreakStart, onSessionComplete]);

    const start = useCallback(() => {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        if (status === 'idle') {
            setTimeRemaining(
                mode === 'focus'
                    ? config.focusDuration * 60
                    : mode === 'break'
                        ? config.breakDuration * 60
                        : config.longBreakDuration * 60
            );
        }
        setStatus('running');
    }, [status, mode, config]);

    const pause = useCallback(() => {
        setStatus('paused');
    }, []);

    const resume = useCallback(() => {
        setStatus('running');
    }, []);

    const reset = useCallback(() => {
        setStatus('idle');
        setMode('focus');
        setTimeRemaining(config.focusDuration * 60);
    }, [config.focusDuration]);

    const skip = useCallback(() => {
        if (mode === 'focus') {
            setMode('break');
            setTimeRemaining(config.breakDuration * 60);
            onBreakStart?.();
        } else {
            setMode('focus');
            setTimeRemaining(config.focusDuration * 60);
        }
        setStatus('idle');
    }, [mode, config, onBreakStart]);

    const toggleMinimize = useCallback(() => {
        setIsMinimized((prev) => !prev);
    }, []);

    const formatTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const getModeLabel = useCallback((): string => {
        switch (mode) {
            case 'focus':
                return '집중 모드';
            case 'break':
                return '휴식 시간';
            case 'longBreak':
                return '긴 휴식';
            default:
                return '';
        }
    }, [mode]);

    const getModeColor = useCallback((): string => {
        switch (mode) {
            case 'focus':
                return 'bg-chapter-accent';
            case 'break':
                return 'bg-status-good';
            case 'longBreak':
                return 'bg-reward-gold';
            default:
                return 'bg-obsidian';
        }
    }, [mode]);

    // Calculate progress percentage
    const totalDuration =
        mode === 'focus'
            ? config.focusDuration * 60
            : mode === 'break'
                ? config.breakDuration * 60
                : config.longBreakDuration * 60;
    const progress = ((totalDuration - timeRemaining) / totalDuration) * 100;

    return {
        mode,
        status,
        timeRemaining,
        completedSessions,
        totalFocusTime,
        isMinimized,
        progress,
        start,
        pause,
        resume,
        reset,
        skip,
        toggleMinimize,
        formatTime,
        getModeLabel,
        getModeColor,
    };
}
