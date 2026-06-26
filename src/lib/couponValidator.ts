import Coupon from '@/models/Coupon';
import CouponUsage from '@/models/CouponUsage';
import User from '@/models/User';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export interface CouponValidationResult {
  isValid: boolean;
  error?: string;
  coupon?: any;
  discountAmount?: number;
  finalAmount?: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  category?: string;
}

export interface CouponValidationData {
  code: string;
  userId?: string;
  cartItems: CartItem[];
  totalAmount: number;
}

// 쿠폰 검증 및 할인 계산
export async function validateCoupon(data: CouponValidationData): Promise<CouponValidationResult> {
  try {
    const { code, userId, cartItems, totalAmount } = data;

    // 1. 쿠폰 존재 여부 확인
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      status: 'active'
    });

    if (!coupon) {
      return {
        isValid: false,
        error: '유효하지 않은 쿠폰 코드입니다.'
      };
    }

    // 2. 유효 기간 확인 (사용자별 유효기간 체크)
    const now = new Date();
    
    if (userId) {
      // 사용자가 다운로드한 쿠폰의 유효기간 확인
      const UserCoupon = mongoose.model('UserCoupon');
      const userCoupon = await UserCoupon.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        code: code.toUpperCase(),
        status: 'available'
      });

      if (!userCoupon) {
        return {
          isValid: false,
          error: '다운로드하지 않은 쿠폰입니다.'
        };
      }

      if (userCoupon.validUntil < now) {
        return {
          isValid: false,
          error: '사용 기간이 만료된 쿠폰입니다.'
        };
      }
    } else {
      // 일반적인 쿠폰 유효기간 확인 (고정 기간)
      if (coupon.validityType === 'fixed' && (coupon.validFrom > now || coupon.validUntil < now)) {
        return {
          isValid: false,
          error: '사용 기간이 만료된 쿠폰입니다.'
        };
      }
    }

    // 3. 사용 횟수 제한 확인
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return {
        isValid: false,
        error: '사용 가능한 횟수를 초과한 쿠폰입니다.'
      };
    }

    // 4. 최소 주문 금액 확인
    if (coupon.minOrderAmount && totalAmount < coupon.minOrderAmount) {
      return {
        isValid: false,
        error: `최소 주문 금액 ${coupon.minOrderAmount.toLocaleString()}원 이상 구매 시 사용 가능합니다.`
      };
    }

    // 5. 사용자별 사용 횟수 제한 확인
    if (userId && coupon.userUsageLimit) {
      const userUsageCount = await CouponUsage.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        couponId: coupon._id
      });

      if (userUsageCount >= coupon.userUsageLimit) {
        return {
          isValid: false,
          error: '이미 최대 사용 횟수에 도달한 쿠폰입니다.'
        };
      }
    }

    // 6. 사용자 조건 확인
    if (userId && coupon.conditions) {
      const user = await User.findById(userId);
      if (!user) {
        return {
          isValid: false,
          error: '사용자 정보를 찾을 수 없습니다.'
        };
      }

      const validationResult = await validateUserConditions(user, coupon.conditions);
      if (!validationResult.isValid) {
        return validationResult;
      }
    }

    // 7. 상품 적용 조건 확인
    const productValidation = validateProductConditions(coupon, cartItems);
    if (!productValidation.isValid) {
      return productValidation;
    }

    // 8. 할인 금액 계산
    const discountResult = calculateDiscount(coupon, totalAmount);
    if (!discountResult.isValid) {
      return discountResult;
    }

    return {
      isValid: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value
      },
      discountAmount: discountResult.discountAmount,
      finalAmount: discountResult.finalAmount
    };

  } catch (error) {
    console.error('Coupon validation error:', error);
    return {
      isValid: false,
      error: '쿠폰 검증 중 오류가 발생했습니다.'
    };
  }
}

