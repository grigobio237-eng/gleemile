'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { KakaoIcon } from '@/components/ui/social-icons';

interface AuthInterceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  callbackUrl?: string; // e.g. /mile/join-public/abc1234
  message?: string;
}

const EMOJIS = ['😃', '😎', '🥱', '🥺', '🤯', '😴', '🥳', '🤔'];

export function AuthInterceptModal({ isOpen, onClose, callbackUrl = '/', message = "로그인하고 모든 기능을 무료로 즐겨보세요!" }: AuthInterceptModalProps) {
  if (!isOpen) return null;

  const handleKakaoLogin = () => {
    signIn('kakao', { callbackUrl });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-[400px] bg-[#0B0B0B] rounded-[40px] overflow-hidden shadow-2xl border border-white/10 flex flex-col items-center p-8"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-20%] right-[-20%] w-[200px] h-[200px] bg-emerald-500/20 rounded-full blur-[80px]"></div>
            <div className="absolute bottom-[-10%] left-[-20%] w-[200px] h-[200px] bg-cyan-500/20 rounded-full blur-[80px]"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center w-full">
            {/* Glee Mascot Graphic */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: [0, -5, 0] }}
              transition={{ 
                scale: { duration: 0.5, ease: "easeOut" },
                y: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
              }}
              className="relative mb-6"
            >
              <div className="w-24 h-24 bg-white rounded-[40px] shadow-[0_0_40px_rgba(52,211,153,0.3)] flex items-center justify-center border-4 border-white/10 relative overflow-hidden">
                <Image src="/images/confident.webp" alt="Glee Mascot" width={80} height={80} className="object-contain" priority />
              </div>
              <motion.div 
                initial={{ rotate: -45, scale: 0 }}
                animate={{ rotate: -12, scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="absolute -top-3 -left-3 text-3xl drop-shadow-lg"
              >
                🔓
              </motion.div>
              <motion.div 
                initial={{ rotate: 45, scale: 0 }}
                animate={{ rotate: 12, scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="absolute -bottom-2 -right-2 text-3xl drop-shadow-lg"
              >
                💪
              </motion.div>
            </motion.div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-3">
              우리 모임이 더 즐거워지는<br/>5초 습관
            </h2>
            <p className="text-sm text-slate-400 mb-8 px-4 font-medium break-keep">
              {message}
            </p>

            {/* Emojis Animation */}
            <div className="relative w-full h-16 mb-8 flex items-center justify-center gap-4 overflow-hidden mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)">
              {EMOJIS.slice(0, 5).map((emoji, idx) => (
                <motion.div
                  key={idx}
                  className="text-2xl"
                  initial={{ y: 0 }}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: idx * 0.2,
                    ease: "easeInOut"
                  }}
                >
                  {emoji}
                </motion.div>
              ))}
            </div>

            <button
              onClick={handleKakaoLogin}
              className="w-full bg-[#FEE500] text-black/90 font-bold h-14 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#F4DC00] transition-colors shadow-lg shadow-[#FEE500]/20"
            >
              <KakaoIcon className="w-5 h-5" />
              카카오로 1초 만에 시작하기
            </button>
            
            <p className="text-[11px] text-white/40 mt-6 text-center max-w-[200px]">
              계속 진행하면 글리마일의 이용약관 및 개인정보 처리방침에 동의한 것으로 간주됩니다.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
