
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Clock, Loader2 } from 'lucide-react';


interface GoldenTimeOfferProps {
    script: string;
    userName?: string;
    gender?: string;
    mood?: string;
}

export function GoldenTimeOffer({ script, userName = '회원', gender, mood }: GoldenTimeOfferProps) {

    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Timer Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // TTS Logic
    const handlePlay = async () => {
        if (isPlaying) {
            audioRef.current?.pause();
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
            setIsPlaying(false);
            return;
        }

        if (audioUrl) {
            audioRef.current?.play();
            setIsPlaying(true);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: script,
                    gender,
                    mood
                }),
            });


            if (!response.ok) {
                throw new Error('TTS Failed');
            }

            const data = await response.json();
            const url = `data:audio/mp3;base64,${data.audioContent}`;
            setAudioUrl(url);

            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.play();
                setIsPlaying(true);
            }

        } catch (error) {
            console.warn('Server TTS failed, falling back to browser TTS:', error);
            // Fallback to Browser Speech API
            const utterance = new SpeechSynthesisUtterance(script);
            utterance.lang = 'ko-KR';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;

            utterance.onend = () => setIsPlaying(false);
            utterance.onerror = () => setIsPlaying(false);

            window.speechSynthesis.speak(utterance);
            setIsPlaying(true);

            // Note: Browser TTS doesn't provide audio data for visualization or audioRef, 
            // so visualizer might need dummy animation or be disabled.
            // For now, we keep isPlaying=true so visualizer runs.
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnded = () => setIsPlaying(false);

    return (
        <div className="w-full max-w-4xl mx-auto mb-16 relative perspective-1000">
            {/* Audio Element */}
            <audio ref={audioRef} onEnded={handleEnded} className="hidden" />

            <motion.div
                initial={{ rotateX: 90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ duration: 0.8, type: 'spring' }}
                className="relative bg-gradient-to-br from-gray-900 to-obsidian rounded-[32px] overflow-hidden shadow-2xl border border-white/10"
            >
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px]" />

                {/* Timer Banner */}
                <div className="bg-primary/20 backdrop-blur-md px-6 py-3 flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-2 text-primary font-bold animate-pulse">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-widest">Golden Time Offer</span>
                    </div>
                    <div className="font-mono text-primary font-black text-lg tabular-nums">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="p-8 md:p-10 flex flex-col md:flex-row gap-10 items-center relative z-10">
                    {/* Left: Content */}
                    <div className="flex-1 text-center md:text-left space-y-6">
                        <div>
                            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-black text-white mb-4 border border-white/20 shadow-lg backdrop-blur-sm">
                                LIMITED GIFT
                            </span>
                            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3 drop-shadow-md">
                                {userName}님만을 위한<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-emerald-200 premium-text">
                                    프리미엄 힐링 오디오 가이드
                                </span>
                                <style jsx>{`
                                    .premium-text {
                                        text-shadow: 0 0 20px rgba(255,255,255,0.3);
                                    }
                                `}</style>
                            </h2>
                            <p className="text-slate-200 text-sm leading-relaxed font-medium">
                                {script === "YOUNIQLE_LOADING"
                                    ? "리듬체크 결과를 바탕으로 gleemile 원장님이 당신만을 위한 힐링 가이드를 작성하고 있습니다. 잠시만 기다려주세요..."
                                    : "리듬체크 결과, 지금 가장 필요한 위로와 가이드를 gleemile이 직접 설계했습니다. 이 창을 닫으면 다시 들을 수 없습니다. 지금 바로 청취하세요."}
                            </p>
                        </div>

                        {/* Audio Visualizer (CSS Animation Simulation) */}
                        {isPlaying && (
                            <div className="flex items-center justify-center md:justify-start gap-1 h-8">
                                {[...Array(20)].map((_, i) => (
                                    <React.Fragment key={i}>
                                        <div
                                            className={`w-1.5 bg-emerald-400 rounded-full animate-music-bar shadow-[0_0_10px_theme(colors.emerald.400)] music-bar-${i}`}
                                        />
                                        <style jsx>{`
                                            .music-bar-${i} {
                                                height: ${Math.random() * 100}%;
                                                animation-delay: ${i * 0.05}s;
                                                animation-duration: 0.8s;
                                            }
                                        `}</style>
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Player Button */}
                    <div className="relative shrink-0">
                        {/* Glow Effect */}
                        <div className={`absolute inset-0 bg-secondary/50 blur-3xl rounded-full transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-40'}`} />

                        <button
                            onClick={handlePlay}
                            disabled={isLoading || script === "YOUNIQLE_LOADING"}
                            className={`relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-white border-4 border-emerald-500/30 flex items-center justify-center group hover:scale-105 transition-all active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] z-20 ${script === "YOUNIQLE_LOADING" ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isLoading || script === "YOUNIQLE_LOADING" ? (
                                <Loader2 className="w-12 h-12 text-secondary animate-spin" />
                            ) : isPlaying ? (
                                <Pause className="w-12 h-12 text-secondary fill-current" />
                            ) : (
                                <Play className="w-12 h-12 text-secondary fill-current ml-2 group-hover:scale-110 transition-transform" />
                            )}
                        </button>

                        {!isPlaying && !isLoading && (
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
                                <span className="text-sm font-black text-white drop-shadow-lg animate-bounce block bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                                    {script === "YOUNIQLE_LOADING" ? "Preparing..." : "Click to Listen"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>


        </div>
    );
}
