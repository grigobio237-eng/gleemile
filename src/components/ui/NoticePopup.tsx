'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface Notice {
  _id: string;
  title: string;
  content: string;
  type: string;
  images?: string[];
  popupSettings?: {
    width: number;
    height: number;
    displayDays: number;
    backgroundColor?: string;
  };
}

export default function NoticePopup() {
  const [popupNotices, setPopupNotices] = useState<Notice[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    fetchPopupNotices();
  }, []);

  const fetchPopupNotices = async () => {
    try {
      // 오늘 보지 않기를 선택한 공지사항 ID 목록
      const hiddenNotices = getHiddenNotices();
      
      // 사용자 정보 확인
      const userInfo = await getUserInfo();
      
      // API 호출 시 사용자 타입 정보 전달
      const params = new URLSearchParams({
        userType: userInfo.userType,
        isNewUser: userInfo.isNewUser.toString(),
        role: userInfo.role,
      });
      
      const response = await fetch(`/api/notices/popup?${params}`);
      const data = await response.json();

      if (data.success && data.data.notices.length > 0) {
        // 숨김 처리되지 않은 공지사항만 표시
        const visibleNotices = data.data.notices.filter(
          (notice: Notice) => !hiddenNotices.includes(notice._id)
        );

        if (visibleNotices.length > 0) {
          setPopupNotices(visibleNotices);
          setShowPopup(true);
        }
      }
    } catch (error) {
      console.error('Error fetching popup notices:', error);
    }
  };

  const getUserInfo = async () => {
    try {
      // 세션 정보 확인
      const sessionResponse = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        if (session.user) {
          // 사용자 등록일 확인 (신규 회원 판단)
          const registrationDate = new Date(session.user.createdAt || session.user.created_at);
          const daysSinceRegistration = Math.floor((Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
          const isNewUser = daysSinceRegistration <= 30; // 30일 이내면 신규 회원
          
          return {
            userType: isNewUser ? 'new' : 'existing',
            isNewUser,
            role: session.user.role || 'member'
          };
        }
      }
      
      // 로그인하지 않은 사용자는 기존 회원으로 처리
      return {
        userType: 'existing',
        isNewUser: false,
        role: 'member'
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      return {
        userType: 'existing',
        isNewUser: false,
        role: 'member'
      };
    }
  };

  const getHiddenNotices = (): string[] => {
    try {
      const hidden = localStorage.getItem('hiddenNoticePopups');
      if (!hidden) return [];

      const hiddenData = JSON.parse(hidden);
      const now = new Date().getTime();

      // 만료된 항목 제거
      const validHidden = Object.entries(hiddenData).filter(
        ([_, expiry]: [string, any]) => expiry > now
      );

      // 유효한 항목만 다시 저장
      const validHiddenObj = Object.fromEntries(validHidden);
      localStorage.setItem('hiddenNoticePopups', JSON.stringify(validHiddenObj));

      return Object.keys(validHiddenObj);
    } catch (error) {
      return [];
    }
  };

  const handleClose = () => {
    if (popupNotices.length === 0) return;

    if (dontShowToday) {
      // 오늘 하루 보지 않기
      const currentNotice = popupNotices[currentIndex];
      const displayDays = currentNotice.popupSettings?.displayDays || 1;
      const expiryTime = new Date().getTime() + (displayDays * 24 * 60 * 60 * 1000);

      try {
        const hidden = localStorage.getItem('hiddenNoticePopups');
        const hiddenData = hidden ? JSON.parse(hidden) : {};
        hiddenData[currentNotice._id] = expiryTime;
        localStorage.setItem('hiddenNoticePopups', JSON.stringify(hiddenData));
      } catch (error) {
        console.error('Error saving hidden notice:', error);
      }
    }

    // 다음 팝업이 있으면 표시, 없으면 닫기
    if (currentIndex < popupNotices.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setDontShowToday(false);
    } else {
      setShowPopup(false);
    }
  };

  if (!showPopup || popupNotices.length === 0) {
    return null;
  }

  const currentNotice = popupNotices[currentIndex];

  return (
    <Dialog open={showPopup} onOpenChange={setShowPopup}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          width: currentNotice.popupSettings?.width || 500,
          backgroundColor: currentNotice.popupSettings?.backgroundColor || 'white',
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentNotice.type === 'important' && <AlertCircle className="w-5 h-5 text-red-500" />}
            {currentNotice.title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          <div className="prose max-w-none whitespace-pre-wrap">
            {currentNotice.content}
          </div>

          {/* 이미지 */}
          {currentNotice.images && currentNotice.images.length > 0 && (
            <div className="space-y-2">
              {currentNotice.images.map((image, index) => (
                <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized                   key={index}
                  src={image}
                  alt={`공지 이미지 ${index + 1}`}
                  className="w-full rounded-lg"
                />
              ))}
            </div>
          )}

          {/* 하단 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dontShowToday"
                checked={dontShowToday}
                onCheckedChange={(checked) => setDontShowToday(checked as boolean)}
              />
              <Label htmlFor="dontShowToday" className="cursor-pointer text-sm">
                {currentNotice.popupSettings?.displayDays || 1}일간 보지 않기
              </Label>
            </div>

            <div className="flex gap-2">
              {popupNotices.length > 1 && (
                <span className="text-sm text-foreground/70 py-2">
                  {currentIndex + 1} / {popupNotices.length}
                </span>
              )}
              <Link href={`/notices/${currentNotice._id}`}>
                <Button variant="outline" size="sm">
                  자세히 보기
                </Button>
              </Link>
              <Button onClick={handleClose} size="sm">
                닫기
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

