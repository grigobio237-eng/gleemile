// 전체 프로젝트에서 사용되는 카테고리 목록
export const PRODUCT_CATEGORIES = [
  { value: 'fresh-food', label: '신선식품', labelEn: 'Fresh Food' },
  { value: 'food', label: '식품', labelEn: 'Food' },
  { value: 'clothing', label: '의류', labelEn: 'Clothing' },
  { value: 'shoes', label: '신발', labelEn: 'Shoes' },
  { value: 'bags', label: '가방', labelEn: 'Bags' },
  { value: 'accessories', label: '액세서리', labelEn: 'Accessories' },
  { value: 'lifestyle', label: '라이프스타일', labelEn: 'Lifestyle' },
  { value: 'electronics', label: '전자제품', labelEn: 'Electronics' },
  { value: 'beauty', label: '뷰티', labelEn: 'Beauty' },
  { value: 'sports', label: '스포츠', labelEn: 'Sports' },
  { value: 'books', label: '도서', labelEn: 'Books' },
  { value: 'stem-cell', label: '줄기세포', labelEn: 'Stem Cell' },
  { value: 'hospital-service', label: '진료 서비스', labelEn: 'Hospital Service' },
  { value: 'consultation', label: '상담 프로그램', labelEn: 'Consultation' },
  { value: 'medical-device', label: '의료 기기/용품', labelEn: 'Medical Device' },
] as const;

// 카테고리 value 타입
export type CategoryValue = typeof PRODUCT_CATEGORIES[number]['value'];

// 카테고리 value로 label 찾기
export function getCategoryLabel(value: string): string {
  const category = PRODUCT_CATEGORIES.find(cat => cat.value === value);
  return category ? category.label : value;
}

// 카테고리 label로 value 찾기
export function getCategoryValue(label: string): string | undefined {
  const category = PRODUCT_CATEGORIES.find(cat => cat.label === label);
  return category?.value;
}
