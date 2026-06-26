'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, Heart, Star } from 'lucide-react';

interface RelatedProduct {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: Array<{
    url: string;
    w?: number;
    h?: number;
  }>;
  category: string;
  summary: string;
  stock: number;
  featured: boolean;
  recommendationReason: string;
}

interface RelatedProductsProps {
  productId: string;
  currentProductName: string;
  currentProductCategory: string;
}

export default function RelatedProducts({ 
  productId, 
  currentProductName, 
  currentProductCategory 
}: RelatedProductsProps) {
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedProducts();
  }, [productId]);

  const fetchRelatedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/recommend?productId=${productId}&limit=6`);
      const data = await response.json();

      if (response.ok) {
        setProducts(data.recommendations || []);
      } else {
        console.error('관련 상품 조회 실패:', data.error);
      }
    } catch (error) {
      console.error('관련 상품 조회 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: string, productName: string) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });

      if (response.ok) {
        alert(`${productName}이(가) 장바구니에 추가되었습니다!`);
      } else {
        const errorData = await response.json();
        alert(`장바구니 추가 실패: ${errorData.error}`);
      }
    } catch (error) {
      console.error('장바구니 추가 중 오류:', error);
      alert('장바구니 추가 중 오류가 발생했습니다.');
    }
  };

  const getRecommendationBadgeColor = (reason: string) => {
    switch (reason) {
      case '같은 카테고리':
        return 'bg-primary-container text-blue-800';
      case '비슷한 가격대':
        return 'bg-green-100 text-green-800';
      case '인기 상품':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-secondary-container text-purple-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-obsidian">관련 상품</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <div className="aspect-square bg-gray-200 animate-pulse rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 animate-pulse rounded mb-2" />
                <div className="h-3 bg-gray-200 animate-pulse rounded mb-2" />
                <div className="h-6 bg-gray-200 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-obsidian mb-2">
          관련 상품
        </h2>
        <p className="text-obsidian">
          {currentProductName}과(와) 함께 보면 좋은 상품들
        </p>
      </div>

      {/* 상품 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {products.map((product) => (
          <Card key={product._id} className="group hover:shadow-lg transition-shadow duration-300">
            <Link href={`/products/${product._id}`}>
              <div className="aspect-square relative bg-gray-100 rounded-t-lg overflow-hidden">
                {product.images.length > 0 ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 16vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-foreground/70">
                    <Heart className="h-12 w-12" />
                  </div>
                )}
                
                {/* 추천 이유 배지 */}
                <Badge 
                  className={`absolute top-2 left-2 text-xs ${getRecommendationBadgeColor(product.recommendationReason)}`}
                >
                  {product.recommendationReason}
                </Badge>

                {/* 품절 배지 */}
                {product.stock === 0 && (
                  <Badge className="absolute top-2 right-2" variant="destructive">
                    품절
                  </Badge>
                )}

                {/* 인기 상품 배지 */}
                {product.featured && (
                  <Badge className="absolute bottom-2 right-2 bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    인기
                  </Badge>
                )}
              </div>
            </Link>
            
            <CardContent className="p-4">
              {/* 카테고리 */}
              <div className="mb-2">
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
              </div>
              
              {/* 상품명 */}
              <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                <Link 
                  href={`/products/${product._id}`}
                  className="hover:text-primary transition-colors"
                >
                  {product.name}
                </Link>
              </h3>
              
              {/* 요약 */}
              <p className="text-xs text-obsidian mb-3 line-clamp-2">
                {product.summary}
              </p>
              
              {/* 가격 */}
              <div className="mb-3">
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs text-foreground/70 line-through block">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                <span className="text-lg font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
              </div>
              
              {/* 액션 버튼 */}
              <Button
                size="sm"
                onClick={() => handleAddToCart(product._id, product.name)}
                disabled={product.stock === 0}
                className="w-full"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                {product.stock === 0 ? '품절' : '담기'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 더 많은 상품 보기 */}
      <div className="text-center">
        <Button variant="outline" asChild>
          <Link href={`/products?category=${currentProductCategory}`}>
            {currentProductCategory} 카테고리 더 보기
          </Link>
        </Button>
      </div>
    </div>
  );
}
