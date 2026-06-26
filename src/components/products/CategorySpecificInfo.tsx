'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Leaf,
  MapPin,
  Calendar,
  Thermometer,
  Shirt,
  Ruler,
  Palette,
  Cpu,
  Battery,
  Weight,
  Package,
  Info
} from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  // 카테고리별 특화 정보 (선택적)
  nutritionInfo?: {
    calories?: string;
    protein?: string;
    fat?: string;
    carbohydrates?: string;
    sodium?: string;
  };
  originInfo?: {
    origin?: string;
    storageMethod?: string;
    shelfLife?: string;
    packagingMethod?: string;
  };
  clothingInfo?: {
    sizeGuide?: string;
    material?: string;
    careInstructions?: string;
  };
  electronicsInfo?: {
    specifications?: string;
    includedItems?: string;
    warranty?: string;
  };
}

interface CategorySpecificInfoProps {
  product: Product;
}

export default function CategorySpecificInfo({ product }: CategorySpecificInfoProps) {
  const renderFreshFoodInfo = () => {
    const hasNutritionInfo = product.nutritionInfo && (
      product.nutritionInfo.calories ||
      product.nutritionInfo.protein ||
      product.nutritionInfo.fat ||
      product.nutritionInfo.carbohydrates ||
      product.nutritionInfo.sodium
    );

    const hasOriginInfo = product.originInfo && (
      product.originInfo.origin ||
      product.originInfo.storageMethod ||
      product.originInfo.shelfLife ||
      product.originInfo.packagingMethod
    );

    // 정보가 없으면 렌더링하지 않음
    if (!hasNutritionInfo && !hasOriginInfo) {
      return null;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 영양성분 */}
        {hasNutritionInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Leaf className="h-5 w-5 mr-2 text-green-600" />
                영양성분 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {product.nutritionInfo?.calories && (
                  <div className="flex justify-between">
                    <span>칼로리</span>
                    <span className="font-medium">{product.nutritionInfo.calories}</span>
                  </div>
                )}
                {product.nutritionInfo?.protein && (
                  <div className="flex justify-between">
                    <span>단백질</span>
                    <span className="font-medium">{product.nutritionInfo.protein}</span>
                  </div>
                )}
                {product.nutritionInfo?.fat && (
                  <div className="flex justify-between">
                    <span>지방</span>
                    <span className="font-medium">{product.nutritionInfo.fat}</span>
                  </div>
                )}
                {product.nutritionInfo?.carbohydrates && (
                  <div className="flex justify-between">
                    <span>탄수화물</span>
                    <span className="font-medium">{product.nutritionInfo.carbohydrates}</span>
                  </div>
                )}
                {product.nutritionInfo?.sodium && (
                  <div className="flex justify-between">
                    <span>나트륨</span>
                    <span className="font-medium">{product.nutritionInfo.sodium}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 원산지 및 보관법 */}
        {hasOriginInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                원산지 및 보관법
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {product.originInfo?.origin && (
                  <div>
                    <span className="font-medium text-obsidian">원산지:</span>
                    <span className="ml-2">{product.originInfo.origin}</span>
                  </div>
                )}
                {product.originInfo?.storageMethod && (
                  <div>
                    <span className="font-medium text-obsidian">보관법:</span>
                    <span className="ml-2">{product.originInfo.storageMethod}</span>
                  </div>
                )}
                {product.originInfo?.shelfLife && (
                  <div>
                    <span className="font-medium text-obsidian">유통기한:</span>
                    <span className="ml-2">{product.originInfo.shelfLife}</span>
                  </div>
                )}
                {product.originInfo?.packagingMethod && (
                  <div>
                    <span className="font-medium text-obsidian">포장방법:</span>
                    <span className="ml-2">{product.originInfo.packagingMethod}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderClothingInfo = () => {
    const hasClothingInfo = product.clothingInfo && (
      product.clothingInfo.sizeGuide ||
      product.clothingInfo.material ||
      product.clothingInfo.careInstructions
    );

    // 정보가 없으면 렌더링하지 않음
    if (!hasClothingInfo) {
      return null;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 사이즈 가이드 */}
        {product.clothingInfo?.sizeGuide && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Ruler className="h-5 w-5 mr-2 text-secondary" />
                사이즈 가이드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium text-obsidian mb-2">사이즈 정보</p>
                  <div className="whitespace-pre-line text-sm text-obsidian">
                    {product.clothingInfo.sizeGuide}
                  </div>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <Info className="h-3 w-3 inline mr-1" />
                    사이즈는 측정 방법에 따라 차이가 있을 수 있습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 소재 및 관리 */}
        {(product.clothingInfo?.material || product.clothingInfo?.careInstructions) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Shirt className="h-5 w-5 mr-2 text-primary" />
                소재 및 관리
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {product.clothingInfo?.material && (
                  <div>
                    <span className="font-medium text-obsidian">소재:</span>
                    <span className="ml-2">{product.clothingInfo.material}</span>
                  </div>
                )}
                {product.clothingInfo?.careInstructions && (
                  <div>
                    <span className="font-medium text-obsidian">관리 방법:</span>
                    <div className="mt-1 whitespace-pre-line text-obsidian">
                      {product.clothingInfo.careInstructions}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderElectronicsInfo = () => {
    const hasElectronicsInfo = product.electronicsInfo && (
      product.electronicsInfo.specifications ||
      product.electronicsInfo.includedItems ||
      product.electronicsInfo.warranty
    );

    // 정보가 없으면 렌더링하지 않음
    if (!hasElectronicsInfo) {
      return null;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 기술 사양 */}
        {product.electronicsInfo?.specifications && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Cpu className="h-5 w-5 mr-2 text-primary" />
                기술 사양
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line text-sm text-obsidian">
                {product.electronicsInfo.specifications}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 포함 사항 및 보증 */}
        {(product.electronicsInfo?.includedItems || product.electronicsInfo?.warranty) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Package className="h-5 w-5 mr-2 text-green-600" />
                포함 사항 및 보증
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {product.electronicsInfo?.includedItems && (
                  <div>
                    <span className="font-medium text-obsidian">포함 사항:</span>
                    <div className="mt-1 whitespace-pre-line text-obsidian">
                      {product.electronicsInfo.includedItems}
                    </div>
                  </div>
                )}
                {product.electronicsInfo?.warranty && (
                  <div>
                    <span className="font-medium text-obsidian">보증 정보:</span>
                    <div className="mt-1 whitespace-pre-line text-obsidian">
                      {product.electronicsInfo.warranty}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderDefaultInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Info className="h-5 w-5 mr-2 text-primary" />
          상품 정보
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-obsidian">카테고리:</span>
            <Badge variant="outline" className="ml-2">
              {product.category}
            </Badge>
          </div>
          <div>
            <span className="font-medium text-obsidian">재고:</span>
            <span className="ml-2">{product.stock}개</span>
          </div>

        </div>
      </CardContent>
    </Card>
  );

  const getCategorySpecificInfo = () => {
    switch (product.category.toLowerCase()) {
      case 'fresh-food':
      case '신선식품':
        return renderFreshFoodInfo();
      case 'apparel':
      case '의류':
      case 'clothing':
        return renderClothingInfo();
      case 'electronics':
      case '전자제품':
      case '전자기기':
        return renderElectronicsInfo();
      default:
        return renderDefaultInfo();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-obsidian mb-2">
          상품 상세 정보
        </h2>
        <p className="text-obsidian">
          {product.name}에 대한 자세한 정보를 확인하세요
        </p>
      </div>

      {getCategorySpecificInfo()}
    </div>
  );
}
