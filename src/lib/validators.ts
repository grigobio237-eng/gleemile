import { NextRequest } from 'next/server';

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'date' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
  sanitize?: boolean;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export class ValidationError extends Error {
  public field: string;
  public value: any;
  public rule: string;

  constructor(field: string, value: any, rule: string, message: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.rule = rule;
  }
}

export class InputValidator {
  private schema: ValidationSchema;
  private sanitizeHtml: boolean;

  constructor(schema: ValidationSchema, sanitizeHtml: boolean = true) {
    this.schema = schema;
    this.sanitizeHtml = sanitizeHtml;
  }

  public validate(data: any): { isValid: boolean; errors: ValidationError[]; sanitizedData: any } {
    const errors: ValidationError[] = [];
    const sanitizedData: any = {};

    for (const [field, rules] of Object.entries(this.schema)) {
      const value = data[field];

      try {
        const sanitizedValue = this.validateField(field, value, rules);
        sanitizedData[field] = sanitizedValue;
      } catch (error) {
        if (error instanceof ValidationError) {
          errors.push(error);
        } else {
          errors.push(new ValidationError(field, value, 'unknown', 'Validation failed'));
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  }

  private validateField(field: string, value: any, rules: ValidationRule): any {
    // 필수 필드 검증
    if (rules.required && (value === undefined || value === null || value === '')) {
      throw new ValidationError(field, value, 'required', `${field} is required`);
    }

    // 값이 없고 필수가 아닌 경우 undefined 반환
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    let sanitizedValue = value;

    // 타입 검증 및 변환
    if (rules.type) {
      sanitizedValue = this.validateType(field, value, rules.type);
    }

    // 문자열 길이 검증
    if (rules.type === 'string' || typeof sanitizedValue === 'string') {
      if (rules.minLength !== undefined && sanitizedValue.length < rules.minLength) {
        throw new ValidationError(field, value, 'minLength', `${field} must be at least ${rules.minLength} characters long`);
      }
      if (rules.maxLength !== undefined && sanitizedValue.length > rules.maxLength) {
        throw new ValidationError(field, value, 'maxLength', `${field} must be no more than ${rules.maxLength} characters long`);
      }
    }

    // 숫자 범위 검증
    if (rules.type === 'number' || typeof sanitizedValue === 'number') {
      if (rules.min !== undefined && sanitizedValue < rules.min) {
        throw new ValidationError(field, value, 'min', `${field} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && sanitizedValue > rules.max) {
        throw new ValidationError(field, value, 'max', `${field} must be no more than ${rules.max}`);
      }
    }

    // 패턴 검증
    if (rules.pattern && typeof sanitizedValue === 'string') {
      if (!rules.pattern.test(sanitizedValue)) {
        throw new ValidationError(field, value, 'pattern', `${field} format is invalid`);
      }
    }

    // 열거형 검증
    if (rules.enum && !rules.enum.includes(sanitizedValue)) {
      throw new ValidationError(field, value, 'enum', `${field} must be one of: ${rules.enum.join(', ')}`);
    }

    // 커스텀 검증
    if (rules.custom) {
      const result = rules.custom(sanitizedValue);
      if (result !== true) {
        const message = typeof result === 'string' ? result : `${field} validation failed`;
        throw new ValidationError(field, value, 'custom', message);
      }
    }

    // HTML 정리
    if (rules.sanitize && typeof sanitizedValue === 'string') {
      sanitizedValue = this.sanitizeString(sanitizedValue);
    }

    return sanitizedValue;
  }

  private validateType(field: string, value: any, type: string): any {
    switch (type) {
      case 'string':
        return String(value);

      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          throw new ValidationError(field, value, 'type', `${field} must be a valid number`);
        }
        return num;

      case 'boolean':
        if (typeof value === 'boolean') return value;
        if (value === 'true' || value === '1') return true;
        if (value === 'false' || value === '0') return false;
        throw new ValidationError(field, value, 'type', `${field} must be a boolean`);

      case 'email':
        const email = String(value).toLowerCase();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
          throw new ValidationError(field, value, 'type', `${field} must be a valid email address`);
        }
        return email;

      case 'url':
        const url = String(value);
        try {
          new URL(url);
          return url;
        } catch {
          throw new ValidationError(field, value, 'type', `${field} must be a valid URL`);
        }

      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new ValidationError(field, value, 'type', `${field} must be a valid date`);
        }
        return date;

      case 'array':
        if (!Array.isArray(value)) {
          throw new ValidationError(field, value, 'type', `${field} must be an array`);
        }
        return value;

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          throw new ValidationError(field, value, 'type', `${field} must be an object`);
        }
        return value;

      default:
        return value;
    }
  }

  private sanitizeString(str: string): string {
    if (!this.sanitizeHtml) return str;

    // 기본적인 HTML 태그 제거
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
      .replace(/<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }
}

// 일반적인 검증 스키마들
export const commonSchemas = {
  // 사용자 등록
  userRegistration: {
    email: {
      required: true,
      type: 'email' as const,
      maxLength: 255,
      sanitize: true
    },
    password: {
      required: true,
      type: 'string' as const,
      minLength: 8,
      maxLength: 128,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      custom: (value: string) => {
        if (value.length < 8) return 'Password must be at least 8 characters long';
        if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
        if (!/(?=.*[@$!%*?&])/.test(value)) return 'Password must contain at least one special character';
        return true;
      }
    },
    name: {
      required: true,
      type: 'string' as const,
      minLength: 2,
      maxLength: 100,
      sanitize: true
    },
    phone: {
      required: false,
      type: 'string' as const,
      pattern: /^[\+]?[1-9][\d]{0,15}$/,
      sanitize: true
    }
  },

  // 제품 생성/수정
  product: {
    name: {
      required: true,
      type: 'string' as const,
      minLength: 2,
      maxLength: 200,
      sanitize: true
    },
    description: {
      required: true,
      type: 'string' as const,
      minLength: 10,
      maxLength: 2000,
      sanitize: true
    },
    price: {
      required: true,
      type: 'number' as const,
      min: 0,
      max: 999999.99
    },
    category: {
      required: true,
      type: 'string' as const,
      enum: ['electronics', 'clothing', 'books', 'home', 'sports', 'beauty', 'toys', 'other']
    },
    stock: {
      required: true,
      type: 'number' as const,
      min: 0,
      max: 99999
    },
    images: {
      required: false,
      type: 'array' as const,
      custom: (value: any[]) => {
        if (!Array.isArray(value)) return 'Images must be an array';
        if (value.length > 10) return 'Maximum 10 images allowed';
        return true;
      }
    },
    isFunding: {
      required: false,
      type: 'boolean' as const
    },
    fundingGoal: {
      required: false,
      type: 'number' as const,
      min: 0
    },
    fundingEndDate: {
      required: false,
      type: 'date' as const
    }
  },

  // 주문 생성
  order: {
    items: {
      required: true,
      type: 'array' as const,
      custom: (value: any[]) => {
        if (!Array.isArray(value) || value.length === 0) return 'Order must contain at least one item';
        for (const item of value) {
          if (!item.productId || !item.quantity || item.quantity <= 0) {
            return 'Each item must have a valid productId and quantity';
          }
        }
        return true;
      }
    },
    shippingAddress: {
      required: true,
      type: 'object' as const,
      custom: (value: any) => {
        const required = ['street', 'city', 'state', 'zipCode', 'country'];
        for (const field of required) {
          if (!value[field] || typeof value[field] !== 'string') {
            return `Shipping address must include ${field}`;
          }
        }
        return true;
      }
    },
    paymentMethod: {
      required: true,
      type: 'string' as const,
      enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer']
    }
  },

  // 쿠폰 생성
  coupon: {
    code: {
      required: true,
      type: 'string' as const,
      minLength: 3,
      maxLength: 20,
      pattern: /^[A-Z0-9_-]+$/,
      sanitize: true
    },
    discountType: {
      required: true,
      type: 'string' as const,
      enum: ['percentage', 'fixed_amount']
    },
    discountValue: {
      required: true,
      type: 'number' as const,
      min: 0,
      max: 100
    },
    minOrderAmount: {
      required: false,
      type: 'number' as const,
      min: 0
    },
    maxUses: {
      required: false,
      type: 'number' as const,
      min: 1
    },
    expiresAt: {
      required: false,
      type: 'date' as const
    }
  },

  // 제품 쿼리
  productQuery: {
    page: {
      required: false,
      type: 'number' as const,
      min: 1,
      max: 1000
    },
    limit: {
      required: false,
      type: 'number' as const,
      min: 1,
      max: 100
    },
    category: {
      required: false,
      type: 'string' as const,
      sanitize: true
    },
    q: {
      required: false,
      type: 'string' as const,
      maxLength: 100,
      sanitize: true
    },
    search: {
      required: false,
      type: 'string' as const,
      maxLength: 100,
      sanitize: true
    },
    minPrice: {
      required: false,
      type: 'number' as const,
      min: 0
    },
    maxPrice: {
      required: false,
      type: 'number' as const,
      min: 0
    },
    sort: {
      required: false,
      type: 'string' as const,
      enum: ['newest', 'price_asc', 'price_desc', 'popular']
    },
    sortBy: {
      required: false,
      type: 'string' as const,
      enum: ['name', 'price', 'createdAt', 'rating']
    },
    sortOrder: {
      required: false,
      type: 'string' as const,
      enum: ['asc', 'desc']
    },
    isFunding: {
      required: false,
      type: 'boolean' as const
    },
  }
};

// 미들웨어 함수
export function validateRequest(schema: ValidationSchema) {
  return (req: NextRequest) => {
    try {
      const validator = new InputValidator(schema);
      const body = req.body ? JSON.parse(JSON.stringify(req.body)) : {};
      const result = validator.validate(body);

      if (!result.isValid) {
        return {
          error: 'Validation failed',
          details: result.errors.map(err => ({
            field: err.field,
            message: err.message,
            rule: err.rule
          }))
        };
      }

      return { data: result.sanitizedData };
    } catch (error) {
      return {
        error: 'Invalid request format',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };
}

// 스키마 export
export const productQuerySchema = commonSchemas.productQuery;
export const loginSchema = {
  email: {
    required: true,
    type: 'email' as const,
    sanitize: true
  },
  password: {
    required: true,
    type: 'string' as const,
    minLength: 6,
    sanitize: true
  }
};

export default InputValidator;