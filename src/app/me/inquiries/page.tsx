'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    MessageSquare,
    ChevronLeft,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Search,
    ChevronRight,
    Paperclip,
    Sparkles
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import ChapterWrapper from '@/components/layout/ChapterWrapper';
import { motion } from 'framer-motion';

interface Inquiry {
    _id: string;
    inquiryId: string;
    type: string;
    subject: string;
    content: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'closed';
    priority: string;
    createdAt: string;
    adminAnswer?: string;
    aiAnswer?: string;
    attachments?: Array<{
        filename: string;
        url: string;
        size: number;
    }>;
}

const statusLabels: Record<string, string> = {
    pending: '답변 대기',
    in_progress: '처리 중',
    resolved: '답변 완료',
    closed: '종료',
};

const statusColors: Record<string, string> = {
    pending: 'bg-primary-container/50 text-primary',
    in_progress: 'bg-primary-container text-primary',
    resolved: 'bg-secondary-container text-secondary',
    closed: 'bg-slate-100 text-obsidian',
};

const typeLabels: Record<string, string> = {
    general: '일반 문의',
    delivery: '배송 문의',
    payment: '결제 문의',
    product: '상품 문의',
    technical: '시스템 오류',
    refund: '환불/취소',
    partnership: '제휴 문의',
};

