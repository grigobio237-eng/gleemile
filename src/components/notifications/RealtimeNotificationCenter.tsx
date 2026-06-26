'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  Settings, 
  Volume2, 
  VolumeX,
  Wifi,
  WifiOff,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  CreditCard,
  Truck,
  Tag,
  Cog
} from 'lucide-react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

interface NotificationCenterProps {
  className?: string;
}

export default function RealtimeNotificationCenter({ className = '' }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    isConnected,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    handleAction
  } = useRealtimeNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'order' | 'payment' | 'shipping' | 'promotion' | 'system'>('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4" />;
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      case 'shipping':
        return <Truck className="h-4 w-4" />;
      case 'promotion':
        return <Tag className="h-4 w-4" />;
      case 'system':
        return <Cog className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'border-primary/30 bg-blue-50';
      case 'payment':
        return 'border-green-200 bg-green-50';
      case 'shipping':
        return 'border-purple-200 bg-purple-50';
      case 'promotion':
        return 'border-orange-200 bg-orange-50';
      case 'system':
        return 'border-line bg-surface';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-line bg-surface';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-primary text-white';
      case 'low':
        return 'bg-surface0 text-white';
      default:
        return 'bg-surface0 text-white';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* 알림 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* 연결 상태 표시 */}
      <div className="absolute -bottom-1 -right-1">
        {isConnected ? (
          <Wifi className="h-3 w-3 text-green-500" />
        ) : (
          <WifiOff className="h-3 w-3 text-red-500" />
        )}
      </div>

      {/* 알림 패널 */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-line rounded-lg shadow-lg z-50">
          {/* 헤더 */}
          <div className="p-4 border-b border-line">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">알림</h3>
              <div className="flex items-center space-x-2">
                <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
                  {connectionStatus === 'connected' ? '연결됨' : 
                   connectionStatus === 'connecting' ? '연결 중' : 
                   connectionStatus === 'error' ? '오류' : '연결 끊김'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 필터 */}
            <div className="flex space-x-1">
              {[
                { key: 'all', label: '전체' },
                { key: 'unread', label: '읽지 않음' },
                { key: 'order', label: '주문' },
                { key: 'payment', label: '결제' },
                { key: 'shipping', label: '배송' },
                { key: 'promotion', label: '프로모션' },
                { key: 'system', label: '시스템' }
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant={filter === key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(key as any)}
                  className="text-xs"
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  모두 읽음
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllNotifications}
                  disabled={notifications.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  모두 삭제
                </Button>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-foreground/70">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>알림이 없습니다</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-surface transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-sm font-medium text-obsidian truncate">
                                {notification.title}
                              </h4>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getPriorityColor(notification.priority)}`}
                              >
                                {notification.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-obsidian mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-foreground/70">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNotification(notification.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* 액션 버튼들 */}
                        {notification.actions && notification.actions.length > 0 && (
                          <div className="flex space-x-2 mt-3">
                            {notification.actions.map((action, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleAction(notification.id, action.action);
                                  markAsRead(notification.id);
                                }}
                                className="text-xs"
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="p-3 border-t border-line bg-surface">
            <div className="flex items-center justify-between text-xs text-foreground/70">
              <span>총 {notifications.length}개 알림</span>
              <span>읽지 않음 {unreadCount}개</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}















