'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Crown, MousePointer2, Sparkles, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import CharacterImage from '@/components/ui/CharacterImage';

const passItems = [
  {
    id: 'basic',
    name: 'RESET',
    description: '가장 기초적인 나를 발견하는 시작',
    price: '0원',
    period: '무료체험',
    theme: 'border-line bg-white',
    accent: 'text-slate',
    benefitText: '기본 리포트 체험',
    icon: <MousePointer2 className="w-5 h-5 md:w-6 md:h-6" />,
    link: '/basic-plan',
    buttonTheme: 'bg-obsidian text-mist hover:bg-obsidian/90'
  },
  {
    id: 'founder',
    name: 'REBORN',
    description: '과거의 내가 미래의 나를 돕는 데이터 OS',
    price: '9,900원',
    period: '월',
    theme: 'border-[#B19B81]/20 bg-[#FAF7F2]',
    accent: 'text-[#B19B81]',
    benefitText: '주간 AI 리포트',
    icon: <Star className="w-5 h-5 md:w-6 md:h-6" />,
    link: '/founder-ticket',
    buttonTheme: 'bg-[#B19B81] text-white hover:bg-[#8f7d68]'
  },
  {
    id: 'premium',
    name: 'RESTART',
    description: '나만의 정답을 찾아주는 프리미엄 OS',
    price: '29,800원',
    period: '월',
    theme: 'border-primary/20 bg-primary/5',
    accent: 'text-primary',
    benefitText: '전문가 큐레이션',
    icon: <Crown className="w-5 h-5 md:w-6 md:h-6" />,
    link: '/premium-plan',
    buttonTheme: 'bg-primary text-white hover:bg-primary/90'
  },
  {
    id: 'stem-cell-prf',
    name: '줄기세포(PRF)',
    description: 'gleemile 프리미엄 줄기세포 테라피',
    price: '별도문의',
    period: '1회',
    theme: 'border-emerald-200 bg-emerald-50/50',
    accent: 'text-emerald-600',
    benefitText: '맞춤형 줄기세포',
    icon: <Sparkles className="w-5 h-5 md:w-6 md:h-6" />,
    link: '/stem-cell-prf',
    buttonTheme: 'bg-emerald-600 text-white hover:bg-emerald-700'
  }
];

export default function PassCatalog() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-black text-obsidian mb-4">상품 프리젠테이션</h2>
        <p className="text-slate/60 font-medium leading-relaxed">
          고객에게 최적의 상품과 회복 경로를 제안하세요. 
          상세 스펙 페이지를 통해 고객과 함께 구체적인 혜택을 확인하실 수 있습니다.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="w-full grid grid-cols-2 gap-3 md:gap-6">
        {passItems.map((pass, idx) => (
          <motion.div
            key={pass.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className={`h-full relative overflow-hidden flex flex-col rounded-[32px] border transition-all duration-300 hover:shadow-xl ${pass.theme}`}>
              <CardContent className="p-4 md:p-8 flex-1 flex flex-col">
                <div className="mb-4 md:mb-6">
                  <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-6 shadow-sm bg-white ${pass.accent}`}>
                    {pass.icon}
                  </div>
                  <h3 className="text-lg md:text-2xl font-black tracking-tighter mb-1 md:mb-2">{pass.name}</h3>
                  <p className={`text-xs md:text-sm font-bold opacity-70 mb-4 md:mb-8 min-h-[32px] md:min-h-[40px] leading-snug break-keep`}>{pass.description}</p>
                </div>

                <div className="space-y-3 md:space-y-4 mb-4 md:mb-8">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`w-5 h-5 md:w-7 md:h-7 rounded-md md:rounded-lg bg-white overflow-hidden relative shrink-0 shadow-sm`}>
                      <CharacterImage 
                        src="/character/youniqle-1.png" 
                        alt="Y" 
                        fill 
                        className="object-contain p-0.5 md:p-1"
                      />
                    </div>
                    <span className="text-xs md:text-sm font-bold truncate">{pass.benefitText}</span>
                  </div>
                  <div className="flex items-baseline gap-1 md:gap-2">
                    <span className="text-xl md:text-3xl font-black">{pass.price}</span>
                    <span className="text-[10px] md:text-sm font-bold opacity-60">/ {pass.period}</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 md:pt-6 border-t border-current/10">
                  <Button 
                    asChild
                    className={`w-full h-10 md:h-14 rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-all shadow-lg ${pass.buttonTheme} px-0`}
                  >
                    <Link href={pass.link} className="flex items-center justify-center">
                      상세 보기 <ArrowRight className="ml-1 w-3 h-3 md:ml-2 md:w-4 md:h-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        </div>
      </div>

      {/* Guide Banner */}
      <div className="bg-primary/5 border border-line rounded-[32px] p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm flex-shrink-0">
          <Star className="w-8 h-8" />
        </div>
        <div className="space-y-1 text-center md:text-left">
          <h4 className="font-black text-obsidian">고객 맞춤형 제안 툴</h4>
          <p className="text-sm text-slate font-medium opacity-60">
            고객과 함께 상세 스펙을 보며 로드맵을 설계하세요. 
            원하는 상품을 클릭하면 고객용 상세 페이지로 이동합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
