'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  User as UserIcon,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

export default function NavigatorConsultationCenter() {
  const { data: session } = useSession();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'answered'>('all');

  const isNavigator = (session?.user as any)?.isNavigator;

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const mode = isNavigator ? 'navigator' : 'user';
      const res = await fetch(`/api/consultation/navigator?mode=${mode}`);
      if (res.ok) {
        const data = await res.json();
        setConsultations(data.consultations || []);
      }
    } catch (error) {
      console.error('Failed to fetch consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchConsultations();
    }
  }, [session, isNavigator]);

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/consultation/navigator', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action: 'answer',
          answer: replyText
        }),
      });

      if (res.ok) {
        setReplyText('');
        fetchConsultations();
        setExpandedId(null);
      } else {
        alert('답변 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Reply error:', error);
      alert('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredConsultations = consultations.filter(c => {
    if (activeFilter === 'all') return true;
    return c.status === activeFilter;
  });

  if (loading && consultations.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        <p className="text-sm font-bold text-slate/50">상담 내역을 불러오고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge 
            onClick={() => setActiveFilter('all')}
            className={cn(
              "cursor-pointer px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest transition-all",
              activeFilter === 'all' ? "bg-secondary text-white shadow-lg shadow-indigo-200" : "bg-mist text-slate hover:bg-indigo-50"
            )}
          >
            전체 내역 ({consultations.length})
          </Badge>
          <Badge 
            onClick={() => setActiveFilter('pending')}
            className={cn(
              "cursor-pointer px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest transition-all",
              activeFilter === 'pending' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-mist text-slate hover:bg-amber-50"
            )}
          >
            대기 중 ({consultations.filter(c => c.status === 'pending').length})
          </Badge>
          <Badge 
            onClick={() => setActiveFilter('answered')}
            className={cn(
              "cursor-pointer px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest transition-all",
              activeFilter === 'answered' ? "bg-secondary text-white shadow-lg shadow-emerald-200" : "bg-mist text-slate hover:bg-emerald-50"
            )}
          >
            답변 완료 ({consultations.filter(c => c.status === 'answered').length})
          </Badge>
        </div>
      </div>

      {filteredConsultations.length === 0 ? (
        <Card className="border-dashed border-2 border-line bg-mist/30 rounded-[32px] p-12 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate/20 mx-auto mb-4">
            <MessageSquare className="w-8 h-8" />
          </div>
          <p className="text-slate/40 font-bold">표시할 상담 내역이 없습니다.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredConsultations.map((c) => (
            <Card 
              key={c._id}
              className={cn(
                "border-none shadow-sm rounded-[24px] md:rounded-[32px] overflow-hidden transition-all duration-300",
                expandedId === c._id ? "ring-2 ring-indigo-600/20 shadow-xl" : "hover:shadow-md"
              )}
            >
              <div 
                className="p-6 md:p-8 cursor-pointer bg-white"
                onClick={() => setExpandedId(expandedId === c._id ? null : c._id)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                      c.status === 'pending' ? "bg-amber-50 text-primary" : "bg-emerald-50 text-secondary"
                    )}>
                      {c.status === 'pending' ? <Clock className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-slate/40 uppercase tracking-widest">
                          Ticket: {c.ticketId}
                        </span>
                        {((!isNavigator && c.status === 'answered' && !c.isReadByUser) || (isNavigator && c.status === 'pending' && !c.isReadByNavigator)) && (
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <h4 className="font-black text-obsidian truncate">
                        {isNavigator ? `${c.userName}님의 문의` : c.question.substring(0, 40) + (c.question.length > 40 ? '...' : '')}
                      </h4>
                      <p className="text-xs text-slate/60 font-bold mt-1">
                        {new Date(c.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  {expandedId === c._id ? <ChevronUp className="w-5 h-5 text-slate/30" /> : <ChevronDown className="w-5 h-5 text-slate/30" />}
                </div>
              </div>

              <AnimatePresence>
                {expandedId === c._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-8 md:px-8 md:pb-10 space-y-6 border-t border-mist/50 pt-6">
                      {/* Question */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-slate-100 text-foreground/70 border-none font-black text-[9px] uppercase tracking-tighter">Question</Badge>
                          {isNavigator && <span className="text-[10px] text-slate/40 font-bold italic">{c.userEmail}</span>}
                        </div>
                        <div className="bg-mist/30 p-5 rounded-2xl rounded-tl-none border border-line/30">
                          <p className="text-sm font-bold text-obsidian leading-relaxed whitespace-pre-wrap">{c.question}</p>
                        </div>
                      </div>

                      {/* Answer */}
                      {c.answer ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-secondary text-white border-none font-black text-[9px] uppercase tracking-tighter">Answer</Badge>
                            <span className="text-[10px] text-secondary/50 font-bold italic">
                              Replied at {new Date(c.answeredAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="bg-indigo-50/50 p-5 rounded-2xl rounded-tl-none border border-indigo-100/50">
                            <p className="text-sm font-bold text-indigo-900 leading-relaxed whitespace-pre-wrap">{c.answer}</p>
                          </div>
                        </div>
                      ) : (
                        isNavigator ? (
                          <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-primary text-white border-none font-black text-[9px] uppercase tracking-tighter">Your Reply</Badge>
                            </div>
                            <div className="relative">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="회원님을 위한 맞춤 답변을 입력하세요."
                                className="w-full h-32 p-5 rounded-2xl bg-mist/20 border border-line focus:border-secondary/30 focus:bg-white transition-all outline-none resize-none font-bold text-obsidian placeholder:text-slate/30 text-sm"
                              />
                              <Button
                                onClick={() => handleReply(c._id)}
                                disabled={isSubmitting || !replyText.trim()}
                                className="absolute bottom-4 right-4 h-10 px-5 rounded-xl bg-secondary hover:bg-secondary text-white font-black text-xs shadow-lg shadow-indigo-200 flex items-center gap-2"
                              >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> 답변 전송</>}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                            <Clock className="w-5 h-5 text-primary" />
                            <p className="text-sm font-bold text-primary">네비게이터가 문의 내용을 확인하고 있습니다. 조금만 기다려 주세요.</p>
                          </div>
                        )
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
