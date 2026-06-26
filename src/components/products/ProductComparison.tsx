'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { 
  GitCompare, 
  Plus, 
  X, 
  ShoppingCart, 
  Heart, 
  Star,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
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
}

interface ProductComparisonProps {
  currentProductId: string;
}

export default function ProductComparison({ currentProductId }: ProductComparisonProps) {
  const [comparisonProducts, setComparisonProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComparisonProducts();
  }, [currentProductId]);

  const loadComparisonProducts = () => {
    const saved = localStorage.getItem('productComparison');
    if (saved) {
      try {
        const products = JSON.parse(saved);
        setComparisonProducts(products);
      } catch (error) {
        console.error('비교 상품 로드 오류:', error);
      }
    }
  };

  const saveComparisonProducts = (products: Product[]) => {
    localStorage.setItem('productComparison', JSON.stringify(products));
    setComparisonProducts(products);
  };

  const addToComparison = async (productId: string) => {
    if (comparisonProducts.some(p => p._id === productId)) {
      alert('이미 비교 목록에 있는 상품입니다.');
      return;
    }

    if (comparisonProducts.length >= 3) {
      alert('최대 3개 상품까지 비교할 수 있습니다.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        const newProducts = [...comparisonProducts, data.product];
        saveComparisonProducts(newProducts);
        alert('비교 목록에 추가되었습니다.');
      } else {
        alert('상품 정보를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('상품 정보 조회 오류:', error);
      alert('상품 정보 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const removeFromComparison = (productId: string) => {
    const newProducts = comparisonProducts.filter(p => p._id !== productId);
    saveComparisonProducts(newProducts);
  };

  const clearComparison = () => {
    if (confirm('비교 목록을 모두 삭제하시겠습니까?')) {
      saveComparisonProducts([]);
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

  if (comparisonProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GitCompare className="h-5 w-5 mr-2" />
            상품 비교
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <GitCompare className="h-12 w-12 text-foreground/70 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-obsidian mb-2">
            비교할 상품이 없습니다
          </h3>
          <p className="text-obsidian mb-4">
            다른 상품 페이지에서 비교 버튼을 눌러 상품을 추가해보세요.
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
              <GitCompare className="h-5 w-5 mr-2" />
              상품 비교 ({comparisonProducts.length}/3)
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={clearComparison}
              className="flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              전체 삭제
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-4 gap-4">
                {/* 헤더 */}
                <div className="space-y-4">
                  <div className="h-32 flex items-center justify-center bg-surface rounded-lg">
                    <span className="text-sm text-obsidian">비교 항목</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">상품명</div>
                    <div className="font-medium">가격</div>
                    <div className="font-medium">카테고리</div>
                    <div className="font-medium">재고</div>
                    <div className="font-medium">특징</div>
                  </div>
                </div>

                {/* 상품들 */}
                {comparisonProducts.map((product) => (
                  <div key={product._id} className="space-y-4">
                    {/* 상품 이미지 */}
                    <div className="relative">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        {product.images.length > 0 ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.name}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground/70">
                            <Heart className="h-12 w-12" />
                          </div>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 p-0"
                        onClick={() => removeFromComparison(product._id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* 상품 정보 */}
                    <div className="space-y-2 text-sm">
                      <div>
                        <Link 
                          href={`/products/${product._id}`}
                          className="font-medium text-primary hover:underline line-clamp-2"
                        >
                          {product.name}
                        </Link>
                      </div>
                      <div>
                        <div className="font-bold text-primary">
                          {formatPrice(product.price)}
                        </div>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="text-xs text-foreground/70 line-through">
                            {formatPrice(product.originalPrice)}
                          </div>
                        )}
                      </div>
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                      </div>
                      <div>
                        <span className={`font-medium ${
                          product.stock > 10 ? 'text-green-600' :
                          product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {product.stock > 0 ? `${product.stock}개` : '품절'}
                        </span>
                      </div>
                      <div>
                        {product.featured && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            인기
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleAddToCart(product._id, product.name)}
                        disabled={product.stock === 0}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        {product.stock === 0 ? '품절' : '담기'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link href={`/products/${product._id}`}>
                          상세보기
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 비교 버튼 컴포넌트 (다른 상품 카드에서 사용)
export function ComparisonButton({ productId }: { productId: string }) {
  const [isInComparison, setIsInComparison] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkComparisonStatus();
  }, [productId]);

  const checkComparisonStatus = () => {
    const saved = localStorage.getItem('productComparison');
    if (saved) {
      try {
        const products = JSON.parse(saved);
        setIsInComparison(products.some((p: Product) => p._id === productId));
      } catch (error) {
        console.error('비교 상태 확인 오류:', error);
      }
    }
  };

  const handleToggleComparison = async () => {
    if (isInComparison) {
      // 비교 목록에서 제거
      const saved = localStorage.getItem('productComparison');
      if (saved) {
        try {
          const products = JSON.parse(saved);
          const newProducts = products.filter((p: Product) => p._id !== productId);
          localStorage.setItem('productComparison', JSON.stringify(newProducts));
          setIsInComparison(false);
        } catch (error) {
          console.error('비교 목록 업데이트 오류:', error);
        }
      }
    } else {
      // 비교 목록에 추가
      setLoading(true);
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (response.ok) {
          const data = await response.json();
          const saved = localStorage.getItem('productComparison');
          const existingProducts = saved ? JSON.parse(saved) : [];
          
          if (existingProducts.length >= 3) {
            alert('최대 3개 상품까지 비교할 수 있습니다.');
            return;
          }
          
          const newProducts = [...existingProducts, data.product];
          localStorage.setItem('productComparison', JSON.stringify(newProducts));
          setIsInComparison(true);
        } else {
          alert('상품 정보를 가져올 수 없습니다.');
        }
      } catch (error) {
        console.error('상품 정보 조회 오류:', error);
        alert('상품 정보 조회 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Button
      variant={isInComparison ? "default" : "outline"}
      size="sm"
      onClick={handleToggleComparison}
      disabled={loading}
      className="flex items-center"
    >
      <GitCompare className="h-4 w-4 mr-1" />
      {isInComparison ? '비교 중' : '비교하기'}
    </Button>
  );
}
