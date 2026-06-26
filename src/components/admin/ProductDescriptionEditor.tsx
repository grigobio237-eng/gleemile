import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Code, Eye, FileText, Wand2, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProductDescriptionEditorProps {
    value: string;
    onChange: (value: string) => void;
    isHtml: boolean;
    onIsHtmlChange: (isHtml: boolean) => void;
    className?: string;
    // AI 생성을 위한 컨텍스트 데이터
    productContext: {
        name: string;
        category: string;
        price: string | number;
        images: Array<{ url: string }>;
    };
}

export default function ProductDescriptionEditor({
    value,
    onChange,
    isHtml,
    onIsHtmlChange,
    className,
    productContext
}: ProductDescriptionEditorProps) {
    const [activeTab, setActiveTab] = useState<string>('edit');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // AI 입력 상태
    const [keywords, setKeywords] = useState('');
    const [tone, setTone] = useState('신뢰감 있고 고급스러운');
    const [target, setTarget] = useState('');

    const handleGenerate = async () => {
        if (!productContext.name) {
            toast.error('상품명을 먼저 입력해주세요.');
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch('/api/admin/products/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: productContext.name,
                    category: productContext.category,
                    price: productContext.price,
                    keywords,
                    images: productContext.images.map(img => img.url),
                    tone,
                    target
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '생성 실패');
            }

            const data = await response.json();

            // HTML 모드로 자동 전환 및 값 적용
            onIsHtmlChange(true);
            onChange(data.html);
            setActiveTab('preview'); // 미리보기 탭으로 이동
            setIsDialogOpen(false);
            toast.success('상세페이지가 생성되었습니다! 미리보기를 확인하세요.');

        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : '생성 중 오류가 발생했습니다.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">상품 상세 설명</Label>
                <div className="flex items-center space-x-2">
                    {/* AI Generation Dialog */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mr-2 text-secondary border-secondary/30 hover:bg-indigo-50 hover:text-secondary"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                AI 자동 생성
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-secondary" />
                                    AI 상세페이지 자동 생성
                                </DialogTitle>
                                <DialogDescription>
                                    입력된 상품 정보와 이미지를 바탕으로 전문적인 상세페이지를 자동으로 코딩합니다.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>상품명 (자동 입력됨)</Label>
                                    <div className="p-2 bg-gray-100 rounded text-sm text-obsidian">
                                        {productContext.name || '(상품명을 먼저 입력하세요)'}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>사용될 이미지 수</Label>
                                    <div className="p-2 bg-gray-100 rounded text-sm text-obsidian">
                                        {productContext.images.length > 0
                                            ? `${productContext.images.length}장의 이미지가 적절히 배치됩니다.`
                                            : '이미지가 없습니다. 텍스트 위주로 생성됩니다.'}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="keywords">강조하고 싶은 특징/키워드</Label>
                                    <Textarea
                                        id="keywords"
                                        placeholder="예: 친환경 소재, 부드러운 촉감, 4계절 착용 가능, 세탁기 사용 가능"
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>타겟 고객층</Label>
                                        <Input
                                            placeholder="예: 2030 직장인 여성"
                                            value={target}
                                            onChange={(e) => setTarget(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>톤앤매너</Label>
                                        <Select value={tone} onValueChange={setTone}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="신뢰감 있고 고급스러운">신뢰감/고급</SelectItem>
                                                <SelectItem value="친근하고 발랄한">친근/발랄</SelectItem>
                                                <SelectItem value="모던하고 미니멀한">모던/미니멀</SelectItem>
                                                <SelectItem value="감성적이고 따뜻한">감성/따뜻함</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isGenerating}>
                                    취소
                                </Button>
                                <Button
                                    onClick={handleGenerate}
                                    className="bg-secondary hover:bg-secondary"
                                    disabled={isGenerating || !productContext.name}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            생성 중...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-4 h-4 mr-2" />
                                            상세페이지 생성
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Switch
                        id="html-mode"
                        checked={isHtml}
                        onCheckedChange={(checked) => {
                            if (checked && !confirm('HTML 모드로 전환하시겠습니까? 기존 텍스트 포맷이 HTML 태그로 감싸지지 않을 수 있습니다.')) {
                                return;
                            }
                            onIsHtmlChange(checked);
                        }}
                    />
                    <Label htmlFor="html-mode" className="text-sm font-medium cursor-pointer flex items-center">
                        <Code className="w-4 h-4 mr-1 text-foreground/70" />
                        HTML 모드 사용
                    </Label>
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                {isHtml ? (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="bg-surface border-b px-4 py-2 flex items-center justify-between">
                            <TabsList className="grid w-[200px] grid-cols-2">
                                <TabsTrigger value="edit" className="flex items-center">
                                    <Code className="w-3 h-3 mr-2" />
                                    HTML 편집
                                </TabsTrigger>
                                <TabsTrigger value="preview" className="flex items-center">
                                    <Eye className="w-3 h-3 mr-2" />
                                    미리보기
                                </TabsTrigger>
                            </TabsList>
                            <div className="text-xs text-foreground/70 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                <span className="hidden sm:inline">이미지 태그(&lt;img&gt;) 등을 포함한 전체 HTML을 입력하세요.</span>
                            </div>
                        </div>

                        <TabsContent value="edit" className="mt-0 p-0">
                            <Textarea
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                className="min-h-[600px] border-0 rounded-none focus-visible:ring-0 font-mono text-sm resize-y p-4 bg-surface text-obsidian"
                                placeholder="<div style='...'>...</div>"
                            />
                        </TabsContent>

                        <TabsContent value="preview" className="mt-0 p-0">
                            <div className="min-h-[600px] bg-white border-b relative">
                                {/* Mobile Preview Container */}
                                <div className="mx-auto max-w-[480px] border-x min-h-[600px] bg-white shadow-sm">
                                    <div
                                        className="prose prose-sm max-w-none p-4"
                                        dangerouslySetInnerHTML={{ __html: value }}
                                    />
                                </div>
                                <div className="absolute top-2 right-2 px-2 py-1 bg-gray-100 rounded text-xs text-foreground/70">
                                    모바일 프리뷰
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="relative">
                        <div className="bg-surface border-b px-4 py-2 flex items-center text-xs text-foreground/70">
                            <FileText className="w-3 h-3 mr-1" />
                            텍스트 모드: 줄바꿈이 자동으로 적용됩니다.
                        </div>
                        <Textarea
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="min-h-[300px] border-0 rounded-none focus-visible:ring-0 resize-y p-4"
                            placeholder="상품에 대한 상세한 설명을 적어주세요..."
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
