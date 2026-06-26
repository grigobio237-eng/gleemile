'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Copy, CheckCircle2, X, Send, Sparkles, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  badge: string;
}

const TEMPLATES: MessageTemplate[] = [
  {
    id: 'M1',
    title: '일상 기력 & 피부 체크',
    badge: '추천 1',
    content: '요즘 피부, 붓기, 피로 때문에 예전 같지 않다고 느끼는 분들이 많아서 간단 체크를 만들었어요. 몇 개만 체크하면 지금 나한테 먼저 필요한 관리 방향을 볼 수 있어요. 부담 없이 해보세요.'
  },
  {
    id: 'M2',
    title: '집중 회복 & 컨디션 체크',
    badge: '추천 2',
    content: '자도 피곤하고 피부나 얼굴 컨디션이 빨리 무너진다고 느껴지면 이거 한 번 체크해보세요. 짧게 해보면 지금 먼저 손봐야 할 부분을 정리할 수 있어요. 원하시면 gleemile에서 이어서 맞춤 방향도 볼 수 있어요.'
  },
  {
    id: 'M3',
    title: '항노화 & 라인 체크',
    badge: '추천 3',
    content: '피부, 라인, 피로, 노화감 중 지금 내게 가장 먼저 필요한 관리 방향을 간단히 체크해볼 수 있게 만들었어요. 짧고 부담 없으니 한 번 해보세요.'
  }
];

interface Props {
  shopCode: string;
  shopName: string;
  onClose: () => void;
}

export default function MessageTemplateModal({ shopCode, shopName, onClose }: Props) {
  const copyToClipboard = (template: MessageTemplate | null) => {
    const surveyLink = `${window.location.origin}/survey/${shopCode}${template ? `?v=${template.id}` : ''}`;
    
    const fullMessage = template 
      ? `${template.content}\n\n[간단 체크 링크]\n${surveyLink}`
      : surveyLink;
    
    navigator.clipboard.writeText(fullMessage);
    toast.success(template 
      ? `${template.id}번 메시지가 복사되었습니다.` 
      : '기본 설문 링크가 복사되었습니다.');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-obsidian/40 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="relative bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-10 pb-6 flex justify-between items-start border-b border-mist">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <h3 className="text-3xl font-black text-obsidian tracking-tighter">메시지 템플릿</h3>
               <span className="text-sm font-bold text-chapter-accent bg-chapter-accent/10 px-3 py-1 rounded-full">{shopName}</span>
            </div>
            <p className="text-slate/60 font-medium">네비게이터 전용 추천 발송문입니다. 업소 및 고객 성향에 맞춰 선택하세요.</p>
          </div>
          <button 
            onClick={onClose}
            aria-label="닫기"
            className="w-10 h-10 bg-mist rounded-full flex items-center justify-center text-slate hover:text-obsidian transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Quick Link Copy Section */}
          <div className="p-6 bg-chapter-accent/5 border border-chapter-accent/20 rounded-[32px] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-chapter-accent shadow-sm">
                    <LinkIcon className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-black text-obsidian">기본 링크만 복사</h4>
                    <p className="text-xs text-slate/50 font-medium">안내 문구 없이 설문 주소만 복사합니다.</p>
                </div>
            </div>
            <Button 
                onClick={() => copyToClipboard(null)}
                className="w-full sm:w-auto h-12 px-6 bg-chapter-accent text-white rounded-xl font-bold shadow-md shadow-chapter-accent/20 hover:bg-chapter-accent/90"
            >
                링크만 복사
            </Button>
          </div>

          <div className="pt-4 pb-2">
            <h4 className="text-xs font-black text-slate/30 uppercase tracking-[0.2em] px-2">준비된 마케팅 메시지</h4>
          </div>

          {TEMPLATES.map((template) => (
            <Card key={template.id} template={template} onCopy={() => copyToClipboard(template)} />
          ))}
        </div>

        {/* Footer info */}
        <div className="p-8 bg-mist/50 flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-chapter-accent">
                <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-[11px] text-slate/50 font-medium leading-relaxed">
                각 템플릿에는 **{shopName} 전용 링크**와 추적 파라미터가 자동으로 포함됩니다.<br />
                복사 후 카카오톡 대화방에 붙여넣기만 하시면 영업 실적이 네비게이터님께 바로 귀속됩니다.
            </p>
        </div>
      </motion.div>
    </div>
  );
}

function Card({ template, onCopy }: { template: MessageTemplate; onCopy: () => void }) {
  return (
    <div className="group relative bg-mist/30 border border-line rounded-[32px] p-8 hover:bg-white hover:shadow-xl hover:border-chapter-accent/30 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-white bg-obsidian px-3 py-1 rounded-full uppercase tracking-widest">{template.badge}</span>
            <h4 className="font-black text-obsidian text-lg">{template.title}</h4>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate/40 tracking-widest uppercase">ID: {template.id}</span>
        </div>
      </div>
      
      <p className="text-slate/70 text-sm leading-relaxed mb-8 break-keep">
        {template.content}
        <br />
        <span className="text-chapter-accent font-bold mt-2 inline-block">[간단 체크 링크]</span>
      </p>

      <Button 
        onClick={onCopy}
        className="w-full h-14 bg-white border border-line text-obsidian hover:bg-obsidian hover:text-white hover:border-obsidian rounded-2xl font-black transition-all flex items-center justify-center gap-2"
      >
        <Copy className="w-4 h-4" /> 메시지 전문 복사하기
      </Button>
    </div>
  );
}
