'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Clock, RefreshCw, Activity, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MedicalPassCardProps {
  userName: string;
  referralCode: string;
}

export default function MedicalPassCard({ userName, referralCode }: MedicalPassCardProps) {
  const [pin, setPin] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  // 타이머 로직
  useEffect(() => {
    if (timeLeft <= 0) {
      setPin(null);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const generatePass = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/member/pass/generate', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        setPin(data.pin);
        setTimeLeft(data.expiresIn || 300);
      } else {
        alert(data.error || '패스 발급 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('Pass generation failed:', err);
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 의료용 링크: mode=medical 파라미터 포함
  const siteUrl = process.env.NEXT_PUBLIC_PROD_URL || process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const medicalPassUrl = `${siteUrl}/member/${referralCode}?mode=medical${pin ? `&pin=${pin}` : ''}`;

  return (
    <div className="space-y-6">
      <div className="relative group">
        <div className="relative w-full min-h-[480px] max-w-[340px] mx-auto bg-white rounded-[40px] p-6 md:p-10 overflow-hidden shadow-2xl border border-indigo-50">
          
          {/* Clinical Decorations */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          
          <div className="relative z-10 flex flex-col h-full space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-secondary rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Universal Medical Pass</span>
              </div>
              <h3 className="text-2xl font-black text-obsidian tracking-tighter leading-tight">
                디지털 <br /> <span className="text-secondary">진료 패스</span>
              </h3>
              <p className="text-[11px] font-bold text-foreground/70 mt-2 leading-relaxed">
                의료진에게 이 화면을 제시하면 <br />사전 문진 내역이 즉시 공유됩니다.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {pin ? (
                <motion.div
                  key="active-pass"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8 py-4"
                >
                  {/* QR Area */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="p-4 bg-white rounded-[32px] shadow-xl border border-indigo-50 relative">
                      <QRCodeSVG 
                        value={medicalPassUrl}
                        size={150}
                        level="H"
                        fgColor="#1e1b4b"
                      />
                      <div className="absolute inset-x-0 -bottom-2 flex justify-center">
                        <div className="bg-secondary text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                          <Activity className="w-2 h-2" /> SCAN NOW
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PIN Display */}
                  <div className="bg-indigo-50/50 rounded-3xl p-6 text-center border border-indigo-100/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2">
                       <Clock className="w-3 h-3 text-indigo-300 animate-pulse" />
                    </div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Security Access PIN</p>
                    <div className="flex justify-center gap-3">
                      {pin.split('').map((char, i) => (
                        <motion.span
                          key={i}
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="text-3xl font-black text-indigo-900 leading-none"
                        >
                          {char}
                        </motion.span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <span className="text-[11px] font-black text-secondary">{formatTime(timeLeft)}</span>
                      <span className="text-[10px] font-bold text-foreground/70">남음</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="inactive-pass"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center py-10 space-y-6"
                >
                  <div className="w-20 h-20 bg-indigo-50 rounded-[32px] flex items-center justify-center text-indigo-300">
                    <RefreshCw className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground/70">패스가 활성화되지 않았습니다.</p>
                    <p className="text-[10px] font-medium text-slate-300 mt-1">접속 시마다 보안을 위해 새로 생성됩니다.</p>
                  </div>
                  <Button
                    onClick={generatePass}
                    disabled={loading}
                    className="w-full h-14 rounded-2xl bg-secondary text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-secondary active:scale-95 transition-all"
                  >
                    {loading ? "발급 중..." : "진료용 패스 발급하기"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Info */}
            <div className="pt-4 border-t border-slate-50">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                   <Activity className="w-4 h-4 text-secondary" />
                 </div>
                 <div>
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Authenticated Holder</p>
                   <p className="text-sm font-black text-obsidian tracking-tighter leading-none">{userName}</p>
                 </div>
               </div>
            </div>

          </div>
        </div>
      </div>

      <p className="text-[10px] text-center text-slate font-medium leading-relaxed opacity-50 px-6">
        이 패스는 유효 시간 동안에만 의사가 스캔하여 <br /> 
        귀하의 문진 상세 내역을 열람할 수 있도록 보안 처리됩니다.
      </p>
    </div>
  );
}
