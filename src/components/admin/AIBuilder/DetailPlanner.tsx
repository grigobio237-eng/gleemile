'use client';

import React, { useState } from 'react';
import { PRODUCT_CATEGORIES } from '@/constants/categories';
import { toast } from 'sonner';
import ImageUploader from './ImageUploader';
import { removeBackground } from '@imgly/background-removal';
import { Download, RefreshCw } from 'lucide-react';

import html2canvas from 'html2canvas';
import Image from 'next/image';

// Types (Synchronized with AI Studio)
enum PageLength {
    AUTO = 'auto',
    SHORT = '5',
    STANDARD = '7',
    LONG = '9'
}

interface DetailImageSegment {
    id: string;
    title: string;
    logicalSections: string[];
    keyMessage: string;
    visualPrompt: string;
    imageUrl?: string;
    isGenerating?: boolean;
}

interface ProductInfo {
    name: string;
    category: string;
    price: string;
    promotion: string;
    features: string;
    isFunding: boolean;
    targetGender: string[];
    targetAge: string[];
    length: PageLength;
    referenceImage?: string;
}

interface DetailPlannerProps {
    mode?: 'admin' | 'partner';
    partnerType?: string;
}

const DetailPlanner: React.FC<DetailPlannerProps> = ({ mode = 'admin', partnerType = 'commerce' }) => {
    const isMedical = partnerType === 'medical';
    const labels = {
        title: isMedical ? '서비스/진료 빌더' : '상세페이지 빌더',
        productName: isMedical ? '서비스/진료명 *' : '상품명 *',
        productPlaceholder: isMedical ? '예: 프리미엄 줄기세포 테라피' : '예: 프리미엄 에어프라이어',
        priceLabel: isMedical ? '비용/가격대' : '가격대',
        pricePlaceholder: isMedical ? '예: 150,000원' : '예: 49,000원',
        featuresLabel: isMedical ? '핵심 서비스 특징/효과' : '핵심 회복 키워드',
        featuresPlaceholder: isMedical ? '이 서비스가 제공하는 핵심 가치와 치료 효과를 입력하세요.' : '상품이 돕는 회복 키워드와 핵심 가치를 입력하세요.',
        fundingLabel: isMedical ? '특별 프로젝트(펀딩)로 등록' : '펀딩 프로젝트로 등록',
        planningBtn: isMedical ? '🪄 서비스 기획 시작하기' : '🪄 상세페이지 기획 시작하기',
        generatingMsg: isMedical ? 'gleemile이 서비스 전략 기획 중...' : 'gleemile이 브랜드 전략 기획 중...',
        registerSuccess: isMedical ? '서비스가 등록되었습니다 (승인 대기)' : '상품이 등록되었습니다 (승인 대기)',
        emptyMsg: isMedical ? '서비스명은 필수입니다!' : '상품명은 필수입니다!',
        suggestBtn: isMedical ? 'gleemile 효과 추천' : 'gleemile 자동 추천',
        thumbnailBtn: isMedical ? '썸네일 생성' : '썸네일 생성',
        registerBtn: isMedical ? '서비스 등록' : '상품 등록',
        registeringMsg: isMedical ? '서비스 등록 중...' : '상품 등록 중...',
    };
    // [Debug] 카테고리 목록 로드 확인용
    console.log('[DetailPlanner] Current categories:', PRODUCT_CATEGORIES.map(c => c.label));

    // Utility: Canvas를 이용한 이미지 리사이징 (Base64 최적화)
    const resizeImage = (base64: string, maxWidth: number = 1024): Promise<string> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8)); // JPEG 80% 품질로 압축
                } else {
                    resolve(base64);
                }
            };
            img.onerror = () => resolve(base64);
            img.src = base64;
        });
    };

    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
    const [loading, setLoading] = useState(false);
    const [isRemovingBackground, setIsRemovingBackground] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

    const [info, setInfo] = useState<ProductInfo>({
        name: '',
        category: PRODUCT_CATEGORIES[0].value, // label 대신 value(영문 슬러그) 사용
        price: '',
        promotion: '',
        features: '',
        isFunding: false,
        targetGender: ['전체'],
        targetAge: ['20대', '30대', '40대'],
        length: PageLength.STANDARD,
    });

    const [segments, setSegments] = useState<DetailImageSegment[]>([]);
    const [isGeneratingImages, setIsGeneratingImages] = useState(false);
    const [cutoutImage, setCutoutImage] = useState<string | null>(null);
    const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
    const [thumbnailOptions, setThumbnailOptions] = useState({
        style: 'premium',
        includeModel: false,
        addText: true
    });

    // Handle Image Selection with Background Removal
    const handleImageSelected = async (base64: string) => {
        // 전송 전 리사이징 적용
        const resized = await resizeImage(base64);
        setInfo({ ...info, referenceImage: resized });

        // Try background removal
        setIsRemovingBackground(true);
        const tid = toast.loading('배경을 제거하여 제품을 추출하는 중...');
        try {
            const blob = await removeBackground(base64, {
                // @ts-ignore
                model: 'medium',
                publicPath: `${window.location.origin}/imgly-assets/`
            });
            const reader = new FileReader();
            reader.onloadend = async () => {
                const cutout = reader.result as string;
                // 배경 제거된 이미지도 리사이징하여 메모리/전송 효율 최적화
                const resizedCutout = await resizeImage(cutout);
                setCutoutImage(resizedCutout);
                toast.success('제품 추출 완료!', { id: tid });
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Background removal failed:', error);
            // Fallback: use resized original image as cutout
            const resizedOriginal = await resizeImage(base64);
            setCutoutImage(resizedOriginal);
            toast.error('배경 제거 실패. 원본 이미지를 사용합니다.', { id: tid });
        } finally {
            setIsRemovingBackground(false);
        }
    };

    const handleStartPlanning = async () => {
        if (!info.name) {
            toast.error(labels.emptyMsg);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/ai/detail-builder/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: info.name,
                    category: info.category,
                    price: info.price,
                    promotion: info.promotion,
                    keywords: info.features,
                    isFunding: info.isFunding,
                    targetGender: info.targetGender,
                    targetAge: info.targetAge,
                    length: info.length
                })
            });
            const data = await res.json();
            if (data.success) {
                // Fix: Handle both array and object format (with sections)
                const newSegments = Array.isArray(data.plan) ? data.plan : (data.plan.sections || []);
                setSegments(newSegments);
                setStep(2);
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            console.error(e);
            toast.error('기획안 생성 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestFeatures = async () => {
        if (!info.name) return toast.error(isMedical ? '서비스명을 먼저 입력해주세요.' : '상품명을 먼저 입력해주세요.');
        setLoading(true);
        try {
            const res = await fetch('/api/ai/detail-builder/suggest-features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productName: info.name, category: info.category })
            });
            const data = await res.json();
            if (data.success) {
                setInfo(prev => ({ ...prev, features: data.suggestion }));
                toast.success('특징 추천 완료!');
            }
        } catch (e) {
            toast.error('추천 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const generateAllImages = async () => {
        setIsGeneratingImages(true);
        const updatedSegments = [...segments];

        for (let i = 0; i < updatedSegments.length; i++) {
            const seg = updatedSegments[i];
            if (seg.imageUrl) continue; // Skip already generated
            await handleRegenerateImage(seg.id);
        }
        setIsGeneratingImages(false);
        setStep(3);
    };

    const handleRegenerateImage = async (id: string) => {
        const seg = segments.find(s => s.id === id);
        if (!seg) return;

        setSegments(prev => prev.map(s => s.id === id ? { ...s, isGenerating: true } : s));
        try {
            const res = await fetch('/api/ai/detail-builder/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visualPrompt: seg.visualPrompt,
                    keyMessage: seg.keyMessage,
                    referenceImage: cutoutImage || info.referenceImage,
                    aspectRatio: "9:16",
                    sectionId: id
                })
            });
            const data = await res.json();
            if (data.success) {
                setSegments(prev => prev.map(s => s.id === id ? { ...s, imageUrl: data.imageUrl, isGenerating: false } : s));
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            console.error(`Image generation failed for segment ${id}`, e);
            toast.error('이미지 생성 실패');
            setSegments(prev => prev.map(s => s.id === id ? { ...s, isGenerating: false } : s));
        }
    };

    const handleRegenerateSegment = async (id: string) => {
        const seg = segments.find(s => s.id === id);
        if (!seg) return;

        const tid = toast.loading(`${seg.title} 기획안 재생성 중...`);
        try {
            const res = await fetch('/api/ai/detail-builder/regenerate-segment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: info.name,
                    category: info.category,
                    keywords: info.features,
                    sectionId: id,
                    logicalSection: seg.logicalSections[0] || 'Hook'
                })
            });
            const data = await res.json();
            if (data.success) {
                setSegments(prev => prev.map(s => s.id === id ? { ...s, ...data.segment, imageUrl: undefined } : s));
                toast.success('기획안 재생성 완료!', { id: tid });
            }
        } catch (e) {
            toast.error('재생성 중 오류 발생', { id: tid });
        }
    };

    const updateSegment = (id: string, field: keyof DetailImageSegment, value: string) => {
        setSegments(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    // 베이스64 이미지를 파일 객체로 변환
    const base64ToFile = async (base64: string, filename: string): Promise<File> => {
        const res = await fetch(base64);
        const blob = await res.blob();
        return new File([blob], filename, { type: 'image/png' });
    };

    // 썸네일 생성
    const handleGenerateThumbnail = async () => {
        if (!info.name) return toast.error(isMedical ? '서비스명이 필요합니다.' : '상품명이 필요합니다.');
        setIsGeneratingThumbnail(true);
        try {
            const res = await fetch('/api/ai/thumbnail-builder/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: info.name,
                    style: thumbnailOptions.style,
                    includeModel: thumbnailOptions.includeModel,
                    addText: thumbnailOptions.addText,
                    keywords: info.features,
                    referenceImage: cutoutImage || info.referenceImage
                })
            });
            const data = await res.json();
            if (data.success) {
                setThumbnailImage(data.imageUrl);
                toast.success('썸네일 생성 완료!');
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            console.error(e);
            toast.error('썸네일 생성 중 오류가 발생했습니다.');
        } finally {
            setIsGeneratingThumbnail(false);
        }
    };

    // 최종 상품 등록
    const handleRegisterProduct = async () => {
        if (!thumbnailImage) return toast.error('썸네일이 먼저 생성되어야 합니다.');
        setIsRegistering(true);
        const tid = toast.loading('서버에 이미지를 업로드하고 상품을 등록하는 중...');

        try {
            // 1. 모든 이미지 업로드
            const imageUrls: string[] = [];
            // 파일명 충돌 및 특수문자 문제를 피하기 위해 고유하고 안전한 기본 이름 생성
            const safeBaseName = Math.random().toString(36).substring(2, 10);

            // 썸네일 업로드
            const thumbFile = await base64ToFile(thumbnailImage, `${safeBaseName}_thumb.png`);
            const thumbFormData = new FormData();
            thumbFormData.append('file', thumbFile);
            thumbFormData.append('folder', 'products/thumbnails');

            const thumbRes = await fetch('/api/upload', { method: 'POST', body: thumbFormData });
            const thumbData = await thumbRes.json();
            if (!thumbRes.ok || !thumbData.success) {
                throw new Error(thumbData.error || '대표 썸네일 업로드 실패');
            }
            imageUrls.push(thumbData.url); // 첫 번째 이미지가 대표 이미지가 됨

            // 상세 이미지 업로드
            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];
                if (seg.imageUrl) {
                    try {
                        const file = await base64ToFile(seg.imageUrl, `${safeBaseName}_detail_${i + 1}.png`);
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('folder', 'products/details');

                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                        const data = await res.json();
                        if (res.ok && data.success) {
                            imageUrls.push(data.url);
                        } else {
                            console.warn(`상세 이미지 ${i + 1} 업로드 실패:`, data.error);
                        }
                    } catch (uploadError) {
                        console.error(`상세 이미지 ${i + 1} 처리 중 오류:`, uploadError);
                    }
                }
            }

            // 2. 상품 데이터 구성 및 등록
            // 썸네일을 제외한 나머지(상세 이미지)들을 설명 HTML에 포함
            const detailedImageUrls = imageUrls.slice(1);
            const descriptionHtml = detailedImageUrls
                .map((url, idx) => {
                    // Firebase Storage URL(이미 ?token= 포함)과 v=1 파라미터 안전하게 결합
                    const separator = url.includes('?') ? '&' : '?';
                    return `<Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src="${url}${separator}v=1" alt="${info.name}_detail_${idx + 1}" crossorigin="anonymous" style="max-width: 100%; display: block; margin: 0 auto;" />`;
                })
                .join('');

            const slug = info.name
                .toLowerCase()
                .replace(/[^a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).substring(2, 7);

            const productData = {
                name: info.name,
                slug,
                price: parseInt(info.price.replace(/[^0-9]/g, '')) || 0,
                category: info.category,
                summary: segments[0]?.keyMessage || info.name,
                description: descriptionHtml,
                descriptionIsHtml: true,
                images: imageUrls.map(url => ({ url })), // 첫 번째인 썸네일이 mongoose 모델에 의해 대표 이미지로 관리됨
                isFunding: info.isFunding,
                stock: 999,
                status: 'active',
                approvalStatus: mode === 'partner' ? 'pending' : 'approved', // 파트너는 승인 대기, 어드민은 즉시 승인
            };

            // mode에 따라 상품 등록 API 엔드포인트를 분기
            const apiEndpoint = mode === 'partner' ? '/api/partner/products' : '/api/admin/products';
            const regRes = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            const regResult = await regRes.json();

            if (!regRes.ok) throw new Error(regResult.error || (isMedical ? '서비스 등록 실패' : '상품 등록 실패'));

            toast.success(mode === 'partner' ? labels.registerSuccess : (isMedical ? '서비스가 즉시 등록되었습니다!' : '상품이 즉시 등록되었습니다!'), { id: tid });
            setStep(5);
        } catch (e: any) {
            console.error(e);
            toast.error(`등록 오류: ${e.message}`, { id: tid });
        } finally {
            setIsRegistering(false);
        }
    };

    const handleDownloadAsImage = async () => {
        const element = document.getElementById('detail-page-container');
        if (!element) return;

        const tid = toast.loading('이미지로 변환 중 (대용량 이미지는 시간이 걸릴 수 있습니다)...');
        try {
            // 모든 이미지의 로딩을 보장하기 위해 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(element, {
                useCORS: true,
                allowTaint: false,
                scale: 2, // 고해상도 품질
                logging: true, // 디버깅을 위해 일시적 활성화
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById('detail-page-container');
                    if (clonedElement) {
                        clonedElement.style.height = 'auto';
                        clonedElement.style.overflow = 'visible';
                    }
                }
            });

            const image = canvas.toDataURL('image/png', 1.0);
            const link = document.createElement('a');
            link.href = image;
            link.download = `${info.name}_상세페이지_전체_${new Date().getTime()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('다운로드 완료!', { id: tid });
        } catch (error: any) {
            console.error('Download failed:', error);
            toast.error(`이미지 변환 실패: ${error.message || '알 수 없는 오류'}`, { id: tid });
        }
    };

    const handleDownloadAll = () => {
        segments.forEach((seg, index) => {
            if (seg.imageUrl) {
                const link = document.createElement('a');
                link.href = seg.imageUrl;
                link.download = `${info.name}_상세페이지_${index + 1}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 print-area">
            {/* Progress Stepper */}
            <div className="flex items-center justify-center mb-12 no-print">
                {[1, 2, 3, 4, 5].map((s) => (
                    <React.Fragment key={s}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${step === s ? 'bg-primary border-blue-600 text-white shadow-lg scale-110' :
                            step > s ? 'bg-primary-container border-primary/30 text-primary' : 'bg-white border-line text-foreground/70'
                            }`}>
                            {s}
                        </div>
                        {s < 5 && <div className={`w-12 h-1 mx-2 rounded ${step > s ? 'bg-primary' : 'bg-slate-200'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {step === 1 && (
                <div className="bg-white rounded-3xl shadow-xl border border-line p-8 space-y-6 no-print">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-obsidian">기본 정보</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-obsidian mb-1">{labels.productName}</label>
                                    <input
                                        type="text"
                                        value={info.name}
                                        onChange={(e) => setInfo({ ...info, name: e.target.value })}
                                        placeholder={labels.productPlaceholder}
                                        className="w-full px-4 py-3 rounded-xl border border-line bg-white text-obsidian placeholder:text-foreground/70 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-obsidian mb-1">카테고리</label>
                                        <select
                                            value={info.category}
                                            onChange={(e) => setInfo({ ...info, category: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-line bg-white text-obsidian outline-none"
                                            aria-label="카테고리 선택"
                                        >
                                            {PRODUCT_CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-obsidian mb-1">{labels.priceLabel}</label>
                                        <input
                                            type="text"
                                            value={info.price}
                                            onChange={(e) => setInfo({ ...info, price: e.target.value })}
                                            placeholder={labels.pricePlaceholder}
                                            className="w-full px-4 py-3 rounded-xl border border-line bg-white text-obsidian placeholder:text-foreground/70 focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-semibold text-obsidian">{labels.featuresLabel}</label>
                                        <button
                                            onClick={handleSuggestFeatures}
                                            className="text-xs text-primary font-bold hover:underline"
                                        >
                                            {labels.suggestBtn}
                                        </button>
                                    </div>
                                    <textarea
                                        value={info.features}
                                        onChange={(e) => setInfo({ ...info, features: e.target.value })}
                                        rows={3}
                                        placeholder={labels.featuresPlaceholder}
                                        className="w-full px-4 py-3 rounded-xl border border-line bg-white text-obsidian placeholder:text-foreground/70 focus:ring-2 focus:ring-primary outline-none resize-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="isFunding"
                                        checked={info.isFunding}
                                        onChange={(e) => setInfo({ ...info, isFunding: e.target.checked })}
                                        className="w-5 h-5 accent-blue-600 rounded"
                                    />
                                    <label htmlFor="isFunding" className="text-sm font-semibold text-obsidian cursor-pointer">
                                        {labels.fundingLabel}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-obsidian">이미지 및 설정</h3>
                            <ImageUploader
                                label="제품/서비스 참조 사진 업로드 (선택사항)"
                                preview={info.referenceImage}
                                onImageSelected={handleImageSelected}
                                isRemovingBackground={isRemovingBackground}
                            />

                            <div>
                                <label className="block text-sm font-semibold text-obsidian mb-2">상세페이지 길이</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { val: PageLength.AUTO, label: 'AI 추천' },
                                        { val: PageLength.SHORT, label: '5장 (숏)' },
                                        { val: PageLength.STANDARD, label: '7장 (표준)' },
                                        { val: PageLength.LONG, label: '9장 (롱)' },
                                    ].map((item) => (
                                        <button
                                            key={item.val}
                                            onClick={() => setInfo({ ...info, length: item.val as PageLength })}
                                            className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${info.length === item.val
                                                ? 'border-blue-600 bg-blue-50 text-primary'
                                                : 'border-line bg-surface text-foreground/70 hover:border-line'
                                                }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8">
                        <button
                            onClick={handleStartPlanning}
                            disabled={loading || isRemovingBackground}
                            className={`
                                w-full py-5 rounded-3xl font-black text-xl 
                                bg-gradient-to-r from-blue-600 to-indigo-700 
                                hover:from-blue-700 hover:to-indigo-800 
                                text-white shadow-[0_15px_40px_rgba(37,99,235,0.25)] 
                                transition-all duration-300 transform hover:-translate-y-1
                                disabled:opacity-50 disabled:cursor-not-allowed
                                flex items-center justify-center gap-4
                                ring-8 ring-blue-50/50
                            `}
                        >
                            {loading ? (
                                <>
                                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                    {labels.generatingMsg}
                                </>
                            ) : (
                                <>
                                    <span>{labels.planningBtn}</span>
                                    <div className="bg-white/20 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
                                        <RefreshCw size={18} />
                                    </div>
                                </>
                            )}
                        </button>
                    </div>
                </div >
            )
            }

            {
                step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 no-print">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-obsidian">gleemile 기획 전략 초안</h2>
                            <button
                                onClick={() => setStep(1)}
                                className="text-sm font-bold text-foreground/70 hover:text-obsidian"
                            >
                                정보 수정
                            </button>
                        </div>

                        <div className="space-y-4">
                            {segments.map((seg, idx) => (
                                <div key={seg.id} className="bg-white rounded-2xl shadow-sm border border-line overflow-hidden">
                                    <div className="p-1 bg-surface flex border-b border-line">
                                        <div className="px-4 py-2 text-xs font-bold text-foreground/70">PAGE {idx + 1}</div>
                                    </div>
                                    <div className="p-6 grid md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-wrap gap-2">
                                                    {seg.logicalSections.map((tag, tIdx) => (
                                                        <span key={tIdx} className="px-2 py-0.5 bg-blue-50 text-primary text-[10px] font-bold rounded uppercase">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => handleRegenerateSegment(seg.id)}
                                                    className="p-1.5 text-foreground/70 hover:text-primary hover:bg-blue-50 rounded-lg transition-all"
                                                    title="기획안 다시 짜기"
                                                >
                                                    <RefreshCw size={14} className={seg.isGenerating ? 'animate-spin' : ''} />
                                                </button>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-foreground/70 mb-1 uppercase">Key Copy</label>
                                                <input
                                                    type="text"
                                                    value={seg.keyMessage}
                                                    onChange={(e) => updateSegment(seg.id, 'keyMessage', e.target.value)}
                                                    className="w-full px-0 py-2 text-lg font-bold text-obsidian border-b-2 border-transparent bg-white focus:border-primary/30 outline-none transition-all placeholder:text-slate-300"
                                                    placeholder="섹션의 핵심 메시지를 입력하세요"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-foreground/70 mb-1 uppercase">Visual Prompt</label>
                                            <textarea
                                                value={seg.visualPrompt}
                                                onChange={(e) => updateSegment(seg.id, 'visualPrompt', e.target.value)}
                                                rows={2}
                                                className="w-full p-3 text-sm text-obsidian bg-surface rounded-xl border-none focus:ring-2 focus:ring-blue-100 outline-none resize-none transition-all"
                                                placeholder="화면 구성을 설명하는 프롬프트"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="sticky bottom-8 flex justify-center pt-16 pb-8 z-50">
                            <button
                                onClick={generateAllImages}
                                disabled={isGeneratingImages}
                                className={`
                                relative group overflow-hidden px-20 py-7 
                                bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600 
                                hover:from-orange-600 hover:via-rose-600 hover:to-purple-700 
                                text-white rounded-full font-black text-2xl 
                                shadow-[0_25px_60px_rgba(244,63,94,0.4)] 
                                hover:shadow-[0_25px_60px_rgba(244,63,94,0.6)] 
                                hover:scale-105 active:scale-95
                                transition-all duration-500 flex items-center gap-6 
                                disabled:opacity-50 disabled:cursor-not-allowed
                                ring-12 ring-rose-50/50
                                animate-bounce-subtle
                            `}
                            >
                                <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out -skew-x-12 -translate-x-full" />
                                {isGeneratingImages ? (
                                    <>
                                        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>상세 이미지 생성 중...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="relative z-10 drop-shadow-lg">✨ 위 기획으로 상세페이지 이미지 생성 시작하기</span>
                                        <div className="bg-white/20 p-2.5 rounded-2xl group-hover:rotate-12 transition-transform shadow-inner">
                                            <RefreshCw size={28} />
                                        </div>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )
            }

            {
                step === 3 && (
                    <div className="space-y-12 animate-in zoom-in duration-500">
                        <div className="flex flex-col md:flex-row items-center justify-between no-print gap-4">
                            <h2 className="text-2xl font-bold text-obsidian">생성된 상세페이지</h2>
                            <div className="flex flex-wrap gap-2 justify-center">
                                <button
                                    onClick={() => setStep(2)}
                                    className="px-4 py-2 text-sm font-bold text-foreground/70 hover:bg-slate-100 rounded-lg transition-all"
                                >
                                    기획 수정
                                </button>
                                <button
                                    className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                                    onClick={handleDownloadAsImage}
                                >
                                    <Download size={16} /> 상세 이미지 다운로드
                                </button>
                            </div>
                        </div>

                        <div id="detail-page-container" className="flex flex-col items-center gap-0 w-full max-w-2xl mx-auto bg-white shadow-2xl rounded-sm overflow-hidden border border-line print-image-container">
                            {segments.map((seg) => (
                                <div key={seg.id} className="relative w-full aspect-[9/16] bg-slate-100 group">
                                    {seg.imageUrl ? (
                                        <>
                                            <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized 
                                                src={seg.imageUrl.startsWith('data:') ? seg.imageUrl : (seg.imageUrl.includes('?') ? `${seg.imageUrl}&t=${new Date().getTime()}` : `${seg.imageUrl}?t=${new Date().getTime()}`)}
                                                alt={seg.title}
                                                className="w-full h-full object-cover block"
                                                crossOrigin="anonymous"
                                            />
                                            <button
                                                onClick={() => handleRegenerateImage(seg.id)}
                                                className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg text-obsidian hover:text-primary no-print transition-all opacity-0 group-hover:opacity-100"
                                                title="이미지 다시 생성"
                                            >
                                                <RefreshCw size={18} className={seg.isGenerating ? 'animate-spin' : ''} />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-3 no-print">
                                            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                                            <p className="text-sm font-bold text-foreground/70">이미지 생성 중...</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <style jsx global>{`
                        @media print {
                            body * {
                                visibility: hidden;
                            }
                            .print-area, .print-area * {
                                visibility: visible;
                            }
                            .print-area {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                            }
                            .no-print {
                                display: none !important;
                            }
                            .print-image-container {
                                box-shadow: none !important;
                                border: none !important;
                                max-width: 100% !important;
                            }
                        }
                        @keyframes bounce-subtle {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-4px); }
                        }
                        .animate-bounce-subtle {
                            animation: bounce-subtle 2s infinite;
                        }
                    `}</style>

                        <div className="text-center pt-10 no-print flex flex-col items-center gap-4">
                            <button
                                onClick={() => setStep(4)}
                                className={`
                                relative group overflow-hidden px-16 py-6 
                                bg-gradient-to-r from-blue-600 to-indigo-700 
                                hover:from-blue-700 hover:to-indigo-800 
                                text-white rounded-3xl font-black text-xl 
                                shadow-[0_20px_50px_rgba(37,99,235,0.25)] 
                                hover:shadow-[0_20px_50px_rgba(37,99,235,0.4)] 
                                transition-all duration-300 flex items-center gap-4
                                ring-8 ring-blue-50/50
                            `}
                            >
                                <span className="relative z-10">상세페이지 완료 및 썸네일 생성하기 →</span>
                                <div className="bg-white/20 p-1.5 rounded-lg group-hover:translate-x-1 transition-transform">
                                    <RefreshCw size={18} />
                                </div>
                            </button>
                            <button
                                onClick={() => setStep(1)}
                                className="text-foreground/70 text-sm font-bold hover:underline"
                            >
                                처음으로 돌아가기
                            </button>
                        </div>
                    </div>
                )
            }

            {
                step === 4 && (
                    <div className="space-y-8 animate-in slide-in-from-right duration-500">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-extrabold text-obsidian">AI 썸네일 생성</h2>
                            <p className="text-foreground/70">상품의 첫인상을 결정할 프리미엄 썸네일을 만듭니다.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 items-start">
                            <div className="bg-white rounded-3xl p-8 border border-line shadow-xl space-y-6">
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-obsidian">디자인 스타일</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'premium', label: '프리미엄' },
                                            { id: 'lifestyle', label: '라이프스타일' },
                                            { id: 'clean', label: '깔끔한' },
                                            { id: 'creative', label: '크리에이티브' }
                                        ].map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => setThumbnailOptions({ ...thumbnailOptions, style: s.id })}
                                                className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${thumbnailOptions.style === s.id ? 'border-blue-600 bg-blue-50 text-primary' : 'border-slate-50 bg-surface text-foreground/70 hover:border-line'}`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-4 bg-surface rounded-2xl">
                                        <span className="text-sm font-bold text-obsidian">모델(사람) 포함</span>
                                        <input
                                            type="checkbox"
                                            checked={thumbnailOptions.includeModel}
                                            onChange={e => setThumbnailOptions({ ...thumbnailOptions, includeModel: e.target.checked })}
                                            className="w-6 h-6 accent-blue-600"
                                            aria-label="모델(사람) 포함"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-surface rounded-2xl">
                                        <span className="text-sm font-bold text-obsidian">상품명 텍스트 포함</span>
                                        <input
                                            type="checkbox"
                                            checked={thumbnailOptions.addText}
                                            onChange={e => setThumbnailOptions({ ...thumbnailOptions, addText: e.target.checked })}
                                            className="w-6 h-6 accent-blue-600"
                                            aria-label="상품명 텍스트 포함"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerateThumbnail}
                                    disabled={isGeneratingThumbnail}
                                    className={`
                                    w-full py-5 rounded-2xl font-black text-xl 
                                    bg-gradient-to-r from-blue-600 to-indigo-700 
                                    hover:from-blue-700 hover:to-indigo-800 
                                    text-white shadow-lg shadow-primary/20/50
                                    transition-all duration-300 flex items-center justify-center gap-4
                                    disabled:opacity-50
                                `}
                                >
                                    {isGeneratingThumbnail ? (
                                        <>
                                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>gleemile이 프리미엄 썸네일 생성 중...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>✨ 썸네일 생성하기</span>
                                            <div className="bg-white/20 p-1.5 rounded-lg hover:rotate-12 transition-transform">
                                                <RefreshCw size={18} />
                                            </div>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="aspect-square bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative flex items-center justify-center">
                                {thumbnailImage ? (
                                    <>
                                        <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={thumbnailImage} alt="Thumbnail" className="w-full h-full object-cover" crossOrigin="anonymous" />
                                        <button
                                            onClick={handleGenerateThumbnail}
                                            className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all"
                                            aria-label="썸네일 다시 생성"
                                        >
                                            <RefreshCw size={20} className={isGeneratingThumbnail ? 'animate-spin' : ''} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                                            <div className="w-8 h-8 text-obsidian">🖼️</div>
                                        </div>
                                        <p className="text-foreground/70 font-bold">생성된 썸네일이 여기에 표시됩니다</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-8 flex justify-center gap-4">
                            <button
                                onClick={() => setStep(3)}
                                className="px-8 py-3 text-foreground/70 font-bold hover:text-obsidian"
                            >
                                이전으로
                            </button>
                            <button
                                onClick={handleRegisterProduct}
                                disabled={!thumbnailImage || isRegistering}
                                className={`
                                relative group overflow-hidden px-16 py-6 
                                bg-gradient-to-r from-blue-600 to-indigo-700 
                                hover:from-blue-700 hover:to-indigo-800 
                                text-white rounded-3xl font-black text-2xl 
                                shadow-[0_20px_50px_rgba(37,99,235,0.3)] 
                                hover:shadow-[0_20px_50px_rgba(37,99,235,0.5)] 
                                transition-all duration-300 flex items-center gap-4 
                                disabled:opacity-50 disabled:cursor-not-allowed
                                ring-8 ring-blue-50/50
                                ${!isRegistering && thumbnailImage ? 'animate-bounce-subtle' : ''}
                            `}
                            >
                                <div className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-500 ease-in-out -skew-x-12 -translate-x-full" />
                                {isRegistering ? (
                                    <>
                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>AI 상품 등록 중...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="relative z-10">🚀 쇼핑몰에 최종 출시하기</span>
                                        <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                                            <Download size={24} className="rotate-180" />
                                        </div>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )
            }

            {
                step === 5 && (
                    <div className="text-center py-12 space-y-8 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                            ✅
                        </div>
                        <div className="space-y-2">
                            <h2 className="font-extrabold text-obsidian text-4xl">상품 등록 완료!</h2>
                            <p className="text-foreground/70 text-lg">gleemile이 기획한 상품이 쇼핑몰에 성공적으로 등록되었습니다.</p>
                        </div>

                        <div className="bg-white rounded-3xl p-8 border border-line shadow-xl max-w-xl mx-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleDownloadAll}
                                    className="p-6 bg-surface hover:bg-slate-100 rounded-2xl border border-line transition-all space-y-2 group"
                                >
                                    <div className="text-2xl group-hover:scale-110 transition-transform">📥</div>
                                    <div className="font-bold text-obsidian">이미지 저장</div>
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="p-6 bg-surface hover:bg-slate-100 rounded-2xl border border-line transition-all space-y-2 group"
                                >
                                    <div className="text-2xl group-hover:scale-110 transition-transform">📄</div>
                                    <div className="font-bold text-obsidian">PDF 기획서 소장</div>
                                </button>
                            </div>

                            <div className="pt-4 space-y-3">
                                <a
                                    href="/admin/products"
                                    className="block w-full py-4 bg-primary hover:bg-primary text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
                                >
                                    상품 관리 페이지로 이동
                                </a>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="block w-full py-4 bg-slate-100 hover:bg-slate-200 text-obsidian rounded-xl font-bold transition-all"
                                >
                                    새로운 상품 기획하기
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default DetailPlanner;
