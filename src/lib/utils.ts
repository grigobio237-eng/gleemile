import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(price);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function slugify(text: string): string {
  // 한글을 영문으로 변환하는 매핑
  const hangulMap: { [key: string]: string } = {
    '프리미엄': 'premium',
    '면': 'cotton',
    '티셔츠': 'tshirt',
    '모임': 'sports',
    '러닝화': 'runningshoes',
    '가죽': 'leather',
    '백팩': 'backpack',
    '스마트워치': 'smartwatch',
    '블루투스': 'bluetooth',
    '이어폰': 'earphones',
    '세련된': 'elegant',
    '시계': 'watch',
    '유기농': 'organic',
    '토마토': 'tomato',
    '신선한': 'fresh',
    '바나나': 'banana',
    '한우': 'hanwoo',
    '등심': 'sirloin'
  };

  let result = text;
  
  // 한글을 영문으로 변환
  Object.keys(hangulMap).forEach(hangul => {
    result = result.replace(new RegExp(hangul, 'g'), hangulMap[hangul]);
  });
  
  return result
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `ORD-${timestamp}-${random}`.toUpperCase();
}

export function calculateCommission(orderTotal: number): number {
  // 5% commission rate
  return Math.floor(orderTotal * 0.05);
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
  return phoneRegex.test(phone);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

