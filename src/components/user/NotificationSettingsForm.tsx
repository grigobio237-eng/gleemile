'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, MessageSquare, Megaphone, Loader2 } from 'lucide-react';
import { updateNotificationSettings } from '@/lib/firebase/userService';
import { toast } from 'sonner';

interface NotificationSettingsProps {
  userId: string;
  initialSettings?: {
    isAllEnabled: boolean;
    chatEnabled: boolean;
    announcementEnabled: boolean;
  };
}

export function NotificationSettingsForm({ userId, initialSettings }: NotificationSettingsProps) {
  const [settings, setSettings] = useState({
    isAllEnabled: initialSettings?.isAllEnabled ?? true,
    chatEnabled: initialSettings?.chatEnabled ?? true,
    announcementEnabled: initialSettings?.announcementEnabled ?? true,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (key: keyof typeof settings) => {
    setIsUpdating(true);
    const newSettings = { ...settings, [key]: !settings[key] };
    
    // 만약 마스터 스위치(isAllEnabled)를 끄면 하위 항목들도 시각적으로 비활성화(혹은 동기화) 할 수 있습니다.
    // 여기서는 독립적으로 작동하되, 서버에서 isAllEnabled가 최우선으로 검사되도록 설계되어 있습니다.
    if (key === 'isAllEnabled' && !newSettings.isAllEnabled) {
      newSettings.chatEnabled = false;
      newSettings.announcementEnabled = false;
    } else if (key !== 'isAllEnabled' && newSettings[key]) {
      // 하위 항목을 켰을 때, 마스터 스위치가 꺼져있다면 자동으로 켬
      newSettings.isAllEnabled = true;
    }

    setSettings(newSettings);

    try {
      await updateNotificationSettings(userId, newSettings);
      toast.success('알림 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to update notification settings', error);
      toast.error('설정 저장에 실패했습니다. 다시 시도해주세요.');
      // 롤백
      setSettings(settings);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden max-w-md mx-auto">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-obsidian flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            알림 환경설정
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            원하는 알림만 선택해서 받아보세요.
          </p>
        </div>
        {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      </div>
      
      <CardContent className="p-0">
        <div className="divide-y divide-slate-50">
          
          {/* Master Toggle */}
          <div className="p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between">
            <div>
              <p className="font-bold text-obsidian text-sm">전체 푸시 알림</p>
              <p className="text-[11px] text-slate-500 mt-0.5">글리마일의 모든 실시간 알림을 켜거나 끕니다.</p>
            </div>
            <Switch 
              checked={settings.isAllEnabled}
              onCheckedChange={() => handleToggle('isAllEnabled')}
              disabled={isUpdating}
              className="data-[state=checked]:bg-obsidian"
            />
          </div>

          {/* Sub Toggles */}
          <div className={`p-6 flex items-center justify-between transition-opacity duration-300 ${!settings.isAllEnabled ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-bold text-slate-700 text-sm">채팅 메시지</p>
                <p className="text-[11px] text-slate-500 mt-0.5">새로운 팀 채팅이나 첨부파일 알림</p>
              </div>
            </div>
            <Switch 
              checked={settings.chatEnabled}
              onCheckedChange={() => handleToggle('chatEnabled')}
              disabled={isUpdating || !settings.isAllEnabled}
              className="data-[state=checked]:bg-indigo-600"
            />
          </div>

          <div className={`p-6 flex items-center justify-between transition-opacity duration-300 ${!settings.isAllEnabled ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <p className="font-bold text-slate-700 text-sm">공지사항</p>
                <p className="text-[11px] text-slate-500 mt-0.5">팀 임원이 작성한 중요 공지 알림</p>
              </div>
            </div>
            <Switch 
              checked={settings.announcementEnabled}
              onCheckedChange={() => handleToggle('announcementEnabled')}
              disabled={isUpdating || !settings.isAllEnabled}
              className="data-[state=checked]:bg-rose-500"
            />
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
