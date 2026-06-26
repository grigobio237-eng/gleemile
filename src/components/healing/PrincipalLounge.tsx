'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, FlaskConical, ChevronRight, Activity, Sparkles, User, Info } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PrincipalLoungeProps {
    data: {
        name: string;
        role: string;
        bio: string;
        image: string;
        specs: {
            totalSlots: string;
            occupiedSlots: string;
            welcomeMessage: string;
            introTitle: string;
        };
    };
}

export default function PrincipalLounge({ data }: PrincipalLoungeProps) {
    return (
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-6 md:p-20 bg-[#F9F7F2] min-h-screen overflow-y-auto">
            {/* Left Section: Principal Card */}
            <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative w-full max-w-[500px] aspect-[4/5] rounded-[60px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.1)] group mb-12 md:mb-0"
            >
                <Image 
                    src={data.image || '/images/kim-mijeong-profile.jpg'} 
                    alt={data.name} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                <div className="absolute bottom-12 left-12 right-12">
                    <div className="space-y-1">
                        <h2 className="text-white font-black italic tracking-tighter text-4xl">The Orchestrator</h2>
                        <p className="text-[#D4AF37] text-xs font-black uppercase tracking-[0.3em]">CUSTOM ARCHITECT</p>
                    </div>
                </div>

                <div className="absolute bottom-10 right-10">
                    <Badge className="bg-[#D4AF37] text-black border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                        PRINCIPAL
                    </Badge>
                </div>
            </motion.div>

            {/* Right Section: Lab Info */}
            <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="md:ml-24 max-w-[500px] flex flex-col items-start gap-10"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-[2px] bg-[#D4AF37]" />
                        <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em]">원장 전용 프라이빗 라운지</span>
                    </div>
                    <h1 className="font-black text-[#0B0D10] tracking-tighter leading-[0.9] text-xl">
                        Secret Recovery <br /> Lab
                    </h1>
                </div>

                <div className="space-y-6">
                    <p className="text-[#0B0D10] font-bold leading-relaxed text-xl">
                        당신만의 완벽한 회복 여정을 위한 모든 아이템을 조율합니다.
                    </p>
                    <p className="text-[#0B0D10]/40 text-sm leading-relaxed font-medium">
                        {data.bio}
                    </p>
                </div>

                {/* Slots Info */}
                <div className="w-full bg-white rounded-[32px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-[#0B0D10]/5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-[#0B0D10]/30 uppercase tracking-[0.3em] mb-2">이번 달 수용량</p>
                        <div className="flex items-baseline gap-1">
                            <span className="font-black text-[#0B0D10] text-4xl">{data.specs.occupiedSlots}</span>
                            <span className="font-black text-[#0B0D10]/20 text-xl">/ {data.specs.totalSlots}</span>
                        </div>
                    </div>
                    
                    <Badge className="bg-[#E6FFFA] text-[#047857] border-[#059669]/10 px-4 py-2 rounded-full text-[10px] font-black flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                        신규 신청 가능
                    </Badge>
                </div>

                <Button className="w-full h-20 bg-[#0B0D10] hover:bg-[#1A1D23] text-white rounded-[24px] flex items-center justify-center gap-4 group transition-all">
                    <span className="text-sm font-black uppercase tracking-widest">나의 맞춤 회복 플랜 확인하기</span>
                    <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
                </Button>

                <p className="text-[10px] font-black text-[#0B0D10]/30 uppercase tracking-[0.3em] text-center w-full">
                    * Personal Recovery Protocol & Custom Curation
                </p>
            </motion.div>
        </div>
    );
}
