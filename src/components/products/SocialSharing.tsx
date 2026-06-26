'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Share2, 
  MessageCircle, 
  Mail, 
  Link as LinkIcon,
  Copy,
  Check
} from 'lucide-react';

interface SocialSharingProps {
  productName: string;
  productUrl: string;
  productImage?: string;
  productPrice?: number;
}

export default function SocialSharing({ 
  productName, 
  productUrl, 
  productImage, 
  productPrice 
}: SocialSharingProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = `"${productName}"${productPrice ? ` - ${productPrice.toLocaleString()}원` : ''}를 확인해보세요!`;
  const encodedUrl = encodeURIComponent(productUrl);
  const encodedText = encodeURIComponent(shareText);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    kakao: `https://story.kakao.com/share?url=${encodedUrl}&text=${encodedText}`,
    email: `mailto:?subject=${encodeURIComponent(productName)}&body=${encodedText}%0A%0A${encodedUrl}`,
  };

  const handleShare = (platform: string) => {
    const url = shareLinks[platform as keyof typeof shareLinks];
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowShareMenu(false);
    } catch (error) {
      console.error('링크 복사 실패:', error);
      // 폴백: 텍스트 영역 사용
      const textArea = document.createElement('textarea');
      textArea.value = productUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowShareMenu(false);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: shareText,
          url: productUrl,
        });
        setShowShareMenu(false);
      } catch (error) {
        console.error('네이티브 공유 실패:', error);
      }
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowShareMenu(!showShareMenu)}
        className="flex items-center space-x-2"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            <span>복사됨</span>
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            <span>공유하기</span>
          </>
        )}
      </Button>

      {showShareMenu && (
        <>
          {/* 오버레이 */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowShareMenu(false)}
          />
          
          {/* 공유 메뉴 */}
          <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-20">
            <div className="p-4">
              <h4 className="font-medium text-obsidian mb-3">공유하기</h4>
              
              <div className="space-y-2">
                {/* 네이티브 공유 (모바일) */}
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <Button
                    variant="ghost"
                    onClick={handleNativeShare}
                    className="w-full justify-start"
                  >
                    <Share2 className="h-4 w-4 mr-3" />
                    공유하기
                  </Button>
                )}
                
                {/* 링크 복사 */}
                <Button
                  variant="ghost"
                  onClick={handleCopyLink}
                  className="w-full justify-start"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-3 text-green-600" />
                      <span className="text-green-600">링크 복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-3" />
                      링크 복사
                    </>
                  )}
                </Button>

                
                {/* 카카오톡 */}
                <Button
                  variant="ghost"
                  onClick={() => handleShare('kakao')}
                  className="w-full justify-start"
                >
                  <MessageCircle className="h-4 w-4 mr-3 text-yellow-500" />
                  카카오톡
                </Button>
                
                {/* 이메일 */}
                <Button
                  variant="ghost"
                  onClick={() => handleShare('email')}
                  className="w-full justify-start"
                >
                  <Mail className="h-4 w-4 mr-3 text-obsidian" />
                  이메일
                </Button>
              </div>
              
              {/* 상품 정보 미리보기 */}
              <div className="mt-4 p-3 bg-surface rounded-lg">
                <div className="text-sm text-obsidian">
                  <div className="font-medium text-obsidian line-clamp-2">
                    {productName}
                  </div>
                  {productPrice && (
                    <div className="text-primary font-medium">
                      {productPrice.toLocaleString()}원
                    </div>
                  )}
                  <div className="text-xs text-foreground/70 mt-1">
                    {productUrl}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 간단한 공유 버튼 (상품 카드에서 사용)
export function SimpleShareButton({ 
  productName, 
  productUrl, 
  productPrice 
}: {
  productName: string;
  productUrl: string;
  productPrice?: number;
}) {
  const [copied, setCopied] = useState(false);

  const handleQuickShare = async () => {
    const shareText = `"${productName}"${productPrice ? ` - ${productPrice.toLocaleString()}원` : ''}를 확인해보세요!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: shareText,
          url: productUrl,
        });
      } catch (error) {
        console.error('네이티브 공유 실패:', error);
      }
    } else {
      // 링크 복사
      try {
        await navigator.clipboard.writeText(productUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('링크 복사 실패:', error);
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleQuickShare}
      className="flex items-center"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-1 text-green-600" />
          <span className="text-green-600">복사됨</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 mr-1" />
          공유
        </>
      )}
    </Button>
  );
}
