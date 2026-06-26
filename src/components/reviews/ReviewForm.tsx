'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Star, Upload, X, Camera } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface ReviewFormProps {
  productId: string;
  productName: string;
  onReviewSubmitted: () => void;
}

export default function ReviewForm({ productId, productName, onReviewSubmitted }: ReviewFormProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleRatingHover = (value: number) => {
    setHoveredRating(value);
  };

  const handleRatingLeave = () => {
    setHoveredRating(0);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'reviews');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '업로드 실패');
        }

        const result = await response.json();
        return result.url;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...uploadedImages]);
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageToRemove = images[index];
    
    // Vercel Blob URL인 경우 서버에서도 삭제
    if (imageToRemove.includes('blob.vercel-storage.com')) {
      try {
        await fetch('/api/upload/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: imageToRemove }),
        });
      } catch (error) {
        console.error('이미지 삭제 오류:', error);
        // 서버 삭제 실패해도 UI에서는 제거
      }
    }
    
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (rating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }

    if (content.trim().length < 10) {
      alert('리뷰 내용을 10자 이상 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim() || undefined,
          content: content.trim(),
          images,
        }),
      });

      if (response.ok) {
        alert('리뷰가 작성되었습니다. 관리자 승인 후 게시됩니다.');
        // 폼 초기화
        setRating(0);
        setTitle('');
        setContent('');
        setImages([]);
        onReviewSubmitted(); // 부모 컴포넌트에 알림
      } else {
        const errorData = await response.json();
        alert(`리뷰 작성 실패: ${errorData.error}`);
      }
    } catch (error) {
      console.error('리뷰 작성 중 오류:', error);
      alert('리뷰 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingText = (rating: number) => {
    const texts = ['', '별로에요', '그저 그래요', '보통이에요', '좋아요', '최고에요'];
    return texts[rating] || '';
  };

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-semibold text-obsidian mb-2">
            리뷰를 작성하려면 로그인이 필요합니다
          </h3>
          <p className="text-obsidian mb-4">
            로그인 후 {productName}에 대한 리뷰를 작성해보세요.
          </p>
          <Button asChild>
            <a href="/auth/signin">로그인하기</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Star className="h-5 w-5 mr-2 text-yellow-400" />
          리뷰 작성
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 상품 정보 */}
          <div className="bg-surface p-4 rounded-lg">
            <h4 className="font-medium text-obsidian">{productName}</h4>
            <p className="text-sm text-obsidian">리뷰를 작성할 상품입니다.</p>
          </div>

          {/* 별점 평가 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-obsidian">
              별점 평가 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleRatingClick(value)}
                  onMouseEnter={() => handleRatingHover(value)}
                  onMouseLeave={handleRatingLeave}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      value <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 hover:text-yellow-200'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-3 text-sm text-obsidian">
                {getRatingText(hoveredRating || rating)}
              </span>
            </div>
          </div>

          {/* 리뷰 제목 (선택사항) */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-obsidian">
              리뷰 제목 (선택사항)
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="리뷰 제목을 입력해주세요"
              maxLength={100}
            />
            <p className="text-xs text-foreground/70">{title.length}/100자</p>
          </div>

          {/* 리뷰 내용 */}
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium text-obsidian">
              리뷰 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="상품에 대한 솔직한 리뷰를 작성해주세요. (10자 이상)"
              className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary/30"
              maxLength={1000}
            />
            <p className="text-xs text-foreground/70">{content.length}/1000자</p>
          </div>

          {/* 이미지 업로드 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-obsidian">
              리뷰 이미지 (선택사항)
            </label>
            <div className="space-y-3">
              {/* 업로드 버튼 */}
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-20 border-dashed border-2 border-gray-300 hover:border-gray-400"
                  disabled={uploading}
                >
                  <div className="flex flex-col items-center space-y-2">
                    {uploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    ) : (
                      <>
                        <Camera className="h-6 w-6 text-foreground/70" />
                        <span className="text-sm text-obsidian">
                          사진을 업로드하세요 (최대 5장)
                        </span>
                      </>
                    )}
                  </div>
                </Button>
              </div>

              {/* 업로드된 이미지들 */}
              {images.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized                         src={image}
                        alt={`리뷰 이미지 ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-foreground/70">
              • 상품과 관련된 사진을 업로드해주세요
              • 최대 5장까지 업로드 가능합니다
              • 각 이미지는 10MB 이하로 제한됩니다
            </p>
          </div>

          {/* 작성 가이드 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">리뷰 작성 가이드</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 상품의 품질, 배송, 포장에 대한 솔직한 평가를 해주세요</li>
              <li>• 개인정보나 연락처는 포함하지 마세요</li>
              <li>• 욕설이나 비방성 내용은 금지됩니다</li>
              <li>• 관리자 승인 후 게시됩니다</li>
            </ul>
          </div>

          {/* 제출 버튼 */}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRating(0);
                setTitle('');
                setContent('');
                setImages([]);
              }}
              className="flex-1"
            >
              초기화
            </Button>
            <Button
              type="submit"
              disabled={rating === 0 || content.trim().length < 10 || submitting}
              className="flex-1"
            >
              {submitting ? '작성 중...' : '리뷰 작성하기'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
