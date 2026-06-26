'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { History, ShoppingCart, Heart, Trash2 } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  price: number;
  minPrice?: number;
  maxPrice?: number;
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
}

interface RecentlyViewedProps {
  currentProductId?: string;
}

export default function RecentlyViewed({ currentProductId }: RecentlyViewedProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecentlyViewed();
  }, [currentProductId]);

  const loadRecentlyViewed = () => {
    const saved = localStorage.getItem('recentlyViewed');
    if (saved) {
      try {
        let products = JSON.parse(saved);
        // 현재 상품 제외
        if (currentProductId) {
          products = products.filter((p: Product) => p._id !== currentProductId);
        }
        // 최근 10개만 표시
        products = products.slice(0, 10);
        setProducts(products);
      } catch (error) {
        console.error('최근 본 상품 로드 오류:', error);
      }
    }
  };

  const saveRecentlyViewed = (product: Product) => {
    const saved = localStorage.getItem('recentlyViewed');
    let products = saved ? JSON.parse(saved) : [];

    // 중복 제거
    products = products.filter((p: Product) => p._id !== product._id);

    // 맨 앞에 추가
    products.unshift(product);

    // 최대 20개까지 저장
    products = products.slice(0, 20);

    localStorage.setItem('recentlyViewed', JSON.stringify(products));
    setProducts(products);
  };

  const removeFromRecentlyViewed = (productId: string) => {
    const saved = localStorage.getItem('recentlyViewed');
    if (saved) {
      try {
        const products = JSON.parse(saved);
        const newProducts = products.filter((p: Product) => p._id !== productId);
        localStorage.setItem('recentlyViewed', JSON.stringify(newProducts));
        setProducts(newProducts);
      } catch (error) {
        console.error('최근 본 상품 삭제 오류:', error);
      }
    }
  };

  const clearRecentlyViewed = () => {
    if (confirm('최근 본 상품 목록을 모두 삭제하시겠습니까?')) {
      localStorage.removeItem('recentlyViewed');
      setProducts([]);
    }
  };

  const handleAddToCart = async (productId: string, productName: string) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            최근 본 상품
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <History className="h-12 w-12 text-foreground/70 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-obsidian mb-2">
            최근 본 상품이 없습니다
          </h3>
          <p className="text-obsidian mb-4">
            상품을 둘러보시면 여기에 표시됩니다.
          </p>
          <Button asChild>
            <Link href="/products">상품 둘러보기</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              최근 본 상품 ({products.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={clearRecentlyViewed}
              className="flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              전체 삭제
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex space-x-4 pb-2">
              {products.map((product) => (
                <div key={product._id} className="flex-shrink-0 w-48 group">
                  <div className="relative">
                    <Link href={`/products/${product._id}`}>
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        {product.images.length > 0 ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.name}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground/70">
                            <Heart className="h-12 w-12" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* 삭제 버튼 */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFromRecentlyViewed(product._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    {/* 품절 배지 */}
                    {product.stock === 0 && (
                      <Badge className="absolute top-2 left-2" variant="destructive">
                        품절
                      </Badge>
                    )}

                    {/* 인기 배지 */}
                    {product.featured && (
                      <Badge className="absolute top-2 right-2 bg-yellow-100 text-yellow-800">
                        인기
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    {/* 카테고리 */}
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>

                    {/* 상품명 */}
                    <h4 className="font-medium text-sm line-clamp-2">
                      <Link
                        href={`/products/${product._id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {product.name}
                      </Link>
                    </h4>

                    {/* 가격 */}
                    <div>
                      <div className="font-bold text-primary">
                        {product.category === 'stem-cell' && (product.minPrice || product.maxPrice) ? (
                          <>
                            {formatPrice(product.minPrice || 0)} ~ {formatPrice(product.maxPrice || 0)}
                          </>
                        ) : (
                          formatPrice(product.price)
                        )}
                      </div>
                      {product.originalPrice && product.originalPrice > product.price && product.category !== 'stem-cell' && (
                        <div className="text-xs text-foreground/70 line-through">
                          {formatPrice(product.originalPrice)}
                        </div>
                      )}
                    </div>

                    {/* 장바구니 버튼 */}
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleAddToCart(product._id, product.name)}
                      disabled={product.stock === 0 || loading}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      {product.stock === 0 ? '품절' : '담기'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 최근 본 상품 추가 함수 (상품 상세페이지에서 사용)
export function addToRecentlyViewed(product: Product) {
  const saved = localStorage.getItem('recentlyViewed');
  let products = saved ? JSON.parse(saved) : [];

  // 중복 제거
  products = products.filter((p: Product) => p._id !== product._id);

  // 맨 앞에 추가
  products.unshift(product);

  // 최대 20개까지 저장
  products = products.slice(0, 20);

  localStorage.setItem('recentlyViewed', JSON.stringify(products));
}
