'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Upload,
    Sparkles,
    Image as ImageIcon,
    Download,
    Trash2,
    Loader2,
    Palette,
    UserCircle2,
    Type
} from 'lucide-react';
import { toast } from 'sonner';
import { PRODUCT_CATEGORIES } from '@/constants/categories';
import Image from 'next/image';

interface ThumbnailOptions {
    name: string;
    style: string;
    category: string;
    includeModel: boolean;
    addText: boolean;
    isFunding: boolean;
    keywords: string;
}

interface ThumbnailGeneratorProps {
    partnerType?: string;
}

export default function ThumbnailGenerator({ partnerType = 'commerce' }: ThumbnailGeneratorProps) {
    const isMedical = partnerType === 'medical';
    const labels = {
        title: isMedical ? '썸네일 스타일 설정' : '썸네일 스타일 설정',
        desc: isMedical ? '서비스의 매력을 극대화할 스타일을 선택하세요.' : '상품의 매력을 극대화할 스타일을 선택하세요.',
        productName: isMedical ? '서비스/진료명' : '상품명',
        namePlaceholder: isMedical ? '서비스명 입력' : '제품명 입력',
        featuresLabel: isMedical ? '핵심 특징 및 효과' : '핵심 특징 및 USP',
        featuresPlaceholder: isMedical ? '서비스의 핵심 특징을 입력하거나 gleemile 추천을 받아보세요.' : '상품의 핵심 특징을 입력하거나 gleemile 추천을 받아보세요.',
        fundingLabel: isMedical ? '특별 프로젝트(펀딩)로 등록' : '펀딩 프로젝트로 등록',
        generateBtn: isMedical ? 'gleemile 썸네일 생성' : 'gleemile 썸네일 생성',
        nameError: isMedical ? '서비스명을 입력해 주세요.' : '상품명을 입력해 주세요.',
        suggestError: isMedical ? '서비스명을 먼저 입력해주세요.' : '상품명을 먼저 입력해주세요.',
    };
    const [loading, setLoading] = useState(false);
    const [refImage, setRefImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);

    const [suggestingFeatures, setSuggestingFeatures] = useState(false);
    const [options, setOptions] = useState<ThumbnailOptions>({
        name: '',
        style: 'premium',
        category: PRODUCT_CATEGORIES[0].value,
        includeModel: false,
        addText: true,
        isFunding: false,
        keywords: ''
    });

    // Handle Feature Suggestion
    const handleSuggestFeatures = async () => {
        if (!options.name) {
            toast.error(labels.suggestError);
            return;
        }

        setSuggestingFeatures(true);
        try {
            const res = await fetch('/api/ai/detail-builder/suggest-features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productName: options.name, category: options.category })
            });
            const data = await res.json();
            if (data.success) {
                setOptions(prev => ({ ...prev, keywords: data.suggestion }));
                toast.success('gleemile이 새로운 특징을 추천했습니다!');
            }
        } catch (error) {
            toast.error('특징 추천 중 오류가 발생했습니다.');
        } finally {
            setSuggestingFeatures(false);
        }
    };

    // Handle Image Upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setRefImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!options.name) {
            toast.error(labels.nameError);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/ai/thumbnail-builder/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...options,
                    referenceImage: refImage,
                    isFunding: options.isFunding
                })
            });
            const data = await res.json();
            if (data.success) {
                setResultImage(data.imageUrl);
                toast.success('썸네일이 생성되었습니다!');
            } else {
                toast.error(data.error || '생성 실패');
            }
        } catch (error) {
            toast.error('생성 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Settings */}
                <div className="space-y-6">
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg">{labels.title}</CardTitle>
                            <CardDescription>{labels.desc}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">카테고리 *</Label>
                                    <Select
                                        value={options.category}
                                        onValueChange={(value: string) => setOptions(prev => ({ ...prev, category: value }))}
                                    >
                                        <SelectTrigger id="category" className="h-10 border-line">
                                            <SelectValue placeholder="카테고리" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PRODUCT_CATEGORIES.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="productName">{labels.productName}</Label>
                                    <Input
                                        id="productName"
                                        placeholder={labels.namePlaceholder}
                                        value={options.name}
                                        onChange={e => setOptions({ ...options, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 border p-3 rounded-lg bg-surface border-line">
                                <Checkbox
                                    id="isFundingThumb"
                                    checked={options.isFunding}
                                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, isFunding: checked as boolean }))}
                                />
                                <div className="grid gap-1 leading-none">
                                    <Label
                                        htmlFor="isFundingThumb"
                                        className="text-xs font-bold leading-none"
                                    >
                                        {labels.fundingLabel}
                                    </Label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="features">{labels.featuresLabel}</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-primary hover:text-primary hover:bg-blue-50 gap-1 text-xs font-bold"
                                        onClick={handleSuggestFeatures}
                                        disabled={suggestingFeatures}
                                    >
                                        {suggestingFeatures ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                        gleemile 추천
                                    </Button>
                                </div>
                                <Textarea
                                    id="features"
                                    placeholder={labels.featuresPlaceholder}
                                    className="h-20"
                                    value={options.keywords}
                                    onChange={e => setOptions({ ...options, keywords: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="flex items-center gap-2">
                                    <Palette className="h-4 w-4 text-foreground/70" />
                                    디자인 스타일
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['premium', 'lifestyle', 'clean', 'creative'].map(s => (
                                        <Button
                                            key={s}
                                            variant={options.style === s ? 'default' : 'outline'}
                                            className="capitalize h-12"
                                            onClick={() => setOptions({ ...options, style: s })}
                                        >
                                            {s}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                                <Label htmlFor="includeModel" className="flex items-center gap-2 cursor-pointer">
                                    <UserCircle2 className="h-4 w-4 text-foreground/70" />
                                    <span className="text-sm font-medium">모델(사람) 포함</span>
                                </Label>
                                <Checkbox
                                    id="includeModel"
                                    checked={options.includeModel}
                                    onCheckedChange={(checked) => setOptions({ ...options, includeModel: checked as boolean })}
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                                <Label htmlFor="addText" className="flex items-center gap-2 cursor-pointer">
                                    <Type className="h-4 w-4 text-foreground/70" />
                                    <span className="text-sm font-medium">텍스트 오버레이</span>
                                </Label>
                                <Checkbox
                                    id="addText"
                                    checked={options.addText}
                                    onCheckedChange={(checked) => setOptions({ ...options, addText: checked as boolean })}
                                />
                            </div>

                            <div className="space-y-2 pt-4">
                                <Label htmlFor="refImage">참조 이미지 (선택)</Label>
                                <div
                                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all ${refImage ? 'bg-blue-50 border-primary/30' : 'border-line'
                                        }`}
                                >
                                    {refImage ? (
                                        <div className="relative w-full aspect-square max-w-[150px] rounded-lg overflow-hidden shadow-sm">
                                            <Image src={refImage} alt="Ref" fill className="object-cover" />
                                            <button
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                                                onClick={() => setRefImage(null)}
                                                aria-label="참조 이미지 삭제"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label htmlFor="refImage" className="cursor-pointer flex flex-col items-center">
                                            <Upload className="h-6 w-6 text-slate-300 mb-2" />
                                            <span className="text-xs text-foreground/70">파일 업로드</span>
                                            <input id="refImage" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <Button
                                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-lg font-bold"
                                disabled={loading}
                                onClick={handleGenerate}
                            >
                                {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Sparkles className="h-6 w-6 mr-2" />}
                                {labels.generateBtn}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Result */}
                <div className="space-y-6">
                    <Card className="border-none shadow-xl bg-slate-900 aspect-square flex flex-col items-center justify-center overflow-hidden relative">
                        {resultImage ? (
                            <>
                                <Image src={resultImage} alt="Result" fill className="object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button className="bg-white text-obsidian hover:bg-slate-100">
                                        <Download className="h-4 w-4 mr-2" />
                                        고화질 다운로드
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="p-6 bg-slate-800 rounded-full inline-block">
                                    <ImageIcon className="h-10 w-10 text-obsidian" />
                                </div>
                                <p className="text-foreground/70 font-medium">설정을 완료하고 생성을 시작하세요</p>
                            </div>
                        )}
                    </Card>

                    {resultImage && (
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4].map(v => (
                                <div key={v} className="aspect-square bg-slate-100 rounded-lg overflow-hidden border cursor-pointer hover:border-primary/30 transition-all opacity-50 hover:opacity-100">
                                    <Image src={`https://picsum.photos/seed/${v}/200/200`} alt="variant" width={200} height={200} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <footer className="text-center py-10 space-y-4">
                <div className="h-px bg-slate-200 w-32 mx-auto" />
                <div className="space-y-2">
                    <p className="text-sm text-foreground/70 font-medium italic">이 앱은 gleemile 싱크클럽의 지침으로 만들어졌습니다.</p>
                </div>
            </footer>
        </div>
    );
}
