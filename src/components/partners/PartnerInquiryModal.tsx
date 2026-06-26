'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Send, CheckCircle2, Building2, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface PartnerInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PartnerInquiryModal({ isOpen, onClose }: PartnerInquiryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phoneNumber: '',
    content: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 항목 검증
    if (!formData.email || !formData.phoneNumber) {
      alert('연락처와 이메일은 필수 입력 항목입니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/partners/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setFormData({
            companyName: '',
            contactName: '',
            email: '',
            phoneNumber: '',
            content: ''
          });
        }, 2000);
      } else {
        const error = await response.json();
        alert(error.error || '문의 접수 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 rounded-[32px] border-none bg-white overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8"
            >
              <DialogHeader className="mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl font-serif text-obsidian">제휴 문의하기</DialogTitle>
                <DialogDescription className="text-slate/60">
                  gleemile과 함께 성장할 파트너를 기다립니다.<br />
                  양식을 작성해주시면 담당자가 빠르게 연락드리겠습니다.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-xs font-black uppercase tracking-widest text-slate/40 flex items-center gap-2">
                    <Building2 className="w-3 h-3" /> 업체명 / 기관명
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="회사명을 입력해주세요"
                    className="rounded-xl border-line/50 focus:border-primary/50 h-12"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName" className="text-xs font-black uppercase tracking-widest text-slate/40 flex items-center gap-2">
                      <User className="w-3 h-3" /> 담당자명
                    </Label>
                    <Input
                      id="contactName"
                      placeholder="성함"
                      className="rounded-xl border-line/50 focus:border-primary/50 h-12"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-xs font-black uppercase tracking-widest text-slate/40 flex items-center gap-2">
                      <Phone className="w-3 h-3" /> 연락처 (필수)
                    </Label>
                    <Input
                      id="phoneNumber"
                      placeholder="010-0000-0000"
                      className="rounded-xl border-line/50 focus:border-primary/50 h-12"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate/40 flex items-center gap-2">
                    <Mail className="w-3 h-3" /> 이메일 주소 (필수)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    className="rounded-xl border-line/50 focus:border-primary/50 h-12"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-xs font-black uppercase tracking-widest text-slate/40 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" /> 문의 내용
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="제휴 희망 내용이나 궁금하신 점을 자유롭게 적어주세요"
                    className="rounded-xl border-line/50 focus:border-primary/50 min-h-[120px] resize-none py-4"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-2xl bg-obsidian text-mist font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                >
                  {isSubmitting ? '전송 중...' : (
                    <span className="flex items-center gap-2">
                      제휴 신청하기 <Send className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 text-center flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-serif text-obsidian mb-2">접수가 완료되었습니다</h3>
              <p className="text-slate/60">
                작성해주신 소중한 내용은 담당자가 확인 후<br />
                빠르게 피드백 드리겠습니다. 감사합니다.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
