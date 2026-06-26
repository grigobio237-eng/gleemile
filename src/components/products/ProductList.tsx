'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { Heart, ShoppingCart } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: Array<{
    url: string;
    w?: number;
    h?: number;
  }>;
  summary: string;
  category: string;
  isGalleryArt?: boolean;
  artistName?: string;
}

interface ProductListProps {
  searchParams: {
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
    isFunding?: string; // Added isFunding parameter
  };
}

export default function ProductList({ searchParams }: ProductListProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (searchParams.q) params.append('q', searchParams.q);
        if (searchParams.category) params.append('category', searchParams.category);
        if (searchParams.sort) params.append('sort', searchParams.sort);
        if (searchParams.page) params.append('page', searchParams.page);
        if (searchParams.isFunding) params.append('isFunding', searchParams.isFunding);

        // 관리자용 프리뷰 모드 추가
        if (['admin', 'superadmin'].includes((session?.user as any)?.role)) {
          params.append('preview', 'true');
        }

        const response = await fetch(`/api/products?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // 환경에 따라 느릴 수 있으므로 30초 타임아웃으로 연장
          signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.products) {
          setProducts(data.products);
          setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
        } else {
          console.error('Invalid response format:', data);
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
        setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams, session]);

  const router = useRouter();
  const { addToCart, loading: cartLoading } = useCart();

  const handleAddToCart = async (productId: string) => {
    if (!session) {
      if (confirm('로그인이 필요한 서비스입니다. 회원가입 하시겠습니까?')) {
        router.push(`/auth/signup?callbackUrl=${encodeURIComponent(window.location.href)}`);
      }
      return;
    }

    const success = await addToCart(productId, 1);
    if (success) {
      alert('장바구니에 추가되었습니다.');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="border-line shadow-sm overflow-hidden rounded-[24px] bg-white">
            <div className="aspect-square bg-slate-100 animate-pulse rounded-t-[24px]" />
            <CardContent className="p-3 sm:p-5">
              <div className="h-4 bg-slate-100 animate-pulse rounded mb-2 w-3/4" />
              <div className="h-3 bg-slate-100 animate-pulse rounded mb-4 w-full" />
              <div className="flex justify-between items-center gap-2">
                <div className="h-6 bg-slate-100 animate-pulse rounded w-16" />
                <div className="h-8 bg-slate-100 animate-pulse rounded w-10 sm:w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary text-lg">상품을 찾을 수 없습니다.</p>
        <p className="text-text-secondary text-sm mt-2">
          다른 검색어로 시도해보세요.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
        {products.map((product) => {
          const productLink = product.isGalleryArt 
            ? `/gallery/artworks/${product._id}` 
            : `/products/${product._id}`;
            
          const categoryLabel = product.isGalleryArt 
            ? `Fine Art • ${product.category === 'sleep-relax' ? '수면/안정' : product.category === 'energy' ? '활력/에너지' : '회복 키트'}`
            : product.category;

          return (
            <Card key={product._id} className="overflow-hidden border-none shadow-sm rounded-[24px] bg-white group hover:shadow-md transition-shadow">
              <Link href={productLink}>
                <div className="aspect-square relative bg-surface overflow-hidden">
                  {product.images.length > 0 ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <Heart className="h-8 w-8" />
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-rose-500 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-lg">품절</span>
                    </div>
                  )}
                </div>
              </Link>

              <CardContent className="p-3.5 sm:p-5">
                <div className="mb-1.5 flex items-center justify-between">
                  <Badge variant="outline" className={`text-[9px] sm:text-xs font-bold rounded-lg px-2 py-0.5 ${product.isGalleryArt ? 'text-chapter-accent border-chapter-accent/20 bg-chapter-accent/5' : 'text-foreground/70 border-line'}`}>
                    {categoryLabel}
                  </Badge>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-obsidian tracking-tight mb-1.5 line-clamp-2 min-h-[32px] sm:min-h-[40px]">
                  <Link
                    href={productLink}
                    className="hover:text-primary transition-colors"
                  >
                    {product.name}
                  </Link>
                </h3>

                <p className="text-slate text-[10px] sm:text-xs mb-3 line-clamp-1 opacity-70">
                  {product.summary}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-auto">
                  <span className="text-sm sm:text-base font-black text-[#0E3A3A] tracking-tighter">
                    {product.isGalleryArt ? `₩ ${product.price.toLocaleString()}` : formatPrice(product.price)}
                  </span>
                  {product.isGalleryArt ? (
                    <Button
                      size="sm"
                      className="w-full sm:w-auto h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs font-black rounded-lg bg-chapter-accent text-white hover:bg-obsidian transition-colors"
                      asChild
                    >
                      <Link href={productLink}>
                        상세보기
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full sm:w-auto h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs font-black rounded-lg bg-obsidian text-mist hover:bg-primary transition-colors"
                      onClick={() => handleAddToCart(product._id)}
                      disabled={product.stock === 0 || cartLoading}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      {product.stock === 0 ? '품절' : cartLoading ? '...' : '담기'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-12">
          <div className="flex space-x-2">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === pagination.page ? 'default' : 'outline'}
                size="sm"
                className="rounded-xl font-bold h-9 w-9 p-0 flex items-center justify-center"
                asChild
              >
                <Link href={`${pathname}?${new URLSearchParams({
                  ...searchParams,
                  page: page.toString(),
                }).toString()}`}>
                  {page}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}


