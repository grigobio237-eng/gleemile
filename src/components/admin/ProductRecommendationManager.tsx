'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Star, 
  StarOff, 
  RefreshCw, 
  Eye,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  featuredByAdmin: boolean;
  adminRecommendationReason?: string;
  images?: Array<{ url: string }>;
  createdAt: string;
}

interface ProductRecommendationManagerProps {
  className?: string;
}

export default function ProductRecommendationManager({ 
  className = '' 
}: ProductRecommendationManagerProps) {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [recommendationReason, setRecommendationReason] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 상품 목록 조회
  const fetchProducts = async (pageNum: number = 1, search: string = '') => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', '20');
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/admin/products/recommend?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products);
        setTotalPages(data.data.pagination.pages);
      } else {
        setError(data.error || '상품을 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('상품을 불러오는 중 오류가 발생했습니다.');
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 관리자 추천 설정
  const toggleRecommendation = async (productId: string, featured: boolean, reason?: string) => {
    try {
      const response = await fetch('/api/admin/products/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          featuredByAdmin: featured,
          adminRecommendationReason: reason
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 로컬 상태 업데이트
        setProducts(products.map(product => 
          product._id === productId 
            ? { 
                ...product, 
                featuredByAdmin: featured,
                adminRecommendationReason: reason || product.adminRecommendationReason
              }
            : product
        ));
        
        setEditingProduct(null);
        setRecommendationReason('');
      } else {
        setError(data.error || '추천 설정에 실패했습니다.');
      }
    } catch (err) {
      setError('추천 설정 중 오류가 발생했습니다.');
      console.error('Toggle recommendation error:', err);
    }
  };

  // 검색 처리
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(1, searchTerm);
  };

  // 초기 로드
  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5" />
            <span>관리자 추천 상품 관리</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 검색 */}
          <form onSubmit={handleSearch} className="flex space-x-2 mb-6">
            <Input
              placeholder="상품명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              검색
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => fetchProducts(page)}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </form>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* 상품 목록 */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>로딩 중...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <Card key={product._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* 상품 이미지 */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images?.[0]?.url ? (
                            <Image 
                              src={product.images[0].url} 
                              alt={product.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-foreground/70 text-xs">
                              이미지
                            </div>
                          )}
                        </div>

                        {/* 상품 정보 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-obsidian truncate">
                            {product.name}
                          </h3>
                          <p className="text-sm text-foreground/70">
                            {product.category} • {product.price.toLocaleString()}원
                          </p>
                          {product.featuredByAdmin && product.adminRecommendationReason && (
                            <p className="text-sm text-primary mt-1">
                              추천 이유: {product.adminRecommendationReason}
                            </p>
                          )}
                        </div>

                        {/* 추천 상태 */}
                        <div className="flex items-center space-x-2">
                          <Badge variant={product.featuredByAdmin ? "default" : "secondary"}>
                            {product.featuredByAdmin ? "추천됨" : "일반"}
                          </Badge>
                        </div>
                      </div>

                      {/* 액션 버튼들 */}
                      <div className="flex items-center space-x-2 ml-4">
                        {editingProduct === product._id ? (
                          <div className="flex items-center space-x-2">
                            <Textarea
                              placeholder="추천 이유를 입력하세요..."
                              value={recommendationReason}
                              onChange={(e) => setRecommendationReason(e.target.value)}
                              className="w-48 h-20"
                            />
                            <Button
                              size="sm"
                              onClick={() => toggleRecommendation(
                                product._id, 
                                true, 
                                recommendationReason
                              )}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingProduct(null);
                                setRecommendationReason('');
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={product.featuredByAdmin}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setEditingProduct(product._id);
                                  setRecommendationReason(product.adminRecommendationReason || '');
                                } else {
                                  toggleRecommendation(product._id, false);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingProduct(product._id);
                                setRecommendationReason(product.adminRecommendationReason || '');
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {products.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-foreground/70">상품이 없습니다.</p>
                </div>
              )}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newPage = page - 1;
                  setPage(newPage);
                  fetchProducts(newPage, searchTerm);
                }}
                disabled={page === 1}
              >
                이전
              </Button>
              <span className="text-sm text-foreground/70">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                  fetchProducts(newPage, searchTerm);
                }}
                disabled={page === totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
