'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RefreshCw, Sparkles, Loader2, Upload, X, Check, Brain, Activity, ArrowRight, Heart, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRecovery } from '@/contexts/RecoveryContext';
import { useSession } from 'next-auth/react';
import MembershipUpsellDialog from '@/components/auth/MembershipUpsellDialog';
import { useAIProgress } from '@/hooks/use-ai-progress';
import { AIProgressOverlay } from '@/components/shared/AIProgressOverlay';
import Image from 'next/image';

export interface AnalysisResult {
    subjectName: string;
    type: 'MEAL' | 'HYDRATION' | 'SKIN' | 'SLEEP' | 'ACTIVITY' | 'ROUTINE' | 'BODY' | 'MEDICAL_DOC' | 'OTHER' | 'AUTO';
    summary: string;
    analysisTable: { label: string; value: string; benefit: string; }[];
    futureDirection: string;
    matchScore: number;
}

export default function HeroScanner({ 
    onStart, 
    isDiagnosing = false,
    initialAnalysisData = null,
    initialImage
}: { 
    onStart: (data?: AnalysisResult, image?: string) => void;
    isDiagnosing?: boolean;
    initialAnalysisData?: AnalysisResult | null;
    initialImage?: string;
}) {
    const { journey, setJourney, medicalCategory, setMedicalCategory, treatmentType, setTreatmentType } = useRecovery();
    const [selectionStep, setSelectionStep] = useState<'JOURNEY' | 'CATEGORY' | 'STAGE' | 'TYPE' | 'READY'>('JOURNEY');
    const [isMobile, setIsMobile] = useState(false);
    const [status, setStatus] = useState<'idle' | 'select_type' | 'scanning' | 'result'>('idle');
    const [snapType, setSnapType] = useState<string>('AUTO');
    const [loading, setLoading] = useState(false);
    
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState('60초 리듬체크 시작하기');

    // Sync external result (e.g. from parent's Ghibli-themed SnapInput modal analysis)
    useEffect(() => {
        if (initialAnalysisData) {
            setResult(initialAnalysisData);
            setStatus('result');
            if (initialImage) {
                setCapturedImage(initialImage);
            }
        }
    }, [initialAnalysisData, initialImage]);

    // Sync with AI progress
    useEffect(() => {
        let interval: NodeJS.Timeout;
        let finishInterval: NodeJS.Timeout;

        if (isDiagnosing) {
            setProgress(0);
            interval = setInterval(() => {
                setProgress((prev) => {
                    let nextProgress = prev;
                    if (prev >= 90) {
                        nextProgress = prev + 0.05;
                        nextProgress = Math.min(99, nextProgress);
                    } else if (prev < 75) {
                        nextProgress = prev + 0.8;
                    } else {
                        const step = 0.8 + ((prev - 75) / 15) * 1.6;
                        nextProgress = Math.min(90, prev + step);
                    }

                    if (nextProgress < 30) setLoadingText('gleemile이 상태를 분석 중입니다...');
                    else if (nextProgress < 55) setLoadingText('gleemile 회복 패턴 매칭 중...');
                    else if (nextProgress < 80) setLoadingText('회복 데이터를 수집하고 있습니다...');
                    else if (nextProgress < 95) setLoadingText('맞춤형 질문을 설계 중입니다...');
                    else setLoadingText('거의 다 되었습니다. 마지막 정리 중...');

                    return nextProgress;
                });
            }, 100);
        } else {
            // When isDiagnosing transitions to false, read progress state via functional update
            // and perform the acceleration finish animation!
            setProgress((currentProgress) => {
                if (currentProgress > 0 && currentProgress < 100) {
                    let speed = 4;
                    finishInterval = setInterval(() => {
                        setProgress((prev) => {
                            if (prev >= 100) {
                                clearInterval(finishInterval);
                                setTimeout(() => setProgress(0), 600);
                                return 100;
                            }
                            return prev + speed;
                        });
                    }, 16);
                    return currentProgress;
                } else {
                    return 0;
                }
            });
            setLoadingText('60초 리듬체크 시작하기');
        }
        return () => {
            clearInterval(interval);
            if (finishInterval) clearInterval(finishInterval);
        };
    }, [isDiagnosing]);

    const { progress: scanProgress, statusMessage, finish: finishProgress } = useAIProgress(loading);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [showUpsell, setShowUpsell] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);
    
    const { data: session } = useSession();
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [showWebcam, setShowWebcam] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkMobile = () => {
            const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmall = window.innerWidth < 1024;
            setIsMobile(isTouch || isSmall);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (showWebcam && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play().catch(e => console.error("Video play error:", e));
            };
        }
    }, [showWebcam, stream]);

    const startWebcam = async () => {
        setShowWebcam(false);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const stopWebcam = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowWebcam(false);
    }, [stream]);

    const compressImage = (base64: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.src = base64;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/webp', 0.8));
            };
        });
    };

    const analyzeImage = async (imageData: string) => {
        setStatus('scanning');
        setLoading(true);
        setHasSaved(false);
        stopWebcam();

        try {
            const compressedData = await compressImage(imageData);
            setCapturedImage(compressedData);
            const response = await fetch('/api/ai/life-snap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: compressedData, journey, snapType })
            });
            if (!response.ok) throw new Error('Analysis failed');
            const data = await response.json();
            if (data.isMismatch) {
                toast.error(data.mismatchReason || "선택하신 카테고리와 맞지 않는 사진입니다.");
                setStatus('idle');
                return;
            }
            finishProgress();
            await new Promise(r => setTimeout(r, 800));
            setResult(data);
            setStatus('result');
            if (session?.user?.email) autoSaveResult(data, compressedData);
        } catch (err: any) {
            toast.error("gleemile 분석 중 오류가 발생했습니다.");
            setStatus('idle');
        } finally {
            setLoading(false);
        }
    };

    const autoSaveResult = async (analysisResult: AnalysisResult, imageData: string) => {
        setIsSaving(true);
        try {
            await fetch('/api/scan/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: analysisResult.type || 'OTHER',
                    imageData: imageData,
                    score: analysisResult.matchScore,
                    summary: analysisResult.summary,
                    metrics: { ...analysisResult.analysisTable, futureDirection: analysisResult.futureDirection }
                })
            });
            setHasSaved(true);
        } catch (err) {
            console.error("Auto-save failed:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        if (video.videoWidth === 0) return;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        analyzeImage(canvas.toDataURL('image/webp'));
    };

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

    const handleMobileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const compressedData = await compressFileDirectly(file);
            analyzeImage(compressedData);
        } catch (err) {
            console.error("Direct image compression failed, fallback to FileReader:", err);
            const reader = new FileReader();
            reader.onload = (event) => analyzeImage(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const renderIdleView = () => (
        <div 
            onClick={() => {
                onStart(); // Triggers the unified SnapInput modal instantly
            }}
            className="relative w-full aspect-[4/3.2] sm:aspect-[4/3] min-h-[260px] sm:min-h-[380px] md:min-h-[420px] rounded-[32px] md:rounded-5xl overflow-hidden group cursor-pointer shadow-[0_15px_40px_rgba(112,0,255,0.2)] hover:shadow-[0_20px_50px_rgba(244,63,94,0.3)] transition-all duration-700 active:scale-98 select-none border-2 border-transparent"
        >
            {/* 1. Ultimate Hyper-Colorful Animated Neon Aura & Mesh Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F0C1B] via-[#150030] to-[#050014]" />
            
            {/* Glowing Liquid Blobs (Moving & rotating to create high-end mesh gradient effect) */}
            <motion.div 
                animate={{ 
                    x: [-40, 40, -40],
                    y: [-30, 40, -30],
                    scale: [1, 1.2, 1]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.45)_0%,transparent_60%)] blur-[50px] pointer-events-none"
            />
            <motion.div 
                animate={{ 
                    x: [50, -50, 50],
                    y: [40, -40, 40],
                    scale: [1.2, 0.9, 1.2]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[-10%] right-[-10%] w-[90%] h-[90%] rounded-full bg-[radial-gradient(circle,rgba(112,0,255,0.4)_0%,transparent_60%)] blur-[60px] pointer-events-none"
            />
            <motion.div 
                animate={{ 
                    x: [-30, 30, -30],
                    y: [30, -30, 30],
                    scale: [0.8, 1.1, 0.8]
                }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-[20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-[radial-gradient(circle,rgba(0,240,255,0.35)_0%,transparent_60%)] blur-[50px] pointer-events-none"
            />
 
            {/* Glowing Dynamic Edge Ribbon border to act as a laser trace */}
            <div className="absolute inset-0 border-2 border-primary/20 rounded-[32px] md:rounded-5xl pointer-events-none group-hover:border-primary/50 transition-colors duration-700" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-[#00F0FF]/5 to-transparent rounded-[32px] md:rounded-5xl pointer-events-none animate-pulse" />
 
            {/* Fine digital grid lines overlay with beautiful violet-tint glow */}
            <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,#FF3366_1px,transparent_1px),linear-gradient(to_bottom,#7000FF_1px,transparent_1px)] bg-[size:20px_20px]" />
            
            {/* 2. Double Neon Pulsing Waves */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Outermost pulsing neon aura */}
                <motion.div 
                    animate={{ scale: [0.95, 1.3, 0.95], opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute w-[85%] aspect-square rounded-full border-2 border-[#FF3366]/30 blur-[2px]"
                />
                {/* Middle cyan aura */}
                <motion.div 
                    animate={{ scale: [0.98, 1.15, 0.98], opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                    className="absolute w-[65%] aspect-square rounded-full border border-[#00F0FF]/40 bg-gradient-to-tr from-[#7000FF]/5 to-transparent"
                />
            </div>
 
            {/* 3. Immersive Interactive Elements */}
            <div className="absolute inset-0 flex flex-col items-center justify-between text-center p-4 sm:p-6 md:p-10 z-10 py-5 sm:py-8 md:py-12">
                
                {/* Interactive Holographic 3D Crystal Camera Gear Emblem */}
                <div className="relative mt-1 sm:mt-2 md:mt-4">
                    {/* Glowing neon background aura for emblem */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FF3366] to-[#00F0FF] opacity-30 blur-md scale-120 group-hover:scale-135 transition-transform duration-500" />
                    
                    {/* Ring spinning border with spectrum dash */}
                    <div className="absolute -inset-3 rounded-full border border-dashed border-[#00F0FF]/40 group-hover:rotate-90 transition-transform duration-[3000ms] ease-out animate-[spin_30s_linear_infinite]" />
                    
                    <div className="w-11 h-11 sm:w-18 sm:h-18 md:w-26 md:h-26 rounded-full bg-white/[0.08] backdrop-blur-3xl flex items-center justify-center border border-white/20 group-hover:scale-108 group-hover:border-[#00F0FF]/70 group-hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all duration-700 relative overflow-hidden">
                        
                        {/* Shimmer holographic overlay inside lens */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-[#FF3366]/30 to-[#00F0FF]/30 pointer-events-none opacity-60" />
                        
                        <div className="w-8 h-8 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-b from-white/15 to-[#150030]/80 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(255,255,255,0.2)] relative border border-white/10">
                            {/* Colorful Glowing Camera Icon */}
                            <Camera className="w-4 h-4 sm:w-7 sm:h-7 md:w-10 md:h-10 text-white group-hover:text-[#00F0FF] group-hover:scale-110 transition-all duration-500 relative z-10 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
                            
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
                                transition={{ duration: 1.8, repeat: Infinity }}
                                className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FF3366] to-[#7000FF] blur-md pointer-events-none"
                            />
                        </div>
                    </div>
                </div>
 
                {/* Typography with Sparkling High-Contrast Gold-Prism Details */}
                <div className="space-y-2 sm:space-y-3.5 max-w-sm px-2 relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#FF3366]/20 to-[#7000FF]/20 border border-[#FF3366]/30 shadow-[0_0_15px_rgba(255,51,102,0.15)]">
                        <Sparkles className="w-3 h-3 text-[#FF3366] animate-pulse" />
                        <span className="text-[8px] font-black text-white uppercase tracking-[0.25em] drop-shadow-sm">One-Stop Wellness Scanner</span>
                    </div>
                    
                    <div className="space-y-0.5 sm:space-y-1.5">
                        <p className="text-white font-extrabold text-lg sm:text-2xl md:text-3.5xl leading-tight tracking-tight break-keep drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                            오늘 나의 회복 이야기
                        </p>
                        <p className="text-white/80 text-[9px] sm:text-xs md:text-sm font-medium leading-relaxed break-keep drop-shadow-[0_1px_5px_rgba(0,0,0,0.5)]">
                            사진을 업로드하거나 오늘의 한 줄을 입력하여<br />
                            60초 맞춤형 컨디션 케어를 시작해 보세요.
                        </p>
                    </div>
                </div>

                {/* Vivid high-contrast neon green/cyan call to action guidance */}
                <div className="flex flex-col items-center gap-1.5 pb-2 relative z-10">
                    <span className="text-[11px] font-black text-[#00F0FF] group-hover:text-white uppercase tracking-[0.22em] transition-colors duration-300 drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                        지금 탭하여 기록 시작하기
                    </span>
                    <motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="flex gap-1"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] opacity-40 shadow-[0_0_5px_#00F0FF]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF3366] opacity-80 animate-pulse shadow-[0_0_8px_#FF3366]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] opacity-40 shadow-[0_0_5px_#00F0FF]" />
                    </motion.div>
                </div>
            </div>
        </div>
    );

    const renderSelectTypeView = () => (
        <div className="w-full h-full md:relative md:aspect-[4/3] md:rounded-5xl overflow-hidden bg-white group cursor-pointer md:border md:border-primary/10 md:shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-8 border-b border-line bg-mist/30">
                <div>
                    <h3 className="font-bold text-foreground tracking-tight text-xl">어떤 스냅을 기록할까요?</h3>
                    <p className="text-sm font-medium text-foreground/40 mt-1">기록의 성격에 맞춰 카테고리를 선택해주세요.</p>
                </div>
                <button 
                    onClick={() => setStatus('idle')} 
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-foreground/30 hover:text-primary hover:bg-primary/5 transition-all shadow-sm"
                    aria-label="닫기"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="grid grid-cols-1 gap-3">
                    {[
                        { id: 'MEAL', emoji: '🍱', title: '음식 사진', desc: '오늘의 영양과 식사 패턴' },
                        { id: 'HYDRATION', emoji: '💧', title: '물/음료 사진', desc: '수분과 카페인 섭취 기록' },
                        { id: 'SKIN', emoji: '✨', title: '피부 컨디션', desc: '외형적인 회복의 변화' },
                        { id: 'SLEEP', emoji: '🛏️', title: '수면 환경', desc: '충분한 휴식을 위한 준비' },
                        { id: 'ACTIVITY', emoji: '🏃', title: '활동과 움직임', desc: '가벼운 산책이나 운동 기록' },
                        { id: 'ROUTINE', emoji: '💊', title: '자기관리 루틴', desc: '영양제나 관리 제품 기록' },
                        { id: 'BODY', emoji: '🤕', title: '불편한 부위', desc: '피로나 통증이 느껴지는 곳' },
                        { id: 'MEDICAL_DOC', emoji: '📄', title: '처방전/리듬체크서', desc: '의료적인 기록과 안내문' },
                        { id: 'OTHER', emoji: '📸', title: '기타 일상', desc: '회복 과정의 모든 순간' },
                    ].map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setSnapType(cat.id);
                                setStatus('idle');
                                startWebcam();
                            }}
                            className="flex items-center text-left gap-5 p-5 rounded-3xl border border-transparent hover:border-primary/10 hover:bg-primary/5 transition-all bg-mist/10"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-white flex flex-shrink-0 items-center justify-center text-2xl shadow-sm border border-primary/5">
                                {cat.emoji}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-base font-bold text-foreground">{cat.title}</h4>
                                <p className="text-xs font-medium text-foreground/40 mt-0.5 break-keep">{cat.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderWebcamView = () => (
        <div className="relative aspect-[4/3] rounded-5xl overflow-hidden bg-black border border-primary/10 shadow-2xl">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                <Button onClick={handleCapture} className="w-24 h-24 rounded-full bg-white p-1.5 hover:scale-105 active:scale-95 transition-all shadow-2xl">
                    <div className="w-full h-full rounded-full border-4 border-primary/10 flex items-center justify-center bg-primary/20">
                        <div className="w-14 h-14 rounded-full bg-primary" />
                    </div>
                </Button>
                <Button variant="ghost" onClick={stopWebcam} className="absolute top-8 right-8 text-white/60 hover:text-white bg-white/10 backdrop-blur-md rounded-full w-12 h-12" aria-label="닫기">
                    <X className="w-6 h-6" />
                </Button>
            </div>
        </div>
    );

    const renderResultView = () => {
        if (!result) return null;
        const categoryMap = {
            MEAL: { label: '식단', icon: '🍱' },
            HYDRATION: { label: '수분', icon: '💧' },
            SKIN: { label: '피부', icon: '✨' },
            SLEEP: { label: '수면', icon: '🛏️' },
            ACTIVITY: { label: '활동', icon: '🏃' },
            ROUTINE: { label: '루틴', icon: '💊' },
            BODY: { label: '바디', icon: '🤕' },
            MEDICAL_DOC: { label: '서류', icon: '📄' },
            OTHER: { label: '기타', icon: '📸' },
            AUTO: { label: '분석중', icon: '🧠' }
        };

        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="space-y-6 fixed inset-0 z-[100] bg-mist overflow-y-auto w-full h-full p-4 pb-32 md:relative md:inset-auto md:z-auto md:p-0 md:bg-transparent md:h-auto"
            >
                <Card className="rounded-[40px] md:rounded-5xl border-none shadow-2xl shadow-primary/5 overflow-hidden bg-white max-w-lg mx-auto my-4 md:my-0">
                    {isDiagnosing && (
                        <div className="absolute top-0 left-0 right-0 h-1.5 z-50 bg-mist">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-primary"
                                transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                            />
                        </div>
                    )}
                    <div className="relative h-64 md:h-72 overflow-hidden">
                        {capturedImage && <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={capturedImage} alt="Captured" className="w-full h-full object-cover" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                        <div className="absolute bottom-6 md:bottom-8 left-6 md:left-10 right-6 md:right-10 flex items-end justify-between">
                            <div className="space-y-2">
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md">
                                    {categoryMap[result.type as keyof typeof categoryMap]?.icon} {categoryMap[result.type as keyof typeof categoryMap]?.label}
                                </Badge>
                                <h4 className="text-2xl md:text-3xl font-bold tracking-tight">{result.subjectName}</h4>
                                <div className="text-[11px] font-bold uppercase tracking-widest text-primary/60 flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5" /> Recovery Insights
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold uppercase tracking-widest block mb-1 text-foreground/40">MATCH SCORE</span>
                                <span className="font-black tracking-tighter text-primary text-4xl md:text-4xl">{result.matchScore}<span className="text-lg opacity-30">/100</span></span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setStatus('idle')} 
                            className="absolute top-6 right-6 md:top-8 md:right-8 p-3 bg-white/40 hover:bg-white/60 backdrop-blur-md rounded-full text-foreground/40 hover:text-primary transition-all shadow-sm"
                            aria-label="닫기"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <CardContent className="p-6 md:p-10 space-y-6 md:space-y-10">
                        <div className="space-y-3 md:space-y-4">
                            <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/30">
                                <Brain className="w-4 h-4" /> Youniqle Personalized Summary
                            </div>
                            <div className="bg-mist/30 p-5 md:p-8 rounded-[32px] md:rounded-5xl border border-primary/5 italic text-lg md:text-2xl font-bold leading-tight text-foreground/80">
                                "{result.summary}"
                            </div>
                        </div>

                        <div className="space-y-3 md:space-y-4">
                            <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/30">
                                <Sprout className="w-4 h-4" /> Growth Analysis
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {result.analysisTable?.map((item, idx) => (
                                    <div key={idx} className="p-5 md:p-6 rounded-[28px] md:rounded-4xl bg-white border border-primary/10 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{item.label}</span>
                                            <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary bg-primary/5">
                                                {item.value}
                                            </Badge>
                                        </div>
                                        <p className="text-sm font-medium text-foreground/70 leading-relaxed">{item.benefit}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {result.futureDirection && (
                            <div className="p-6 md:p-8 rounded-[32px] md:rounded-5xl bg-primary/5 border border-primary/10 space-y-4 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[80px] rounded-full -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-1000" />
                                <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-primary relative z-10">
                                    <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Gentle Recovery Guide
                                </div>
                                <div className="space-y-3 relative z-10">
                                    {result.futureDirection.split(/\n|\\n/).filter(line => line.trim().length > 0).map((line, index) => {
                                        const parts = line.split(/(\*\*.*?\*\*)/g);
                                        return (
                                            <div key={index} className="flex items-start gap-3 bg-white/80 backdrop-blur-sm p-4 rounded-3xl border border-primary/5 shadow-sm hover:shadow transition-all duration-300">
                                                <span className="text-primary font-bold text-base leading-none mt-0.5 select-none">•</span>
                                                <p className="text-sm md:text-base font-medium text-foreground/80 leading-relaxed">
                                                    {parts.map((part, pIdx) => {
                                                        if (part.startsWith('**') && part.endsWith('**')) {
                                                            return <strong key={pIdx} className="text-primary font-extrabold">{part.slice(2, -2)}</strong>;
                                                        }
                                                        return part;
                                                    })}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 md:pt-6 flex flex-col gap-3">
                            {isDiagnosing ? (
                                <div className="w-full bg-primary/5 border border-primary/10 rounded-[32px] p-5 md:p-6 space-y-4 relative overflow-hidden shadow-inner">
                                    {/* Shimmer/Scanner line effect running from left to right */}
                                    <motion.div 
                                        animate={{ x: ['-100%', '200%'] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-primary/10 to-transparent pointer-events-none"
                                    />
                                    
                                    <div className="flex justify-between items-center text-xs md:text-sm font-bold text-primary relative z-10">
                                        <div className="flex items-center gap-2.5">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                                            <span className="tracking-tight text-foreground/80">{loadingText}</span>
                                        </div>
                                        <span className="font-mono text-sm shrink-0 bg-primary/10 px-2 py-0.5 rounded-full">{Math.round(progress)}%</span>
                                    </div>
                                    
                                    {/* Progress Bar Container */}
                                    <div className="h-2.5 w-full bg-primary/10 rounded-full overflow-hidden relative z-10 border border-primary/5">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className="h-full bg-primary rounded-full relative"
                                            transition={{ type: 'spring', stiffness: 60, damping: 12 }}
                                        >
                                            {/* Glow effect on progress bar cap */}
                                            <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/40 blur-[1px]" />
                                        </motion.div>
                                    </div>
                                </div>
                            ) : (
                                <Button 
                                    onClick={() => onStart(result || undefined, capturedImage || undefined)}
                                    className="w-full h-16 md:h-20 rounded-full text-sm sm:text-base md:text-xl font-bold shadow-2xl transition-all group relative overflow-hidden bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                                >
                                    <div className="flex items-center justify-center gap-2 md:gap-3">
                                        <Heart className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
                                        <span>60초 리듬체크 시작하기</span>
                                        <ArrowRight className="ml-1 md:ml-2 w-4.5 h-4.5 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Button>
                            )}
                            
                            {!isDiagnosing && (
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setStatus('idle')}
                                    className="w-full h-12 md:hidden rounded-full text-foreground/50 hover:text-foreground font-bold text-sm"
                                >
                                    닫기
                                </Button>
                            )}

                            {/* Mobile Safe Area Bottom Spacer to avoid bottom cut-off */}
                            <div className="h-16 md:hidden" />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    return (
        <div className="w-full max-w-lg mx-auto">
            <AnimatePresence mode="wait">
                {status === 'idle' && (
                    <motion.div key="idle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                        {showWebcam ? renderWebcamView() : renderIdleView()}
                    </motion.div>
                )}
                {status === 'select_type' && (
                    <motion.div key="select_type" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed inset-0 z-[100] md:relative md:inset-auto md:z-auto">
                        {renderSelectTypeView()}
                    </motion.div>
                )}
                {status === 'scanning' && (
                    <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative aspect-[4/3] rounded-5xl bg-mist flex flex-col items-center justify-center overflow-hidden">
                        {capturedImage && <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={capturedImage} alt="Scanning" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
                        <AIProgressOverlay active={loading} progress={scanProgress} message={statusMessage} variant="compact" />
                    </motion.div>
                )}
                {status === 'result' && renderResultView()}
            </AnimatePresence>
            <canvas ref={canvasRef} className="hidden" />
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleMobileCapture} 
                aria-label="이미지 업로드" 
                {...({ capture: 'environment' } as any)}
            />
            <MembershipUpsellDialog open={showUpsell} onOpenChange={setShowUpsell} />
        </div>
    );
}
