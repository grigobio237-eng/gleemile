'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, CheckCircle2, AlertCircle, Clock, Send, UserCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConsultationList() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const res = await fetch('/api/consultation/navigator?mode=navigator');
      const data = await res.json();
      if (data.success) {
        setConsultations(data.consultations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/consultation/navigator', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTicket._id,
          action: 'answer',
          answer: answer.trim()
        })
      });

      if (!res.ok) throw new Error('답변 등록에 실패했습니다.');

      addToast({ title: '성공', description: '상담 답변이 등록되었습니다.', variant: 'success' });
      setSelectedTicket(null);
      setAnswer('');
      fetchConsultations();
    } catch (err: any) {
      addToast({ title: '오류', description: err.message, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="destructive" className="bg-rose-500">답변 대기</Badge>;
      case 'answered': return <Badge variant="secondary" className="bg-secondary text-white">답변 완료</Badge>;
      case 'completed': return <Badge variant="outline" className="text-secondary border-emerald-600">상담 종료</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {consultations.length === 0 ? (
          <div className="col-span-full h-64 border-2 border-dashed border-line rounded-[32px] flex flex-col items-center justify-center text-foreground/70">
            <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold">접수된 상담 티켓이 없습니다.</p>
          </div>
        ) : (
          consultations.map((ticket) => (
            <motion.div
              key={ticket._id}
              layoutId={ticket._id}
              onClick={() => setSelectedTicket(ticket)}
              className="cursor-pointer group"
            >
              <Card className="border-none shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all rounded-[32px] overflow-hidden bg-white h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black tracking-widest text-foreground/70 uppercase">{ticket.ticketId}</span>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-foreground/70" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black">{ticket.userName} 고객님</CardTitle>
                      <p className="text-xs text-foreground/70">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="bg-surface p-4 rounded-2xl mb-4 line-clamp-3 text-sm text-obsidian leading-relaxed italic">
                    "{ticket.question}"
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-foreground/70 pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> 
                      {ticket.status === 'pending' ? '답변 필요' : '처리됨'}
                    </span>
                    {ticket.nudgeCount > 0 && (
                      <span className="flex items-center gap-1 text-rose-500 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5" /> 독촉 {ticket.nudgeCount}회
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Answer Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setSelectedTicket(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              layoutId={selectedTicket._id}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 md:p-12 overflow-y-auto space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black text-obsidian">{selectedTicket.userName}님의 상담 티켓</h3>
                    <p className="text-sm text-foreground/70 font-medium uppercase tracking-widest">{selectedTicket.ticketId}</p>
                  </div>
                  {getStatusBadge(selectedTicket.status)}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black text-foreground/70 uppercase tracking-widest">
                    <MessageCircle className="w-4 h-4" /> 고객 질문
                  </div>
                  <div className="p-6 bg-surface rounded-[28px] border border-line text-obsidian italic leading-relaxed text-lg">
                    "{selectedTicket.question}"
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black text-foreground/70 uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" /> 나의 답변
                  </div>
                  {selectedTicket.status !== 'pending' ? (
                    <div className="p-6 bg-indigo-50/50 rounded-[28px] border border-indigo-100 text-indigo-900 leading-relaxed">
                      {selectedTicket.answer}
                    </div>
                  ) : (
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="고객님께 전해주실 상담 내용을 입력하세요."
                      className="w-full h-48 p-6 bg-surface border border-line rounded-[28px] focus:ring-2 focus:ring-indigo-500/20 focus:border-secondary/30 outline-none resize-none text-obsidian font-medium transition-all"
                      disabled={submitting}
                    />
                  )}
                </div>
              </div>

              <div className="p-8 border-t border-line bg-surface/50 flex gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedTicket(null)}
                  disabled={submitting}
                  className="flex-1 h-16 rounded-2xl font-bold"
                >
                  닫기
                </Button>
                {selectedTicket.status === 'pending' && (
                  <Button
                    onClick={handleAnswer}
                    disabled={submitting || !answer.trim()}
                    className="flex-[2] h-16 bg-secondary text-white rounded-2xl font-black text-lg gap-2"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    답변 등록하기
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

