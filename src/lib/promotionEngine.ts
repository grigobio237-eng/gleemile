import Promotion from '@/models/Promotion';
import User from '@/models/User';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  category?: string;
  brand?: string;
}

export interface PromotionResult {
  applicable: boolean;
  promotion?: any;
  discountAmount?: number;
  finalAmount?: number;
  freeItems?: Array<{
    productId: string;
    quantity: number;
    discountPercentage?: number;
  }>;
  message?: string;
}

export interface PromotionContext {
  userId?: string;
  cartItems: CartItem[];
  totalAmount: number;
  userGrade?: string;
  orderCount?: number;
  totalSpent?: number;
}

// 프로모션 적용 엔진
export class PromotionEngine {
  // 활성 프로모션 조회
  static async getActivePromotions(): Promise<any[]> {
    const now = new Date();
    return await Promotion.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ priority: -1, createdAt: -1 });
  }

  // 장바구니에 적용 가능한 프로모션 찾기
  static async findApplicablePromotions(context: PromotionContext): Promise<PromotionResult[]> {
    try {
      const promotions = await this.getActivePromotions();
      const results: PromotionResult[] = [];

      for (const promotion of promotions) {
        const result = await this.applyPromotion(promotion, context);
        if (result.applicable) {
          results.push(result);
        }
      }

      // 우선순위별로 정렬 (높은 우선순위가 먼저)
      return results.sort((a, b) => (b.promotion?.priority || 0) - (a.promotion?.priority || 0));
    } catch (error) {
      console.error('Promotion engine error:', error);
      return [];
    }
  }

  // 특정 프로모션 적용
  static async applyPromotion(promotion: any, context: PromotionContext): Promise<PromotionResult> {
    try {
      // 1. 기본 조건 확인
      if (!this.isPromotionActive(promotion)) {
        return { applicable: false, message: '프로모션이 활성화되지 않았습니다.' };
      }

      // 2. 사용 제한 확인
      if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
        return { applicable: false, message: '프로모션 사용 한도를 초과했습니다.' };
      }

      // 3. 최소 주문 금액 확인
      if (promotion.minOrderAmount && context.totalAmount < promotion.minOrderAmount) {
        return { 
          applicable: false, 
          message: `최소 주문 금액 ${promotion.minOrderAmount.toLocaleString()}원 이상 구매 시 적용 가능합니다.` 
        };
      }

      // 4. 사용자 조건 확인
      if (context.userId) {
        const userValidation = await this.validateUserConditions(promotion, context);
        if (!userValidation.valid) {
          return { applicable: false, message: userValidation.message };
        }
      }

      // 5. 상품 적용 조건 확인
      const productValidation = this.validateProductConditions(promotion, context.cartItems);
      if (!productValidation.valid) {
        return { applicable: false, message: productValidation.message };
      }

      // 6. 프로모션 타입별 할인 계산
      const discountResult = this.calculateDiscount(promotion, context);
      if (!discountResult.applicable) {
        return { applicable: false, message: discountResult.message };
      }

      return {
        applicable: true,
        promotion: {
          _id: promotion._id,
          name: promotion.name,
          type: promotion.type,
          description: promotion.description
        },
        discountAmount: discountResult.discountAmount,
        finalAmount: discountResult.finalAmount,
        freeItems: discountResult.freeItems,
        message: discountResult.message
      };

    } catch (error) {
      console.error('Promotion application error:', error);
      return { applicable: false, message: '프로모션 적용 중 오류가 발생했습니다.' };
    }
  }

  // 프로모션 활성 상태 확인
  private static isPromotionActive(promotion: any): boolean {
    const now = new Date();
    return promotion.status === 'active' && 
           promotion.startDate <= now && 
           promotion.endDate >= now;
  }

  // 사용자 조건 검증
  private static async validateUserConditions(promotion: any, context: PromotionContext): Promise<{valid: boolean, message?: string}> {
    if (!promotion.userConditions) {
      return { valid: true };
    }

    const conditions = promotion.userConditions;

    // 사용자 등급 확인
    if (conditions.userGrades && conditions.userGrades.length > 0) {
      if (!context.userGrade || !conditions.userGrades.includes(context.userGrade)) {
        return { valid: false, message: '해당 등급의 사용자는 적용할 수 없습니다.' };
      }
    }

    // 신규/기존 고객 확인
    if (conditions.newCustomersOnly && context.orderCount && context.orderCount > 0) {
      return { valid: false, message: '신규 고객만 적용 가능합니다.' };
    }

    if (conditions.existingCustomersOnly && (!context.orderCount || context.orderCount === 0)) {
      return { valid: false, message: '기존 고객만 적용 가능합니다.' };
    }

    // 주문 횟수 확인
    if (conditions.minOrderCount && (!context.orderCount || context.orderCount < conditions.minOrderCount)) {
      return { valid: false, message: `최소 ${conditions.minOrderCount}회 이상 주문한 고객만 적용 가능합니다.` };
    }

    if (conditions.maxOrderCount && context.orderCount && context.orderCount > conditions.maxOrderCount) {
      return { valid: false, message: `최대 ${conditions.maxOrderCount}회 이하 주문한 고객만 적용 가능합니다.` };
    }

    // 총 구매 금액 확인
    if (conditions.minTotalSpent && (!context.totalSpent || context.totalSpent < conditions.minTotalSpent)) {
      return { valid: false, message: `최소 ${conditions.minTotalSpent.toLocaleString()}원 이상 구매한 고객만 적용 가능합니다.` };
    }

    if (conditions.maxTotalSpent && context.totalSpent && context.totalSpent > conditions.maxTotalSpent) {
      return { valid: false, message: `최대 ${conditions.maxTotalSpent.toLocaleString()}원 이하 구매한 고객만 적용 가능합니다.` };
    }

    return { valid: true };
  }

  // 상품 적용 조건 검증
  private static validateProductConditions(promotion: any, cartItems: CartItem[]): {valid: boolean, message?: string} {
    // 모든 상품에 적용
    if (promotion.targetType === 'all') {
      return { valid: true };
    }

    // 특정 상품에만 적용
    if (promotion.targetType === 'products' && promotion.targetIds) {
      const targetProductIds = promotion.targetIds.map((id: any) => id.toString());
      const hasTargetProduct = cartItems.some(item => 
        targetProductIds.includes(item.productId)
      );

      if (!hasTargetProduct) {
        return { valid: false, message: '해당 상품에 적용할 수 없는 프로모션입니다.' };
      }
    }

    // 특정 카테고리에만 적용
    if (promotion.targetType === 'categories' && promotion.targetIds) {
      const hasTargetCategory = cartItems.some(item => 
        item.category && promotion.targetIds.includes(item.category)
      );

      if (!hasTargetCategory) {
        return { valid: false, message: '해당 카테고리에 적용할 수 없는 프로모션입니다.' };
      }
    }

    // 특정 브랜드에만 적용
    if (promotion.targetType === 'brands' && promotion.targetIds) {
      const hasTargetBrand = cartItems.some(item => 
        item.brand && promotion.targetIds.includes(item.brand)
      );

      if (!hasTargetBrand) {
        return { valid: false, message: '해당 브랜드에 적용할 수 없는 프로모션입니다.' };
      }
    }

    // 제외 상품 확인
    if (promotion.excludedProducts && promotion.excludedProducts.length > 0) {
      const excludedProductIds = promotion.excludedProducts.map((id: any) => id.toString());
      const hasExcludedProduct = cartItems.some(item => 
        excludedProductIds.includes(item.productId)
      );

      if (hasExcludedProduct) {
        return { valid: false, message: '제외된 상품이 포함되어 적용할 수 없습니다.' };
      }
    }

    // 제외 카테고리 확인
    if (promotion.excludedCategories && promotion.excludedCategories.length > 0) {
      const hasExcludedCategory = cartItems.some(item => 
        item.category && promotion.excludedCategories.includes(item.category)
      );

      if (hasExcludedCategory) {
        return { valid: false, message: '제외된 카테고리가 포함되어 적용할 수 없습니다.' };
      }
    }

    return { valid: true };
  }

  // 할인 금액 계산
  private static calculateDiscount(promotion: any, context: PromotionContext): {applicable: boolean, discountAmount?: number, finalAmount?: number, freeItems?: any[], message?: string} {
    let discountAmount = 0;
    let freeItems: any[] = [];

    switch (promotion.type) {
      case 'discount':
        return this.calculateDiscountPromotion(promotion, context);
      
      case 'bundle':
        return this.calculateBundlePromotion(promotion, context);
      
      case 'free_shipping':
        return this.calculateFreeShippingPromotion(promotion, context);
      
      case 'buy_x_get_y':
        return this.calculateBuyXGetYPromotion(promotion, context);
      
      case 'flash_sale':
        return this.calculateFlashSalePromotion(promotion, context);
      
      default:
        return { applicable: false, message: '지원하지 않는 프로모션 타입입니다.' };
    }
  }

  // 일반 할인 프로모션 계산
  private static calculateDiscountPromotion(promotion: any, context: PromotionContext): {applicable: boolean, discountAmount?: number, finalAmount?: number, message?: string} {
    let discountAmount = 0;

    if (promotion.discountType === 'percentage') {
      discountAmount = Math.floor(context.totalAmount * (promotion.discountValue / 100));
      
      // 최대 할인 금액 제한
      if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
        discountAmount = promotion.maxDiscountAmount;
      }
    } else if (promotion.discountType === 'fixed') {
      discountAmount = promotion.discountValue;
    }

    // 할인 금액이 주문 금액을 초과하지 않도록 제한
    discountAmount = Math.min(discountAmount, context.totalAmount);
    const finalAmount = Math.max(0, context.totalAmount - discountAmount);

    return {
      applicable: true,
      discountAmount,
      finalAmount,
      message: `${promotion.name} 적용`
    };
  }

  // 번들 프로모션 계산
  private static calculateBundlePromotion(promotion: any, context: PromotionContext): {applicable: boolean, discountAmount?: number, finalAmount?: number, message?: string} {
    if (!promotion.bundleProducts || promotion.bundleProducts.length === 0) {
      return { applicable: false, message: '번들 상품이 설정되지 않았습니다.' };
    }

    let bundleDiscount = 0;
    const bundleProductIds = promotion.bundleProducts.map((item: any) => item.productId.toString());

    // 장바구니에서 번들 상품들 찾기
    const bundleItems = context.cartItems.filter(item => 
      bundleProductIds.includes(item.productId)
    );

    if (bundleItems.length === 0) {
      return { applicable: false, message: '번들 상품이 장바구니에 없습니다.' };
    }

    // 번들 상품별 할인 계산
    for (const bundleProduct of promotion.bundleProducts) {
      const cartItem = bundleItems.find(item => 
        item.productId === bundleProduct.productId.toString()
      );

      if (cartItem && bundleProduct.discountPercentage) {
        const itemDiscount = Math.floor(
          (cartItem.price * cartItem.quantity) * (bundleProduct.discountPercentage / 100)
        );
        bundleDiscount += itemDiscount;
      }
    }

    const finalAmount = Math.max(0, context.totalAmount - bundleDiscount);

    return {
      applicable: true,
      discountAmount: bundleDiscount,
      finalAmount,
      message: `${promotion.name} 번들 할인 적용`
    };
  }

  // 무료배송 프로모션 계산
  private static calculateFreeShippingPromotion(promotion: any, context: PromotionContext): {applicable: boolean, discountAmount?: number, finalAmount?: number, message?: string} {
    // 무료배송은 배송비만 할인 (실제 배송비는 주문 시스템에서 계산)
    return {
      applicable: true,
      discountAmount: 0, // 배송비는 별도 계산
      finalAmount: context.totalAmount,
      message: `${promotion.name} 무료배송 적용`
    };
  }

  // Buy X Get Y 프로모션 계산
  private static calculateBuyXGetYPromotion(promotion: any, context: PromotionContext): {applicable: boolean, discountAmount?: number, finalAmount?: number, freeItems?: any[], message?: string} {
    if (!promotion.buyXGetY) {
      return { applicable: false, message: 'Buy X Get Y 설정이 없습니다.' };
    }

    const { buyQuantity, getQuantity, getProductId, discountPercentage } = promotion.buyXGetY;
    
    // 구매할 상품이 장바구니에 있는지 확인
    const buyProduct = context.cartItems.find(item => 
      item.productId === getProductId.toString()
    );

    if (!buyProduct || buyProduct.quantity < buyQuantity) {
      return { applicable: false, message: `최소 ${buyQuantity}개 이상 구매 시 적용 가능합니다.` };
    }

    // 무료 상품 수량 계산
    const freeQuantity = Math.floor(buyProduct.quantity / buyQuantity) * getQuantity;
    
    if (freeQuantity === 0) {
      return { applicable: false, message: '무료 상품을 받을 수 없습니다.' };
    }

    const freeItems = [{
      productId: getProductId.toString(),
      quantity: freeQuantity,
      discountPercentage: discountPercentage || 100
    }];

    return {
      applicable: true,
      discountAmount: 0, // 무료 상품은 별도 처리
      finalAmount: context.totalAmount,
      freeItems,
      message: `${promotion.name} - ${buyQuantity}개 구매 시 ${getQuantity}개 무료`
    };
  }

  // 플래시 세일 프로모션 계산
  private static calculateFlashSalePromotion(promotion: any, context: PromotionContext): {applicable: boolean, discountAmount?: number, finalAmount?: number, message?: string} {
    if (!promotion.flashSale) {
      return { applicable: false, message: '플래시 세일 설정이 없습니다.' };
    }

    const { originalPrice, salePrice, stockLimit, soldCount } = promotion.flashSale;

    // 재고 확인
    if (stockLimit && soldCount >= stockLimit) {
      return { applicable: false, message: '플래시 세일 상품이 품절되었습니다.' };
    }

    // 플래시 세일 상품이 장바구니에 있는지 확인
    const flashSaleProduct = context.cartItems.find(item => 
      item.price === originalPrice
    );

    if (!flashSaleProduct) {
      return { applicable: false, message: '플래시 세일 상품이 장바구니에 없습니다.' };
    }

    const discountAmount = (originalPrice - salePrice) * flashSaleProduct.quantity;
    const finalAmount = context.totalAmount - discountAmount;

    return {
      applicable: true,
      discountAmount,
      finalAmount,
      message: `${promotion.name} 플래시 세일 적용`
    };
  }

  // 프로모션 사용 기록 업데이트
  static async recordPromotionUsage(promotionId: string, userId: string, orderId: string, discountAmount: number): Promise<boolean> {
    try {
      await Promotion.updateOne(
        { _id: promotionId },
        { 
          $inc: { 
            usageCount: 1,
            'stats.totalOrders': 1,
            'stats.totalRevenue': discountAmount
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Promotion usage recording error:', error);
      return false;
    }
  }
}
