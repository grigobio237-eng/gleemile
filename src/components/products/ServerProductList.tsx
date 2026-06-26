import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Heart, ShoppingCart } from 'lucide-react';
import connectDB from '@/lib/db';
import Product from '@/models/Product';

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
}

interface ServerProductListProps {
  searchParams: {
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
  };
}

async function fetchProducts(searchParams: any) {
  try {
    // MongoDB 연결 확인
    await connectDB();

    // Build filter object
    const filter: any = { status: 'active' };
    
    if (searchParams.q && searchParams.q.trim()) {
      // 텍스트 검색은 인덱스가 있어야 하므로 간단한 검색으로 대체
      filter.$or = [
        { name: { $regex: searchParams.q, $options: 'i' } },
        { summary: { $regex: searchParams.q, $options: 'i' } }
      ];
    }
    
    if (searchParams.category && searchParams.category !== 'all') {
      filter.category = searchParams.category;
    }

    // Build sort object
    let sort: any = { createdAt: -1 }; // default: newest first
    
    switch (searchParams.sort) {
      case 'price_asc':
        sort = { price: 1 };
        break;
      case 'price_desc':
        sort = { price: -1 };
        break;
      case 'popular':
        sort = { createdAt: -1 };
        break;
      case 'newest':
      default:
        sort = { createdAt: -1 };
        break;
    }

    // Pagination
    const page = parseInt(searchParams.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // Execute query with timeout
    const queryPromise = Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .maxTimeMS(5000); // 5초 타임아웃

    const countPromise = Product.countDocuments(filter).maxTimeMS(5000);

    const [products, total] = await Promise.all([queryPromise, countPromise]);

    return {
      products: products.map((product: any) => ({
        ...product,
        id: product._id,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    // 에러 발생 시 빈 결과 반환
    return { products: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
  }
}

export default async function ServerProductList({ searchParams }: ServerProductListProps) {
  try {
    const { products, pagination } = await fetchProducts(searchParams);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product: Product) => (
          <Card key={product._id} className="overflow-hidden">
            <Link href={`/products/${product._id}`}>
              <div className="aspect-square relative bg-gray-100">
                {product.images.length > 0 ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-foreground/70">
                    <Heart className="h-12 w-12" />
                  </div>
                )}
                {product.stock === 0 && (
                  <Badge className="absolute top-3 left-3" variant="destructive">
                    품절
                  </Badge>
                )}
              </div>
            </Link>
            
            <CardContent className="p-6">
              <div className="mb-2">
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
              </div>
              
              <h3 className="font-semibold mb-2 line-clamp-2">
                <Link 
                  href={`/products/${product._id}`}
                  className="hover:text-primary transition-colors"
                >
                  {product.name}
                </Link>
              </h3>
              
              <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                {product.summary}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary text-xl">
                  {formatPrice(product.price)}
                </span>
                <Button
                  size="sm"
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  {product.stock === 0 ? '품절' : '담기'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
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
                asChild
              >
                <Link href={`/products?${new URLSearchParams({
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
  } catch (error) {
    console.error('ServerProductList error:', error);
    return (
      <div className="text-center py-12">
        <h2 className="font-semibold text-red-600 mb-4 text-xl">
          문제가 발생했습니다
        </h2>
        <p className="text-obsidian mb-4">
          상품 목록을 불러오는 중 오류가 발생했습니다.
        </p>
        <p className="text-sm text-foreground/70">
          잠시 후 다시 시도해주세요.
        </p>
      </div>
    );
  }
}
