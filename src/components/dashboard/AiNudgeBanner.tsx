'use client';

import React from 'react';
import { ShieldAlert, Utensils, BrainCircuit, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export type NudgeType = 'INJURY_RISK' | 'MEAL_PLAN' | 'MENTAL_CARE';

export interface AiNudge {
  id: string;
  type: NudgeType;
  title: string;
  message: string;
}

interface AiNudgeBannerProps {
  nudge: AiNudge;
  onDismiss?: (id: string) => void;
}

export default function AiNudgeBanner({ nudge, onDismiss }: AiNudgeBannerProps) {
  // 넛지 타입에 따른 아이콘 및 색상 매핑
  const config = {
    INJURY_RISK: {
      icon: ShieldAlert,
      styles: 'bg-rose-50 border-rose-200 text-rose-800',
      iconColor: 'text-rose-500'
    },
    MEAL_PLAN: {
      icon: Utensils,
      styles: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      iconColor: 'text-secondary'
    },
    MENTAL_CARE: {
      icon: BrainCircuit,
      styles: 'bg-indigo-50 border-secondary/30 text-indigo-800',
      iconColor: 'text-secondary'
    }
  };

  const currentConfig = config[nudge.type];
  const Icon = currentConfig.icon;

  return (
    <Alert className={`mb-6 flex items-start justify-between rounded-2xl border shadow-sm ${currentConfig.styles}`}>
      <div className="flex gap-4">
        <Icon className={`h-5 w-5 mt-0.5 ${currentConfig.iconColor}`} />
        <div className="flex flex-col gap-1">
          <AlertTitle className="font-bold text-sm tracking-tight m-0">{nudge.title}</AlertTitle>
          <AlertDescription className="text-xs font-medium opacity-90 leading-relaxed">
            {nudge.message}
          </AlertDescription>
        </div>
      </div>
      {onDismiss && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 -mt-1 -mr-1 hover:bg-black/5 rounded-full shrink-0" 
          onClick={() => onDismiss(nudge.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
}
