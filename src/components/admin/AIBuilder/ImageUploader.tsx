'use client';

import React, { useRef } from 'react';
import Image from 'next/image';

interface ImageUploaderProps {
    label: string;
    onImageSelected: (base64: string) => void;
    preview?: string;
    isRemovingBackground?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ label, onImageSelected, preview, isRemovingBackground }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onImageSelected(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-obsidian">{label}</label>
            <div
                onClick={() => !isRemovingBackground && fileInputRef.current?.click()}
                className={`relative group cursor-pointer border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center transition-all hover:border-primary/30 hover:bg-blue-50/30 ${isRemovingBackground ? 'opacity-50 cursor-wait' : ''}`}
            >
                {preview ? (
                    <div className="w-full h-48 rounded-lg overflow-hidden relative">
                        <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized 
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-contain"
                            crossOrigin="anonymous"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-sm font-medium">
                            {isRemovingBackground ? '배경 제거 중...' : '이미지 변경하기'}
                        </div>
                    </div>
                ) : (
                    <div className="py-8 flex flex-col items-center">
                        {isRemovingBackground ? (
                            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-3" />
                        ) : (
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-foreground/70 group-hover:text-primary transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                                </svg>
                            </div>
                        )}
                        <p className="text-sm text-foreground/70 font-medium">
                            {isRemovingBackground ? 'gleemile이 제품 배경을 제거하는 중입니다' : '클릭하거나 파일을 드래그하세요'}
                        </p>
                        <p className="text-xs text-foreground/70 mt-1">PNG, JPG (최대 5MB)</p>
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isRemovingBackground}
                    aria-label={label}
                />
            </div>
        </div>
    );
};

export default ImageUploader;
