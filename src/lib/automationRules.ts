import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import { sendAdminNotification } from './adminNotifications';
import { sendOrderStatusNotification } from './orderNotifications';
import { InventoryManager } from './inventoryManagement';

// 자동화 규칙 타입
export type AutomationRuleType = 
  | 'order_processing'     // 주문 처리 자동화
  | 'inventory_management' // 재고 관리 자동화
  | 'customer_engagement'  // 고객 참여 자동화
  | 'notification'         // 알림 자동화
  | 'pricing'              // 가격 자동화
  | 'status_update';       // 상태 업데이트 자동화

// 자동화 규칙 인터페이스
export interface AutomationRule {
  id: string;
  name: string;
  type: AutomationRuleType;
  enabled: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number; // 1-10 (높을수록 우선순위)
  createdAt: Date;
  updatedAt: Date;
}

// 규칙 조건
export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
}

// 규칙 액션
export interface RuleAction {
  type: 'update_status' | 'send_notification' | 'update_inventory' | 'send_email' | 'create_task';
  parameters: Record<string, any>;
}

// 자동화 규칙 매니저
export class AutomationRuleManager {
  // 기본 자동화 규칙들
  static getDefaultRules(): AutomationRule[] {
    return [
      // 주문 처리 자동화
      {
        id: 'auto_confirm_high_value_orders',
        name: '고액 주문 자동 확인',
        type: 'order_processing',
        enabled: true,
        conditions: [
          { field: 'totalAmount', operator: 'greater_than', value: 500000 },
          { field: 'paymentStatus', operator: 'equals', value: 'paid' }
        ],
        actions: [
          { type: 'update_status', parameters: { status: 'confirmed' } },
          { type: 'send_notification', parameters: { type: 'admin', message: '고액 주문이 자동 확인되었습니다.' } }
        ],
        priority: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 재고 관리 자동화
      {
        id: 'auto_disable_out_of_stock',
        name: '품절 상품 자동 비활성화',
        type: 'inventory_management',
        enabled: true,
        conditions: [
          { field: 'stock', operator: 'equals', value: 0 },
          { field: 'status', operator: 'not_equals', value: 'out_of_stock' }
        ],
        actions: [
          { type: 'update_status', parameters: { status: 'out_of_stock' } },
          { type: 'send_notification', parameters: { type: 'admin', message: '상품이 품절되어 비활성화되었습니다.' } }
        ],
        priority: 9,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 고객 참여 자동화
      {
        id: 'welcome_new_customers',
        name: '신규 고객 환영 이메일',
        type: 'customer_engagement',
        enabled: true,
        conditions: [
          { field: 'totalOrders', operator: 'equals', value: 1 },
          { field: 'daysSinceRegistration', operator: 'less_than', value: 1 }
        ],
        actions: [
          { type: 'send_email', parameters: { template: 'welcome', subject: 'Youniqle에 오신 것을 환영합니다!' } }
        ],
        priority: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 알림 자동화
      {
        id: 'urgent_order_alert',
        name: '긴급 주문 알림',
        type: 'notification',
        enabled: true,
        conditions: [
          { field: 'status', operator: 'equals', value: 'pending' },
          { field: 'hoursSinceCreated', operator: 'greater_than', value: 2 }
        ],
        actions: [
          { type: 'send_notification', parameters: { type: 'admin', message: '2시간 이상 처리되지 않은 주문이 있습니다.' } }
        ],
        priority: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 가격 자동화
      {
        id: 'auto_discount_old_products',
        name: '오래된 상품 자동 할인',
        type: 'pricing',
        enabled: false, // 기본적으로 비활성화
        conditions: [
          { field: 'daysSinceCreated', operator: 'greater_than', value: 90 },
          { field: 'status', operator: 'equals', value: 'active' }
        ],
        actions: [
          { type: 'update_status', parameters: { discount: 0.1 } } // 10% 할인
        ],
        priority: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  // 주문에 대한 자동화 규칙 실행
  static async executeOrderRules(order: any): Promise<void> {
    try {
      await connectDB();

      const rules = this.getDefaultRules().filter(rule => 
        rule.enabled && rule.type === 'order_processing'
      );

      for (const rule of rules) {
        if (await this.evaluateConditions(rule.conditions, order)) {
          await this.executeActions(rule.actions, order);
        }
      }

    } catch (error) {
      console.error('주문 자동화 규칙 실행 오류:', error);
    }
  }

  // 상품에 대한 자동화 규칙 실행
  static async executeProductRules(product: any): Promise<void> {
    try {
      await connectDB();

      const rules = this.getDefaultRules().filter(rule => 
        rule.enabled && rule.type === 'inventory_management'
      );

      for (const rule of rules) {
        if (await this.evaluateConditions(rule.conditions, product)) {
          await this.executeActions(rule.actions, product);
        }
      }

    } catch (error) {
      console.error('상품 자동화 규칙 실행 오류:', error);
    }
  }

  // 고객에 대한 자동화 규칙 실행
  static async executeCustomerRules(customer: any): Promise<void> {
    try {
      await connectDB();

      // 고객의 주문 데이터 조회
      const orders = await Order.find({ userId: customer.email });
      const customerData = {
        ...customer,
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        daysSinceRegistration: Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      };

      const rules = this.getDefaultRules().filter(rule => 
        rule.enabled && rule.type === 'customer_engagement'
      );

      for (const rule of rules) {
        if (await this.evaluateConditions(rule.conditions, customerData)) {
          await this.executeActions(rule.actions, customerData);
        }
      }

    } catch (error) {
      console.error('고객 자동화 규칙 실행 오류:', error);
    }
  }

  // 조건 평가
  static async evaluateConditions(conditions: RuleCondition[], data: any): Promise<boolean> {
    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(data, condition.field);
      
      if (!this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
        return false;
      }
    }
    return true;
  }

  // 필드 값 가져오기
  static getFieldValue(data: any, field: string): any {
    const fields = field.split('.');
    let value = data;
    
    for (const f of fields) {
      if (value && typeof value === 'object' && f in value) {
        value = value[f];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  // 개별 조건 평가
  static evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'not_equals':
        return fieldValue !== expectedValue;
      case 'greater_than':
        return Number(fieldValue) > Number(expectedValue);
      case 'less_than':
        return Number(fieldValue) < Number(expectedValue);
      case 'contains':
        return String(fieldValue).includes(String(expectedValue));
      case 'not_contains':
        return !String(fieldValue).includes(String(expectedValue));
      default:
        return false;
    }
  }

  // 액션 실행
  static async executeActions(actions: RuleAction[], data: any): Promise<void> {
    for (const action of actions) {
      try {
        await this.executeAction(action, data);
      } catch (error) {
        console.error(`액션 실행 오류 (${action.type}):`, error);
      }
    }
  }

  // 개별 액션 실행
  static async executeAction(action: RuleAction, data: any): Promise<void> {
    switch (action.type) {
      case 'update_status':
        await this.updateStatus(data, action.parameters);
        break;
      case 'send_notification':
        await this.sendNotification(data, action.parameters);
        break;
      case 'update_inventory':
        await this.updateInventory(data, action.parameters);
        break;
      case 'send_email':
        await this.sendEmail(data, action.parameters);
        break;
      case 'create_task':
        await this.createTask(data, action.parameters);
        break;
    }
  }

  // 상태 업데이트
  static async updateStatus(data: any, parameters: any): Promise<void> {
    if (data._id && parameters.status) {
      if (data.orderNumber) {
        // 주문 상태 업데이트
        await Order.findByIdAndUpdate(data._id, { 
          status: parameters.status,
          updatedAt: new Date()
        });
      } else if (data.name) {
        // 상품 상태 업데이트
        await Product.findByIdAndUpdate(data._id, { 
          status: parameters.status,
          updatedAt: new Date()
        });
      }
    }
  }

  // 알림 발송
  static async sendNotification(data: any, parameters: any): Promise<void> {
    if (parameters.type === 'admin') {
      await sendAdminNotification('system_error', {
        errorType: '자동화 규칙',
        errorMessage: parameters.message,
        timestamp: new Date().toISOString(),
        affectedFeature: '자동화 시스템'
      });
    }
  }

  // 재고 업데이트
  static async updateInventory(data: any, parameters: any): Promise<void> {
    if (data._id && parameters.adjustment) {
      await InventoryManager.adjustStock(data._id, parameters.adjustment, '자동화 규칙');
    }
  }

  // 이메일 발송
  static async sendEmail(data: any, parameters: any): Promise<void> {
    // 이메일 발송 로직 (구현 필요)
    console.log(`이메일 발송: ${data.email} - ${parameters.subject}`);
  }

  // 작업 생성
  static async createTask(data: any, parameters: any): Promise<void> {
    // 작업 생성 로직 (구현 필요)
    console.log(`작업 생성: ${parameters.title}`);
  }

  // 주기적 자동화 규칙 실행 (예: 5분마다)
  static async executePeriodicRules(): Promise<void> {
    try {
      await connectDB();

      // 긴급 주문 알림 규칙
      const urgentOrders = await Order.find({
        status: 'pending',
        createdAt: { $lt: new Date(Date.now() - 2 * 60 * 60 * 1000) } // 2시간 전
      });

      for (const order of urgentOrders) {
        const orderData = {
          ...order.toObject(),
          hoursSinceCreated: Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60))
        };

        await this.executeOrderRules(orderData);
      }

      // 재고 부족 상품 규칙
      const products = await Product.find({ status: 'active' });
      for (const product of products) {
        const productData = {
          ...product.toObject(),
          daysSinceCreated: Math.floor((Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        };

        await this.executeProductRules(productData);
      }

    } catch (error) {
      console.error('주기적 자동화 규칙 실행 오류:', error);
    }
  }
}


