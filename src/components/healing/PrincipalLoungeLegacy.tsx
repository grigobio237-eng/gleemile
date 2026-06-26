'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    BadgeCheck,
    Quote,
    MessageCircle
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface PrincipalLoungeLegacyProps {
    data: {
        name: string;
        role: string;
        bio: string;
        image: string;
        history: string[];
        philosophy: {
            emoji: string;
            title: string;
            desc: string;
        }[];
        faqs: {
            q: string;
            a: string;
        }[];
    };
}

export default function PrincipalLoungeLegacy({ data }: PrincipalLoungeLegacyProps) {
    return (
        <div className="w-full bg-white space-y-16 md:space-y-40 py-16 md:py-40 overflow-x-hidden">
            {/* 0. Advisor Profile Section */}
            <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center border-b border-[#0B0D10]/5 pb-16 md:pb-32">
                <div className="space-y-6 md:space-y-10 order-2 md:order-1">
                    <div className="space-y-4 md:space-y-6">
                        <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] block">Research Director & Program Developer</span>
                        <h2 className="font-black text-[#0B0D10] tracking-tighter text-3xl md:text-5xl leading-tight">
                            박상회 의학박사 <span className="text-lg md:text-xl font-bold text-[#0B0D10]/50 not-italic block md:inline md:ml-3">Dr. Park Sang-Hwoi</span>
                        </h2>
                        <h3 className="font-black text-[#0B0D10] tracking-tighter leading-tight italic text-xl md:text-2xl opacity-90">
                            "인간의 마음과 신체가 조화롭게 회복될 때, 비로소 완전한 삶의 웰니스가 완성됩니다."
                        </h3>
                    </div>

                    <div className="space-y-6 md:space-y-8">
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-[#0B0D10]/30 uppercase tracking-[0.4em]">Profile & Background</p>
                            <p className="text-sm md:text-base font-semibold text-[#0B0D10]/70 leading-relaxed break-keep">
                                도쿄대학교 의학박사 출신이자 인정건강심리카운셀러로 뇌과학과 심리 케어 분야의 최고 권위자입니다. <br />
                                gleemile 힐링 라운지의 연구소장으로서 청소년 및 현대인들의 정신 건강 증진과 회복 메커니즘을 연구하고 설계하여, 통합 웰니스 프로그램 개발 자문을 담당하고 있습니다.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-[#0B0D10]/30 uppercase tracking-[0.4em]">Career & History</p>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-bold text-[#0B0D10]/80">
                                <li className="flex items-start gap-2">
                                    <BadgeCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                                    <span>도쿄대학 의학박사 (Dr.M.Sc)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <BadgeCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                                    <span>인정건강심리카운셀러 (Q.H.Psychologist)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <BadgeCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                                    <span>도쿄대학 의학부 객원연구원</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <BadgeCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                                    <span>후생노동성 국립정신보건연구소 심신의학연구실 비상근연구원</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <BadgeCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                                    <span>서울특별시보건협회 회장</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <BadgeCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                                    <span>(사)청소년희망본부 대표</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <BadgeCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                                    <span>전 숭실대학교 문화치유전공 겸임교수</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <BadgeCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                                    <span>대한임상건강의학회 학술이사</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <BadgeCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                                    <span>대한임상암예방학회 상임이사</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <BadgeCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                                    <span>KBS &lt;여유만만&gt; (박수홍과 함께) 출연 등 다수</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="relative w-5/6 sm:w-2/3 mx-auto md:w-full aspect-[4/5] rounded-[24px] md:rounded-[60px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.12)] group order-1 md:order-2">
                    <Image
                        src="/images/park-sanghoe-profile.png"
                        alt="박상회 박사"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10]/60 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 md:right-12 text-white space-y-1 md:space-y-2">
                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">Research Director</p>
                        <h2 className="font-black tracking-tighter italic text-xl md:text-4xl">박상회 의학박사</h2>
                    </div>
                </div>
            </section>

            {/* 1. Principal Profile Section */}
            <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
                <div className="relative w-5/6 sm:w-2/3 mx-auto md:w-full aspect-[4/5] rounded-[24px] md:rounded-[60px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.12)] group">
                    <Image
                        src={data.image}
                        alt={data.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10]/60 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 md:right-12 text-white space-y-1 md:space-y-2">
                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">Representative Director</p>
                        <h2 className="font-black tracking-tighter italic text-xl md:text-4xl">김미정 원장</h2>
                    </div>
                </div>

                <div className="space-y-6 md:space-y-10">
                    <div className="space-y-4 md:space-y-6">
                        <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] block">Representative Director & Master Architect</span>
                        <h2 className="font-black text-[#0B0D10] tracking-tighter text-3xl md:text-5xl leading-tight">
                            김미정 원장 <span className="text-lg md:text-xl font-bold text-[#0B0D10]/50 not-italic block md:inline md:ml-3">Director Kim Mi-jung</span>
                        </h2>
                        <h3 className="font-black text-[#0B0D10] tracking-tighter leading-tight italic text-xl md:text-2xl opacity-90">
                            "회복 설계는 기적이 아닙니다. 회복된 몸 위에 놓일 때 비로소 완성되는 도구일 뿐입니다."
                        </h3>
                    </div>

                    <div className="space-y-6 md:space-y-8">
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-[#0B0D10]/30 uppercase tracking-[0.4em]">Profile & Background</p>
                            <p className="text-sm md:text-base font-semibold text-[#0B0D10]/70 leading-relaxed break-keep">
                                정밀 의학과 데이터 분석을 기반으로, 무너진 생체 리듬을 재구축하는 최고의 전문가입니다. <br />
                                임상에서의 풍부한 한방·양방 통합 진료 경험을 바탕으로 개인별 유전체 및 라이프 데이터를 분석하여, gleemile의 개인 맞춤형 회복 프로토콜 설계를 주도하고 있습니다.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-[#0B0D10]/30 uppercase tracking-[0.4em]">Career & History</p>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-bold text-[#0B0D10]/80">
                                {data.history.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <BadgeCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Philosophy Section */}
            <section className="bg-[#F9F7F2] py-16 md:py-40">
                <div className="max-w-7xl mx-auto px-6 space-y-10 md:space-y-20">
                    <div className="text-center space-y-4">
                        <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.5em] block">Core Philosophy</span>
                        <h2 className="font-black text-[#0B0D10] italic tracking-tighter text-3xl md:text-4xl">
                            Why <span className="text-[#D4AF37] tracking-normal">Recovery</span> First?
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {data.philosophy.map((card, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="bg-white p-6 sm:p-10 md:p-12 rounded-[28px] md:rounded-[48px] shadow-[0_30px_80px_rgba(0,0,0,0.02)] border border-[#0B0D10]/5 space-y-6 md:space-y-8"
                            >
                                <div className="text-4xl md:text-4xl">{card.emoji}</div>
                                <div className="space-y-3 md:space-y-4">
                                    <h3 className="text-lg sm:text-2xl font-black text-[#0B0D10] tracking-tight leading-tight italic">{card.title}</h3>
                                    <p className="text-xs sm:text-sm font-medium text-[#0B0D10]/50 leading-relaxed word-keep-all">{card.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. FAQ Section */}
            <section className="max-w-4xl mx-auto px-6 space-y-10 md:space-y-20">
                <div className="text-center space-y-4">
                    <span className="text-[10px] font-black text-[#0B0D10]/20 uppercase tracking-[0.5em] block">Resources</span>
                    <h2 className="font-black text-[#0B0D10] italic tracking-tighter text-3xl md:text-4xl">자주 묻는 질문 (FAQ)</h2>
                </div>
                <Accordion type="single" collapsible className="w-full space-y-3 md:space-y-4">
                    {data.faqs.map((faq, i) => (
                        <AccordionItem key={i} value={`item-${i}`} className="border-none bg-[#F9F7F2]/50 rounded-[20px] md:rounded-[32px] overflow-hidden px-5 sm:px-10 transition-all hover:bg-[#F9F7F2]">
                            <AccordionTrigger className="text-base sm:text-xl font-black text-[#0B0D10] hover:no-underline py-5 md:py-8 text-left">
                                {faq.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-[#0B0D10]/50 font-medium leading-relaxed pb-6 md:pb-10 text-sm sm:text-lg">
                                {faq.a}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </section>

            {/* 4. Chat CTA Section */}
            <section className="max-w-4xl mx-auto px-6 text-center space-y-8 md:space-y-12">
                <div className="space-y-4 md:space-y-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-[#F9F7F2] rounded-full flex items-center justify-center mx-auto">
                        <MessageCircle className="w-8 h-8 md:w-10 md:h-10 text-[#D4AF37]" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-black text-[#0B0D10] tracking-tighter italic text-2xl md:text-4xl">Still have questions?</h3>
                        <p className="text-sm sm:text-lg text-[#0B0D10]/40 font-bold">원장 김미정 혹은 gleemile 어시스턴트와 1:1로 직접 대화하세요.</p>
                    </div>
                </div>

                <Button className="h-auto py-4 md:py-0 md:h-24 px-6 sm:px-16 bg-[#0B0D10] text-white rounded-[20px] md:rounded-full font-black text-sm sm:text-base md:text-xl uppercase tracking-widest shadow-[0_30px_60px_rgba(0,0,0,0.15)] hover:scale-105 transition-all gap-2 md:gap-4 flex flex-col md:flex-row items-center justify-center w-full md:w-auto mx-auto">
                    <span className="text-[#D4AF37] opacity-60 text-[9px] md:text-xs tracking-[0.2em] md:mt-1">1:1 Consultation</span>
                    <span>프라이빗 라운지 입장하기</span>
                </Button>
            </section>
        </div>
    );
}