// 사용자 조건 검증
async function validateUserConditions(user: any, conditions: any): Promise<CouponValidationResult> {
  // 사용자 등급 확인
  if (conditions.userGrades && conditions.userGrades.length > 0) {
    if (!conditions.userGrades.includes(user.grade)) {
      return {
        isValid: false,
        error: '해당 등급의 사용자는 사용할 수 없는 쿠폰입니다.'
      };
    }
  }

  // 주문 횟수 확인
  if (conditions.minOrderCount || conditions.maxOrderCount) {
    const orderCount = await Order.countDocuments({ 
      userId: user._id,
      status: { $in: ['delivered', 'completed'] }
    });

    if (conditions.minOrderCount && orderCount < conditions.minOrderCount) {
      return {
        isValid: false,
        error: `최소 ${conditions.minOrderCount}회 이상 주문한 사용자만 사용 가능합니다.`
      };
    }

    if (conditions.maxOrderCount && orderCount > conditions.maxOrderCount) {
      return {
        isValid: false,
        error: `최대 ${conditions.maxOrderCount}회 이하 주문한 사용자만 사용 가능합니다.`
      };
    }
  }

  // 총 구매 금액 확인
  if (conditions.minTotalSpent || conditions.maxTotalSpent) {
    const totalSpent = await Order.aggregate([
      { 
        $match: { 
          userId: user._id,
          status: { $in: ['delivered', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    const userTotalSpent = totalSpent.length > 0 ? totalSpent[0].total : 0;

    if (conditions.minTotalSpent && userTotalSpent < conditions.minTotalSpent) {
      return {
        isValid: false,
        error: `최소 ${conditions.minTotalSpent.toLocaleString()}원 이상 구매한 사용자만 사용 가능합니다.`
      };
    }

    if (conditions.maxTotalSpent && userTotalSpent > conditions.maxTotalSpent) {
      return {
        isValid: false,
        error: `최대 ${conditions.maxTotalSpent.toLocaleString()}원 이하 구매한 사용자만 사용 가능합니다.`
      };
    }
  }

  return { isValid: true };
}

// 상품 적용 조건 검증
function validateProductConditions(coupon: any, cartItems: CartItem[]): CouponValidationResult {
  // 특정 상품에만 적용
  if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
    const applicableProductIds = coupon.applicableProducts.map((id: any) => id.toString());
    const hasApplicableProduct = cartItems.some(item => 
      applicableProductIds.includes(item.productId)
    );

    if (!hasApplicableProduct) {
      return {
        isValid: false,
        error: '해당 상품에 적용할 수 없는 쿠폰입니다.'
      };
    }
  }

  // 특정 카테고리에만 적용
  if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
    const hasApplicableCategory = cartItems.some(item => 
      item.category && coupon.applicableCategories.includes(item.category)
    );

    if (!hasApplicableCategory) {
      return {
        isValid: false,
        error: '해당 카테고리에 적용할 수 없는 쿠폰입니다.'
      };
    }
  }

  // 제외 상품 확인
  if (coupon.excludedProducts && coupon.excludedProducts.length > 0) {
    const excludedProductIds = coupon.excludedProducts.map((id: any) => id.toString());
    const hasExcludedProduct = cartItems.some(item => 
      excludedProductIds.includes(item.productId)
    );

    if (hasExcludedProduct) {
      return {
        isValid: false,
        error: '제외된 상품이 포함되어 사용할 수 없는 쿠폰입니다.'
      };
    }
  }

  return { isValid: true };
}

// 할인 금액 계산
function calculateDiscount(coupon: any, totalAmount: number): CouponValidationResult {
  let discountAmount = 0;

  switch (coupon.type) {
    case 'percentage':
      discountAmount = Math.floor(totalAmount * (coupon.value / 100));
      
      // 최대 할인 금액 제한
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
      break;

    case 'fixed':
      discountAmount = coupon.value;
      break;

    case 'free_shipping':
      // 무료배송 쿠폰의 경우 배송비만 할인 (실제 배송비는 주문 시스템에서 계산)
      discountAmount = 0; // 배송비는 별도 계산 필요
      break;

    default:
      return {
        isValid: false,
        error: '잘못된 쿠폰 타입입니다.'
      };
  }

  // 할인 금액이 주문 금액을 초과하지 않도록 제한
  discountAmount = Math.min(discountAmount, totalAmount);

  const finalAmount = Math.max(0, totalAmount - discountAmount);

  return {
    isValid: true,
    discountAmount,
    finalAmount
  };
}

// 쿠폰 사용 기록 생성
export async function recordCouponUsage(
  couponId: string,
  userId: string,
  orderId: string,
  code: string,
  discountAmount: number,
  originalAmount: number,
  finalAmount: number
): Promise<boolean> {
  try {
    const usage = new CouponUsage({
      couponId: new mongoose.Types.ObjectId(couponId),
      userId: new mongoose.Types.ObjectId(userId),
      orderId: new mongoose.Types.ObjectId(orderId),
      code: code.toUpperCase(),
      discountAmount,
      originalAmount,
      finalAmount
    });

    await usage.save();

    // 쿠폰 사용 횟수 증가
    await Coupon.updateOne(
      { _id: couponId },
      { $inc: { usageCount: 1 } }
    );

    return true;
  } catch (error) {
    console.error('Coupon usage recording error:', error);
    return false;
  }
}

// UserCoupon 상태를 'used'로 업데이트
export async function markCouponAsUsed(
  userId: string,
  couponCode: string,
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const UserCoupon = mongoose.model('UserCoupon');
    
    // 사용자의 사용 가능한 쿠폰 찾기
    const userCoupon = await UserCoupon.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      code: couponCode.toUpperCase(),
      status: 'available'
    });

    if (!userCoupon) {
      return {
        success: false,
        error: '사용 가능한 쿠폰을 찾을 수 없습니다.'
      };
    }

    // 쿠폰 상태를 'used'로 업데이트
    userCoupon.status = 'used';
    userCoupon.usedAt = new Date();
    userCoupon.orderId = new mongoose.Types.ObjectId(orderId);
    
    await userCoupon.save();

    return { success: true };
  } catch (error) {
    console.error('Mark coupon as used error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '쿠폰 상태 업데이트 중 오류가 발생했습니다.'
    };
  }
}

// 쿠폰 사용 취소 (주문 취소/실패 시)
export async function cancelCouponUsage(
  userId: string,
  couponCode: string,
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const UserCoupon = mongoose.model('UserCoupon');
    
    // 해당 주문으로 사용된 쿠폰 찾기
    const userCoupon = await UserCoupon.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      code: couponCode.toUpperCase(),
      orderId: new mongoose.Types.ObjectId(orderId),
      status: 'used'
    });

    if (!userCoupon) {
      return {
        success: false,
        error: '사용된 쿠폰을 찾을 수 없습니다.'
      };
    }

    // 유효기간이 만료되지 않았다면 다시 사용 가능하도록
    const now = new Date();
    if (userCoupon.validUntil >= now) {
      userCoupon.status = 'available';
    } else {
      userCoupon.status = 'expired';
    }
    
    userCoupon.usedAt = undefined;
    userCoupon.orderId = undefined;
    
    await userCoupon.save();

    // CouponUsage 기록 삭제
    await CouponUsage.deleteOne({
      userId: new mongoose.Types.ObjectId(userId),
      code: couponCode.toUpperCase(),
      orderId: new mongoose.Types.ObjectId(orderId)
    });

    // Coupon usageCount 감소
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (coupon && coupon.usageCount > 0) {
      await Coupon.updateOne(
        { _id: coupon._id },
        { $inc: { usageCount: -1 } }
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Cancel coupon usage error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '쿠폰 사용 취소 중 오류가 발생했습니다.'
    };
  }
}














