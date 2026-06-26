'use client';

import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Download, Share2, Sparkles, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface QRReferralCardProps {
  userName: string;
  referralCode: string;
}

export default function QRReferralCard({ userName, referralCode }: QRReferralCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!referralCode) {
    return (
      <div className="space-y-6">
        <div className="relative w-full aspect-[4/5] max-w-[340px] mx-auto bg-[#0B0D10] rounded-[40px] p-10 flex flex-col items-center justify-center border border-white/5">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D4AF37] mb-4" />
          <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] animate-pulse">Generating Protocol...</p>
        </div>
      </div>
    );
  }

  // 로컬 개발 중에도 QR 코드는 운영 서버를 가리키게 하여 모바일상의 접속 거부를 방지합니다.
  const siteUrl = process.env.NEXT_PUBLIC_PROD_URL || process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const referralLink = `${siteUrl}/member/${referralCode}`;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // High quality
        backgroundColor: '#0B0D10',
        logging: false,
        useCORS: true
      });
      
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `youniqle-invitation-${userName}.png`;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    // 1. Mobile Native Share
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Youniqle 초대',
          text: `${userName}님이 당신을 Youniqle에 초대했습니다.`,
          url: referralLink,
        });
        return;
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    }

    // 2. Clipboard Fallback
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard failed', err);
      alert('자동 복사에 실패했습니다. QR 코드를 이용해 주세요.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Preview & Design Area */}
      <div className="relative group">
        <div 
          ref={cardRef}
          className="relative w-full aspect-[4/5] max-w-[340px] mx-auto bg-[#0B0D10] rounded-[40px] p-6 md:p-10 overflow-hidden shadow-2xl border border-white/5"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4AF37]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* Header */}
            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center gap-2 mb-2 md:mb-4">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-[#D4AF37]" />
                </div>
                <span className="text-[9px] md:text-[10px] font-black text-[#F9F7F2]/40 uppercase tracking-[0.4em]">Youniqle ?</span>
              </div>
              <h3 className="font-black text-[#F9F7F2] tracking-tighter italic leading-none break-keep text-xl md:text-2xl">
                PRIVATE <br /> <span className="text-[#D4AF37]">INVITATION</span>
              </h3>
            </div>
 
            {/* QR Area */}
            <div className="flex flex-col items-center justify-center py-4 md:py-6">
              <div className="p-4 md:p-6 bg-[#F9F7F2] rounded-[24px] md:rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                <QRCodeSVG 
                  value={referralLink}
                  size={130} // default for mobile
                  className="md:hidden"
                  level="H"
                  includeMargin={false}
                  fgColor="#0B0D10"
                />
                <QRCodeSVG 
                  value={referralLink}
                  size={160} // for desktop
                  className="hidden md:block"
                  level="H"
                  includeMargin={false}
                  fgColor="#0B0D10"
                />
                <div className="absolute inset-0 border-[4px] md:border-[6px] border-[#D4AF37]/20 rounded-[24px] md:rounded-[32px] pointer-events-none" />
              </div>
              <p className="mt-4 md:mt-6 text-[9px] md:text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em]">Scan to Begin Recovery</p>
            </div>

            {/* User Info Overlay */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-black text-[#F9F7F2]/30 uppercase tracking-widest mb-1">Referral Agent</p>
                  <p className="text-lg font-black text-[#F9F7F2] tracking-tighter italic">{userName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-[#F9F7F2]/30 uppercase tracking-widest mb-1">Pass Code</p>
                  <p className="text-xs font-black text-[#D4AF37] tracking-widest">{referralCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <ShieldCheck className="w-3 h-3 text-[#F9F7F2]" />
                <span className="text-[8px] font-bold text-[#F9F7F2] uppercase tracking-widest">Authenticated Invitation Card</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Decoration for visual interest in UI */}
        <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center -rotate-12 group-hover:rotate-0 transition-all opacity-0 group-hover:opacity-100">
            <Share2 className="w-5 h-5 text-obsidian" />
        </div>
      </div>

      {/* 2. Actions */}
      <div className="grid grid-cols-1 gap-3">
        <Button 
          onClick={handleDownload}
          disabled={downloading}
          className="h-16 rounded-2xl bg-obsidian text-mist font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all group"
        >
          {downloading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-mist"></div>
          ) : (
            <>
              <Download className="w-4 h-4 mr-3 group-hover:translate-y-1 transition-transform" />
              인비테이션 카드 저장하기
            </>
          )}
        </Button>
        <Button 
          onClick={handleShare}
          className="h-16 rounded-2xl bg-white border-2 border-obsidian text-obsidian font-black text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-all group hover:bg-surface"
        >
          {copied ? (
            <>
              <ShieldCheck className="w-4 h-4 mr-3 text-secondary" />
              링크 복사 완료
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
              공유하기
            </>
          )}
        </Button>
        <p className="text-[10px] text-center text-slate font-medium leading-relaxed opacity-60">
          이미지를 저장하거나 링크를 전달하여 <br /> 친구를 초대해 주세요.
        </p>
      </div>
    </div>
  );
}
