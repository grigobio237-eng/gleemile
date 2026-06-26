'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    MessageSquare,
    Eye,
    Paperclip,
    Sparkles,
    Send,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// --- Types ---
export interface Inquiry {
    _id: string;
    inquiryId: string;
    userName: string;
    userEmail: string;
    type: 'general' | 'delivery' | 'payment' | 'product' | 'technical' | 'refund' | 'partnership';
    subject: string;
    content: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    aiAnswer?: string;
    adminAnswer?: string;
    createdAt: string;
    answeredAt?: string;
    attachments?: Array<{
        filename: string;
        url: string;
        size: number;
        type: string;
    }>;
    floor?: number;
    artistId?: string;
}

interface InquiryListProps {
    floor?: number;
    artistId?: string;
    title?: string;
    description?: string;
    hideFilters?: boolean;
}

const typeLabels: Record<string, string> = {
    general: '일반',
    delivery: '배송',
    payment: '결제',
    product: '상품',
    technical: '기술',
    refund: '환불',
    partnership: '파트너십',
};

const statusLabels: Record<string, string> = {
    pending: '대기',
    in_progress: '진행중',
    resolved: '해결',
    closed: '종료',
};

const priorityLabels: Record<string, string> = {
    low: '낮음',
    medium: '보통',
    high: '높음',
    urgent: '긴급',
};

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-primary-container text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-obsidian',
};

const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-obsidian',
    medium: 'bg-primary-container text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
};

