'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RefreshCcw, Sparkles, Loader2, ArrowLeft, Check, X, AlertCircle, Save, History, Utensils, Droplets, Smile, Bed, Dumbbell, Pill, Activity, FileText, LayoutGrid, ArrowRight, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MembershipUpsellDialog from '@/components/auth/MembershipUpsellDialog';
import { AccessControl } from '@/lib/logic/access-control';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

export interface AnalysisResult {
    isMismatch?: boolean;
    mismatchReason?: string;
    subjectName: string;
    type: 'MEAL' | 'HYDRATION' | 'SKIN' | 'SLEEP' | 'ACTIVITY' | 'ROUTINE' | 'BODY' | 'MEDICAL_DOC' | 'OTHER' | 'AUTO';
    summary: string;
    analysisTable: Array<{ label: string, value: string, benefit: string }>;
    futureDirection: string;
    matchScore: number;
}

const CATEGORY_MAP = {
    MEAL: { label: '식단', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50' },
    HYDRATION: { label: '수분', icon: Droplets, color: 'text-primary', bg: 'bg-blue-50' },
    SKIN: { label: '스킨케어', icon: Smile, color: 'text-pink-500', bg: 'bg-pink-50' },
    SLEEP: { label: '수면', icon: Bed, color: 'text-secondary', bg: 'bg-indigo-50' },
    ACTIVITY: { label: '활동', icon: Dumbbell, color: 'text-green-500', bg: 'bg-green-50' },
    ROUTINE: { label: '루틴', icon: Pill, color: 'text-secondary', bg: 'bg-purple-50' },
    BODY: { label: '바디/상태', icon: Activity, color: 'text-red-500', bg: 'bg-red-50' },
    MEDICAL_DOC: { label: '의료서류', icon: FileText, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    OTHER: { label: '기타', icon: LayoutGrid, color: 'text-foreground/70', bg: 'bg-surface' },
    AUTO: { label: '자동 분류', icon: Sparkles, color: 'text-chapter-accent', bg: 'bg-chapter-accent/5' }
};

export default function FoodScanner({ 
    onStart, 
    autoStart = false 
}: { 
    onStart?: (data?: AnalysisResult) => void;
    autoStart?: boolean;
} = {}) {
    const { data: session } = useSession();
    const router = useRouter();
    const [status, setStatus] = useState<'idle' | 'webcam' | 'analyzing' | 'result'>('idle');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);
    const [showUpsell, setShowUpsell] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
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

    const stopWebcam = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraReady(false);
    }, [stream]);

    const startWebcam = async () => {
        setIsCameraReady(false);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // 자동 카메라 구동 트리거
    useEffect(() => {
        if (autoStart && status === 'idle') {
            const timer = setTimeout(() => {
                startWebcam();
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [autoStart, status]);

    useEffect(() => {
        if (status === 'webcam' && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [status, stream]);

    const captureImage = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/webp', 0.8);
            setCapturedImage(dataUrl);
            stopWebcam();
            analyzeImage(dataUrl);
        }
    };

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

    const analyzeImage = async (imageData: string) => {
        setStatus('analyzing');
        setLoading(true);
        try {
            const compressedData = await compressImage(imageData);
            setCapturedImage(compressedData);
            
            const response = await fetch('/api/ai/life-snap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    image: compressedData,
                    snapType: 'AUTO',
                    journey: 'WELLNESS' 
                }),
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            
            if (data.isMismatch) {
                toast.error(data.mismatchReason || "분석 대상이 아닙니다.");
                setStatus('idle');
                return;
            }

            setResult(data);
            setStatus('result');
            
            // Auto save for members
            if (session?.user?.email) {
                autoSaveResult(data, compressedData);
            }
        } catch (err: any) {
            toast.error(err.message || "분석 중 오류가 발생했습니다.");
            setStatus('idle');
        } finally {
            setLoading(false);
        }
    };

    const autoSaveResult = async (analysisResult: AnalysisResult, imageData: string) => {
        try {
            await fetch('/api/scan/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: analysisResult.type,
                    imageData: imageData,
                    score: analysisResult.matchScore,
                    summary: analysisResult.summary,
                    metrics: {
                        ...analysisResult.analysisTable,
                        futureDirection: analysisResult.futureDirection
                    }
                })
            });
            setHasSaved(true);
        } catch (err) {
            console.error("Auto-save failed:", err);
        }
    };

    const handleSaveToTimeline = async () => {
        if (!session) {
            toast.error("로그인이 필요한 기능입니다.");
            return;
        }
        if (hasSaved) {
            toast.info("이미 타임라인에 기록되었습니다.");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch('/api/scan/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: result?.type,
                    imageData: capturedImage,
                    score: result?.matchScore,
                    summary: result?.summary,
                    metrics: {
                        ...result?.analysisTable,
                        futureDirection: result?.futureDirection
                    }
                })
            });

            if (!response.ok) throw new Error('저장에 실패했습니다.');
            
            toast.success('스캔 타임라인에 기록되었습니다.');
            setHasSaved(true);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const resetAnalysis = () => {
        stopWebcam();
        setCapturedImage(null);
        setResult(null);
        setHasSaved(false);
        setStatus('idle');
    };

    const categoryInfo = result ? CATEGORY_MAP[result.type as keyof typeof CATEGORY_MAP] || CATEGORY_MAP.OTHER : CATEGORY_MAP.AUTO;
    const CategoryIcon = categoryInfo.icon;

    return (
        <div className="w-full max-w-lg mx-auto">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        try {
                            const compressedData = await compressFileDirectly(file);
                            setCapturedImage(compressedData);
                            analyzeImage(compressedData);
                        } catch (err) {
                            console.error("Direct image compression failed, fallback to FileReader:", err);
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                const base64 = event.target?.result as string;
                                setCapturedImage(base64);
                                analyzeImage(base64);
                            };
                            reader.readAsDataURL(file);
                        }
                    }
                }} 
                accept="image/*" 
                className="hidden" 
                {...({ capture: 'environment' } as any)}
            />

            <AnimatePresence mode="wait">
                {status === 'idle' && (
                    <motion.div 
                        key="idle"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => startWebcam()}
                        className="relative aspect-[4/3] rounded-[40px] overflow-hidden bg-obsidian group cursor-pointer border-4 border-white/5 shadow-2xl"
                    >
                        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&q=80')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-obsidian/80" />
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-4">
                            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/10 group-hover:scale-110 transition-all duration-500">
                                <Camera className="w-8 h-8 text-white/50" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-black text-white tracking-tight uppercase italic text-xl">Ready to Scan</h3>
                                <p className="text-white/60 text-xs font-bold leading-relaxed break-keep px-4">
                                    클릭하여 카메라로 음식을 촬영하거나 사진을 선택하세요.<br />
                                    제미나이 gleemile 엔진이 영양과 칼로리를 정밀 분석합니다.
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {Object.values(CATEGORY_MAP).slice(0, 5).map((cat, idx) => (
                                    <Badge key={idx} variant="outline" className="border-white/10 text-white/50 font-black text-[8px] uppercase tracking-widest bg-white/5">{cat.label}</Badge>
                                ))}
                            </div>
                        </div>
                        <Sparkles className="absolute top-8 right-8 w-6 h-6 text-chapter-accent animate-pulse" />
                    </motion.div>
                )}

                {status === 'webcam' && (
                    <motion.div key="webcam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative aspect-[4/3] rounded-[40px] overflow-hidden bg-black border-4 border-white/10 shadow-2xl">
                        {!isCameraReady && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-obsidian z-20">
                                <Loader2 className="w-12 h-12 text-chapter-accent animate-spin mb-4" />
                                <p className="text-white/40 font-black tracking-widest uppercase text-[10px]">Initializing Vision...</p>
                            </div>
                        )}
                        <video ref={videoRef} autoPlay playsInline muted onLoadedMetadata={() => setIsCameraReady(true)} className="w-full h-full object-cover" />
                        {isCameraReady && (
                            <div className="absolute bottom-10 left-0 right-0 z-30 flex justify-center gap-6">
                                <button 
                                    onClick={captureImage} 
                                    title="사진 촬영"
                                    aria-label="사진 촬영"
                                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-chapter-accent hover:scale-110 active:scale-95 transition-all"
                                >
                                    <div className="w-14 h-14 bg-chapter-accent rounded-full flex items-center justify-center text-white">
                                        <Camera className="w-6 h-6" />
                                    </div>
                                </button>
                                <button 
                                    onClick={resetAnalysis} 
                                    title="취소"
                                    aria-label="취소"
                                    className="w-20 h-20 bg-obsidian/80 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-obsidian transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {status === 'analyzing' && (
                    <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative aspect-[4/3] rounded-[40px] bg-obsidian flex flex-col items-center justify-center text-mist overflow-hidden border-4 border-white/10">
                        {capturedImage && <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={capturedImage} alt="Scanning" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
                        <div className="relative z-10 flex flex-col items-center gap-6">
                            <div className="w-16 h-16 border-4 border-chapter-accent border-t-transparent rounded-full animate-spin" />
                            <div className="text-center">
                                <h3 className="font-black italic uppercase tracking-widest text-white text-xl">Analyzing...</h3>
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">Classifying recovery data</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {status === 'result' && result && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <Card className="rounded-[40px] border-none shadow-2xl overflow-hidden bg-white">
                            <div className="relative h-64 overflow-hidden">
                                {capturedImage && <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={capturedImage} alt="Captured" className="w-full h-full object-cover" />}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between text-white">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className={`${categoryInfo.bg} ${categoryInfo.color} border-none font-black italic text-[10px] px-3`}>
                                                <CategoryIcon className="w-3 h-3 mr-1" /> {categoryInfo.label}
                                            </Badge>
                                        </div>
                                        <h4 className="text-2xl font-black italic uppercase tracking-tighter">{result.subjectName}</h4>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-black uppercase tracking-widest block mb-1 opacity-60">MATCH</span>
                                        <span className="text-3xl font-black italic text-chapter-accent">{result.matchScore}<span className="text-sm opacity-40">%</span></span>
                                    </div>
                                </div>
                                <button 
                                    onClick={resetAnalysis} 
                                    title="결과 닫기"
                                    aria-label="결과 닫기"
                                    className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white/60 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate/60">
                                        <Brain className="w-4 h-4 text-reward-gold" /> Vision Insight
                                    </div>
                                    <p className="font-black leading-tight text-obsidian bg-mist/30 p-6 rounded-[32px] border border-line/30 italic text-xl">
                                        "{result.summary}"
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate/60">
                                        <Activity className="w-4 h-4 text-chapter-accent" /> Recovery Analysis
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {result.analysisTable?.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-5 rounded-[24px] bg-white border border-line/50 hover:border-chapter-accent/20 transition-colors">
                                                <div>
                                                    <span className="text-[10px] font-black text-slate/40 uppercase tracking-widest block mb-1">{item.label}</span>
                                                    <p className="text-sm font-bold text-obsidian leading-snug">{item.benefit}</p>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <span className="text-sm font-black italic text-chapter-accent">{item.value}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 rounded-[32px] bg-obsidian text-white space-y-3 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-chapter-accent/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 relative z-10">
                                        <Sparkles className="w-4 h-4 text-chapter-accent" /> Next Step
                                    </div>
                                    <p className="text-sm font-bold leading-relaxed relative z-10 italic">
                                        {result.futureDirection}
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-line space-y-4">
                                    {!hasSaved ? (
                                        <Button 
                                            onClick={handleSaveToTimeline}
                                            disabled={isSaving}
                                            className="w-full h-16 rounded-[24px] bg-chapter-accent text-white font-black italic uppercase tracking-[0.2em] shadow-xl shadow-chapter-accent/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                        >
                                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                            Save to Timeline
                                        </Button>
                                    ) : (
                                        <div className="w-full h-16 rounded-[24px] bg-status-normal/10 border-2 border-status-normal/20 text-status-normal flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest">
                                            <Check className="w-5 h-5" /> Recorded Successfully
                                        </div>
                                    )}
                                    
                                    <Button 
                                        onClick={() => onStart ? onStart(result) : router.push('/diagnosis')}
                                        variant="outline"
                                        className="w-full h-14 rounded-2xl border-2 border-line bg-white hover:bg-mist text-obsidian font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    >
                                        Start Deep Diagnosis <ArrowRight className="w-4 h-4" />
                                    </Button>

                                    <Button variant="ghost" onClick={resetAnalysis} className="w-full h-12 text-slate/40 font-bold hover:bg-mist transition-all text-xs">
                                        Scan Another Moment <RefreshCcw className="ml-2 w-3 h-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
