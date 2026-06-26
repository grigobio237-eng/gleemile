'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'payment' | 'shipping' | 'promotion' | 'system';
  title: string;
  message: string;
  data?: any;
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: Date;
  createdAt: Date;
  read?: boolean;
}

interface NotificationSettings {
  types?: string[];
  categories?: string[];
  priority?: string[];
  sound?: boolean;
  vibration?: boolean;
  desktop?: boolean;
}

interface UseRealtimeNotificationsReturn {
  notifications: NotificationData[];
  unreadCount: number;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' | 'disabled';
  subscribe: (settings: NotificationSettings) => void;
  unsubscribe: (settings: NotificationSettings) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  handleAction: (notificationId: string, action: string) => void;
  playNotificationSound: () => void;
}

export function useRealtimeNotifications(): UseRealtimeNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error' | 'disabled'>('disconnected');
  
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const maxNotifications = 50; // 최대 알림 개수

  // 알림 사운드 초기화
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  // WebSocket 연결
  useEffect(() => {
    const connectWebSocket = async () => {
      // 프로덕션 환경에서는 WebSocket 연결 비활성화
      if (process.env.NODE_ENV === 'production') {
        console.log('WebSocket disabled in production environment');
        setConnectionStatus('disabled');
        return;
      }

      try {
        setConnectionStatus('connecting');

        // JWT 토큰 가져오기
        const token = localStorage.getItem('token') || document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          console.warn('No authentication token found');
          setConnectionStatus('error');
          return;
        }

        // Socket.IO 클라이언트 연결 (개발 환경에서만)
        const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        // 연결 성공
        socket.on('connect', () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setConnectionStatus('connected');
        });

        // 연결 해제
        socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          setIsConnected(false);
          setConnectionStatus('disconnected');
        });

        // 연결 에러
        socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          setConnectionStatus('error');
        });

        // 재연결 시도
        socket.on('reconnect', (attemptNumber) => {
          console.log('WebSocket reconnected after', attemptNumber, 'attempts');
          setIsConnected(true);
          setConnectionStatus('connected');
        });

        // 재연결 실패
        socket.on('reconnect_failed', () => {
          console.error('WebSocket reconnection failed');
          setConnectionStatus('error');
        });

        // 알림 수신
        socket.on('notification', (notification: NotificationData) => {
          console.log('Received notification:', notification);
          
          setNotifications(prev => {
            const newNotifications = [notification, ...prev].slice(0, maxNotifications);
            return newNotifications;
          });

          // 읽지 않은 알림 개수 업데이트
          setUnreadCount(prev => prev + 1);

          // 알림 사운드 재생
          playNotificationSound();

          // 브라우저 알림 (데스크톱 알림)
          if (Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
              tag: notification.id,
              requireInteraction: notification.priority === 'urgent'
            });
          }

          // 진동 (모바일)
          if (navigator.vibrate && notification.priority === 'urgent') {
            navigator.vibrate([200, 100, 200]);
          }
        });

        // 기본 구독 설정
        socket.emit('subscribe_notifications', {
          types: ['order', 'payment', 'shipping', 'promotion', 'system'],
          priority: ['medium', 'high', 'urgent']
        });

      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setConnectionStatus('error');
      }
    };

    connectWebSocket();

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // 알림 사운드 재생
  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.warn('Failed to play notification sound:', error);
      });
    }
  }, []);

  // 알림 구독
  const subscribe = useCallback((settings: NotificationSettings) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('subscribe_notifications', settings);
    }
  }, [isConnected]);

  // 알림 구독 해제
  const unsubscribe = useCallback((settings: NotificationSettings) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('unsubscribe_notifications', settings);
    }
  }, [isConnected]);

  // 알림 읽음 처리
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );

    setUnreadCount(prev => Math.max(0, prev - 1));

    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark_notification_read', notificationId);
    }
  }, [isConnected]);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // 알림 제거
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  // 모든 알림 제거
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // 알림 액션 처리
  const handleAction = useCallback((notificationId: string, action: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('handle_notification_action', {
        notificationId,
        action
      });
    }

    // 액션에 따른 추가 처리
    const notification = notifications.find(n => n.id === notificationId);
    if (notification?.actions) {
      const actionConfig = notification.actions.find(a => a.action === action);
      if (actionConfig?.url) {
        window.open(actionConfig.url, '_blank');
      }
    }
  }, [isConnected, notifications]);

  // 만료된 알림 자동 제거
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setNotifications(prev => {
        const filtered = prev.filter(notification => {
          if (notification.expiresAt) {
            return new Date(notification.expiresAt) > now;
          }
          return true;
        });

        // 읽지 않은 알림 개수 재계산
        const unread = filtered.filter(n => !n.read).length;
        setUnreadCount(unread);

        return filtered;
      });
    }, 60000); // 1분마다 체크

    return () => clearInterval(interval);
  }, []);

  // 브라우저 알림 권한 요청
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    connectionStatus,
    subscribe,
    unsubscribe,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    handleAction,
    playNotificationSound
  };
}
