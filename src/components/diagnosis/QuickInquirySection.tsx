'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface QuickInquirySectionProps {
  userId?: string;
  reportId?: string;
}

export default function QuickInquirySection({ userId, reportId }: QuickInquirySectionProps) {
  const [question, setQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { addToast } = useToast();

  const [attachReport, setAttachReport] = useState(true);

  const handleSubmit = async () => {
    if (!question.trim()) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/consultation/navigator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          reportId: reportId,
          includeData: attachReport
        })
      });

      if (res.ok) {
        setIsSuccess(true);
        addToast({
          title: '상담 접수 완료',
          description: '전담 전문가에게 상담 요청이 전달되었습니다.',
          variant: 'success'
        });
        setQuestion('');
      } else {
        throw new Error('전송 실패');
      }
    } catch (error) {
      addToast({
        title: '전송 오류',
        description: '상담 요청 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        variant: 'error'
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12"
      >
        <Card className="bg-green-50 border-green-100 rounded-[32px] overflow-hidden">
          <CardContent className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-2xl font-black text-obsidian">전문가 상담이 접수되었습니다.</h3>
            <p className="text-slate font-medium">
              네비게이터가 내용을 검토 중입니다. 답변이 등록되면 알림을 보내드릴게요.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsSuccess(false)}
              className="mt-4 rounded-xl border-green-200 text-green-700 hover:bg-green-100"
            >
              추가 문의하기
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-12"
    >
      <Card className="bg-white shadow-2xl rounded-[40px] border-none overflow-hidden">
        <div className="bg-obsidian p-8 md:p-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Professional Support</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black italic">
              Still have <span className="text-primary font-bold italic text-glow-cream">Questions?</span>
            </h3>
            <p className="text-mist/60 text-sm font-medium">
              상태 분석 결과에 대해 전담 전문가(네비게이터)가 직접 답변해 드립니다.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-obsidian">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-mist/40 uppercase">Average Response</p>
              <p className="text-sm font-black text-white">Under 2 Hours</p>
            </div>
          </div>
        </div>
        
        <CardContent className="p-8 md:p-12 space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate uppercase tracking-widest flex items-center gap-2">
              상담 내용 <span className="text-primary text-[10px] normal-case font-medium">(질문만 입력하세요)</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="추천받은 액션 플랜이나 현재 상태에 대해 궁금한 점을 적어주세요."
              className="w-full h-40 p-6 bg-mist/30 border-2 border-line rounded-[24px] focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-none text-obsidian font-medium"
              disabled={isSending}
            />
          </div>

          <div 
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${attachReport ? 'bg-primary/5 border-primary/20' : 'bg-mist/20 border-transparent'}`}
            onClick={() => setAttachReport(!attachReport)}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${attachReport ? 'bg-primary border-primary' : 'border-line'}`}>
              {attachReport && <CheckCircle2 className="w-4 h-4 text-obsidian" />}
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-obsidian">내 최근 리듬체크 데이터 포함</p>
              <p className="text-[10px] text-slate font-medium">네비게이터가 유저님의 데이터를 기반으로 정밀 분석해 드립니다.</p>
            </div>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={isSending || !question.trim()}
            className="w-full h-20 bg-obsidian text-white rounded-[24px] font-black group hover:scale-[1.02] active:scale-95 transition-all text-xl"
          >
            {isSending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                상담 요청 전송
                <Send className="w-5 h-5 ml-3 text-primary group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </Button>
          
          <p className="text-center text-[10px] text-slate/40 font-medium">
            네비게이터가 부재중이거나 응대가 늦어질 경우 본사 관리자가 직접 응대합니다.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