export default function InquiryList({
    floor,
    artistId,
    title = "문의 목록",
    description = "접수된 문의를 확인하고 답변을 등록하세요.",
    hideFilters = false
}: InquiryListProps) {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');

    // Detail View State
    const [adminAnswer, setAdminAnswer] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchInquiries = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (typeFilter !== 'all') params.append('type', typeFilter);
            if (priorityFilter !== 'all') params.append('priority', priorityFilter);

            // Context Filters
            if (floor) params.append('floor', floor.toString());
            if (artistId) params.append('artistId', artistId);

            const response = await fetch(`/api/admin/inquiries?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setInquiries(data.data.inquiries || []);
            }
        } catch (error) {
            console.error('문의 조회 오류:', error);
            toast.error('문의를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, typeFilter, priorityFilter, floor, artistId]);

    useEffect(() => {
        fetchInquiries();
    }, [fetchInquiries]);

    const handleViewDetail = (inquiry: Inquiry) => {
        setSelectedInquiry(inquiry);
        setAdminAnswer(inquiry.adminAnswer || '');
        setIsDetailDialogOpen(true);
    };

    const handleSaveAnswer = async () => {
        if (!selectedInquiry || !adminAnswer.trim()) {
            toast.error('답변을 입력해주세요.');
            return;
        }

        try {
            setSaving(true);
            const response = await fetch(`/api/admin/inquiries/${selectedInquiry.inquiryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminAnswer,
                    status: 'resolved',
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('답변이 저장되었습니다.');
                setIsDetailDialogOpen(false);
                fetchInquiries();
            } else {
                toast.error(data.error || '답변 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('답변 저장 오류:', error);
            toast.error('답변 저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">

            {/* Filters (Optional) */}
            {!hideFilters && (
                <Card className="border-none shadow-sm bg-surface">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40 bg-white border-line">
                                    <SelectValue placeholder="상태" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">전체 상태</SelectItem>
                                    <SelectItem value="pending">대기</SelectItem>
                                    <SelectItem value="in_progress">진행중</SelectItem>
                                    <SelectItem value="resolved">해결</SelectItem>
                                    <SelectItem value="closed">종료</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-40 bg-white border-line">
                                    <SelectValue placeholder="유형" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">전체 유형</SelectItem>
                                    <SelectItem value="general">일반</SelectItem>
                                    <SelectItem value="delivery">배송</SelectItem>
                                    <SelectItem value="payment">결제</SelectItem>
                                    <SelectItem value="product">상품</SelectItem>
                                    <SelectItem value="technical">기술</SelectItem>
                                    <SelectItem value="refund">환불</SelectItem>
                                    <SelectItem value="partnership">파트너십</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                <SelectTrigger className="w-40 bg-white border-line">
                                    <SelectValue placeholder="우선순위" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">전체 우선순위</SelectItem>
                                    <SelectItem value="low">낮음</SelectItem>
                                    <SelectItem value="medium">보통</SelectItem>
                                    <SelectItem value="high">높음</SelectItem>
                                    <SelectItem value="urgent">긴급</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Inquiries List */}
            <Card className="border-none shadow-none">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        {title}
                        <Badge variant="secondary" className="ml-2">{inquiries.length}</Badge>
                    </CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <CardContent className="px-0">
                    {loading ? (
                        <div className="text-center py-12 flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                            <p className="text-foreground/70 text-sm">Loading inquiries...</p>
                        </div>
                    ) : inquiries.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-line rounded-xl">
                            <MessageSquare className="h-10 w-10 mx-auto text-slate-200 mb-3" />
                            <p className="text-foreground/70 font-medium text-sm">접수된 문의가 없습니다.</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-line overflow-hidden">
                            <Table>
                                <TableHeader className="bg-surface">
                                    <TableRow className="border-line hover:bg-surface">
                                        <TableHead className="w-[100px] font-bold text-xs uppercase">ID</TableHead>
                                        <TableHead className="font-bold text-xs uppercase">Customer</TableHead>
                                        <TableHead className="font-bold text-xs uppercase">Type / Subject</TableHead>
                                        <TableHead className="font-bold text-xs uppercase">Status</TableHead>
                                        <TableHead className="font-bold text-xs uppercase">Date</TableHead>
                                        <TableHead className="text-right font-bold text-xs uppercase">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inquiries.map((inquiry) => (
                                        <TableRow key={inquiry._id} className="group hover:bg-surface border-slate-50">
                                            <TableCell className="font-mono text-xs text-foreground/70">
                                                {inquiry.inquiryId}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-bold text-sm text-obsidian">{inquiry.userName}</p>
                                                    <p className="text-[10px] text-foreground/70">{inquiry.userEmail}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-white">
                                                        {typeLabels[inquiry.type]}
                                                    </Badge>
                                                    <p className="font-medium text-sm truncate max-w-[200px] text-obsidian">
                                                        {inquiry.subject}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    <Badge className={`${statusColors[inquiry.status]} w-fit text-[10px] px-2`}>
                                                        {statusLabels[inquiry.status]}
                                                    </Badge>
                                                    {inquiry.priority === 'urgent' && (
                                                        <Badge className="bg-rose-100 text-rose-600 w-fit text-[10px] px-2 border-rose-200">
                                                            긴급
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-foreground/70">
                                                {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-full hover:bg-slate-200"
                                                    onClick={() => handleViewDetail(inquiry)}
                                                >
                                                    <Eye className="h-4 w-4 text-foreground/70 group-hover:text-obsidian" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Inquiry Detail Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0 gap-0 overflow-hidden bg-white rounded-2xl">
                    <div className="p-6 border-b border-line bg-surface/50 flex items-center justify-between">
                        <div>
                            <DialogTitle className="font-bold text-obsidian text-xl">문의 상세 정보</DialogTitle>
                            <DialogDescription className="text-foreground/70 mt-1">
                                접수된 문의 내용을 확인하고 답변을 작성해주세요.
                            </DialogDescription>
                        </div>
                        <Badge variant="outline" className="bg-white font-mono text-foreground/70">
                            {selectedInquiry?.inquiryId}
                        </Badge>
                    </div>

                    {selectedInquiry && (
                        <div className="flex flex-col md:flex-row h-[70vh]">
                            {/* Left: Inquiry Content */}
                            <div className="flex-1 p-6 overflow-y-auto border-r border-line space-y-8">
                                {/* User Info */}
                                <div className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-line">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-foreground/70 font-bold">
                                        {selectedInquiry.userName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-obsidian">{selectedInquiry.userName}</p>
                                        <p className="text-xs text-foreground/70">{selectedInquiry.userEmail}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-xs font-bold text-foreground/70">작성일</p>
                                        <p className="text-xs text-foreground/70">{new Date(selectedInquiry.createdAt).toLocaleString('ko-KR')}</p>
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <Badge className={statusColors[selectedInquiry.status]}>{statusLabels[selectedInquiry.status]}</Badge>
                                        <Badge variant="outline">{typeLabels[selectedInquiry.type]}</Badge>
                                        <Badge className={priorityColors[selectedInquiry.priority]}>{priorityLabels[selectedInquiry.priority]}</Badge>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-obsidian mb-2">{selectedInquiry.subject}</h3>
                                        <div className="p-6 bg-surface/50 rounded-2xl border border-line text-sm leading-relaxed text-obsidian whitespace-pre-wrap">
                                            {selectedInquiry.content}
                                        </div>
                                    </div>
                                </div>

                                {/* Attachments */}
                                {selectedInquiry.attachments && selectedInquiry.attachments.length > 0 && (
                                    <div className="space-y-3">
                                        <h5 className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Attachments</h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {selectedInquiry.attachments.map((file, index) => (
                                                <a
                                                    key={index}
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-3 rounded-lg border border-line bg-white hover:border-secondary/30 hover:bg-indigo-50/50 transition-all group"
                                                >
                                                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                                                        <Paperclip className="h-4 w-4 text-foreground/70 group-hover:text-secondary" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-sm font-medium text-obsidian truncate">{file.filename}</p>
                                                        <p className="text-[10px] text-foreground/70">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Answer Section */}
                            <div className="w-full md:w-[400px] bg-surface flex flex-col">
                                <div className="p-4 border-b border-line/60 bg-white/50 backdrop-blur-sm sticky top-0">
                                    <h4 className="font-bold text-obsidian flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-secondary" />
                                        답변 관리
                                    </h4>
                                </div>

                                <div className="flex-1 p-4 overflow-y-auto space-y-6">
                                    {/* AI Answer Preview */}
                                    {selectedInquiry.aiAnswer && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-secondary">
                                                <Sparkles className="w-3 h-3" /> AI Suggested Answer
                                            </div>
                                            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-900 leading-relaxed whitespace-pre-wrap">
                                                {selectedInquiry.aiAnswer}
                                            </div>
                                            <Button size="sm" variant="ghost" className="w-full text-xs text-secondary h-8 hover:bg-secondary-container" onClick={() => setAdminAnswer(selectedInquiry.aiAnswer || '')}>
                                                이 답변 사용하기
                                            </Button>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-foreground/70 uppercase">관리자 답변 작성</label>
                                        <Textarea
                                            value={adminAnswer}
                                            onChange={(e) => setAdminAnswer(e.target.value)}
                                            placeholder="고객에게 전송될 답변을 입력하세요..."
                                            className="min-h-[200px] resize-none p-4 text-sm bg-white border-line focus:border-secondary/30 focus:ring-indigo-500/20"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-white border-t border-line sticky bottom-0">
                                    <Button
                                        className="w-full bg-secondary hover:bg-secondary text-white font-bold h-12 shadow-lg shadow-indigo-200"
                                        onClick={handleSaveAnswer}
                                        disabled={saving || !adminAnswer.trim()}
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 저장 중...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" /> 답변 저장 및 발송
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
