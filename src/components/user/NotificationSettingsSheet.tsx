'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { NotificationSettingsForm } from './NotificationSettingsForm';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface NotificationSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function NotificationSettingsSheet({ isOpen, onClose, userId }: NotificationSettingsSheetProps) {
  const [initialSettings, setInitialSettings] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);

  // 시트가 열릴 때 최신 설정값을 로드합니다.
  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      const fetchSettings = async () => {
        try {
          const userSnap = await getDoc(doc(db, 'users', userId));
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.notificationSettings) {
              setInitialSettings(data.notificationSettings);
            }
          }
        } catch (error) {
          console.error('Failed to load notification settings', error);
        } finally {
          setLoading(false);
        }
      };
      fetchSettings();
    }
  }, [isOpen, userId]);

  // 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (은은한 블러) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />

          {/* Sheet Container */}
          <motion.div
            initial={{ y: '100%', x: 0 }}
            animate={{ y: 0, x: 0 }}
            exit={{ y: '100%', x: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed z-[70] bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:left-auto md:right-0 md:w-96 bg-white md:shadow-2xl flex flex-col rounded-t-[2rem] md:rounded-none md:rounded-l-[2rem] overflow-hidden"
            // md 이상에서는 x축 애니메이션으로 덮어씁니다 (tailwindcss responsive 동작에 맞춰 애니메이션 속성을 동적으로 바꾸는 대신 css transform과 framer-motion을 병합 사용)
            style={{
               // 모바일에서는 bottom sheet 이므로 y로 동작하지만, 데스크탑에서는 오른쪽 슬라이드로 동작하게 하려면 variants를 사용할 수 있습니다.
               // 편의상 반응형 뷰포트를 기준으로 motion css 변수를 맵핑합니다.
            }}
            variants={{
              mobile: { y: '100%', x: 0 },
              desktop: { y: 0, x: '100%' }
            }}
          >
             {/* PC/Tablet Slide-in animation override via CSS media query or framer-motion variants */}
             <style dangerouslySetInnerHTML={{__html: `
                @media (min-width: 768px) {
                  .responsive-sheet {
                    transform: translateX(100%) !important;
                    animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                  }
                  @keyframes slideInRight {
                    to { transform: translateX(0) !important; }
                  }
                }
             `}} />
            
            <div className="md:hidden w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2" />
            
            <div className="flex justify-end p-4">
              <button 
                onClick={onClose}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 hide-scrollbar px-2">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <NotificationSettingsForm 
                  userId={userId} 
                  initialSettings={initialSettings} 
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
