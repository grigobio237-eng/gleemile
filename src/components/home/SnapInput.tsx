'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, PenLine, ArrowRight, X, Image as ImageIcon, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

interface SnapInputProps {
  onComplete: (data: { type: 'PHOTO' | 'TEXT'; content: string | File }) => void;
  onCancel: () => void;
  initialImage?: string;
  isDiagnosing?: boolean;
}

export default function SnapInput({ onComplete, onCancel, initialImage, isDiagnosing = false }: SnapInputProps) {
  const [mode, setMode] = useState<'SELECT' | 'PHOTO' | 'TEXT'>(initialImage ? 'PHOTO' : 'SELECT');
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [memo, setMemo] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(initialImage || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);

  const [loadingText, setLoadingText] = useState('회복 리듬 분석 중...');

  // Progress animation logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDiagnosing) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          let nextProgress = prev;
          
          if (prev >= 90) {
            // Above 90%, slowly creep forward with fine details
            nextProgress = prev + 0.08;
            nextProgress = Math.min(99, nextProgress);
          } else if (prev < 75) {
            // 1% ~ 75%: deliberate, slow & reliable scan phase
            nextProgress = prev + 0.9;
          } else {
            // 75% ~ 90%: spring acceleration phase
            const step = 0.9 + ((prev - 75) / 15) * 1.6;
            nextProgress = Math.min(90, prev + step);
          }

          // Dynamic loading text updates based on actual progress
          if (nextProgress < 30) setLoadingText('gleemile이 이미지를 정밀 분석 중입니다...');
          else if (nextProgress < 55) setLoadingText('gleemile 회복 패턴 매칭 중...');
          else if (nextProgress < 80) setLoadingText('오늘의 회복 컨텍스트 구성 중...');
          else if (nextProgress < 95) setLoadingText('맞춤형 리듬체크 설계 중...');
          else setLoadingText('거의 다 되었습니다. 결과를 정비하고 있어요...');

          return nextProgress;
        });
      }, 100);
    } else {
      setLoadingText('회복 리듬 분석 중...');
    }
    return () => clearInterval(interval);
  }, [isDiagnosing]);

  const compressFileDirectly = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          URL.revokeObjectURL(url);
          resolve(compressed);
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      try {
        const compressedData = await compressFileDirectly(file);
        setSelectedImage(compressedData);
        setMode('PHOTO');
        setShowPhotoOptions(false); // Reset photo option branch state
      } catch (err) {
        console.error("Direct image compression failed, fallback to FileReader:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImage(reader.result as string);
          setMode('PHOTO');
          setShowPhotoOptions(false); // Reset photo option branch state
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = () => {
    if (mode === 'PHOTO' && selectedImage) {
      onComplete({ type: 'PHOTO', content: selectedImage });
    } else if (mode === 'TEXT' && memo.trim()) {
      onComplete({ type: 'TEXT', content: memo });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#F4F7F2] text-[#2D3A30] flex flex-col items-center justify-center p-4 sm:p-6 md:p-12 overflow-y-auto relative">
      {/* 1. Warm Ghibli Serenity Pastel Mesh Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Soft Emerald Sage Blob */}
        <motion.div 
          animate={{ 
            x: [-20, 20, -20],
            y: [-30, 20, -30],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[15%] -left-[15%] w-[80%] h-[80%] rounded-full bg-[radial-gradient(circle,rgba(212,226,212,0.45)_0%,transparent_70%)] blur-[50px]"
        />
        {/* Warm Sunlight Peach Blob */}
        <motion.div 
          animate={{ 
            x: [30, -30, 30],
            y: [20, -30, 20],
            scale: [1.1, 0.95, 1.1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-[15%] -right-[15%] w-[90%] h-[90%] rounded-full bg-[radial-gradient(circle,rgba(247,221,209,0.45)_0%,transparent_70%)] blur-[60px]"
        />
        {/* Subtle Paper Noise Overlay */}
        <div className="absolute inset-0 opacity-[0.015] bg-black bg-[size:40px_40px] pointer-events-none" />
      </div>

      <button 
        onClick={onCancel}
        className="absolute top-4 right-4 md:top-8 md:right-8 p-2.5 bg-white/80 border border-[#E2E6E2] hover:bg-surface rounded-full transition-all duration-300 z-50 shadow-md hover:scale-105"
        title="닫기"
        aria-label="닫기"
      >
        <X className="w-5 h-5 text-[#556257]" />
      </button>
 
      <div className="max-w-2xl w-full space-y-6 sm:space-y-10 md:space-y-12 flex flex-col justify-center relative z-10">
        {/* Header Section */}
        <div className="space-y-3 sm:space-y-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#E8F0E8] border border-[#D4E2D4] rounded-full shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-[#556257] animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-extrabold text-[#556257] uppercase tracking-widest">Step 01. Today's Snap</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="font-extrabold tracking-tight break-keep px-2 text-[#2D3A30] font-serif-display leading-tight text-2xl sm:text-4xl md:text-4xl"
          >
            사진은 평가가 아니라 기록입니다.<br />
            <span className="text-[#556257] italic">얼굴이 아니어도 괜찮아요.</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="text-[#68756A] font-semibold text-[11px] sm:text-sm break-keep leading-relaxed px-4 max-w-lg mx-auto"
          >
            음식, 물컵, 책상, 혹은 지금 보이는 창밖 풍경까지.<br />
            당신의 오늘을 대변하는 하나면 충분합니다.
          </motion.p>
        </div>
 
        {/* Input Section */}
        <AnimatePresence mode="wait">
          {mode === 'SELECT' && (
            <motion.div 
              key="select_instant_3_cards"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.03 }}
              className="w-full space-y-4 sm:space-y-6 px-1 max-w-md mx-auto"
            >
              {/* Top Row: Photo Actions Side-by-Side */}
              <div className="grid grid-cols-2 gap-4">
                {/* 1. Camera Shoot Card */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="group p-5 sm:p-8 bg-white/95 border border-[#E0E5DF] hover:border-[#556257]/80 hover:bg-[#E8F0E8]/20 rounded-[28px] sm:rounded-[36px] transition-all duration-500 text-center space-y-4 shadow-[0_10px_24px_rgba(85,98,87,0.04)] hover:shadow-[0_12px_28px_rgba(85,98,87,0.1)] active:scale-98 cursor-pointer"
                >
                  <div className="relative w-11 h-11 sm:w-16 sm:h-16 rounded-2xl bg-[#E8F0E8] flex items-center justify-center mx-auto group-hover:scale-108 transition-all shadow-inner">
                    <Camera className="w-5.5 h-5.5 sm:w-8 sm:h-8 text-[#556257]" />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-sm sm:text-lg font-extrabold text-[#2D3A30]">사진 촬영</span>
                    <span className="text-[9px] sm:text-xs text-[#68756A] font-semibold opacity-70 block">즉시 카메라 촬영</span>
                  </div>
                </button>

                {/* 2. Gallery Pick Card */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="group p-5 sm:p-8 bg-white/95 border border-[#E0E5DF] hover:border-[#556257]/80 hover:bg-[#E8F0E8]/20 rounded-[28px] sm:rounded-[36px] transition-all duration-500 text-center space-y-4 shadow-[0_10px_24px_rgba(85,98,87,0.04)] hover:shadow-[0_12px_28px_rgba(85,98,87,0.1)] active:scale-98 cursor-pointer"
                >
                  <div className="relative w-11 h-11 sm:w-16 sm:h-16 rounded-2xl bg-[#EAF2FF] flex items-center justify-center mx-auto group-hover:scale-108 transition-all shadow-inner">
                    <ImageIcon className="w-5.5 h-5.5 sm:w-8 sm:h-8 text-[#4B79A1]" />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-sm sm:text-lg font-extrabold text-[#2D3A30]">보관함 선택</span>
                    <span className="text-[9px] sm:text-xs text-[#68756A] font-semibold opacity-70 block">앨범 사진 올리기</span>
                  </div>
                </button>
              </div>

              {/* Bottom Row: Text Write Card Full-Width */}
              <button
                onClick={() => setMode('TEXT')}
                className="group w-full p-5 sm:p-7 bg-white/95 border border-[#E0E5DF] hover:border-[#8C6F62]/80 hover:bg-[#FAF0EB]/20 rounded-[28px] sm:rounded-[36px] transition-all duration-500 flex items-center gap-4 sm:gap-6 shadow-[0_10px_24px_rgba(85,98,87,0.04)] hover:shadow-[0_12px_28px_rgba(140,111,98,0.1)] active:scale-98 cursor-pointer text-left"
              >
                <div className="relative w-11 h-11 sm:w-16 sm:h-16 rounded-2xl bg-[#FAF0EB] flex items-center justify-center flex-shrink-0 group-hover:scale-108 transition-all shadow-inner">
                  <PenLine className="w-5.5 h-5.5 sm:w-8 sm:h-8 text-[#8C6F62]" />
                </div>
                <div className="space-y-0.5">
                  <span className="block text-sm sm:text-lg font-extrabold text-[#2D3A30]">한 줄로 기록</span>
                  <span className="text-[9px] sm:text-xs text-[#8C6F62]/80 font-semibold opacity-70 block">텍스트 입력으로 간편하게 오늘 하루 남기기</span>
                </div>
                <ArrowRight className="ml-auto w-5 h-5 text-slate-300 group-hover:text-[#8C6F62] group-hover:translate-x-1 transition-all duration-300" />
              </button>
              
              {/* Hidden File Inputs */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
                title="보관함 사진 업로드"
              />
              <input 
                type="file" 
                ref={cameraInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                capture="environment"
                className="hidden" 
                title="실시간 카메라 촬영"
              />
            </motion.div>
          )}
  
          {mode === 'PHOTO' && (
            <motion.div 
              key="photo"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4 sm:space-y-8"
            >
              <div className="relative aspect-[4/3] w-full max-w-[280px] sm:max-w-md mx-auto bg-white border-4 border-white rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-[0_15px_40px_rgba(85,98,87,0.15)]">
                {selectedImage && (
                  <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                )}
                <button 
                  onClick={() => {
                    setMode('SELECT');
                    setSelectedImage(null);
                    setImageFile(null);
                    setShowPhotoOptions(false);
                  }}
                  className="absolute top-3 right-3 bg-[#2D3A30]/80 text-white p-2 rounded-full hover:bg-[#2D3A30] hover:scale-105 backdrop-blur-md transition-all duration-300"
                  title="사진 취소"
                  aria-label="사진 취소"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-col items-center gap-3">
                <Button 
                  onClick={handleSubmit} 
                  disabled={isDiagnosing}
                  className={`w-full max-w-[280px] h-13 sm:h-16 rounded-[20px] sm:rounded-[24px] text-base sm:text-lg font-black shadow-lg transition-all duration-500 group relative overflow-hidden ${isDiagnosing ? 'bg-slate-200 text-foreground/70' : 'bg-gradient-to-r from-[#556257] to-[#6A786C] hover:from-[#465248] hover:to-[#556257] text-white shadow-[#556257]/15 hover:scale-102 active:scale-98'}`}
                >
                  {isDiagnosing ? (
                    <>
                      {/* Progress Bar Layer */}
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="absolute inset-y-0 left-0 bg-[#556257] z-0"
                        transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                      />
                      
                      {/* Base Text (White opacity) - Inactive Layer */}
                      <div className="absolute inset-0 flex items-center justify-center z-10 text-foreground/70">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#556257]" />
                          <span>{loadingText}</span>
                          <span className="tabular-nums opacity-60">{Math.round(progress)}%</span>
                        </div>
                      </div>
  
                      {/* Inverted Text (White) - Active Layer */}
                      <motion.div 
                        className="absolute inset-y-0 left-0 overflow-hidden z-20 flex items-center bg-[#556257]"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="w-[280px] flex items-center justify-center text-white font-black">
                          <div className="flex items-center gap-2 w-full justify-center">
                            <Sparkles className="w-4 h-4 sm:w-5 h-5 animate-pulse text-[#D4E2D4]" />
                            <span className="whitespace-nowrap text-sm sm:text-base">{loadingText}</span>
                            <span className="tabular-nums text-sm sm:text-base">{Math.round(progress)}%</span>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  ) : (
                    <div className="relative z-10 flex items-center justify-center">
                      <span>이 사진으로 결정</span>
                      <ArrowRight className="ml-2 w-4 h-4 sm:w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                    </div>
                  )}
                </Button>
                
                <p className="text-[10px] sm:text-xs text-[#68756A] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-[#556257]" /> 사진은 당신의 보관함에만 안전하게 저장됩니다.
                </p>
              </div>
            </motion.div>
          )}
  
          {mode === 'TEXT' && (
            <motion.div 
              key="text"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4 sm:space-y-8"
            >
              <div className="space-y-2 sm:space-y-4">
                <Textarea 
                  placeholder="오늘의 기분이나 남기고 싶은 한 줄을 적어주세요..."
                  title="기록 내용 입력"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="min-h-[130px] sm:min-h-[200px] text-base sm:text-xl font-semibold border-2 border-[#E2E6E2] rounded-[24px] sm:rounded-[36px] p-5 sm:p-8 focus-visible:ring-2 focus-visible:ring-[#556257] focus-visible:border-[#556257] bg-white hover:bg-surface/50 text-[#2D3A30] leading-relaxed placeholder:text-slate-300 transition-all duration-300 shadow-inner"
                />
                <div className="flex justify-end pr-2">
                  <span className="text-[10px] sm:text-xs text-[#68756A]/60 font-bold">{memo.length} characters</span>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-3">
                <Button 
                  onClick={handleSubmit}
                  disabled={!memo.trim() || isDiagnosing}
                  className={`w-full max-w-[300px] h-13 sm:h-16 rounded-[20px] sm:rounded-[24px] text-base sm:text-lg font-black shadow-lg transition-all duration-500 group relative overflow-hidden ${isDiagnosing ? 'bg-slate-200 text-foreground/70' : 'bg-gradient-to-r from-[#8C6F62] to-[#A38577] hover:from-[#765D52] hover:to-[#8C6F62] text-white shadow-[#8C6F62]/15 hover:scale-102 active:scale-98'}`}
                >
                  {isDiagnosing ? (
                    <>
                      {/* Progress Bar Layer */}
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="absolute inset-y-0 left-0 bg-[#8C6F62] z-0"
                        transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                      />
                      
                      {/* Base Text (Slate) - Inactive Layer */}
                      <div className="absolute inset-0 flex items-center justify-center z-10 text-foreground/70">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#8C6F62]" />
                          <span>{loadingText}</span>
                          <span className="tabular-nums opacity-60">{Math.round(progress)}%</span>
                        </div>
                      </div>
  
                      {/* Inverted Text (White) - Active Layer */}
                      <motion.div 
                        className="absolute inset-y-0 left-0 overflow-hidden z-20 flex items-center bg-[#8C6F62]"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="w-[300px] flex items-center justify-center text-white font-black">
                          <div className="flex items-center gap-2 w-full justify-center">
                            <Sparkles className="w-4 h-4 sm:w-5 h-5 animate-pulse text-[#F7DDD1]" />
                            <span className="whitespace-nowrap text-sm sm:text-base">{loadingText}</span>
                            <span className="tabular-nums text-sm sm:text-base">{Math.round(progress)}%</span>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  ) : (
                    <div className="relative z-10 flex items-center justify-center">
                      <span>이 기록으로 결정</span>
                      <ArrowRight className="ml-2 w-4 h-4 sm:w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                    </div>
                  )}
                </Button>
                
                <button 
                  onClick={() => setMode('SELECT')}
                  disabled={isDiagnosing}
                  className="text-[#68756A] font-extrabold text-xs sm:text-sm hover:text-[#2D3A30] transition-colors disabled:pointer-events-none cursor-pointer"
                >
                  사진 선택으로 돌아가기
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
  
        {/* Next Nudge Footer - Hidden when in sub-modes to focus */}
        {mode === 'SELECT' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-4 sm:pt-10 border-t border-[#E0E5DF] text-center"
          >
            <p className="text-[10px] sm:text-sm font-black text-[#556257]/40 tracking-[0.25em] uppercase">
              RECOVER YOUR RHYTHM © YOUNIQLE
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
