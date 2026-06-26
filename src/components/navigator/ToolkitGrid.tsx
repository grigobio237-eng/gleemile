'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wind, 
  Moon, 
  Activity, 
  Brain, 
  CheckSquare, 
  Calendar,
  Thermometer,
  Zap
} from 'lucide-react';
import Link from 'next/link';

const TOOLS = [
  { 
    id: 'sleep', 
    name: '수면 분석', 
    desc: '어제 나의 잠은 어땠을까?', 
    icon: <Moon className="w-6 h-6" />, 
    color: 'bg-indigo-50 text-secondary',
    link: '/utils?tool=sleep'
  },
  { 
    id: 'breathing', 
    name: '회복 호흡', 
    desc: '3분간의 깊은 이완', 
    icon: <Wind className="w-6 h-6" />, 
    color: 'bg-sky-50 text-sky-600',
    link: '/utils/breathing'
  },
  { 
    id: 'mbti', 
    name: '기질 확인', 
    desc: '나는 어떤 유형의 사람인가?', 
    icon: <Brain className="w-6 h-6" />, 
    color: 'bg-purple-50 text-secondary',
    link: '/utils/mbti'
  },
  { 
    id: 'bmi', 
    name: '신체 밸런스', 
    desc: 'BMI 기반 신체 체크', 
    icon: <Activity className="w-6 h-6" />, 
    color: 'bg-emerald-50 text-secondary',
    link: '/utils/bmi'
  },
  { 
    id: 'todo', 
    name: '투두 리스트', 
    desc: '놓치지 말아야 할 회복 액션', 
    icon: <CheckSquare className="w-6 h-6" />, 
    color: 'bg-amber-50 text-primary',
    link: '/utils/todo'
  },
  { 
    id: 'weather', 
    name: '기상 예보', 
    desc: '환경에 맞춘 리듬 설계', 
    icon: <Thermometer className="w-6 h-6" />, 
    color: 'bg-orange-50 text-orange-600',
    link: '/utils/weather'
  },
];

export default function ToolkitGrid() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {TOOLS.map((tool, index) => (
        <motion.div
          key={tool.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Link href={tool.link}>
            <div className="h-full p-5 bg-white border border-line rounded-3xl shadow-sm hover:shadow-md transition-all group active:scale-95">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${tool.color}`}>
                {tool.icon}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-obsidian tracking-tight">{tool.name}</h4>
                <p className="text-[10px] font-medium text-foreground/70 leading-tight">
                  {tool.desc}
                </p>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
