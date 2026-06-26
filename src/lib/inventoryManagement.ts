import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { sendAdminNotification } from './adminNotifications';
import { sendLowStockNotification, sendOutOfStockNotification, sendInventoryAdjustmentNotification } from './partnerNotifications';

// 재고 상태 타입
export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';

// 재고 관리 클래스
export class InventoryManager {
  // 재고 상태 확인
  static getInventoryStatus(product: any): InventoryStatus {
    const availableStock = product.stock - (product.reservedStock || 0);
    const minStock = product.minStock || 10;
    const maxStock = product.maxStock || 1000;

    if (availableStock <= 0) {
      return 'out_of_stock';
    } else if (availableStock <= minStock) {
      return 'low_stock';
    } else if (availableStock >= maxStock) {
      return 'overstocked';
    } else {
      return 'in_stock';
    }
  }

  // 재고 예약 (주문 생성 시)
  static async reserveStock(productId: string, quantity: number): Promise<{
    success: boolean;
    message: string;
    availableStock?: number;
  }> {
    try {
      await connectDB();
      
      const product = await Product.findById(productId);
      if (!product) {
        return { success: false, message: '상품을 찾을 수 없습니다.' };
      }

      const availableStock = product.stock - (product.reservedStock || 0);
      
      if (availableStock < quantity) {
        return { 
          success: false, 
          message: `재고가 부족합니다. (가능: ${availableStock}개, 요청: ${quantity}개)`,
          availableStock 
        };
      }

      // 재고 예약
      product.reservedStock = (product.reservedStock || 0) + quantity;
      await product.save();

      // 재고 상태 업데이트
      await this.updateProductStatus(product._id);

      return { 
        success: true, 
        message: '재고가 예약되었습니다.',
        availableStock: availableStock - quantity
      };

    } catch (error) {
      console.error('재고 예약 오류:', error);
      return { success: false, message: '재고 예약 중 오류가 발생했습니다.' };
    }
  }