export default function MyInquiriesPage() {
    const router = useRouter();
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            const res = await fetch('/api/inquiries');
            if (res.ok) {
                const data = await res.json();
                setInquiries(data.data?.inquiries || []);
            }
        } catch (error) {
            console.error('Failed to fetch inquiries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = (inquiry: Inquiry) => {
        setSelectedInquiry(inquiry);
        setIsDetailOpen(true);
    };

    return (
        <ChapterWrapper chapter="my-page">
            <div className="max-w-5xl mx-auto py-12 px-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/me')}
                            className="p-0 hover:bg-transparent text-foreground/70 mb-2 font-bold text-xs uppercase tracking-widest"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back to Dashboard
                        </Button>
                        <h1 className="font-black text-obsidian tracking-tighter flex items-center gap-3 text-3xl md:text-4xl">
                            <MessageSquare className="w-8 h-8 md:w-10 md:h-10 text-rose-500" />
                            My Inquiries
                        </h1>
                        <p className="text-foreground/70 font-medium mt-2">
                            고객센터에 접수하신 문의 내역과 답변을 확인하실 수 있습니다.
                        </p>
                    </div>
                </div>

                {/* Inquiry List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-20 bg-white rounded-[32px] border border-line">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-4"></div>
                            <p className="text-foreground/70 font-bold text-sm">데이터를 불러오는 중입니다...</p>
                        </div>
                    ) : inquiries.length === 0 ? (
                        <Card className="border-none shadow-sm rounded-[32px] bg-white text-center py-20 px-6">
                            <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            <h3 className="font-black text-obsidian mb-2 text-xl">접수된 문의 내역이 없습니다.</h3>
                            <p className="text-foreground/70 font-medium text-sm mb-8">
                                궁금한 점이나 도움이 필요하신가요? 언제든지 문의해주세요.
                            </p>
                            <Button className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl px-8 font-bold h-12" onClick={() => router.push('/support')}>
                                문의하기
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {inquiries.map((inquiry, idx) => (
                                <motion.div
                                    key={inquiry._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <div
                                        onClick={() => handleViewDetail(inquiry)}
                                        className="group bg-white rounded-[24px] p-6 border border-line shadow-sm hover:shadow-md hover:border-rose-100 transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="bg-surface text-foreground/70 border-line text-[10px] px-2 py-0.5 font-bold">
                                                        {typeLabels[inquiry.type] || inquiry.type}
                                                    </Badge>
                                                    <Badge className={`${statusColors[inquiry.status]} border-none text-[10px] px-2 py-0.5 font-bold`}>
                                                        {statusLabels[inquiry.status]}
                                                    </Badge>
                                                    <span className="text-xs font-medium text-foreground/70">
                                                        {new Date(inquiry.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-obsidian group-hover:text-rose-600 transition-colors line-clamp-1">
                                                    {inquiry.subject}
                                                </h3>
                                                <p className="text-sm text-foreground/70 line-clamp-1">
                                                    {inquiry.content}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {inquiry.status === 'resolved' && (
                                                    <div className="flex items-center gap-1.5 text-secondary bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-bold">
                                                        <CheckCircle className="w-3.5 h-3.5" /> 답변 완료
                                                    </div>
                                                )}
                                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detail Modal */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-[32px] p-0 border-none">
                        {selectedInquiry && (
                            <>
                                <div className="p-8 border-b border-line bg-surface/50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Badge variant="outline" className="bg-white text-foreground/70 border-line text-xs py-1">
                                            {typeLabels[selectedInquiry.type]}
                                        </Badge>
                                        <Badge className={`${statusColors[selectedInquiry.status]} border-none text-xs py-1`}>
                                            {statusLabels[selectedInquiry.status]}
                                        </Badge>
                                        <span className="text-xs font-medium text-foreground/70 ml-auto font-mono">
                                            {new Date(selectedInquiry.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <DialogTitle className="font-black text-obsidian leading-tight text-xl">
                                        {selectedInquiry.subject}
                                    </DialogTitle>
                                </div>
                                <div className="p-8 space-y-8">
                                    <div className="space-y-3">
                                        <h5 className="text-xs font-black text-foreground/70 uppercase tracking-widest">Inquiry Content</h5>
                                        <div className="bg-surface p-6 rounded-2xl text-sm leading-relaxed text-obsidian whitespace-pre-wrap">
                                            {selectedInquiry.content}
                                        </div>
                                        {selectedInquiry.attachments && selectedInquiry.attachments.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {selectedInquiry.attachments.map((file, i) => (
                                                    <a
                                                        key={i}
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-3 py-2 bg-white border border-line rounded-lg text-xs font-medium text-obsidian hover:border-rose-200 hover:text-rose-600 transition-colors"
                                                    >
                                                        <Paperclip className="w-3.5 h-3.5" />
                                                        {file.filename}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {selectedInquiry.adminAnswer ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-secondary-container rounded-full flex items-center justify-center text-secondary">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                </div>
                                                <h5 className="text-xs font-black text-secondary uppercase tracking-widest">Admin Response</h5>
                                            </div>
                                            <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-2xl text-sm leading-relaxed text-obsidian whitespace-pre-wrap shadow-sm">
                                                {selectedInquiry.adminAnswer}
                                            </div>
                                            {selectedInquiry.aiAnswer && (
                                                <div className="mt-4 pt-4 border-t border-line text-xs text-foreground/70">
                                                    <span className="flex items-center gap-1.5 mb-1 font-bold text-foreground/70">
                                                        <Sparkles className="w-3 h-3 text-purple-400" /> gleemile 분석 참고
                                                    </span>
                                                    이 답변은 gleemile 분석을 참고하여 작성되었습니다.
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-amber-50 rounded-2xl p-6 text-center border border-amber-100">
                                            <Clock className="w-8 h-8 text-amber-300 mx-auto mb-3" />
                                            <h5 className="font-bold text-amber-800 text-sm mb-1">답변 대기 중입니다.</h5>
                                            <p className="text-xs text-primary/80">
                                                담당자가 내용을 확인하고 있습니다.<br />
                                                조금만 기다려주시면 상세히 답변 드리겠습니다.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 pt-0 border-t-0 flex justify-end">
                                    <Button variant="ghost" onClick={() => setIsDetailOpen(false)} className="text-foreground/70 hover:text-obsidian">
                                        닫기
                                    </Button>
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </ChapterWrapper>
    );
}
