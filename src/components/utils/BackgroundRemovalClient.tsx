'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, RefreshCw, Shield, AlertTriangle, Info } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as bodyPix from '@tensorflow-models/body-pix';
import Image from 'next/image';

interface BackgroundRemovalClientProps {
    onComplete?: () => void;
}

export default function BackgroundRemovalClient({ onComplete }: BackgroundRemovalClientProps) {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // BodyPix Model State
    const [bodyPixModel, setBodyPixModel] = useState<bodyPix.BodyPix | null>(null);
    const [modelLoading, setModelLoading] = useState(true);

    // Load BodyPix model on mount
    useEffect(() => {
        const loadBodyPix = async () => {
            try {
                await tf.ready();
                const net = await bodyPix.load({
                    architecture: 'MobileNetV1',
                    outputStride: 16,
                    multiplier: 0.75,
                    quantBytes: 2
                });
                setBodyPixModel(net);
                setModelLoading(false);
                console.log('BodyPix model loaded');
            } catch (err) {
                console.error('Error loading BodyPix:', err);
                setError('gleemile 모델을 로드하는 중 오류가 발생했습니다. 브라우저를 새로고침해주세요.');
                setModelLoading(false);
            }
        };
        loadBodyPix();
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleImageFile(file);
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImageFile(file);
    };

    const handleImageFile = (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            setError('이미지 크기는 10MB 이하여야 합니다');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setOriginalImage(e.target?.result as string);
            setProcessedImage(null);
            setError('');
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveBackground = async () => {
        if (!originalImage || !bodyPixModel) return;

        setLoading(true);
        setError('');

        try {
            const imgElement = document.createElement('img');
            imgElement.src = originalImage;
            await new Promise((resolve) => { imgElement.onload = resolve; });

            // Person Segmentation
            const segmentation = await bodyPixModel.segmentPerson(imgElement, {
                flipHorizontal: false,
                internalResolution: 'medium',
                segmentationThreshold: 0.7,
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = imgElement.width;
            canvas.height = imgElement.height;

            if (!ctx) throw new Error('Canvas Context Error');

            // Draw Original Image
            ctx.drawImage(imgElement, 0, 0);

            // Get Image Data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixelData = imageData.data;

            // Apply Mask (Make non-person pixels transparent)
            for (let i = 0; i < pixelData.length; i += 4) {
                if (segmentation.data[i / 4] === 0) { // 0: Background, 1: Person
                    pixelData[i + 3] = 0; // Set Alpha to 0
                }
            }

            // Update Canvas
            ctx.putImageData(imageData, 0, 0);

            // Result
            setProcessedImage(canvas.toDataURL('image/png'));
            onComplete?.();

        } catch (err) {
            console.error('Processing error:', err);
            setError('배경 제거 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!processedImage) return;
        const link = document.createElement('a');
        link.href = processedImage;
        link.download = 'youniqle-portrait-nobg.png';
        link.click();
    };

    const handleReset = () => {
        setOriginalImage(null);
        setProcessedImage(null);
        setError('');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 text-sm text-secondary bg-emerald-50 px-4 py-2 rounded-lg">
                <Shield className="h-4 w-4" />
                <span className="font-medium">프라이버시 보호: 이미지는 서버로 전송되지 않습니다</span>
            </div>

            {/* Info Alert: Portrait Only */}
            <div className="bg-blue-50 border border-primary/30 rounded-lg p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                    <h4 className="font-bold text-blue-800 text-sm">인물 사진 전용 도구입니다</h4>
                    <p className="text-sm text-primary mt-1">
                        이 도구는 사람을 인식하여 배경을 제거하도록 최적화되어 있습니다. <br />
                        제품, 동물, 자동차 등의 사물 사진은 배경 제거가 제대로 되지 않을 수 있습니다.
                    </p>
                </div>
            </div>

            {/* Upload Area */}
            {!originalImage && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ${isDragging ? 'border-primary/30 bg-blue-50 scale-[1.02]' : 'border-gray-300 bg-surface hover:border-gray-400'}`}
                >
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileInput}
                        aria-label="인물 사진 업로드"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 mb-4 rounded-full bg-primary-container text-primary flex items-center justify-center">
                            <Upload className="h-10 w-10" />
                        </div>
                        <h3 className="font-bold text-obsidian mb-2 text-xl">인물 사진을 업로드하세요</h3>
                        <p className="text-obsidian mb-4">JPG, PNG (최대 10MB)</p>
                        <Button size="lg" className="mt-2" disabled={modelLoading}>
                            {modelLoading ? 'gleemile 모델 로딩 중...' : '파일 선택'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Processing & Preview */}
            {originalImage && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-bold mb-4 text-center">원본 이미지</h3>
                        <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[300px]">
                            <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={originalImage} alt="Original" className="max-w-full max-h-96 rounded-lg" />
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-bold mb-4 text-center">배경 제거 결과</h3>
                        <div className="rounded-lg p-4 flex items-center justify-center min-h-[300px] checkerboard-bg">
                            <style jsx>{`
                                .checkerboard-bg {
                                    background-image: linear-gradient(45deg, #e5e7eb 25%, transparent 25%), 
                                                    linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), 
                                                    linear-gradient(45deg, transparent 75%, #e5e7eb 75%), 
                                                    linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
                                    background-size: 20px 20px;
                                }
                            `}</style>
                            {processedImage ? (
                                <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={processedImage} alt="Processed" className="max-w-full max-h-96 rounded-lg" />
                            ) : (
                                <div className="text-center text-foreground/70">
                                    {loading ? (
                                        <div className="space-y-4">
                                            <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary" />
                                            <p className="text-obsidian font-medium">인물 인식 중...</p>
                                        </div>
                                    ) : (
                                        <p>아래 버튼을 클릭하세요</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
                    <AlertTriangle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {originalImage && (
                <div className="flex gap-3">
                    {!processedImage && !loading && (
                        <Button
                            onClick={handleRemoveBackground}
                            size="lg"
                            className="flex-1"
                            disabled={!bodyPixModel}
                        >
                            <RefreshCw className="h-5 w-5 mr-2" />
                            {bodyPixModel ? '배경 제거하기' : '모델 로딩 중...'}
                        </Button>
                    )}
                    {processedImage && (
                        <>
                            <Button onClick={handleDownload} size="lg" className="flex-1">
                                <Download className="h-5 w-5 mr-2" />
                                PNG 다운로드
                            </Button>
                            <Button onClick={handleReset} size="lg" variant="outline">
                                다시 시작
                            </Button>
                        </>
                    )}
                </div>
            )}

            <div className="bg-surface p-4 rounded-lg text-xs text-foreground/70 text-center">
                Powered by TensorFlow.js (BodyPix) • Free & Secure • Portrait Only
            </div>
        </div>
    );
}