  // 재고 확정 (결제 완료 시)
  static async confirmStock(productId: string, quantity: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await connectDB();
      
      const product = await Product.findById(productId);
      if (!product) {
        return { success: false, message: '상품을 찾을 수 없습니다.' };
      }

      // 실제 재고 차감
      product.stock = product.stock - quantity;
      product.reservedStock = Math.max(0, (product.reservedStock || 0) - quantity);
      
      await product.save();

      // 재고 상태 업데이트
      await this.updateProductStatus(product._id);

      return { success: true, message: '재고가 확정되었습니다.' };

    } catch (error) {
      console.error('재고 확정 오류:', error);
      return { success: false, message: '재고 확정 중 오류가 발생했습니다.' };
    }
  }

  // 재고 예약 취소 (주문 취소 시)
  static async cancelReservation(productId: string, quantity: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await connectDB();
      
      const product = await Product.findById(productId);
      if (!product) {
        return { success: false, message: '상품을 찾을 수 없습니다.' };
      }

      // 예약된 재고 해제
      product.reservedStock = Math.max(0, (product.reservedStock || 0) - quantity);
      await product.save();

      // 재고 상태 업데이트
      await this.updateProductStatus(product._id);

      return { success: true, message: '재고 예약이 취소되었습니다.' };

    } catch (error) {
      console.error('재고 예약 취소 오류:', error);
      return { success: false, message: '재고 예약 취소 중 오류가 발생했습니다.' };
    }
  }

  // 재고 반품 (주문 취소 시)
  static async returnStock(productId: string, quantity: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await connectDB();
      
      const product = await Product.findById(productId);
      if (!product) {
        return { success: false, message: '상품을 찾을 수 없습니다.' };
      }

      // 재고 복구
      product.stock = product.stock + quantity;
      await product.save();

      // 재고 상태 업데이트
      await this.updateProductStatus(product._id);

      return { success: true, message: '재고가 반품되었습니다.' };

    } catch (error) {
      console.error('재고 반품 오류:', error);
      return { success: false, message: '재고 반품 중 오류가 발생했습니다.' };
    }
  }

  // 상품 상태 업데이트
  static async updateProductStatus(productId: string): Promise<void> {
    try {
      await connectDB();
      
      const product = await Product.findById(productId);
      if (!product) return;

      const status = this.getInventoryStatus(product);
      let newStatus = product.status;

      switch (status) {
        case 'out_of_stock':
          newStatus = 'out_of_stock';
          break;
        case 'low_stock':
          // 재고 부족 알림 발송
          await this.sendLowStockNotification(product);
          newStatus = 'active'; // 재고 부족이지만 주문은 가능
          break;
        case 'in_stock':
        case 'overstocked':
          if (product.status === 'out_of_stock') {
            newStatus = 'active'; // 재고가 다시 들어왔을 때
          }
          break;
      }

      if (newStatus !== product.status) {
        product.status = newStatus;
        await product.save();
      }

    } catch (error) {
      console.error('상품 상태 업데이트 오류:', error);
    }
  }

  // 재고 부족 알림 발송
  static async sendLowStockNotification(product: any): Promise<void> {
    try {
      // 관리자 알림
      await sendAdminNotification('low_stock', {
        productName: product.name,
        currentStock: product.stock - (product.reservedStock || 0),
        minStock: product.minStock || 10,
        partnerName: product.partnerName || 'Unknown'
      });

      // 파트너 알림 (파트너 이메일이 있는 경우)
      if (product.partnerEmail) {
        await sendLowStockNotification(
          product._id.toString(),
          product.name,
          product.stock - (product.reservedStock || 0),
          product.minStock || 10,
          product.stock - (product.reservedStock || 0),
          product.partnerEmail
        );
      }
    } catch (error) {
      console.error('재고 부족 알림 발송 실패:', error);
    }
  }

  // 재고 현황 조회
  static async getProductInventoryStatus(productId: string): Promise<{
    success: boolean;
    data?: {
      productId: string;
      productName: string;
      currentStock: number;
      reservedStock: number;
      availableStock: number;
      minStock: number;
      maxStock: number;
      status: InventoryStatus;
      productStatus: string;
    };
    message?: string;
  }> {
    try {
      await connectDB();
      
      const product = await Product.findById(productId);
      if (!product) {
        return { success: false, message: '상품을 찾을 수 없습니다.' };
      }

      const availableStock = product.stock - (product.reservedStock || 0);
      const status = this.getInventoryStatus(product);

      return {
        success: true,
        data: {
          productId: product._id.toString(),
          productName: product.name,
          currentStock: product.stock,
          reservedStock: product.reservedStock || 0,
          availableStock,
          minStock: product.minStock || 10,
          maxStock: product.maxStock || 1000,
          status,
          productStatus: product.status
        }
      };

    } catch (error) {
      console.error('재고 현황 조회 오류:', error);
      return { success: false, message: '재고 현황 조회 중 오류가 발생했습니다.' };
    }
  }

  // 전체 재고 현황 조회
  static async getAllInventoryStatus(): Promise<{
    success: boolean;
    data?: Array<{
      productId: string;
      productName: string;
      currentStock: number;
      reservedStock: number;
      availableStock: number;
      status: InventoryStatus;
      partnerName: string;
    }>;
    message?: string;
  }> {
    try {
      await connectDB();
      
      const products = await Product.find({}).select('name stock reservedStock minStock maxStock partnerName');
      
      const inventoryData = products.map(product => {
        const availableStock = product.stock - (product.reservedStock || 0);
        const status = this.getInventoryStatus(product);

        return {
          productId: product._id.toString(),
          productName: product.name,
          currentStock: product.stock,
          reservedStock: product.reservedStock || 0,
          availableStock,
          status,
          partnerName: product.partnerName || 'Unknown'
        };
      });

      return {
        success: true,
        data: inventoryData
      };

    } catch (error) {
      console.error('전체 재고 현황 조회 오류:', error);
      return { success: false, message: '전체 재고 현황 조회 중 오류가 발생했습니다.' };
    }
  }

  // 재고 수량 조정
  static async adjustStock(productId: string, adjustment: number, reason: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await connectDB();
      
      const product = await Product.findById(productId);
      if (!product) {
        return { success: false, message: '상품을 찾을 수 없습니다.' };
      }

      const newStock = product.stock + adjustment;
      if (newStock < 0) {
        return { success: false, message: '재고가 음수가 될 수 없습니다.' };
      }

      product.stock = newStock;
      await product.save();

      // 재고 상태 업데이트
      await this.updateProductStatus(product._id);

      // 파트너 알림 발송 (파트너 이메일이 있는 경우)
      if (product.partnerEmail) {
        try {
          await sendInventoryAdjustmentNotification(
            product.name,
            adjustment,
            reason,
            newStock,
            product.partnerEmail
          );
        } catch (notificationError) {
          console.error('재고 조정 알림 발송 실패:', notificationError);
        }
      }

      return { 
        success: true, 
        message: `재고가 조정되었습니다. (${adjustment > 0 ? '+' : ''}${adjustment}개, 사유: ${reason})` 
      };

    } catch (error) {
      console.error('재고 조정 오류:', error);
      return { success: false, message: '재고 조정 중 오류가 발생했습니다.' };
    }
  }
}
