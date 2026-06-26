'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Upload,
  X,
  Image as ImageIcon,
  GripVertical,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface ImageItem {
  url: string;
  w?: number;
  h?: number;
  type?: string;
}

interface ImageManagerProps {
  images: ImageItem[];
  onImagesChange: (images: ImageItem[]) => void;
  maxImages?: number;
}

export default function ImageManager({
  images,
  onImagesChange,
  maxImages = 10
}: ImageManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // 이미지 업로드
  const handleImageUpload = async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      toast.error(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`);
      return;
    }

    setUploading(true);
    const newImages: ImageItem[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 파일 크기 검증 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}은(는) 5MB를 초과합니다.`);
          continue;
        }

        // 이미지 타입 검증
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name}은(는) 이미지 파일이 아닙니다.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('이미지 업로드 실패');
        }

        const result = await response.json();
        newImages.push({
          url: result.url,
          w: result.width,
          h: result.height,
          type: file.type,
        });
      }

      onImagesChange([...images, ...newImages]);
      toast.success(`${newImages.length}개의 이미지가 업로드되었습니다.`);
    } catch (error) {
      console.error('이미지 업로드 에러:', error);
      toast.error('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 이미지 삭제
  const handleImageDelete = async (index: number) => {
    const imageToDelete = images[index];

    try {
      // Vercel Blob에서 이미지 삭제
      const response = await fetch('/api/upload/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: imageToDelete.url }),
      });

      if (!response.ok) {
        throw new Error('이미지 삭제 실패');
      }

      // 로컬 상태에서 이미지 제거
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
      toast.success('이미지가 삭제되었습니다.');
    } catch (error) {
      console.error('이미지 삭제 에러:', error);
      toast.error('이미지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 이미지 순서 변경
  const handleImageReorder = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== dropIndex) {
      handleImageReorder(dragIndex, dropIndex);
    }
    setDragIndex(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <ImageIcon className="h-5 w-5 mr-2 text-primary" />
          상품 이미지 관리
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 업로드 섹션 */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto text-foreground/70 mb-2" />
          <Label htmlFor="image-upload" className="cursor-pointer">
            <span className="text-sm font-medium text-primary hover:text-primary">
              이미지 업로드
            </span>
            <span className="text-xs text-foreground/70 block mt-1">
              클릭하거나 드래그하여 업로드 (최대 {maxImages}개, 5MB 이하)
            </span>
          </Label>
          <Input
            id="image-upload"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
            disabled={uploading}
          />
        </div>

        {/* 업로드 중 표시 */}
        {uploading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-sm text-obsidian mt-2">이미지 업로드 중...</p>
          </div>
        )}

        {/* 이미지 목록 */}
        {images.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-obsidian">
              업로드된 이미지 ({images.length}/{maxImages})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="relative group border rounded-lg overflow-hidden bg-surface"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  {/* 드래그 핸들 */}
                  <div className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-foreground/70 cursor-move" />
                  </div>

                  {/* 이미지 */}
                  <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized                     src={image.url}
                    alt={`상품 이미지 ${index + 1}`}
                    className="w-full h-24 object-cover"
                    crossOrigin="anonymous" // 교차 출처 리소스 허용 (COEP 대응)
                  />

                  {/* 삭제 버튼 */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleImageDelete(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* 이미지 정보 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                    <div className="truncate">
                      {image.w && image.h ? `${image.w}×${image.h}` : '이미지'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        {images.length === 0 && !uploading && (
          <div className="text-center py-8 text-foreground/70">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">아직 업로드된 이미지가 없습니다.</p>
            <p className="text-xs mt-1">위의 업로드 영역을 클릭하여 이미지를 추가하세요.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
